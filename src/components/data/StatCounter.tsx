import { useEffect, useRef, useState } from 'react';
import { formatStat, type CounterFormat } from './formatStat';
import './stat-counter.scss';

/**
 * app-stat-counter : nombre animé (easing) à l'apparition puis à chaque changement de valeur.
 * Formats nombre, FCFA, pourcentage, compact. Respecte prefers-reduced-motion.
 */
export function StatCounter({
  value,
  format = 'number',
  decimals = 0,
  duration = 1000,
  prefix = '',
  suffix = '',
  currency = 'FCFA',
}: {
  value: number;
  format?: CounterFormat;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(0);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((e) => {
      if (e.some((x) => x.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const from = shownRef.current;
    const set = (v: number) => {
      shownRef.current = v;
      setShown(v);
    };
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === value) {
      set(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      set(from + (value - from) * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, visible, duration]);
  return (
    <span ref={el} className="app-stat-counter">
      {prefix}
      {formatStat(shown, format, decimals, currency)}
      {suffix}
    </span>
  );
}
