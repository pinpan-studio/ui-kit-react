import { CircularProgress, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ConnectedOverlay } from './ConnectedOverlay';
import { defaultEntityLabel } from './entityLabel';
import './entity-autocomplete.scss';

type Entity = Record<string, unknown>;

/**
 * app-entity-autocomplete : recherche avec debounce (300 ms), spinner, effacement, « aucun résultat ».
 * `searchFn` renvoie une promesse (équivalent de l'Observable Angular).
 */
export function EntityAutocomplete<T extends Entity>({
  placeholder = 'Rechercher...',
  icon = 'search',
  searchFn,
  displayFn = defaultEntityLabel,
  onItemSelected,
  disabled,
  initialItem = null,
}: {
  placeholder?: string;
  icon?: string;
  searchFn: (term: string) => Promise<T[]>;
  displayFn?: (item: T) => string;
  onItemSelected?: (item: T | null) => void;
  disabled?: boolean;
  initialItem?: T | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(() =>
    initialItem ? displayFn(initialItem) || defaultEntityLabel(initialItem) : '',
  );
  const [typed, setTyped] = useState<string | null>(null);
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<T | null>(initialItem);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const label = (i: T) => displayFn(i) || defaultEntityLabel(i);

  useEffect(() => {
    if (typed === null) return;
    setLoading(true);
    let live = true;
    const t = setTimeout(() => {
      const term = typed.trim();
      if (!term || (selected && label(selected) === term)) {
        setOptions([]);
        setLoading(false);
        return;
      }
      searchFn(term)
        .catch(() => [] as T[])
        .then((r) => {
          if (!live) return;
          setOptions(r ?? []);
          setLoading(false);
          setActive(-1);
        });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  const pick = (o: T) => {
    setSelected(o);
    setText(label(o));
    setOptions([]);
    setOpen(false);
    onItemSelected?.(o);
  };
  const clear = () => {
    setSelected(null);
    setText('');
    setTyped(null);
    setOptions([]);
    setLoading(false);
    onItemSelected?.(null);
  };
  const showEmpty =
    !loading && !!text && options.length === 0 && typed !== null && !(selected && label(selected) === text);
  const panelOpen = open && (options.length > 0 || showEmpty);

  return (
    <div className="app-entity-autocomplete">
      <div
        ref={box}
        className={`field-box select-box autocomplete-box${disabled ? ' is-disabled' : ''}${text ? ' has-value' : ''}`}
      >
        <MaterialIcon name={icon} className="input-icon" />
        <input
          type="text"
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          role="combobox"
          aria-expanded={panelOpen}
          onChange={(e) => {
            setText(e.target.value);
            setTyped(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (selected) {
              if (text !== label(selected)) setText(label(selected));
            } else if (!text.trim()) clear();
          }}
          onKeyDown={(e) => {
            if (!panelOpen) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && options[active]) {
              e.preventDefault();
              pick(options[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {loading && <CircularProgress size={16} className="mat-spinner" />}
        {(selected || text) && (
          <Tooltip title="Effacer">
            <button
              type="button"
              className="clear-btn"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
            >
              <MaterialIcon name="close" />
            </button>
          </Tooltip>
        )}
        <MaterialIcon name="arrow_drop_down" className="search-indicator-icon" />
      </div>
      <ConnectedOverlay
        anchor={box.current}
        open={panelOpen}
        onClose={() => setOpen(false)}
        width={box.current?.offsetWidth}
      >
        <div
          className="app-entity-autocomplete mat-mdc-autocomplete-panel app-autocomplete-panel"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.map((o, i) => (
            <div
              key={String(o._id ?? o.id ?? i)}
              role="option"
              aria-selected={i === active}
              className={`mat-mdc-option app-autocomplete-option${i === active ? ' mat-mdc-option-active' : ''}`}
              onClick={() => pick(o)}
            >
              <span className="mdc-list-item__primary-text">
                <div className="option-content">
                  <MaterialIcon name={icon} className="opt-icon" />
                  <span className="opt-label">{label(o)}</span>
                </div>
              </span>
            </div>
          ))}
          {showEmpty && (
            <div className="mat-mdc-option mdc-list-item--disabled empty-option" aria-disabled>
              <span className="mdc-list-item__primary-text">
                <div className="empty-result">
                  <MaterialIcon name="search_off" />
                  <span>Aucun résultat pour « {text} »</span>
                </div>
              </span>
            </div>
          )}
        </div>
      </ConnectedOverlay>
    </div>
  );
}
