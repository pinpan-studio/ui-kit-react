// Porté depuis ui-kit Angular (harnais/components/widgets/carousel-widget).
import { useRef, useState, type CSSProperties } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import type { HzSlide } from '../../../data/static/harnais.data';
import { toneIcon } from '../../../theme/toneInk';
import './carousel-widget.scss';

const toneVar = (tone?: string) =>
  !tone || tone === 'primary'
    ? 'var(--primary-color)'
    : tone === 'neutral'
      ? 'var(--text-muted)'
      : `var(--${tone}-color)`;

/** Carrousel : diapositives (image ou visuel à icône), flèches, pastilles, clavier et glissement tactile. */
export function HzCarousel({ slides }: { slides: HzSlide[] }) {
  const [index, setIndex] = useState(0);
  const startX = useRef(0);
  const go = (step: number) => setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + step)));

  return (
    <div className="hz-carousel">
      <div
        className="viewport"
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        aria-label={`${slides.length} diapositives`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          else if (e.key === 'ArrowRight') go(1);
        }}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          const dx = e.clientX - startX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="track" style={{ transform: `translateX(${-index * 100}%)` }}>
          {slides.map((s, i) => (
            <article
              key={i}
              className="slide"
              aria-hidden={i !== index}
              style={{ '--tone': toneVar(s.tone), '--tone-icon': toneIcon(toneVar(s.tone)) } as CSSProperties}
            >
              <div className={`visual${s.image ? ' has-image' : ''}`}>
                {s.image ? (
                  <img src={s.image} alt={s.title} loading="lazy" />
                ) : (
                  <MaterialIcon name={s.icon ?? 'auto_awesome'} />
                )}
                {s.tag && <span className="tag">{s.tag}</span>}
              </div>
              <div className="content">
                <h4>{s.title}</h4>
                {s.text && <p>{s.text}</p>}
                {!!s.stats?.length && (
                  <dl className="mini-stats">
                    {s.stats.map((st) => (
                      <div key={st.label}>
                        <dt>{st.label}</dt>
                        <dd>{st.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </article>
          ))}
        </div>
        <button type="button" className="nav prev" disabled={index === 0} onClick={() => go(-1)} aria-label="Précédent">
          <MaterialIcon name="chevron_left" />
        </button>
        <button
          type="button"
          className="nav next"
          disabled={index === slides.length - 1}
          onClick={() => go(1)}
          aria-label="Suivant"
        >
          <MaterialIcon name="chevron_right" />
        </button>
      </div>
      <div className="dots">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === index ? 'on' : undefined}
            onClick={() => setIndex(i)}
            aria-label={'Diapositive ' + (i + 1)}
          />
        ))}
        <span className="pos">
          {index + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
