import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { CarouselSlide } from './mediaTypes';
import './carousel.scss';

/**
 * app-carousel : images (`url`, `title`, `caption`) ou contenu libre via `renderSlide`.
 * Flèches, points ou vignettes, défilement automatique (pause au survol / onglet masqué), boucle,
 * glisser, plusieurs éléments visibles, clavier ←/→.
 */
export function Carousel<T extends CarouselSlide = CarouselSlide>({
  className,
  items = [],
  autoplay = 0,
  loop = true,
  arrows = true,
  indicators = 'dots',
  perView = 1,
  gap = 12,
  aspectRatio = '16 / 9',
  onIndexChange,
  renderSlide,
}: {
  className?: string;
  items?: T[];
  autoplay?: number;
  loop?: boolean;
  arrows?: boolean;
  indicators?: 'dots' | 'thumbs' | 'none';
  perView?: number;
  gap?: number;
  aspectRatio?: string;
  onIndexChange?: (i: number) => void;
  renderSlide?: (item: T, index: number) => ReactNode;
}) {
  const [rawIndex, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef(0);
  const maxIndex = Math.max(0, items.length - perView);
  const index = Math.min(rawIndex, maxIndex);
  const pages = maxIndex + 1;
  const idxRef = useRef(index);
  idxRef.current = index;

  const goTo = (i: number) => {
    const n = loop ? (i < 0 ? maxIndex : i > maxIndex ? 0 : i) : Math.max(0, Math.min(maxIndex, i));
    setIndex(n);
    onIndexChange?.(n);
  };
  const goRef = useRef(goTo);
  goRef.current = goTo;
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoplay || hovered || paused || dragging) return;
    const t = setInterval(() => {
      if (!document.hidden) goRef.current(idxRef.current + 1);
    }, autoplay);
    return () => clearInterval(t);
  }, [autoplay, hovered, paused, dragging]);

  const dragStart = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return;
    const el = e.currentTarget;
    const width = el.getBoundingClientRect().width / perView;
    const sx = e.clientX;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    const move = (ev: globalThis.PointerEvent) => {
      dragRef.current = ev.clientX - sx;
      setDragX(dragRef.current);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      const dx = dragRef.current;
      dragRef.current = 0;
      setDragging(false);
      setDragX(0);
      if (Math.abs(dx) > width * 0.18) {
        if (dx < 0) goRef.current(idxRef.current + 1);
        else goRef.current(idxRef.current - 1);
      }
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up, { once: true });
    el.addEventListener('pointercancel', up, { once: true });
  };

  return (
    <div className={className ? `app-carousel ${className}` : 'app-carousel'}>
      <div
        className="cr"
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') prev();
          if (e.key === 'ArrowRight') next();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ '--per-view': perView, '--gap': `${gap}px` } as CSSProperties}
      >
        <div
          className="cr-viewport"
          style={{ aspectRatio: renderSlide ? undefined : aspectRatio }}
          onPointerDown={dragStart}
        >
          <div
            className={`cr-track${dragging ? ' dragging' : ''}`}
            style={{
              transform: `translateX(calc(${-index * (100 / perView)}% - ${(index * gap) / perView}px + ${dragX}px))`,
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                className="cr-slide"
                aria-hidden={i < index || i >= index + perView}
                role="group"
                aria-label={`${i + 1} sur ${items.length}`}
              >
                {renderSlide ? (
                  renderSlide(item, i)
                ) : (
                  <>
                    <img src={item.url} alt={item.title || ''} draggable={false} loading="lazy" />
                    {(item.title || item.caption) && (
                      <div className="cr-caption">
                        {item.title && <strong>{item.title}</strong>}
                        {item.caption && <span>{item.caption}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          {arrows && pages > 1 && (
            <>
              <button
                type="button"
                className="cr-arrow prev"
                onClick={prev}
                disabled={!loop && index === 0}
                aria-label="Précédent"
              >
                <MaterialIcon name="chevron_left" />
              </button>
              <button
                type="button"
                className="cr-arrow next"
                onClick={next}
                disabled={!loop && index >= maxIndex}
                aria-label="Suivant"
              >
                <MaterialIcon name="chevron_right" />
              </button>
            </>
          )}
          {!!autoplay && pages > 1 && (
            <button
              type="button"
              className="cr-pause"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause'}
            >
              <MaterialIcon name={paused ? 'play_arrow' : 'pause'} />
            </button>
          )}
        </div>
        {indicators === 'dots' && pages > 1 ? (
          <div className="cr-dots">
            {Array.from({ length: pages }, (_, p) => (
              <button
                key={p}
                type="button"
                className={p === index ? 'active' : undefined}
                onClick={() => goTo(p)}
                aria-label={`Aller à ${p + 1}`}
              />
            ))}
          </div>
        ) : indicators === 'thumbs' && pages > 1 ? (
          <div className="cr-thumbs">
            {items.map((item, i) => (
              <button key={i} type="button" className={i === index ? 'active' : undefined} onClick={() => goTo(i)}>
                <img src={item.url} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
