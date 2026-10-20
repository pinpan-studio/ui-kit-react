import { Popper, ClickAwayListener } from '@mui/material';
import { useRef, useState, type KeyboardEvent } from 'react';

export interface MatOption {
  value: string;
  label: string;
}

const Arrow = () => (
  <div className="mat-mdc-select-arrow-wrapper">
    <div className="mat-mdc-select-arrow">
      <svg viewBox="0 0 24 24" width="24px" height="24px" focusable="false" aria-hidden="true">
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </div>
  </div>
);

/** Réplique de mat-select (déclencheur + panneau « m3-dropdown-menu »), simple ou multiple. */
export function MatSelect({
  options,
  value,
  onChange,
  multiple,
  placeholder,
  panelClass = 'm3-dropdown-menu',
  disabled,
  onBlur,
  'aria-label': ariaLabel,
}: {
  options: MatOption[];
  value: string | string[] | null;
  onChange?: (v: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  panelClass?: string;
  disabled?: boolean;
  onBlur?: () => void;
  'aria-label'?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const values = Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const text = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label)
    .join(', ');
  const close = () => {
    setOpen(false);
    onBlur?.();
    ref.current?.focus();
  };
  const show = () => {
    if (disabled) return;
    const i = options.findIndex((o) => values.includes(o.value));
    setActive(i < 0 ? 0 : i);
    setOpen(true);
  };
  const pick = (v: string) => {
    if (multiple) onChange?.(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
    else {
      onChange?.(v);
      close();
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === 'Escape' || e.key === 'Tab') close();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const o = options[active];
      if (o) pick(o.value);
    }
  };
  return (
    <div
      ref={ref}
      role="combobox"
      aria-expanded={open}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`mat-mdc-select${open ? ' mat-select-open' : ''}${disabled ? ' mat-mdc-select-disabled' : ''}${multiple ? ' mat-mdc-select-multiple' : ''}${text ? '' : ' mat-mdc-select-empty'}`}
      onClick={() => (open ? close() : show())}
      onKeyDown={onKey}
    >
      <div className="mat-mdc-select-trigger">
        <div className="mat-mdc-select-value">
          {text ? (
            <span className="mat-mdc-select-value-text">
              <span className="mat-mdc-select-min-line">{text}</span>
            </span>
          ) : (
            <span className="mat-mdc-select-placeholder mat-mdc-select-min-line">{placeholder}</span>
          )}
        </div>
        <Arrow />
      </div>
      <Popper
        className="cdk-overlay-pane"
        open={open}
        anchorEl={ref.current}
        placement="bottom-start"
        style={{ zIndex: 1300, width: ref.current?.offsetWidth }}
        modifiers={[
          { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
          { name: 'preventOverflow', options: { padding: 8 } },
        ]}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!(e.target instanceof Node && ref.current?.contains(e.target))) close();
          }}
        >
          <div
            role="listbox"
            aria-multiselectable={multiple}
            className={`mat-mdc-select-panel mdc-menu-surface mdc-menu-surface--open ${panelClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={values.includes(o.value)}
                onClick={() => pick(o.value)}
                onMouseEnter={() => setActive(i)}
                className={`mat-mdc-option mdc-list-item${values.includes(o.value) ? ' mdc-list-item--selected' : ''}${i === active ? ' mat-mdc-option-active' : ''}`}
              >
                <span className="mdc-list-item__primary-text">{o.label}</span>
              </div>
            ))}
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
