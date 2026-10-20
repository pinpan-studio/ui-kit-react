import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './masonry-grid.scss';

const UNIT = 4;

/**
 * app-masonry-grid : cartes de hauteurs différentes empilées sans trous, ordre de lecture conservé.
 * Grille CSS à rangées fines (4 px) ; chaque cellule est mesurée (ResizeObserver) et s'étend sur autant de rangées.
 */
export function MasonryGrid<T>({
  className,
  items = [],
  minColumnWidth = 240,
  columns = null,
  gap = 16,
  animate = true,
  trackBy = (_it, i) => i,
  renderItem,
}: {
  className?: string;
  items?: T[];
  minColumnWidth?: number;
  columns?: number | null;
  gap?: number;
  animate?: boolean;
  trackBy?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const [spans, setSpans] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const ro = useRef<ResizeObserver | null>(null);
  const template = columns
    ? `repeat(${columns}, minmax(0, 1fr))`
    : `repeat(auto-fill, minmax(min(100%, ${minColumnWidth}px), 1fr))`;

  useEffect(() => {
    ro.current = new ResizeObserver((entries) => {
      setSpans((prev) => {
        const next = [...prev];
        let changed = false;
        for (const e of entries) {
          const i = +((e.target as HTMLElement).dataset['i'] ?? -1);
          const span = Math.max(1, Math.ceil(e.target.getBoundingClientRect().height / UNIT));
          if (i >= 0 && next[i] !== span) {
            next[i] = span;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setReady(true);
    });
    return () => ro.current?.disconnect();
  }, []);

  useLayoutEffect(() => {
    const o = ro.current;
    if (!o || !host.current) return;
    o.disconnect();
    setSpans((s) => s.slice(0, items.length));
    host.current.querySelectorAll<HTMLElement>(':scope > .mg-cell > .mg-inner').forEach((el) => o.observe(el));
    if (!items.length) setReady(true);
  }, [items, gap]);

  return (
    <div className={className ? `app-masonry-grid ${className}` : 'app-masonry-grid'}>
      <div
        ref={host}
        className={`mg${ready ? ' ready' : ''}`}
        style={{ gridTemplateColumns: template, columnGap: gap, gridAutoRows: UNIT }}
      >
        {items.map((it, i) => (
          <div
            key={trackBy(it, i)}
            className={`mg-cell${animate ? ' anim' : ''}`}
            style={{ gridRowEnd: `span ${spans[i] || 1}`, animationDelay: `${animate ? Math.min(i, 12) * 35 : 0}ms` }}
          >
            <div className="mg-inner" data-i={i} style={{ paddingBottom: gap }}>
              {renderItem(it, i)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
