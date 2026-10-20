import { ClickAwayListener, Popper } from '@mui/material';
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { TreeOption } from './treeTypes';
import './tree-select.scss';

interface FlatNode {
  node: TreeOption;
  depth: number;
  parent: string | null;
  hasChildren: boolean;
}
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
const leaves = (n: TreeOption): string[] => (n.children?.length ? n.children.flatMap(leaves) : [n.value]);

/** app-tree-select : arbre recherchable (surlignage), sélection simple (chemin) ou multiple (cases tri-état). */
export function TreeSelect({
  options,
  value,
  onChange,
  multiple,
  placeholder = 'Sélectionner…',
  icon = 'account_tree',
  clearable = true,
  leafOnly,
  disabled,
  onBlur,
}: {
  options: TreeOption[];
  value: string | string[] | null;
  onChange: (v: string | string[] | null) => void;
  multiple?: boolean;
  placeholder?: string;
  icon?: string;
  clearable?: boolean;
  leafOnly?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const origin = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [width, setWidth] = useState(280);
  const selected = value == null ? [] : Array.isArray(value) ? value : [value];
  const flat = useMemo(() => {
    const out: FlatNode[] = [];
    const walk = (list: TreeOption[], depth: number, parent: string | null) =>
      list.forEach((n) => {
        out.push({ node: n, depth, parent, hasChildren: !!n.children?.length });
        if (n.children) walk(n.children, depth + 1, n.value);
      });
    walk(options, 0, null);
    return out;
  }, [options]);
  const byValue = useMemo(() => new Map(flat.map((f) => [f.node.value, f])), [flat]);
  // Ancêtres des valeurs initiales dépliés (writeValue Angular).
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const exp = new Set<string>();
    for (const s of selected) {
      let p = byValue.get(s)?.parent ?? null;
      while (p) {
        exp.add(p);
        p = byValue.get(p)?.parent ?? null;
      }
    }
    return exp;
  });
  const q = norm(query.trim());
  const matches = useMemo(() => {
    if (!q) return null;
    const keep = new Set<string>();
    for (const f of flat) {
      if (!norm(f.node.label).includes(q)) continue;
      let cur: string | null = f.node.value;
      while (cur) {
        keep.add(cur);
        cur = byValue.get(cur)?.parent ?? null;
      }
    }
    return keep;
  }, [q, flat, byValue]);
  const visible = flat.filter((f) => {
    if (matches) return matches.has(f.node.value);
    let p = f.parent;
    while (p) {
      if (!expanded.has(p)) return false;
      p = byValue.get(p)?.parent ?? null;
    }
    return true;
  });
  const highlight = (label: string): ReactNode => {
    const t = query.trim();
    if (!t) return label;
    const i = norm(label).indexOf(norm(t));
    return i < 0 ? (
      label
    ) : (
      <>
        {label.slice(0, i)}
        <mark>{label.slice(i, i + t.length)}</mark>
        {label.slice(i + t.length)}
      </>
    );
  };
  const isOpen = (v: string) => !!matches || expanded.has(v);
  const labelOf = (v: string) => byValue.get(v)?.node.label ?? v;
  const pathOf = (v: string) => {
    const parts: string[] = [];
    let cur: string | null = v;
    while (cur) {
      const f = byValue.get(cur);
      if (!f) break;
      parts.unshift(f.node.label);
      cur = f.parent;
    }
    return parts.join(' › ');
  };
  const state = (n: TreeOption) => {
    const l = leaves(n);
    const sel = new Set(selected);
    const c = l.filter((v) => sel.has(v)).length;
    return c === 0 ? 'none' : c === l.length ? 'all' : 'some';
  };
  const setValue = (v: string[]) => onChange(multiple ? v : (v[0] ?? null));
  const close = () => {
    setOpen(false);
    onBlur?.();
  };
  const toggle = () => {
    if (disabled) return;
    if (open) {
      close();
      return;
    }
    setWidth(Math.max(260, origin.current?.getBoundingClientRect().width ?? 280));
    setOpen(true);
    setTimeout(() => search.current?.focus(), 30);
  };
  const expand = (v: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });
  };
  const rowClick = (f: FlatNode) => {
    if (f.node.disabled) return;
    if (multiple) {
      const all = state(f.node) === 'all';
      const sel = new Set(selected);
      leaves(f.node).forEach((v) => (all ? sel.delete(v) : sel.add(v)));
      setValue([...sel]);
    } else if (f.hasChildren && leafOnly) expand(f.node.value);
    else {
      setValue([f.node.value]);
      close();
    }
  };

  return (
    <div className="app-tree-select">
      <div className="form-field kit-field">
        <button
          ref={origin}
          type="button"
          className={`field-box ts-trigger${disabled ? ' is-disabled' : ''}`}
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="tree"
          aria-expanded={open}
        >
          <MaterialIcon name={icon} />
          <span className={`ts-value${selected.length ? '' : ' ph'}`}>
            {!selected.length ? (
              placeholder
            ) : multiple ? (
              <>
                {selected.slice(0, 2).map((v) => (
                  <span key={v} className="ts-chip">
                    {labelOf(v)}
                  </span>
                ))}
                {selected.length > 2 && <span className="ts-more">+{selected.length - 2}</span>}
              </>
            ) : (
              pathOf(selected[0] as string)
            )}
          </span>
          {selected.length > 0 && clearable && (
            <MaterialIcon
              name="close"
              className="ts-clear"
              onClick={(e) => {
                e.stopPropagation();
                setValue([]);
              }}
            />
          )}
          <MaterialIcon name="expand_more" className={`ts-arrow${open ? ' open' : ''}`} />
        </button>
      </div>
      <Popper
        open={open && !!origin.current}
        anchorEl={origin.current}
        placement="bottom-start"
        className="cdk-overlay-pane"
        style={{ zIndex: 1300, minWidth: width, display: 'flex' }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
        ]}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!(e.target instanceof Node && origin.current?.contains(e.target))) close();
          }}
        >
          <div className="kit-tree-panel" onKeyDown={(e) => e.key === 'Escape' && close()}>
            <div className="tp-search">
              <MaterialIcon name="search" />
              <input
                ref={search}
                placeholder="Rechercher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Effacer">
                  <MaterialIcon name="close" />
                </button>
              )}
            </div>
            <div className="tp-list" role="tree">
              {visible.map((f) => (
                <div
                  key={f.node.value}
                  role="treeitem"
                  aria-selected={selected.includes(f.node.value)}
                  style={{ paddingLeft: 8 + f.depth * 20 }}
                  className={`tp-row${!multiple && selected[0] === f.node.value ? ' sel' : ''}${f.node.disabled ? ' disabled' : ''}`}
                  aria-expanded={f.hasChildren ? isOpen(f.node.value) : undefined}
                  onClick={() => rowClick(f)}
                >
                  {f.hasChildren ? (
                    <button
                      type="button"
                      className="tp-exp"
                      onClick={(e) => expand(f.node.value, e)}
                      aria-label={isOpen(f.node.value) ? 'Replier' : 'Déplier'}
                    >
                      <MaterialIcon name="chevron_right" className={isOpen(f.node.value) ? 'open' : undefined} />
                    </button>
                  ) : (
                    <span className="tp-exp" />
                  )}
                  {multiple && (
                    <span
                      className={`tp-check${state(f.node) === 'all' ? ' on' : ''}${state(f.node) === 'some' ? ' some' : ''}`}
                    />
                  )}
                  {f.node.icon && <MaterialIcon name={f.node.icon} className="tp-icon" />}
                  <span className="tp-label">{highlight(f.node.label)}</span>
                  {f.hasChildren && <span className="tp-count">{leaves(f.node).length}</span>}
                </div>
              ))}
              {!visible.length && <div className="tp-empty">Aucun résultat pour « {query} »</div>}
            </div>
            {multiple && (
              <div className="tp-foot">
                <span>{selected.length} sélectionné(s)</span>
                <span className="spacer" />
                <button type="button" onClick={() => setValue([])}>
                  Tout effacer
                </button>
                <button type="button" className="ok" onClick={close}>
                  Valider
                </button>
              </div>
            )}
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
