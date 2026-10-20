import { Tooltip } from '@mui/material';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { youtubeId } from './mediaUtils';
import './youtube-player.scss';

/**
 * app-youtube-player « façade » : miniature seule, iframe youtube-nocookie insérée au clic.
 * Pilotage via l'API postMessage de l'embed, sans script externe.
 */
export function YoutubePlayer({
  className,
  video,
  title = '',
  duration = '',
  start = 0,
  aspectRatio = '16 / 9',
  controls = false,
  eager = false,
  onStateChange,
}: {
  className?: string;
  video: string;
  title?: string;
  duration?: string;
  start?: number;
  aspectRatio?: string;
  controls?: boolean;
  eager?: boolean;
  onStateChange?: (s: 'playing' | 'paused' | 'ended') => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [clicked, setClicked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const activated = clicked || eager;
  const id = youtubeId(video);
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${id}${start ? '&t=' + start + 's' : ''}`;
  const p = new URLSearchParams({
    autoplay: clicked ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
    playsinline: '1',
  });
  if (start) p.set('start', String(start));
  if (typeof location !== 'undefined') p.set('origin', location.origin);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?${p}`;

  const post = (msg: object) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify(msg), 'https://www.youtube-nocookie.com');
  const command = (func: string, args: unknown[] = []) => post({ event: 'command', func, args });
  const cb = useRef(onStateChange);
  cb.current = onStateChange;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin || 'about:blank', 'https://x').hostname)) return;
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const data = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as {
          event?: string;
          info?: { playerState?: number; muted?: boolean } | number;
        } | null;
        const info = data?.info;
        const state = typeof info === 'object' ? info?.playerState : data?.event === 'onStateChange' ? info : undefined;
        if (state === 1) {
          setPlaying(true);
          cb.current?.('playing');
        } else if (state === 2) {
          setPlaying(false);
          cb.current?.('paused');
        } else if (state === 0) {
          setPlaying(false);
          cb.current?.('ended');
        }
        if (typeof info === 'object' && typeof info?.muted === 'boolean') setMuted(info.muted);
      } catch {
        /* message étranger */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const thumbFallback = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset['fb']) {
      img.dataset['fb'] = '1';
      img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    }
  };

  return (
    <div className={className ? `app-youtube-player ${className}` : 'app-youtube-player'}>
      <div className="yt" style={{ aspectRatio }}>
        {!id ? (
          <div className="yt-state">
            <MaterialIcon name="link_off" />
            <strong>Vidéo introuvable</strong>
            <span>L’URL ou l’identifiant YouTube est invalide.</span>
          </div>
        ) : !activated ? (
          <button
            type="button"
            className="yt-facade"
            onClick={() => {
              setClicked(true);
              setPlaying(true);
            }}
            aria-label={'Lire la vidéo : ' + (title || id)}
          >
            <img src={thumb} alt={title} loading="lazy" onError={thumbFallback} />
            <span className="yt-shade" />
            {title && <span className="yt-title">{title}</span>}
            <span className="yt-play">
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path
                  d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.3.3 34 .3 34 .3s-21.3 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z"
                  fill="#f00"
                />
                <path d="M45 24 27 14v20z" fill="#fff" />
              </svg>
            </span>
            {duration && <span className="yt-duration">{duration}</span>}
            <span className="yt-consent">
              <MaterialIcon name="shield" />
              La vidéo sera chargée depuis YouTube
            </span>
          </button>
        ) : (
          <iframe
            ref={frame}
            src={embedUrl}
            title={title || 'Vidéo YouTube'}
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => post({ event: 'listening', id })}
          />
        )}
      </div>
      {controls && activated && (
        <div className="yt-bar">
          <button type="button" onClick={() => command(playing ? 'pauseVideo' : 'playVideo')}>
            <MaterialIcon name={playing ? 'pause' : 'play_arrow'} />
            {playing ? 'Pause' : 'Lire'}
          </button>
          <button
            type="button"
            onClick={() => {
              command(muted ? 'unMute' : 'mute');
              setMuted(!muted);
            }}
          >
            <MaterialIcon name={muted ? 'volume_off' : 'volume_up'} />
            {muted ? 'Son coupé' : 'Son'}
          </button>
          <button type="button" onClick={() => command('seekTo', [start, true])}>
            <MaterialIcon name="replay" />
            Revenir au début
          </button>
          <span className="spacer" />
          <Tooltip title="Ouvrir sur YouTube">
            <a href={watchUrl} target="_blank" rel="noopener">
              <MaterialIcon name="open_in_new" />
            </a>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
