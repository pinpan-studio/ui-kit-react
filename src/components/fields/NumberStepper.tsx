import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './number-stepper.scss';

/** app-number-stepper : boutons − / +, bornes, pas, décimales, appui long, ↑/↓ (Maj ×10), unité, variante compacte. */
export function NumberStepper({
  value: raw,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 0,
  unit = '',
  compact,
  disabled,
  onBlur,
  'aria-label': ariaLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  unit?: string;
  compact?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  'aria-label'?: string;
}) {
  const value = raw ?? (isFinite(min) ? min : 0);
  const cur = useRef(value);
  cur.current = value;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fmt = (v: number) =>
    v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const [text, setText] = useState<string | null>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (v: number) => {
    const f = 10 ** decimals;
    const n = Math.max(min, Math.min(max, Math.round(v * f) / f));
    if (n === cur.current) return;
    cur.current = n;
    onChange(n);
  };
  const doStep = (d: number, mult = 1) => commit(cur.current + d * step * mult);
  const hold = (d: number, e: PointerEvent) => {
    if (e.button !== 0) return;
    doStep(d);
    let delay = 380;
    const tick = () => {
      doStep(d);
      delay = Math.max(40, delay * 0.8);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, delay);
  };
  const release = () => clearTimeout(timer.current);
  const typed = () => {
    if (text === null) return;
    const n = parseFloat(text.replace(/\s| /g, '').replace(',', '.'));
    if (!isNaN(n)) commit(n);
    setText(null);
  };

  return (
    <span className="app-number-stepper">
      <div className={`ns${compact ? ' compact' : ''}${disabled ? ' disabled' : ''}`}>
        <button
          type="button"
          onPointerDown={(e) => hold(-1, e)}
          onPointerUp={release}
          onPointerLeave={release}
          onKeyDown={(e) => e.key === 'Enter' && doStep(-1)}
          disabled={disabled || value <= min}
          aria-label="Diminuer"
        >
          <MaterialIcon name="remove" />
        </button>
        <div className="val">
          <input
            type="text"
            inputMode="decimal"
            value={text ?? fmt(value)}
            disabled={disabled}
            role="spinbutton"
            aria-label={ariaLabel}
            aria-valuemin={isFinite(min) ? min : undefined}
            aria-valuemax={isFinite(max) ? max : undefined}
            aria-valuenow={value}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                doStep(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1);
              } else if (e.key === 'Enter') typed();
            }}
            onBlur={() => {
              typed();
              onBlur?.();
            }}
          />
          {unit && <span className="unit">{unit}</span>}
        </div>
        <button
          type="button"
          onPointerDown={(e) => hold(1, e)}
          onPointerUp={release}
          onPointerLeave={release}
          onKeyDown={(e) => e.key === 'Enter' && doStep(1)}
          disabled={disabled || value >= max}
          aria-label="Augmenter"
        >
          <MaterialIcon name="add" />
        </button>
      </div>
    </span>
  );
}
