import { ClickAwayListener, Popper, Tooltip } from '@mui/material';
import { useRef, useState, type PointerEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { DEFAULT_SWATCHES, contrast, hexToHsv, hsvToHex } from './colorUtils';
import './color-picker.scss';

/** app-color-picker : palette + zone saturation/luminosité, teinte, saisie hexadécimale, pipette ; `inline` = palette seule. */
export function ColorPicker({
  value: raw,
  onChange,
  swatches = DEFAULT_SWATCHES,
  inline,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  swatches?: string[];
  inline?: boolean;
  disabled?: boolean;
}) {
  const value = (raw ?? '').toLowerCase();
  const origin = useRef<HTMLDivElement>(null);
  const sv = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [hue, setHueState] = useState(() => (value ? hexToHsv(value).h : 230));
  const [text, setText] = useState<string | null>(null);
  const eyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const base = hexToHsv(value || '#4f6bed');
  const hsv = { ...base, h: base.s === 0 ? hue : base.h };
  const cur = useRef(value);
  cur.current = value;

  const emit = (hex: string, remember = false) => {
    cur.current = hex;
    onChange(hex);
    if (remember && !swatches.includes(hex)) setRecent((r) => [hex, ...r.filter((c) => c !== hex)].slice(0, 8));
  };
  const pick = (c: string) => {
    setHueState(hexToHsv(c).h);
    emit(c);
  };
  const typed = () => {
    if (text === null) return;
    let v = text.trim().toLowerCase();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-f]{3}$/.test(v))
      v =
        '#' +
        v
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('');
    if (/^#[0-9a-f]{6}$/.test(v)) {
      pick(v);
      setRecent((r) => [v, ...r.filter((c) => c !== v)].slice(0, 8));
    }
    setText(null);
  };
  const setHue = (h: number) => {
    setHueState(h);
    emit(hsvToHex(h, hsv.s || 1, hsv.v || 1), true);
  };
  const svDown = (e: PointerEvent) => {
    const el = sv.current as HTMLDivElement;
    el.setPointerCapture?.(e.pointerId);
    const h = hsv.h;
    const move = (ev: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const v = 1 - Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
      emit(hsvToHex(h, s, v));
    };
    move(e);
    el.addEventListener('pointermove', move);
    el.addEventListener(
      'pointerup',
      () => {
        el.removeEventListener('pointermove', move);
        emit(cur.current, true);
      },
      { once: true },
    );
  };
  const eyedrop = async () => {
    try {
      const Ctor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } })
        .EyeDropper;
      const r = await new Ctor().open();
      pick(r.sRGBHex.toLowerCase());
    } catch {
      /* annulé */
    }
  };

  if (inline)
    return (
      <div className="app-color-picker">
        <div className="cp-swatches inline">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              className={`sw${c === value ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => pick(c)}
              aria-label={c}
            >
              {c === value && <MaterialIcon name="check" style={{ color: contrast(c) }} />}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="app-color-picker">
      <div className="form-field kit-field">
        <div ref={origin} className={`field-box cp-trigger${disabled ? ' is-disabled' : ''}`}>
          <button
            type="button"
            className="cp-chip"
            style={{ background: value || 'transparent' }}
            onClick={() => setOpen((o) => !o)}
            disabled={disabled}
            aria-label="Choisir une couleur"
          />
          <input
            type="text"
            value={text ?? value}
            maxLength={7}
            spellCheck={false}
            placeholder="#000000"
            disabled={disabled}
            aria-label="Couleur hexadécimale"
            onChange={(e) => setText(e.target.value)}
            onBlur={typed}
            onKeyDown={(e) => {
              if (e.key === 'Enter') typed();
              if (e.key === 'Escape') setOpen(false);
            }}
            onFocus={() => setOpen(true)}
          />
          <MaterialIcon name="palette" className="cp-caret" onClick={() => setOpen((o) => !o)} />
        </div>
      </div>
      <Popper
        open={open && !!origin.current}
        anchorEl={origin.current}
        placement="bottom-start"
        className="cdk-overlay-pane"
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
        ]}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!(e.target instanceof Node && origin.current?.contains(e.target))) setOpen(false);
          }}
        >
          <div className="app-color-picker" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
            <div className="kit-color-panel">
              <div
                ref={sv}
                className="cp-sv"
                style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                onPointerDown={svDown}
              >
                <div
                  className="cp-sv-cursor"
                  style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
                />
              </div>
              <div className="cp-row">
                {eyeDropper && (
                  <Tooltip title="Pipette">
                    <button type="button" className="cp-eye" onClick={() => void eyedrop()} aria-label="Pipette">
                      <MaterialIcon name="colorize" />
                    </button>
                  </Tooltip>
                )}
                <input
                  className="cp-hue"
                  type="range"
                  min={0}
                  max={360}
                  value={hsv.h}
                  onChange={(e) => setHue(+e.target.value)}
                  aria-label="Teinte"
                />
                <span className="cp-preview" style={{ background: value }} />
              </div>
              <div className="cp-swatches">
                {swatches.map((c) => (
                  <Tooltip key={c} title={c}>
                    <button
                      type="button"
                      className={`sw${c === value ? ' on' : ''}`}
                      style={{ background: c }}
                      onClick={() => pick(c)}
                      aria-label={c}
                    />
                  </Tooltip>
                ))}
              </div>
              {recent.length > 0 && (
                <>
                  <span className="cp-label">Récentes</span>
                  <div className="cp-swatches">
                    {recent.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="sw"
                        style={{ background: c }}
                        onClick={() => pick(c)}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
