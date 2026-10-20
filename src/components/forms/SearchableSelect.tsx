import { Tooltip } from '@mui/material';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ConnectedOverlay } from './ConnectedOverlay';
import './searchable-select.scss';

export interface SelectOption<V = unknown> {
  value: V;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  count?: number;
  disabled?: boolean;
}

/** app-searchable-select : sélecteur riche avec recherche instantanée (même panneau que app-filter-dropdown). */
export function SearchableSelect<V>({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher…',
  icon = '',
  clearable,
  allowNull,
  nullLabel = '— Aucun —',
  disabled,
  showCount,
  onBlur,
}: {
  options: SelectOption<V>[];
  value: V | null;
  onChange?: (v: V | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: string;
  clearable?: boolean;
  allowNull?: boolean;
  nullLabel?: string;
  disabled?: boolean;
  showCount?: boolean;
  onBlur?: () => void;
}) {
  const trigger = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [hi, setHi] = useState(0);
  const [width, setWidth] = useState(0);

  const normalized = useMemo<SelectOption<V | null>[]>(() => {
    const list: SelectOption<V | null>[] = options;
    if (allowNull && !list.some((o) => o.value === null || o.value === ''))
      return [{ value: null, label: nullLabel }, ...list];
    return list;
  }, [options, allowNull, nullLabel]);
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q
      ? normalized.filter((o) => o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q))
      : normalized;
  }, [normalized, term]);
  const selected =
    value === null || value === undefined
      ? null
      : (normalized.find((o) => o.value === value || String(o.value) === String(value)) ?? null);
  const label = selected ? selected.label : value === null && allowNull ? nullLabel : '';

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const doOpen = () => {
    if (disabled) return;
    setWidth(trigger.current?.getBoundingClientRect().width ?? 0);
    setTerm('');
    setHi(0);
    setOpen(true);
  };
  const close = () => {
    if (!open) return;
    setOpen(false);
    setTerm('');
    onBlur?.();
  };
  const select = (o: SelectOption<V | null>) => {
    if (o.disabled) return;
    onChange?.(o.value);
    close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        doOpen();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((i) => (i + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((i) => (i - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[hi];
      if (c) select(c);
    }
  };

  return (
    <div className="app-searchable-select">
      <div
        ref={trigger}
        className={`app-search-select-trigger${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${label ? ' has-value' : ''}`}
        onClick={() => (open ? close() : doOpen())}
        onKeyDown={onKey}
        tabIndex={0}
        role="combobox"
        aria-expanded={open}
        aria-label={label ? `${placeholder} : ${label}` : placeholder}
      >
        {icon && <MaterialIcon name={icon} className="trigger-icon" />}
        <div className="trigger-content">
          {label ? (
            <span className="trigger-label">{label}</span>
          ) : (
            <span className="trigger-placeholder">{placeholder}</span>
          )}
        </div>
        {clearable && label && !disabled && (
          <Tooltip title="Effacer la sélection">
            <button
              type="button"
              className="clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(null);
              }}
            >
              <MaterialIcon name="close" />
            </button>
          </Tooltip>
        )}
        <MaterialIcon name={open ? 'arrow_drop_up' : 'arrow_drop_down'} className="arrow-icon" />
      </div>
      <ConnectedOverlay
        anchor={trigger.current}
        open={open}
        onClose={close}
        width={width || undefined}
        className="app-search-select-overlay"
      >
        <div
          className="pq-fs-panel app-search-select-panel"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
            else onKey(e);
          }}
        >
          <div className="pq-fs-search">
            <MaterialIcon name="search" />
            <input
              ref={search}
              type="text"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setHi(0);
              }}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
            {term && (
              <button type="button" className="pq-fs-search-clear" onClick={() => setTerm('')}>
                <MaterialIcon name="close" />
              </button>
            )}
          </div>
          <div className="pq-fs-list" role="listbox">
            {filtered.map((o, i) => (
              <button
                key={String(o.value)}
                type="button"
                disabled={o.disabled}
                onClick={() => select(o)}
                className={`pq-fs-opt${selected?.value === o.value ? ' pq-fs-opt--sel' : ''}${hi === i ? ' is-highlighted' : ''}`}
              >
                {o.icon ? (
                  <MaterialIcon name={o.icon} className="pq-fs-opt-icon" style={{ color: o.color }} />
                ) : o.color ? (
                  <span className="pq-fs-dot" style={{ backgroundColor: o.color }} />
                ) : null}
                <span className="pq-fs-opt-label">{o.label}</span>
                {showCount && o.count != null && o.count > 0 && <span className="pq-fs-opt-count">{o.count}</span>}
                {selected?.value === o.value && <MaterialIcon name="check" className="pq-fs-check" />}
              </button>
            ))}
            {!filtered.length && (
              <div className="pq-fs-empty">
                <MaterialIcon name="search_off" />
                <span>Aucun résultat pour « {term} »</span>
              </div>
            )}
          </div>
          {allowNull && value !== null && (
            <button
              type="button"
              className="pq-fs-footer"
              onClick={() => {
                onChange?.(null);
                close();
              }}
            >
              <MaterialIcon name="filter_alt_off" /> {nullLabel}
            </button>
          )}
        </div>
      </ConnectedOverlay>
    </div>
  );
}
