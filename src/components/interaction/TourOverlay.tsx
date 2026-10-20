import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { TourStep } from './types';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}
const W0 = 340;
const H = 190;

const elOf = (s?: TourStep): HTMLElement | null =>
  !s?.target ? null : typeof s.target === 'string' ? document.querySelector<HTMLElement>(s.target) : s.target;

/** Visite guidée (TourService + app-tour-overlay) : projecteur, carte positionnée, ←/→, Échap. */
export function TourOverlay({
  steps,
  padding = 8,
  onEnd,
}: {
  steps: TourStep[];
  padding?: number;
  onEnd: (completed: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[index];

  const measure = useCallback(() => {
    const el = elOf(step);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    });
  }, [step, padding]);

  const go = useCallback(
    async (i: number) => {
      const s = steps[i];
      if (!s) return;
      await s.before?.();
      setIndex(i);
      elOf(s)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    },
    [steps],
  );
  const next = useCallback(
    () => (index < steps.length - 1 ? void go(index + 1) : onEnd(true)),
    [index, steps.length, go, onEnd],
  );
  const prev = useCallback(() => index > 0 && void go(index - 1), [index, go]);

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 380);
    return () => clearTimeout(t);
  }, [measure]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onEnd(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        prev();
      }
    };
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [measure, next, prev, onEnd]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = 12;
  const W = Math.min(W0, vw - 24);
  let card = { top: vh / 2 - H / 2, left: vw / 2 - W / 2, side: 'none' };
  if (rect) {
    const pref = step?.placement ?? 'auto';
    const fits = {
      bottom: rect.top + rect.height + m + H < vh,
      top: rect.top - m - H > 0,
      right: rect.left + rect.width + m + W < vw,
      left: rect.left - m - W > 0,
    };
    const side =
      pref !== 'auto' && fits[pref]
        ? pref
        : ((['bottom', 'top', 'right', 'left'] as const).find((s) => fits[s]) ?? 'bottom');
    const clampX = (x: number) => Math.max(12, Math.min(vw - W - 12, x));
    const clampY = (y: number) => Math.max(12, Math.min(vh - H - 12, y));
    if (side === 'bottom')
      card = {
        top: Math.min(vh - H - 12, rect.top + rect.height + m),
        left: clampX(rect.left + rect.width / 2 - W / 2),
        side,
      };
    else if (side === 'top')
      card = { top: Math.max(12, rect.top - m - H), left: clampX(rect.left + rect.width / 2 - W / 2), side };
    else if (side === 'right')
      card = { top: clampY(rect.top + rect.height / 2 - H / 2), left: rect.left + rect.width + m, side };
    else card = { top: clampY(rect.top + rect.height / 2 - H / 2), left: rect.left - m - W, side };
  }
  if (!step) return null;

  return createPortal(
    <div className="kit-tour" style={{ zIndex: 1400 }} onClick={(e) => e.stopPropagation()}>
      {rect ? <div className="tour-spot" style={rect} /> : <div className="tour-dim" />}
      <div
        className={`tour-card arrow-${card.side}`}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        style={{ top: card.top, left: card.left }}
      >
        <div className="tc-head">
          {step.icon && (
            <span className="tc-ic">
              <MaterialIcon name={step.icon} />
            </span>
          )}
          <strong>{step.title}</strong>
          <button type="button" className="tc-x" onClick={() => onEnd(false)} aria-label="Fermer la visite">
            <MaterialIcon name="close" />
          </button>
        </div>
        <p>{step.content}</p>
        <div className="tc-foot">
          <div className="tc-dots">
            {steps.map((_, i) => (
              <i key={i} className={`${i === index ? 'on' : ''} ${i < index ? 'done' : ''}`} />
            ))}
          </div>
          <span className="tc-count">
            {index + 1} / {steps.length}
          </span>
          <span className="spacer" />
          {index > 0 ? (
            <button type="button" className="tc-btn ghost" onClick={prev}>
              Précédent
            </button>
          ) : (
            <button type="button" className="tc-btn ghost" onClick={() => onEnd(false)}>
              Passer
            </button>
          )}
          <button type="button" className="tc-btn" onClick={next}>
            {index === steps.length - 1 ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
