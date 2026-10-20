import type { CSSProperties, ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';

// Répliques DOM des composants Angular Material de la galerie Data (chip, list, checkbox, badge, progress),
// stylées par la CSS MIT copiée dans styles/_mat-data.scss.

const CHECK = 'M1.73,12.91 8.1,19.28 22.79,4.59';

export function MdcCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: () => void;
  label?: string;
}) {
  return (
    <div className="mat-mdc-checkbox mat-accent">
      <div className="mdc-form-field mat-internal-form-field">
        <div className="mdc-checkbox">
          <div className="mat-mdc-checkbox-touch-target" />
          <input
            type="checkbox"
            className={`mdc-checkbox__native-control${indeterminate ? ' mdc-checkbox--selected' : ''}`}
            checked={checked}
            ref={(el) => {
              if (el) el.indeterminate = !!indeterminate;
            }}
            onChange={() => onChange?.()}
            aria-label={label}
          />
          <div className="mdc-checkbox__ripple" />
          <div className="mdc-checkbox__background">
            <svg focusable="false" viewBox="0 0 24 24" className="mdc-checkbox__checkmark" aria-hidden="true">
              <path fill="none" d={CHECK} className="mdc-checkbox__checkmark-path" />
            </svg>
            <div className="mdc-checkbox__mixedmark" />
          </div>
          <div className="mat-ripple mat-mdc-checkbox-ripple mat-focus-indicator" />
        </div>
        <label className="mdc-label" />
      </div>
    </div>
  );
}

export function MatChipSet({ children }: { children: ReactNode }) {
  return (
    <div className="mat-mdc-chip-set mdc-evolution-chip-set">
      <div className="mdc-evolution-chip-set__chips" role="presentation">
        {children}
      </div>
    </div>
  );
}
export function MatChip({
  children,
  highlighted,
  disabled,
  avatar,
  onRemove,
}: {
  children: ReactNode;
  highlighted?: boolean;
  disabled?: boolean;
  avatar?: string;
  onRemove?: () => void;
}) {
  const cls = [
    'mat-mdc-chip mat-primary mdc-evolution-chip',
    avatar &&
      'mdc-evolution-chip--with-primary-graphic mdc-evolution-chip--with-primary-icon mdc-evolution-chip--with-avatar mat-mdc-chip-with-avatar',
    onRemove && 'mdc-evolution-chip--with-trailing-action',
    highlighted && 'mat-mdc-chip-highlighted',
    disabled && 'mdc-evolution-chip--disabled mat-mdc-chip-disabled',
    'mat-mdc-standard-chip',
    onRemove && 'mat-mdc-chip-with-trailing-icon',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <span className="mat-mdc-chip-focus-overlay" />
      <span className="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
        <span className="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--presentational mdc-evolution-chip__action--primary">
          {avatar && (
            <span className="mdc-evolution-chip__graphic mat-mdc-chip-graphic">
              <MaterialIcon
                name={avatar}
                className="mat-mdc-chip-avatar mdc-evolution-chip__icon mdc-evolution-chip__icon--primary"
              />
            </span>
          )}
          <span className="mdc-evolution-chip__text-label mat-mdc-chip-action-label">
            {children}
            <span className="mat-mdc-chip-primary-focus-indicator mat-focus-indicator" />
          </span>
        </span>
      </span>
      {onRemove && (
        <span className="mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing">
          <button
            type="button"
            aria-label="Retirer"
            onClick={onRemove}
            className="mat-mdc-chip-remove mat-mdc-chip-trailing-icon mat-focus-indicator mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--secondary mdc-evolution-chip__action--trailing"
          >
            <MaterialIcon name="cancel" />
          </button>
        </span>
      )}
    </div>
  );
}

export function MatList({ children }: { children: ReactNode }) {
  return (
    <div className="mat-mdc-list mat-mdc-list-base mdc-list" role="list">
      {children}
    </div>
  );
}
export function MatListItem({ avatar, title, line }: { avatar: ReactNode; title: ReactNode; line: ReactNode }) {
  return (
    <div
      role="listitem"
      className="mat-mdc-list-item mdc-list-item mdc-list-item--with-leading-avatar mdc-list-item--with-two-lines"
    >
      <div className="mat-mdc-list-item-avatar list-avatar mdc-list-item__start">{avatar}</div>
      <span className="mdc-list-item__content">
        <span className="mat-mdc-list-item-title mdc-list-item__primary-text">{title}</span>
        <span className="mat-mdc-list-item-line mdc-list-item__secondary-text">{line}</span>
        <span className="mat-mdc-list-item-unscoped-content" />
      </span>
      <div className="mat-focus-indicator" />
    </div>
  );
}
export function MatSelectionList<V>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel = 'Sélection',
}: {
  options: { value: V; label: ReactNode }[];
  value: V[];
  onChange: (v: V[]) => void;
  'aria-label'?: string;
}) {
  const toggle = (v: V) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div
      role="listbox"
      aria-multiselectable="true"
      aria-label={ariaLabel}
      className="mat-mdc-selection-list mat-mdc-list-base mdc-list"
    >
      {options.map((o, i) => {
        const sel = value.includes(o.value);
        return (
          <div
            key={i}
            role="option"
            aria-selected={sel}
            tabIndex={0}
            onClick={() => toggle(o.value)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle(o.value);
              }
            }}
            className={`mat-mdc-list-item mat-mdc-list-option mdc-list-item mat-mdc-list-item-interactive mdc-list-item--with-trailing-checkbox mat-mdc-list-item-single-line mdc-list-item--with-one-line${sel ? ' mdc-list-item--selected' : ''}`}
          >
            <span className="mdc-list-item__content">
              <span className="mat-mdc-list-item-unscoped-content mdc-list-item__primary-text">{o.label}</span>
            </span>
            <span className="mdc-list-item__end">
              <div className="mdc-checkbox">
                <input type="checkbox" className="mdc-checkbox__native-control" checked={sel} readOnly tabIndex={-1} />
                <div className="mdc-checkbox__background">
                  <svg viewBox="0 0 24 24" className="mdc-checkbox__checkmark" aria-hidden="true">
                    <path fill="none" d={CHECK} className="mdc-checkbox__checkmark-path" />
                  </svg>
                  <div className="mdc-checkbox__mixedmark" />
                </div>
              </div>
            </span>
            <div className="mat-focus-indicator" />
          </div>
        );
      })}
    </div>
  );
}

export function MatBadgeContent({ children }: { children: ReactNode }) {
  return <span className="mat-badge-content mat-badge-active">{children}</span>;
}

export function MatProgressBar({ value, color = 'primary' }: { value: number; color?: 'primary' | 'accent' | 'warn' }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`mat-mdc-progress-bar mdc-linear-progress mat-${color} mdc-linear-progress--animation-ready`}
    >
      <div className="mdc-linear-progress__buffer">
        <div className="mdc-linear-progress__buffer-bar" style={{ flexBasis: '100%' }} />
      </div>
      <div
        className="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
        style={{ transform: `scaleX(${value / 100})` }}
      >
        <span className="mdc-linear-progress__bar-inner" />
      </div>
      <div className="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
        <span className="mdc-linear-progress__bar-inner" />
      </div>
    </div>
  );
}

/** mat-progress-spinner / mat-spinner (rayon et viewBox calculés comme Angular Material, trait 10 %). */
export function MatSpinner({ diameter = 40, value }: { diameter?: number; value?: number }) {
  const stroke = diameter / 10;
  const r = (diameter - 10) / 2;
  const size = +(r * 2 + stroke).toFixed(1);
  const vb = `0 0 ${size} ${size}`;
  const circ = 2 * Math.PI * r;
  const det = value !== undefined;
  const circle = (s: CSSProperties, cls?: string) => (
    <circle
      cx="50%"
      cy="50%"
      r={r}
      className={cls}
      style={{ strokeWidth: '10%', strokeDasharray: `${circ}px`, ...s }}
    />
  );
  const ind = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      className="mdc-circular-progress__indeterminate-circle-graphic"
      viewBox={vb}
    >
      {circle({ strokeDashoffset: `${circ / 2}px` })}
    </svg>
  );
  return (
    <div
      role="progressbar"
      aria-valuenow={det ? value : undefined}
      className={`mat-mdc-progress-spinner mdc-circular-progress mat-primary${det ? '' : ' mdc-circular-progress--indeterminate'}`}
      style={
        {
          width: diameter,
          height: diameter,
          '--mat-progress-spinner-size': `${diameter}px`,
          '--mat-progress-spinner-active-indicator-width': `${diameter}px`,
        } as CSSProperties
      }
    >
      <div className="mdc-circular-progress__determinate-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
          className="mdc-circular-progress__determinate-circle-graphic"
          viewBox={vb}
        >
          {circle(
            { strokeDashoffset: det ? `${(circ * (100 - value)) / 100}px` : undefined },
            'mdc-circular-progress__determinate-circle',
          )}
        </svg>
      </div>
      <div className="mdc-circular-progress__indeterminate-container">
        <div className="mdc-circular-progress__spinner-layer">
          <div className="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-left">{ind}</div>
          <div className="mdc-circular-progress__gap-patch">{ind}</div>
          <div className="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-right">{ind}</div>
        </div>
      </div>
    </div>
  );
}

/** Réplique DOM de mat-chip-listbox (sélection unique). */
export function MatChipListbox<V extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: string }[];
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={`mdc-evolution-chip-set mat-mdc-chip-listbox mat-mdc-chip-set${className ? ` ${className}` : ''}`}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div role="presentation" className="mdc-evolution-chip-set__chips">
        {options.map((o) => {
          const sel = o.value === value;
          return (
            <div
              key={o.value}
              role="presentation"
              className={`mat-mdc-chip mat-mdc-chip-option mat-primary mdc-evolution-chip mat-mdc-standard-chip mdc-evolution-chip--filter mdc-evolution-chip--selectable mdc-evolution-chip--selecting mdc-evolution-chip--with-primary-graphic${sel ? ' mat-mdc-chip-selected mdc-evolution-chip--selected' : ''}`}
            >
              <span className="mat-mdc-chip-focus-overlay" />
              <span className="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => !sel && onChange(o.value)}
                  className="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
                >
                  <span className="mdc-evolution-chip__graphic mat-mdc-chip-graphic">
                    <span className="mdc-evolution-chip__checkmark">
                      <svg
                        viewBox="-2 -3 30 30"
                        focusable="false"
                        aria-hidden="true"
                        className="mdc-evolution-chip__checkmark-svg"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          d="M1.73,12.91 8.1,19.28 22.79,4.59"
                          className="mdc-evolution-chip__checkmark-path"
                        />
                      </svg>
                    </span>
                  </span>
                  <span className="mdc-evolution-chip__text-label mat-mdc-chip-action-label">
                    {o.label}
                    <span className="mat-mdc-chip-primary-focus-indicator mat-focus-indicator" />
                  </span>
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
