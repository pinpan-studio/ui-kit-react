import { Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ConnectedOverlay } from './ConnectedOverlay';
import './filter-dropdown.scss';

export interface FilterOption<V = unknown> {
  value: V;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
}

/** app-filter-dropdown : déclencheur pilule + popover recherchable. */
export function FilterDropdown<V>({
  options,
  value,
  onChange,
  labelPrefix = '',
  placeholder = 'Tous',
  customTriggerLabel = '',
  standalone,
  disabled,
}: {
  options: FilterOption<V>[];
  value: V;
  onChange: (v: V) => void;
  labelPrefix?: string;
  placeholder?: string;
  customTriggerLabel?: string;
  standalone?: boolean;
  disabled?: boolean;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const first = options[0];
  const hasSentinel =
    !!first &&
    (first.value === '' ||
      first.value === 'all' ||
      first.value === 'ALL' ||
      first.value == null ||
      /^(tous|toutes|all)\b/i.test(first.label.trim()));
  const sentinel = hasSentinel ? first : null;
  const actual = hasSentinel ? options.slice(1) : options;
  const q = search.trim().toLowerCase();
  const filtered = q ? actual.filter((o) => o.label.toLowerCase().includes(q)) : actual;
  const active = !(value === null || value === undefined || value === '' || (sentinel && value === sentinel.value));
  const hit = options.find((o) => o.value === value);
  const current = customTriggerLabel || hit?.label || placeholder || first?.label || '';
  const total = sentinel?.count ?? actual.length;
  const close = () => {
    setOpen(false);
    setSearch('');
  };
  const pick = (v: V) => {
    onChange(v);
    close();
  };
  const clear = () => pick(sentinel ? sentinel.value : (first?.value as V));

  return (
    <span className="app-filter-dropdown">
      <Tooltip title={labelPrefix ? `${labelPrefix} : ${current}` : current}>
        <button
          ref={btn}
          type="button"
          disabled={disabled}
          onClick={() => (open ? close() : setOpen(true))}
          className={`filter-dropdown-btn pq-fs-trigger${active ? ' pq-fs-trigger--active' : ''}${standalone ? ' standalone' : ''}`}
        >
          <span className="btn-content">
            {labelPrefix && <span className="prefix pq-fs-prefix">{labelPrefix} :</span>}
            <span className="label pq-fs-label">{current}</span>
            {hit?.count !== undefined && hit.count > 0 && <span className="count pq-fs-badge">({hit.count})</span>}
            {active && (
              <span
                className="pq-fs-dot"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                title="Effacer ce filtre"
              >
                <MaterialIcon name="close" />
              </span>
            )}
            <MaterialIcon name={open ? 'arrow_drop_up' : 'arrow_drop_down'} className="arrow-icon pq-fs-caret" />
          </span>
        </button>
      </Tooltip>
      <ConnectedOverlay anchor={btn.current} open={open} onClose={close}>
        <div className="pq-fs-panel" onKeyDown={(e) => e.key === 'Escape' && close()}>
          <div className="pq-fs-search">
            <MaterialIcon name="search" />
            <input
              ref={input}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              autoComplete="off"
              spellCheck={false}
            />
            {search && (
              <button type="button" className="pq-fs-search-clear" onClick={() => setSearch('')}>
                <MaterialIcon name="close" />
              </button>
            )}
          </div>
          <div className="pq-fs-list" role="listbox">
            {sentinel && (
              <button
                type="button"
                className={`pq-fs-opt pq-fs-opt--all${!active ? ' pq-fs-opt--sel' : ''}`}
                onClick={() => pick(sentinel.value)}
              >
                <span className="pq-fs-opt-label">{sentinel.label}</span>
                {total > 0 && <span className="pq-fs-opt-count">{total}</span>}
                {!active && <MaterialIcon name="check" className="pq-fs-check" />}
              </button>
            )}
            {filtered.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                className={`pq-fs-opt${o.value === value ? ' pq-fs-opt--sel' : ''}`}
                onClick={() => pick(o.value)}
              >
                {o.icon && <MaterialIcon name={o.icon} className="pq-fs-opt-icon" style={{ color: o.color }} />}
                <span className="pq-fs-opt-label">{o.label}</span>
                {o.count != null && o.count > 0 && <span className="pq-fs-opt-count">{o.count}</span>}
                {o.value === value && <MaterialIcon name="check" className="pq-fs-check" />}
              </button>
            ))}
            {!filtered.length && (
              <div className="pq-fs-empty">
                <MaterialIcon name="search_off" />
                <span>Aucun résultat pour « {search} »</span>
              </div>
            )}
          </div>
          {active && (
            <button type="button" className="pq-fs-footer" onClick={clear}>
              <MaterialIcon name="filter_alt_off" /> Effacer la sélection
            </button>
          )}
        </div>
      </ConnectedOverlay>
    </span>
  );
}
