// Porté depuis ui-kit Angular (harnais/components/widgets/table-widget).
import { useState } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import type { HarnaisWidget, HzColumn, HzRow } from '../../../data/static/harnais.data';
import './table-widget.scss';

type TableBlock = Extract<HarnaisWidget, { type: 'table' }>;

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'fr', { numeric: true });
}
const isNumeric = (c: HzColumn) => c.kind === 'number' || c.kind === 'progress';
const format = (c: HzColumn, v: string | number) =>
  typeof v === 'number' && c.kind === 'number' ? v.toLocaleString('fr-FR') + (c.unit ?? '') : String(v);
const toneOf = (c: HzColumn, v: string | number) => c.tones?.[String(v)] ?? 'neutral';
const initials = (v: string | number) =>
  String(v)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Tableau déclaratif : tri par colonne, recherche, pagination, export CSV local. */
export function HzTable({ block: b }: { block: TableBlock }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = b.pageSize ?? 8;

  const q = query.trim().toLowerCase();
  let rows: HzRow[] = b.rows;
  if (q) rows = rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  if (sort) rows = [...rows].sort((x, y) => compare(x[sort.key], y[sort.key]) * sort.dir);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const start = cur * pageSize;
  const visible = rows.slice(start, start + pageSize);
  const range = rows.length ? `${start + 1}–${Math.min(start + pageSize, rows.length)} sur ${rows.length}` : '0 ligne';

  const toggleSort = (key: string) => {
    setSort(!sort || sort.key !== key ? { key, dir: 1 } : sort.dir === 1 ? { key, dir: -1 } : null);
    setPage(0);
  };

  /** Export CSV (séparateur « ; » pour Excel FR), généré localement. */
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      b.columns.map((c) => esc(c.label)).join(';'),
      ...rows.map((r) => b.columns.map((c) => esc(r[c.key] ?? '')).join(';')),
    ];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: (b.title ?? 'export').replace(/\W+/g, '-').toLowerCase() + '.csv',
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hz-table">
      <div className="toolbar">
        {b.searchable && (
          <label className="search">
            <MaterialIcon name="search" />
            <input
              type="search"
              placeholder="Filtrer…"
              aria-label="Filtrer le tableau"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
        )}
        <span className="spacer" />
        <button type="button" className="ghost" onClick={exportCsv}>
          <MaterialIcon name="download" />
          CSV
        </button>
      </div>
      <div className="scroller">
        <table>
          <thead>
            <tr>
              {b.columns.map((c) => {
                const on = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={isNumeric(c) ? 'num' : undefined}
                    aria-sort={on ? (sort?.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  >
                    <button type="button" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <MaterialIcon
                        name={on && sort?.dir === -1 ? 'arrow_downward' : 'arrow_upward'}
                        className={`sort${on ? ' on' : ''}`}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length ? (
              visible.map((r, i) => (
                <tr key={i}>
                  {b.columns.map((c) => {
                    const v = r[c.key] ?? '';
                    return (
                      <td key={c.key} className={isNumeric(c) ? 'num' : undefined}>
                        {c.kind === 'badge' ? (
                          <span className={`m3-badge ${toneOf(c, v)}`}>{v}</span>
                        ) : c.kind === 'progress' ? (
                          <span className="progress">
                            <span className="bar">
                              <i style={{ width: `${v}%` }} />
                            </span>
                            <span className="pct">{v} %</span>
                          </span>
                        ) : c.kind === 'person' ? (
                          <span className="person">
                            <span className="ava">{initials(v)}</span>
                            <span className="name">{v}</span>
                          </span>
                        ) : c.kind === 'mono' ? (
                          <code>{v}</code>
                        ) : (
                          format(c, v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty" colSpan={b.columns.length}>
                  Aucune ligne ne correspond à « {query} ».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="footer">
        <span>{range}</span>
        {pages > 1 && (
          <span className="pager">
            <button
              type="button"
              className="icon"
              disabled={cur === 0}
              onClick={() => setPage(cur - 1)}
              aria-label="Page précédente"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <span>
              {cur + 1} / {pages}
            </span>
            <button
              type="button"
              className="icon"
              disabled={cur >= pages - 1}
              onClick={() => setPage(cur + 1)}
              aria-label="Page suivante"
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
