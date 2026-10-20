import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import './range-slider.scss';

export type RangeValue = [number, number];
const NNBSP = /\u202f/g;

/** app-range-slider : deux curseurs, histogramme, saisie min/max, écart minimal, infobulles formatées. */
export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  unit = '',
  histogram = [],
  inputs = true,
  format = null,
  disabled,
  onBlur,
}: {
  value: RangeValue | null;
  onChange: (v: RangeValue) => void;
  min?: number;
  max?: number;
  step?: number;
  minGap?: number;
  unit?: string;
  histogram?: number[];
  inputs?: boolean;
  format?: ((v: number) => string) | null;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const lo = value?.[0] ?? min;
  const hi = value?.[1] ?? max;
  const cur = useRef<RangeValue>([lo, hi]);
  cur.current = [lo, hi];
  const [texts, setTexts] = useState<[string | null, string | null]>([null, null]);
  const histMax = Math.max(1, ...histogram);
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const fmtNum = (v: number) => v.toLocaleString('fr-FR').replace(NNBSP, ' ');
  const fmt = (v: number) => (format ? format(v) : `${fmtNum(v)}${unit ? ' ' + unit : ''}`);
  const inRange = (i: number) => {
    const w = (max - min) / histogram.length;
    const a = min + i * w;
    return a + w > lo && a < hi;
  };
  const snap = (v: number) => Math.max(min, Math.min(max, Math.round((v - min) / step) * step + min));
  const set = (t: 0 | 1, v: number) => {
    const s = snap(v);
    const [l, h] = cur.current;
    const next: RangeValue = t === 0 ? [Math.min(s, h - minGap), h] : [l, Math.max(s, l + minGap)];
    cur.current = next;
    onChange(next);
  };
  const valueAt = (e: { clientX: number }) => {
    const r = (track.current as HTMLDivElement).getBoundingClientRect();
    return min + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (max - min);
  };
  const drag = (t: 0 | 1, e: PointerEvent) => {
    const el = track.current as HTMLDivElement;
    el.setPointerCapture?.(e.pointerId);
    setActive(t);
    const move = (ev: globalThis.PointerEvent) => set(t, valueAt(ev));
    el.addEventListener('pointermove', move);
    el.addEventListener(
      'pointerup',
      () => {
        el.removeEventListener('pointermove', move);
        setActive(null);
        onBlur?.();
      },
      { once: true },
    );
  };
  const onKey = (t: 0 | 1, e: KeyboardEvent) => {
    const c = t ? hi : lo;
    const big = (max - min) / 10;
    const map: Record<string, number> = {
      ArrowLeft: c - step,
      ArrowDown: c - step,
      ArrowRight: c + step,
      ArrowUp: c + step,
      PageDown: c - big,
      PageUp: c + big,
      Home: min,
      End: max,
    };
    const v = map[e.key];
    if (v !== undefined) {
      e.preventDefault();
      set(t, v);
    }
  };
  const typed = (t: 0 | 1) => {
    const txt = texts[t];
    if (txt !== null) {
      const n = parseFloat(txt.replace(/[\s ]/g, '').replace(',', '.'));
      if (!isNaN(n)) set(t, n);
    }
    setTexts((s) => (t ? [s[0], null] : [null, s[1]]));
  };

  return (
    <div className="app-range-slider">
      <div className={`rs${disabled ? ' disabled' : ''}`}>
        {histogram.length > 0 && (
          <div className="rs-hist">
            {histogram.map((h, i) => (
              <span key={i} style={{ height: `${(h / histMax) * 100}%` }} className={inRange(i) ? 'in' : undefined} />
            ))}
          </div>
        )}
        <div
          ref={track}
          className="rs-track"
          onPointerDown={(e) => {
            const v = valueAt(e);
            const t: 0 | 1 = Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1;
            set(t, v);
            drag(t, e);
          }}
        >
          <div className="rs-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
          {([0, 1] as const).map((t) => (
            <div
              key={t}
              className={`rs-thumb${active === t ? ' active' : ''}`}
              style={{ left: `${pct(t ? hi : lo)}%` }}
              tabIndex={0}
              role="slider"
              aria-label={t ? 'Maximum' : 'Minimum'}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={t ? hi : lo}
              aria-valuetext={fmt(t ? hi : lo)}
              onPointerDown={(e) => {
                e.stopPropagation();
                drag(t, e);
              }}
              onKeyDown={(e) => onKey(t, e)}
            >
              <span className="rs-tip">{fmt(t ? hi : lo)}</span>
            </div>
          ))}
        </div>
        {inputs && (
          <div className="rs-inputs">
            {([0, 1] as const).map((t) => (
              <span key={t} style={{ display: 'contents' }}>
                {t === 1 && <span className="dash">—</span>}
                <label className="field-box">
                  <span>{t ? 'Max' : 'Min'}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={texts[t] ?? fmtNum(t ? hi : lo)}
                    disabled={disabled}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTexts((s) => (t ? [s[0], v] : [v, s[1]]));
                    }}
                    onBlur={() => typed(t)}
                    onKeyDown={(e) => e.key === 'Enter' && typed(t)}
                  />
                  {unit && <em>{unit}</em>}
                </label>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
