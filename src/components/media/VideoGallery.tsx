import { Dialog, Tooltip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { VideoPlayer } from './VideoPlayer';
import { YoutubePlayer } from './YoutubePlayer';
import { youtubeId } from './mediaUtils';
import type { VideoItem } from './mediaTypes';
import './video-gallery.scss';

/** Extrait une image d'une vidéo locale (≈ 1 s) pour servir de miniature. */
// eslint-disable-next-line react-refresh/only-export-components -- utilitaire porté tel quel depuis video-gallery.component.ts
export function captureVideoFrame(src: string, at = 1): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.playsInline = true;
    v.src = src;
    const fail = () => resolve(null);
    const timer = setTimeout(fail, 8000);
    v.addEventListener(
      'error',
      () => {
        clearTimeout(timer);
        fail();
      },
      { once: true },
    );
    v.addEventListener(
      'loadeddata',
      () => {
        v.currentTime = Math.min(at, (isFinite(v.duration) ? v.duration : at * 2) / 2);
      },
      { once: true },
    );
    v.addEventListener(
      'seeked',
      () => {
        clearTimeout(timer);
        try {
          const c = document.createElement('canvas');
          c.width = 480;
          c.height = Math.round((480 * (v.videoHeight || 9)) / (v.videoWidth || 16));
          const g = c.getContext('2d');
          if (!g) return fail();
          g.drawImage(v, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.8));
        } catch {
          fail();
        }
      },
      { once: true },
    );
  });
}

/** Lecture en modale (mode grille) — app-video-gallery-dialog. */
function VideoGalleryDialog({
  videos,
  initial,
  onClose,
}: {
  videos: VideoItem[];
  initial: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initial);
  const v = videos[index];
  const go = (d: number) => {
    const i = index + d;
    if (i >= 0 && i < videos.length) setIndex(i);
  };
  const nb = (tip: string, icon: string, fn: () => void, disabled = false) => (
    <Tooltip title={tip}>
      <span style={{ display: 'contents' }}>
        <button type="button" onClick={fn} disabled={disabled}>
          <MaterialIcon name={icon} />
        </button>
      </span>
    </Tooltip>
  );
  return (
    <div className="vgd">
      {v && (
        <>
          {v.youtube ? (
            <YoutubePlayer key={v.id} video={v.youtube} title={v.title} eager />
          ) : (
            <VideoPlayer key={v.id} src={v.src ?? null} poster={v.poster ?? ''} autoplay onEnded={() => go(1)} />
          )}
          <div className="vgd-info">
            <div className="vgd-text">
              <strong>{v.title}</strong>
              <span>
                {v.author ? `${v.author} · ` : ''}
                {v.meta || v.category}
              </span>
              {v.description && <p>{v.description}</p>}
            </div>
            <div className="vgd-nav">
              {nb('Précédente', 'skip_previous', () => go(-1), index === 0)}
              <span>
                {index + 1} / {videos.length}
              </span>
              {nb('Suivante', 'skip_next', () => go(1), index >= videos.length - 1)}
              {nb('Fermer (Échap)', 'close', onClose)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * app-video-gallery : `grid` (cartes, lecture en modale avec précédent / suivant) ou `theater`
 * (grand lecteur + playlist « À suivre », enchaînement automatique). Vidéos locales et YouTube, filtres.
 */
export function VideoGallery({
  videos = [],
  layout = 'grid',
  filters = false,
  autoplayNext = true,
  minCardWidth = 240,
  onSelectedChange,
  className,
}: {
  videos?: VideoItem[];
  layout?: 'grid' | 'theater';
  filters?: boolean;
  autoplayNext?: boolean;
  minCardWidth?: number;
  onSelectedChange?: (v: VideoItem) => void;
  className?: string;
}) {
  const [category, setCategory] = useState<string | null>(null);
  /** Une lecture a déjà eu lieu : les suivantes démarrent seules — jamais au chargement. */
  const [started, setStarted] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<{ list: VideoItem[]; index: number } | null>(null);
  const categories = useMemo(
    () => [...new Set(videos.map((v) => v.category).filter((c): c is string => !!c))],
    [videos],
  );
  const filtered = useMemo(() => videos.filter((v) => !category || v.category === category), [videos, category]);
  const [currentSel, setCurrent] = useState<VideoItem | null>(null);
  // linkedSignal : se réinitialise sur la première vidéo quand la liste filtrée change.
  useEffect(() => setCurrent(filtered[0] ?? null), [filtered]);
  const current = currentSel;
  const ci = filtered.findIndex((v) => v.id === current?.id);
  const next = ci >= 0 && ci < filtered.length - 1 ? filtered[ci + 1] : null;

  useEffect(() => {
    let alive = true;
    for (const v of videos) {
      if (v.poster || v.youtube || !v.src) continue;
      const src = v.src;
      void captureVideoFrame(src).then((url) => {
        if (alive && url) setThumbs((t) => (t[v.id] ? t : { ...t, [v.id]: url }));
      });
    }
    return () => {
      alive = false;
    };
  }, [videos]);

  const thumb = (v: VideoItem): string | null => {
    if (v.poster) return v.poster;
    if (v.youtube) {
      const id = youtubeId(v.youtube);
      return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
    }
    return thumbs[v.id] ?? null;
  };
  const select = (v: VideoItem) => {
    if (layout === 'theater') {
      setStarted(true);
      setCurrent(v);
      onSelectedChange?.(v);
      return;
    }
    setDialog({ list: filtered, index: filtered.indexOf(v) });
    onSelectedChange?.(v);
  };
  const onEnded = () => {
    if (next && autoplayNext) {
      setStarted(true);
      setCurrent(next);
    }
  };

  return (
    <div className={className ? `app-video-gallery ${className}` : 'app-video-gallery'}>
      <div className={`vg${layout === 'theater' ? ' theater' : ''}`}>
        {filters && categories.length > 0 && (
          <div className="vg-chips" role="tablist">
            <button type="button" role="tab" className={!category ? 'on' : undefined} onClick={() => setCategory(null)}>
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                className={category === c ? 'on' : undefined}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {layout === 'theater' ? (
          <div className="vg-theater">
            <div className="vg-main">
              {current ? (
                <>
                  {current.youtube ? (
                    <YoutubePlayer
                      key={current.id}
                      video={current.youtube}
                      title={current.title}
                      duration={current.duration ?? ''}
                    />
                  ) : (
                    <VideoPlayer
                      src={current.src ?? null}
                      poster={thumb(current) ?? ''}
                      title={current.title}
                      autoplay={autoplayNext && started}
                      onEnded={onEnded}
                    />
                  )}
                  <div className="vg-now">
                    <strong>{current.title}</strong>
                    <span>
                      {current.author ? ` ${current.author} · ` : ''}
                      {current.meta || current.category}
                    </span>
                    {current.description && <p>{current.description}</p>}
                  </div>
                </>
              ) : (
                <div className="vg-empty">
                  <MaterialIcon name="video_library" />
                  Aucune vidéo
                </div>
              )}
            </div>
            <aside className="vg-list" aria-label="Playlist">
              <div className="vg-list-head">
                <strong>À suivre</strong>
                <span>{filtered.length} vidéo(s)</span>
              </div>
              {filtered.map((v, i) => {
                const t = thumb(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`vg-item${v.id === current?.id ? ' active' : ''}`}
                    onClick={() => select(v)}
                  >
                    <span className="vg-num">
                      {v.id === current?.id ? <MaterialIcon name="equalizer" /> : ` ${i + 1} `}
                    </span>
                    <span className="vg-thumb sm">
                      {t ? <img src={t} alt="" loading="lazy" /> : <MaterialIcon name="movie" />}
                      {v.duration && <em>{v.duration}</em>}
                    </span>
                    <span className="vg-text">
                      <strong>{v.title}</strong>
                      <span>{v.author || v.category}</span>
                    </span>
                  </button>
                );
              })}
            </aside>
          </div>
        ) : (
          <div
            className="vg-grid"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCardWidth}px), 1fr))` }}
          >
            {filtered.length ? (
              filtered.map((v) => {
                const t = thumb(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="vg-card"
                    onClick={() => select(v)}
                    aria-label={'Lire : ' + v.title}
                  >
                    <span className="vg-thumb">
                      {t ? (
                        <img src={t} alt="" loading="lazy" />
                      ) : (
                        <span className="vg-ph">
                          <MaterialIcon name="movie" />
                        </span>
                      )}
                      <span className="vg-play">
                        <MaterialIcon name="play_arrow" />
                      </span>
                      {v.duration && <em>{v.duration}</em>}
                      {v.youtube && (
                        <span className="vg-src">
                          <MaterialIcon name="smart_display" />
                          YouTube
                        </span>
                      )}
                    </span>
                    <span className="vg-text">
                      <strong>{v.title}</strong>
                      <span>
                        {v.author ? ` ${v.author} ` : ''}
                        {v.author && (v.meta || v.category) ? ' · ' : ''}
                        {v.meta || v.category}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="vg-empty">
                <MaterialIcon name="video_library" />
                Aucune vidéo dans cette catégorie.
              </div>
            )}
          </div>
        )}
      </div>
      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        maxWidth={false}
        disableAutoFocus
        slotProps={{
          paper: {
            className: 'kit-video-dialog-panel',
            sx: { m: '16px', background: 'transparent', boxShadow: 'none' },
          },
        }}
      >
        {dialog && (
          <div className="kit-dialog-surface">
            <VideoGalleryDialog videos={dialog.list} initial={dialog.index} onClose={() => setDialog(null)} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
