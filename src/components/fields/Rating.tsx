import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './rating.scss';

const EMOJIS = [
  { icon: '😡', label: 'Très insatisfait' },
  { icon: '🙁', label: 'Insatisfait' },
  { icon: '😐', label: 'Neutre' },
  { icon: '🙂', label: 'Satisfait' },
  { icon: '😍', label: 'Très satisfait' },
];

/** app-rating : étoiles / cœurs / émojis, demi-valeurs, lecture seule, valeur et nombre d'avis. */
export function Rating({
  value: model = 0,
  onChange,
  max = 5,
  half,
  readonly,
  variant = 'star',
  size = 'medium',
  showValue,
  count = null,
  label = 'Note',
  disabled,
}: {
  value?: number;
  onChange?: (v: number) => void;
  max?: number;
  half?: boolean;
  readonly?: boolean;
  variant?: 'star' | 'heart' | 'emoji';
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  count?: number | null;
  label?: string;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? model;
  const locked = readonly || disabled || !onChange;
  const icon = variant === 'heart' ? 'favorite' : 'star';
  const at = (i: number, e: MouseEvent<HTMLElement>) => {
    if (!half) return i + 1;
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX - r.left < r.width / 2 ? i + 0.5 : i + 1;
  };
  const preview = (v: number) => {
    if (!locked) setHover(v);
  };
  const pick = (v: number) => {
    if (locked) return;
    setHover(null);
    onChange(v === model ? 0 : v);
  };
  const onKey = (e: KeyboardEvent) => {
    if (locked) return;
    const s = half && variant !== 'emoji' ? 0.5 : 1;
    const m = variant === 'emoji' ? 5 : max;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(m, model + s) || s);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, model - s));
    }
  };
  const valueLabel =
    variant === 'emoji'
      ? shown
        ? (EMOJIS[Math.round(shown) - 1]?.label ?? '—')
        : '—'
      : shown.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

  return (
    <span className="app-rating">
      <div
        className={`rt rt--${size}${readonly || disabled ? ' readonly' : ''}${variant === 'heart' ? ' heart' : ''}`}
        role="radiogroup"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
      >
        {variant === 'emoji'
          ? EMOJIS.map((e, i) => (
              <button
                key={e.label}
                type="button"
                className={`emo${shown === i + 1 ? ' on' : ''}${shown && shown !== i + 1 ? ' dim' : ''}`}
                onClick={() => pick(i + 1)}
                onMouseEnter={() => preview(i + 1)}
                aria-label={e.label}
                tabIndex={-1}
              >
                <span>{e.icon}</span>
              </button>
            ))
          : Array.from({ length: max }, (_, i) => (
              <span key={i} className="star" onMouseMove={(e) => preview(at(i, e))} onClick={(e) => pick(at(i, e))}>
                <MaterialIcon name={icon} className="bg" />
                <span className="fg" style={{ width: `${Math.max(0, Math.min(1, shown - i)) * 100}%` }}>
                  <MaterialIcon name={icon} />
                </span>
              </span>
            ))}
        {showValue && (
          <span className="val">
            {valueLabel}
            {count !== null && <em>({count})</em>}
          </span>
        )}
      </div>
    </span>
  );
}
