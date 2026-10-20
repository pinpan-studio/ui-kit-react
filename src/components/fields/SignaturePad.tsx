import { Tooltip } from '@mui/material';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './signature-pad.scss';

interface Pt {
  x: number;
  y: number;
  t: number;
  w: number;
}
interface Stroke {
  color: string;
  points: Pt[];
}

/** app-signature-pad : canvas lissé (vitesse/pression), encres, annuler/effacer, horodatage ; valeur = PNG base64. */
export function SignaturePad({
  value = null,
  onChange,
  height = '180px',
  placeholder = 'Signez dans ce cadre',
  inks = ['#0f172a', '#1d4ed8', '#4f6bed'],
  minWidth = 0.8,
  maxWidth = 3,
  invalid,
  showDate = true,
  disabled,
  onBlur,
}: {
  value?: string | null;
  onChange?: (v: string | null) => void;
  height?: string;
  placeholder?: string;
  inks?: string[];
  minWidth?: number;
  maxWidth?: number;
  invalid?: boolean;
  showDate?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const [count, setCount] = useState(0);
  const [ink, setInk] = useState(inks[0] ?? '#0f172a');
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const pending = useRef<string | null>(value);
  const emitted = useRef<string | null>(value);

  const ctx = () => (canvas.current as HTMLCanvasElement).getContext('2d');
  const drawStroke = (s: Stroke, from: number) => {
    const g = ctx();
    if (!g) return;
    const p = s.points;
    g.strokeStyle = g.fillStyle = s.color;
    g.lineCap = g.lineJoin = 'round';
    const p0 = p[0] as Pt;
    if (p.length === 1) {
      g.beginPath();
      g.arc(p0.x, p0.y, p0.w / 2, 0, Math.PI * 2);
      g.fill();
      return;
    }
    for (let i = Math.max(1, from); i < p.length; i++) {
      const a = p[i - 1] as Pt;
      const b = p[i] as Pt;
      const pp = p[i - 2];
      const pa = i > 1 && pp ? { x: (pp.x + a.x) / 2, y: (pp.y + a.y) / 2 } : a;
      g.lineWidth = (a.w + b.w) / 2;
      g.beginPath();
      g.moveTo(pa.x, pa.y);
      g.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
      g.stroke();
    }
  };
  const redraw = useCallback(() => {
    const c = canvas.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    g.clearRect(0, 0, c.width, c.height);
    if (pending.current && !strokes.current.length) {
      const img = new Image();
      img.onload = () => g.drawImage(img, 0, 0, c.getBoundingClientRect().width, c.getBoundingClientRect().height);
      img.src = pending.current;
    }
    for (const s of strokes.current) drawStroke(s, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height: h } = c.getBoundingClientRect();
      if (!width) return;
      c.width = Math.round(width * dpr);
      c.height = Math.round(h * dpr);
      c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [redraw]);

  // writeValue : une valeur externe différente de la dernière émise remplace le dessin.
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    strokes.current = [];
    setCount(0);
    pending.current = value;
    redraw();
  }, [value, redraw]);

  const emit = () => {
    const v = strokes.current.length ? (canvas.current as HTMLCanvasElement).toDataURL('image/png') : null;
    setSignedAt(v ? new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null);
    emitted.current = v;
    onChange?.(v);
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const c = e.currentTarget;
    c.setPointerCapture?.(e.pointerId);
    const r = c.getBoundingClientRect();
    const stroke: Stroke = { color: ink, points: [] };
    const add = (ev: {
      clientX: number;
      clientY: number;
      timeStamp: number;
      pointerType: string;
      pressure: number;
    }) => {
      const x = ev.clientX - r.left,
        y = ev.clientY - r.top,
        t = ev.timeStamp;
      const last = stroke.points[stroke.points.length - 1];
      let w = (minWidth + maxWidth) / 2;
      if (last) {
        const v = Math.hypot(x - last.x, y - last.y) / Math.max(1, t - last.t);
        w = Math.max(minWidth, Math.min(maxWidth, maxWidth - v * 1.6));
        w = last.w * 0.7 + w * 0.3;
        if (Math.hypot(x - last.x, y - last.y) < 1.2) return;
      }
      if (ev.pointerType === 'pen' && ev.pressure) w = minWidth + (maxWidth - minWidth) * ev.pressure;
      stroke.points.push({ x, y, t, w });
      drawStroke(stroke, stroke.points.length - 1);
    };
    add(e.nativeEvent);
    strokes.current = [...strokes.current, stroke];
    setCount(strokes.current.length);
    const move = (ev: globalThis.PointerEvent) => (ev.getCoalescedEvents?.() ?? [ev]).forEach(add);
    const up = () => {
      c.removeEventListener('pointermove', move);
      if (stroke.points.length === 1) drawStroke(stroke, 0);
      emit();
      onBlur?.();
    };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up, { once: true });
    c.addEventListener('pointercancel', up, { once: true });
  };
  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    setCount(strokes.current.length);
    pending.current = null;
    redraw();
    emit();
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    pending.current = null;
    redraw();
    emit();
  };

  return (
    <div className="app-signature-pad">
      <div className={`sig${disabled ? ' disabled' : ''}${count > 0 ? ' signed' : ''}${invalid ? ' invalid' : ''}`}>
        <canvas ref={canvas} style={{ height }} onPointerDown={down} aria-label="Zone de signature" role="img" />
        <div className="sig-line">
          <span>✕</span>
          <i />
        </div>
        {!count && (
          <div className="sig-hint">
            <MaterialIcon name="draw" />
            {placeholder}
          </div>
        )}
        <div className="sig-tools">
          {inks.map((c) => (
            <button
              key={c}
              type="button"
              className={`ink${c === ink ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => setInk(c)}
              aria-label={`Encre ${c}`}
            />
          ))}
          <span className="sep" />
          <Tooltip title="Annuler le dernier trait">
            <span style={{ display: 'contents' }}>
              <button type="button" onClick={undo} disabled={!count || disabled} aria-label="Annuler le dernier trait">
                <MaterialIcon name="undo" />
              </button>
            </span>
          </Tooltip>
          <Tooltip title="Effacer">
            <span style={{ display: 'contents' }}>
              <button type="button" onClick={clear} disabled={!count || disabled} aria-label="Effacer">
                <MaterialIcon name="delete_outline" />
              </button>
            </span>
          </Tooltip>
        </div>
      </div>
      {signedAt && showDate && (
        <span className="sig-meta">
          <MaterialIcon name="verified" />
          Signé le {signedAt}
        </span>
      )}
    </div>
  );
}
