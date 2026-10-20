import { Menu, MenuItem } from '@mui/material';
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Tip } from '../fields/Tip';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { BulkAction, CellEditEvent, DataColumn, DataRow } from './dataTableTypes';
import './data-table.scss';

type Density = 'compact' | 'normal' | 'comfortable';
const DENSITIES: [Density, string, string][] = [
  ['compact', 'Compacte', 'density_small'],
  ['normal', 'Normale', 'density_medium'],
  ['comfortable', 'Confortable', 'density_large'],
];
const initWidths = <T,>(cols: DataColumn<T>[]) =>
  Object.fromEntries(cols.map((c) => [c.key, c.width ?? 160])) as Record<string, number>;
const initHidden = <T,>(cols: DataColumn<T>[]) => new Set(cols.filter((c) => c.hidden).map((c) => c.key));

/**
 * app-data-table : en-tête et colonnes figés, redimensionnement, colonnes masquables, tri, sélection multiple
 * (Maj+clic) avec actions groupées, lignes dépliables (`expanded`), édition en ligne (double-clic, Entrée / Échap),
 * totaux, densité, export CSV et pagination.
 */
export function DataTable<T extends object>({
  rows,
  columns,
  rowKey = 'id',
  selectable = false,
  bulkActions = [],
  pageSize = 10,
  maxHeight = '520px',
  title = '',
  searchable = true,
  clickable = false,
  expanded: expandedTpl,
  onBulkAction,
  onCellEdit,
  onSelectionChange,
  onRowClick,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey?: string;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  pageSize?: number;
  maxHeight?: string;
  title?: string;
  searchable?: boolean;
  clickable?: boolean;
  expanded?: (row: T) => ReactNode;
  onBulkAction?: (e: { action: string; rows: T[] }) => void;
  onCellEdit?: (e: CellEditEvent<T>) => void;
  onSelectionChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
}) {
  const [widths, setWidths] = useState(() => initWidths(columns));
  const [hidden, setHidden] = useState(() => initHidden(columns));
  const [lastCols, setLastCols] = useState(columns);
  if (lastCols !== columns) {
    setLastCols(columns);
    setWidths(initWidths(columns));
    setHidden(initHidden(columns));
  }
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [selected, setSelected] = useState<Set<unknown>>(new Set());
  const [expanded, setExpanded] = useState<Set<unknown>>(new Set());
  const [editing, setEditing] = useState<{ id: unknown; key: string } | null>(null);
  const [edits, setEdits] = useState<Map<unknown, Partial<T>>>(new Map());
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState<Density>('normal');
  const [colMenu, setColMenu] = useState<HTMLElement | null>(null);
  const [densityMenu, setDensityMenu] = useState<HTMLElement | null>(null);
  const anchor = useRef<unknown>(null);
  useEffect(() => setPage(0), [query, sort]);

  const hasExp = !!expandedTpl;
  const tech = (selectable ? 44 : 0) + (hasExp ? 40 : 0);
  const id = (r: T) => (r as DataRow)[rowKey];
  const value = (r: T, key: string): unknown => {
    const e = edits.get(id(r));
    return e && key in e ? (e as DataRow)[key] : (r as DataRow)[key];
  };
  const display = (r: T, c: DataColumn<T>): string => {
    if (c.format) return c.format({ ...r, ...(edits.get(id(r)) ?? {}) });
    const v = value(r, c.key);
    if (v === null || v === undefined || v === '') return '';
    switch (c.type) {
      case 'number':
        return Number(v).toLocaleString('fr-FR');
      case 'currency':
        return `${Number(v).toLocaleString('fr-FR')} F`;
      case 'date':
        return new Date(v as string).toLocaleDateString('fr-FR');
      case 'progress':
        return `${String(v)} %`;
      default:
        return c.options?.find((o) => o.value === v)?.label ?? String(v);
    }
  };
  const align = (c: DataColumn<T>) => c.align ?? (c.type === 'number' || c.type === 'currency' ? 'right' : 'left');
  const w = (k: string) => widths[k] ?? 160;

  const visibleCols = useMemo(() => {
    const cols = columns.filter((c) => !hidden.has(c.key));
    return [
      ...cols.filter((c) => c.sticky === 'start'),
      ...cols.filter((c) => !c.sticky),
      ...cols.filter((c) => c.sticky === 'end'),
    ];
  }, [columns, hidden]);
  const offsets: Record<string, number> = {};
  let left = tech;
  for (const c of visibleCols.filter((x) => x.sticky === 'start')) {
    offsets[c.key] = left;
    left += w(c.key);
  }
  let right = 0;
  for (const c of visibleCols.filter((x) => x.sticky === 'end').reverse()) {
    offsets[c.key] = right;
    right += w(c.key);
  }
  const lastStart = visibleCols.filter((c) => c.sticky === 'start').at(-1)?.key;
  const firstEnd = visibleCols.find((c) => c.sticky === 'end')?.key;
  const tableWidth = visibleCols.reduce((s, c) => s + w(c.key), tech);

  const q = query.trim().toLowerCase();
  let filtered = q ? rows.filter((r) => columns.some((c) => display(r, c).toLowerCase().includes(q))) : rows;
  if (sort) {
    const m = sort.dir === 'asc' ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      const x = value(a, sort.key),
        y = value(b, sort.key);
      return (
        (typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x ?? '').localeCompare(String(y ?? ''), 'fr', { numeric: true })) * m
      );
    });
  }
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totals: Record<string, number> = {};
  for (const c of columns.filter((x) => x.total))
    totals[c.key] = filtered.reduce((s, r) => s + (Number(value(r, c.key)) || 0), 0);
  const hasTotals = columns.some((c) => c.total);
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(id(r)));
  const someOnPage = !allOnPage && pageRows.some((r) => selected.has(id(r)));
  const colSpan = visibleCols.length + (selectable ? 1 : 0) + (hasExp ? 1 : 0);
  const fmtTotal = (c: DataColumn<T>) => {
    const v = totals[c.key] ?? 0;
    return c.type === 'currency' ? `${v.toLocaleString('fr-FR')} F` : v.toLocaleString('fr-FR');
  };

  const toggleSort = (c: DataColumn<T>) => {
    if (c.sortable === false) return;
    setSort(
      !sort || sort.key !== c.key
        ? { key: c.key, dir: 'asc' }
        : sort.dir === 'asc'
          ? { key: c.key, dir: 'desc' }
          : null,
    );
  };
  const toggleCol = (key: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const resizeStart = (c: DataColumn<T>, e: PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX,
      w0 = w(c.key),
      min = c.minWidth ?? 70;
    const move = (ev: globalThis.PointerEvent) =>
      setWidths((ws) => ({ ...ws, [c.key]: Math.max(min, w0 + ev.clientX - sx) }));
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true });
  };
  const autoFit = (c: DataColumn<T>) => {
    const longest = Math.max(c.label.length, ...filtered.map((r) => display(r, c).length));
    setWidths((ws) => ({ ...ws, [c.key]: Math.min(420, Math.max(c.minWidth ?? 70, longest * 8 + 40)) }));
  };
  const emitSel = (s: Set<unknown>) => {
    setSelected(s);
    onSelectionChange?.(rows.filter((r) => s.has(id(r))));
  };
  const toggleRow = (r: T, e: MouseEvent) => {
    const n = new Set(selected),
      rid = id(r);
    if (e.shiftKey && anchor.current !== null) {
      const ids = filtered.map(id);
      const a = ids.indexOf(anchor.current),
        b = ids.indexOf(rid);
      if (a >= 0 && b >= 0) ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((x) => n.add(x));
    } else {
      if (n.has(rid)) n.delete(rid);
      else n.add(rid);
      anchor.current = rid;
    }
    emitSel(n);
  };
  const togglePage = () => {
    const n = new Set(selected);
    pageRows.forEach((r) => (allOnPage ? n.delete(id(r)) : n.add(id(r))));
    emitSel(n);
  };
  const toggleExpand = (r: T) =>
    setExpanded((s) => {
      const n = new Set(s),
        rid = id(r);
      if (n.has(rid)) n.delete(rid);
      else n.add(rid);
      return n;
    });
  const isEditing = (r: T, c: DataColumn<T>) => !!editing && editing.id === id(r) && editing.key === c.key;
  const startEdit = (r: T, c: DataColumn<T>) => {
    if (!c.editable) return;
    setEditing({ id: id(r), key: c.key });
    setTimeout(() => (document.querySelector('.dt-edit-input') as HTMLInputElement | null)?.focus?.());
  };
  const commitEdit = (r: T, c: DataColumn<T>, raw: string) => {
    if (!isEditing(r, c)) return;
    const previous = value(r, c.key);
    const v = c.editable === 'number' ? (raw === '' ? null : Number(raw.replace(/\s/g, '').replace(',', '.'))) : raw;
    setEditing(null);
    if (v === previous || (c.editable === 'number' && v !== null && isNaN(v as number))) return;
    setEdits((m) => new Map(m).set(id(r), { ...(m.get(id(r)) ?? {}), [c.key]: v } as Partial<T>));
    onCellEdit?.({ row: r, key: c.key, value: v, previous });
  };
  const editKey = (r: T, c: DataColumn<T>, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit(r, c, e.currentTarget.value);
    else if (e.key === 'Escape') setEditing(null);
  };
  /** Export CSV (séparateur « ; » pour Excel FR, BOM UTF-8). */
  const exportCsv = () => {
    const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = [
      visibleCols.map((c) => esc(c.label)).join(';'),
      ...filtered.map((r) => visibleCols.map((c) => esc(display(r, c))).join(';')),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `${title || 'export'}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const stickyProps = (c: DataColumn<T>) => ({
    className: [
      c.sticky === 'start' && 'sticky-s',
      c.sticky === 'end' && 'sticky-e',
      c.key === lastStart && 'edge-s',
      c.key === firstEnd && 'edge-e',
    ]
      .filter(Boolean)
      .join(' '),
    style: {
      left: c.sticky === 'start' ? offsets[c.key] : undefined,
      right: c.sticky === 'end' ? offsets[c.key] : undefined,
      textAlign: align(c),
    } as CSSProperties,
  });
  const techCells = (kind: 'th' | 'td') => {
    const Cell = kind;
    return (
      <>
        {selectable && <Cell className="tech sticky-s" style={{ left: 0 }} />}
        {hasExp && <Cell className="tech sticky-s" style={{ left: selectable ? 44 : 0 }} />}
      </>
    );
  };

  return (
    <div className="app-data-table">
      <div className={`dt dt--${density}`}>
        {selected.size ? (
          <div className="dt-bulk">
            <Tip title="Désélectionner">
              <button type="button" className="dt-icon" onClick={() => emitSel(new Set())}>
                <MaterialIcon name="close" />
              </button>
            </Tip>
            <strong>{selected.size} sélectionné(s)</strong>
            {selected.size < filtered.length && (
              <button type="button" className="dt-link" onClick={() => emitSel(new Set(filtered.map(id)))}>
                Sélectionner les {filtered.length}
              </button>
            )}
            <span className="spacer" />
            {bulkActions.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`dt-bulk-btn${a.tone === 'error' ? ' danger' : ''}`}
                onClick={() => onBulkAction?.({ action: a.id, rows: rows.filter((r) => selected.has(id(r))) })}
              >
                <MaterialIcon name={a.icon} />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="dt-toolbar">
            {title && (
              <>
                <strong className="dt-title">{title}</strong>
                <span className="dt-count">{filtered.length}</span>
              </>
            )}
            {searchable && (
              <div className="dt-search">
                <MaterialIcon name="search" />
                <input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && (
                  <button type="button" onClick={() => setQuery('')}>
                    <MaterialIcon name="close" />
                  </button>
                )}
              </div>
            )}
            <span className="spacer" />
            <Tip title="Densité">
              <button type="button" className="dt-tool" onClick={(e) => setDensityMenu(e.currentTarget)}>
                <MaterialIcon name="density_medium" />
              </button>
            </Tip>
            <button type="button" className="dt-tool" onClick={(e) => setColMenu(e.currentTarget)}>
              <MaterialIcon name="view_column" />
              <span>Colonnes</span>
              {hidden.size > 0 && <em>{hidden.size}</em>}
            </button>
            <Tip title="Exporter en CSV">
              <button type="button" className="dt-tool" onClick={exportCsv}>
                <MaterialIcon name="download" />
              </button>
            </Tip>
          </div>
        )}
        <Menu
          anchorEl={colMenu}
          open={!!colMenu}
          onClose={() => setColMenu(null)}
          slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
        >
          {columns.map((c) => (
            <MenuItem
              key={c.key}
              className="mat-mdc-menu-item"
              disabled={c.required}
              onClick={() => {
                if (!c.required) toggleCol(c.key);
              }}
            >
              <MaterialIcon name={hidden.has(c.key) ? 'check_box_outline_blank' : 'check_box'} />
              {c.label}
              {c.sticky && <MaterialIcon name="push_pin" className="dt-pin" />}
            </MenuItem>
          ))}
          <MenuItem
            className="mat-mdc-menu-item"
            onClick={() => {
              setHidden(initHidden(columns));
              setWidths(initWidths(columns));
              setColMenu(null);
            }}
          >
            <MaterialIcon name="restart_alt" />
            Réinitialiser
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={densityMenu}
          open={!!densityMenu}
          onClose={() => setDensityMenu(null)}
          slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
        >
          {DENSITIES.map(([k, l, ic]) => (
            <MenuItem
              key={k}
              className="mat-mdc-menu-item"
              onClick={() => {
                setDensity(k);
                setDensityMenu(null);
              }}
            >
              <MaterialIcon name={density === k ? 'check' : ic} />
              {l}
            </MenuItem>
          ))}
        </Menu>

        <div className="dt-scroll" style={{ maxHeight }}>
          <table style={{ width: tableWidth, minWidth: '100%' }}>
            <colgroup>
              {selectable && <col style={{ width: 44 }} />}
              {hasExp && <col style={{ width: 40 }} />}
              {visibleCols.map((c) => (
                <col key={c.key} style={{ width: w(c.key) }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {selectable && (
                  <th className="tech sticky-s" style={{ left: 0 }}>
                    <span
                      className={`dt-check${allOnPage ? ' on' : ''}${someOnPage ? ' some' : ''}`}
                      onClick={togglePage}
                      role="checkbox"
                      aria-checked={allOnPage}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                )}
                {hasExp && <th className="tech sticky-s" style={{ left: selectable ? 44 : 0 }} />}
                {visibleCols.map((c) => {
                  const sp = stickyProps(c);
                  const a = align(c);
                  return (
                    <th
                      key={c.key}
                      className={`${sp.className}${c.sortable !== false ? ' sortable' : ''}${sort?.key === c.key ? ' sorted' : ''}`}
                      style={sp.style}
                      onClick={() => toggleSort(c)}
                      aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span
                        className="th-in"
                        style={{ justifyContent: a === 'right' ? 'flex-end' : a === 'center' ? 'center' : undefined }}
                      >
                        {' '}
                        {c.label}{' '}
                        {c.editable && (
                          <Tip title="Modifiable (double-clic)">
                            <MaterialIcon name="edit" className="th-edit" />
                          </Tip>
                        )}
                        {c.sortable !== false && (
                          <MaterialIcon
                            name={
                              sort?.key === c.key
                                ? sort.dir === 'asc'
                                  ? 'arrow_upward'
                                  : 'arrow_downward'
                                : 'unfold_more'
                            }
                            className="th-sort"
                          />
                        )}
                      </span>
                      <span
                        className="resizer"
                        onPointerDown={(e) => resizeStart(c, e)}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={() => autoFit(c)}
                        title="Glisser pour redimensionner · double-clic : ajuster"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const rid = id(r);
                return (
                  <Fragment key={String(rid)}>
                    <tr
                      className={
                        [selected.has(rid) && 'sel', expanded.has(rid) && 'open', clickable && 'clickable']
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    >
                      {selectable && (
                        <td className="tech sticky-s" style={{ left: 0 }} onClick={(e) => toggleRow(r, e)}>
                          <span
                            className={`dt-check${selected.has(rid) ? ' on' : ''}`}
                            role="checkbox"
                            aria-checked={selected.has(rid)}
                          />
                        </td>
                      )}
                      {hasExp && (
                        <td className="tech sticky-s" style={{ left: selectable ? 44 : 0 }}>
                          <button
                            type="button"
                            className="dt-exp"
                            onClick={() => toggleExpand(r)}
                            aria-expanded={expanded.has(rid)}
                          >
                            <MaterialIcon name="chevron_right" />
                          </button>
                        </td>
                      )}
                      {visibleCols.map((c) => {
                        const sp = stickyProps(c);
                        const edited = edits.get(rid) && c.key in (edits.get(rid) ?? {});
                        const v = value(r, c.key);
                        const d = display(r, c);
                        return (
                          <td
                            key={c.key}
                            className={`${sp.className}${c.editable ? ' editable' : ''}${edited ? ' edited' : ''}`}
                            style={sp.style}
                            onDoubleClick={() => startEdit(r, c)}
                            onClick={() => {
                              if (clickable && !isEditing(r, c)) onRowClick?.(r);
                            }}
                          >
                            {isEditing(r, c) ? (
                              c.editable === 'select' ? (
                                <select
                                  className="dt-edit-input"
                                  defaultValue={String(v ?? '')}
                                  onChange={(e) => commitEdit(r, c, e.target.value)}
                                  onBlur={() => setEditing(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditing(null);
                                  }}
                                >
                                  {c.options?.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="dt-edit-input"
                                  type="text"
                                  inputMode={c.editable === 'number' ? 'decimal' : undefined}
                                  defaultValue={String(v ?? '')}
                                  onKeyDown={(e) => editKey(r, c, e)}
                                  onBlur={(e) => commitEdit(r, c, e.target.value)}
                                  style={{ textAlign: align(c) }}
                                />
                              )
                            ) : c.type === 'badge' ? (
                              d ? (
                                <span
                                  className="dt-badge"
                                  style={
                                    { '--tone': `var(--${c.tone ? c.tone(r) : 'primary'}-color)` } as CSSProperties
                                  }
                                >
                                  {d}
                                </span>
                              ) : null
                            ) : c.type === 'progress' ? (
                              <>
                                <span className="dt-progress">
                                  <i
                                    style={{ width: `${Number(v)}%` }}
                                    className={Number(v) < 30 ? 'low' : undefined}
                                  />
                                </span>
                                <em className="dt-pct">{d}</em>
                              </>
                            ) : c.type === 'mono' ? (
                              <code>{d}</code>
                            ) : (
                              <span className="dt-text">{d || '—'}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {expandedTpl && expanded.has(rid) && (
                      <tr className="dt-detail">
                        <td colSpan={colSpan}>
                          <div className="dt-detail-in">{expandedTpl(r)}</div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!pageRows.length && (
                <tr className="dt-empty">
                  <td colSpan={colSpan}>
                    <MaterialIcon name="search_off" />
                    Aucun résultat {query && <>pour « {query} »</>}
                  </td>
                </tr>
              )}
            </tbody>
            {hasTotals && pageRows.length > 0 && (
              <tfoot>
                <tr>
                  {techCells('td')}
                  {visibleCols.map((c, i) => {
                    const sp = stickyProps(c);
                    return (
                      <td key={c.key} className={sp.className} style={sp.style}>
                        {c.total ? ` ${fmtTotal(c)} ` : i === 0 ? ` Total (${filtered.length}) ` : null}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="dt-foot">
          <span>
            {filtered.length ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, filtered.length)} sur{' '}
            {filtered.length}
          </span>
          {selectable && <span className="muted hide-xs">· Maj+clic pour sélectionner une plage</span>}
          <span className="spacer" />
          <button type="button" className="dt-icon" onClick={() => setPage(0)} disabled={page === 0}>
            <MaterialIcon name="first_page" />
          </button>
          <button type="button" className="dt-icon" onClick={() => setPage(page - 1)} disabled={page === 0}>
            <MaterialIcon name="chevron_left" />
          </button>
          <span className="dt-page">
            {page + 1} / {pages}
          </span>
          <button type="button" className="dt-icon" onClick={() => setPage(page + 1)} disabled={page >= pages - 1}>
            <MaterialIcon name="chevron_right" />
          </button>
          <button type="button" className="dt-icon" onClick={() => setPage(pages - 1)} disabled={page >= pages - 1}>
            <MaterialIcon name="last_page" />
          </button>
        </div>
      </div>
    </div>
  );
}
