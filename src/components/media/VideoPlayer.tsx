import { Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { MatSpinner } from '../mat/MatData';
import { MaterialIcon } from '../ui/MaterialIcon';
import { formatMediaTime as fmt } from './mediaUtils';
import type { VideoTrack } from './mediaTypes';
import './video-player.scss';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
type PipDoc = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};
const pipSupported =
  typeof document !== 'undefined' &&
  'pictureInPictureEnabled' in document &&
  !!(document as PipDoc).pictureInPictureEnabled;

/**
 * app-video-player : contrôles maison au-dessus d'un <video> natif — progression avec tampon et aperçu,
 * volume, vitesse, sous-titres, image dans l'image, plein écran, raccourcis (Espace/K, J/L, ←/→, ↑/↓, M, F, C).
 */
export function VideoPlayer({
  className,
  src = null,
  poster = '',
  title = '',
  tracks = [],
  loop = false,
  autoplay = false,
  aspectRatio = '16 / 9',
  emptyLabel = 'Sélectionnez un fichier vidéo pour le lire.',
  onEnded,
}: {
  className?: string;
  src?: string | null;
  poster?: string;
  title?: string;
  tracks?: VideoTrack[];
  loop?: boolean;
  autoplay?: boolean;
  aspectRatio?: string;
  emptyLabel?: string;
  onEnded?: () => void;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fixing = useRef(false);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeS] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRateS] = useState(1);
  const [captions, setCaptions] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState(0);
  const [rateMenu, setRateMenu] = useState<HTMLElement | null>(null);

  const playedPct = duration ? (current / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const volumeIcon = muted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up';

  useEffect(() => {
    const onFs = () => setFullscreen(!!shell.current && document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const hideSoon = (ms: number) => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setUiVisible(false);
    }, ms);
  };
  const poke = () => {
    setUiVisible(true);
    hideSoon(2500);
  };
  const v = () => videoRef.current;
  const toggle = () => {
    const el = v();
    if (!el) return;
    if (el.paused) void el.play().catch(() => setError(true));
    else el.pause();
    poke();
  };
  const skip = (s: number) => {
    const el = v();
    if (el) el.currentTime = Math.max(0, Math.min(duration, el.currentTime + s));
    poke();
  };
  const setVolume = (val: number) => {
    const el = v();
    if (!el) return;
    el.volume = val;
    el.muted = val === 0;
  };
  const toggleMute = () => {
    const el = v();
    if (el) el.muted = !el.muted;
  };
  const setRate = (r: number) => {
    const el = v();
    if (el) el.playbackRate = r;
    setRateS(r);
  };
  const toggleCaptions = () => {
    const on = !captions;
    setCaptions(on);
    const list = v()?.textTracks;
    if (list)
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (t) t.mode = on && i === 0 ? 'showing' : 'hidden';
      }
  };
  const pip = () => {
    const el = v() as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    if (!el) return;
    const d = document as PipDoc;
    if (d.pictureInPictureElement) void d.exitPictureInPicture?.();
    else void el.requestPictureInPicture?.();
  };
  const toggleFullscreen = () => {
    const el = shell.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };
  const onMeta = () => {
    const el = v();
    if (!el) return;
    setError(false);
    // Les WebM produits par MediaRecorder n'ont pas de durée : on force le calcul en sautant à la fin.
    if (el.duration === Infinity && !fixing.current) {
      fixing.current = true;
      el.currentTime = 1e101;
      el.addEventListener(
        'timeupdate',
        () => {
          el.currentTime = 0;
          fixing.current = false;
          setDuration(el.duration);
        },
        { once: true },
      );
      return;
    }
    if (isFinite(el.duration)) setDuration(el.duration);
    setCaptions(tracks.some((t) => t.default));
  };
  const reset = () => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setBuffered(0);
    setError(false);
    fixing.current = false;
  };

  const timeAt = (e: { clientX: number }) => {
    const r = bar.current?.getBoundingClientRect();
    return r ? Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration : 0;
  };
  const hover = (e: PointerEvent) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r) return;
    setHoverX(Math.max(0, Math.min(r.width, e.clientX - r.left)));
    setHoverTime(timeAt(e));
  };
  const seekStart = (e: PointerEvent<HTMLDivElement>) => {
    const el = v();
    if (!el || !duration) return;
    const b = e.currentTarget;
    b.setPointerCapture(e.pointerId);
    const move = (ev: { clientX: number }) => {
      el.currentTime = timeAt(ev);
      setCurrent(el.currentTime);
    };
    move(e);
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', () => b.removeEventListener('pointermove', move), { once: true });
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, () => void> = {
      ' ': toggle,
      k: toggle,
      j: () => skip(-10),
      l: () => skip(10),
      ArrowLeft: () => skip(-5),
      ArrowRight: () => skip(5),
      m: toggleMute,
      f: toggleFullscreen,
      c: () => {
        if (tracks.length) toggleCaptions();
      },
      ArrowUp: () => setVolume(Math.min(1, volume + 0.1)),
      ArrowDown: () => setVolume(Math.max(0, volume - 0.1)),
    };
    const fn = map[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (fn) {
      e.preventDefault();
      fn();
      poke();
    }
  };
  const tb = (tip: string, icon: string, fn: () => void, cls = '') => (
    <Tooltip title={tip}>
      <button type="button" className={`vp-btn${cls}`} onClick={fn}>
        <MaterialIcon name={icon} />
      </button>
    </Tooltip>
  );
  const cls = ['vp', playing && 'is-playing', (uiVisible || !playing) && 'show-ui', fullscreen && 'is-fullscreen']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className ? `app-video-player ${className}` : 'app-video-player'}>
      <div
        ref={shell}
        className={cls}
        style={{ aspectRatio }}
        tabIndex={0}
        onMouseMove={poke}
        onMouseLeave={() => hideSoon(300)}
        onKeyDown={onKey}
      >
        {src && (
          <video
            ref={videoRef}
            src={src}
            poster={poster || undefined}
            muted={muted}
            loop={loop}
            playsInline
            preload="metadata"
            onClick={toggle}
            onDoubleClick={toggleFullscreen}
            onLoadedMetadata={onMeta}
            onDurationChange={onMeta}
            onTimeUpdate={() => {
              const el = v();
              if (!fixing.current && el) setCurrent(el.currentTime);
            }}
            onProgress={() => {
              const el = v();
              if (el?.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              onEnded?.();
            }}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => {
              setBuffering(false);
              const el = v();
              if (autoplay && el?.paused && !current) void el.play().catch(() => undefined);
            }}
            onVolumeChange={() => {
              const el = v();
              if (el) {
                setVolumeS(el.volume);
                setMuted(el.muted);
              }
            }}
            onError={() => setError(true)}
            onEmptied={reset}
          >
            {tracks.map((t) => (
              <track key={t.src} kind="subtitles" src={t.src} label={t.label} srcLang={t.srclang} default={t.default} />
            ))}
          </video>
        )}
        {error || !src ? (
          <div className="vp-state">
            <MaterialIcon name={src ? 'videocam_off' : 'movie'} />
            <strong>{src ? 'Lecture impossible' : 'Aucune vidéo'}</strong>
            <span>{src ? 'Le format de ce fichier n’est pas pris en charge par le navigateur.' : emptyLabel}</span>
          </div>
        ) : (
          <>
            {buffering && playing && (
              <div className="vp-center">
                <MatSpinner diameter={44} />
              </div>
            )}
            {!playing && !buffering && (
              <button type="button" className="vp-big-play" onClick={toggle} aria-label="Lire">
                <MaterialIcon name="play_arrow" />
              </button>
            )}
            {title && <div className="vp-title">{title}</div>}
            <div className="vp-controls" onClick={(e) => e.stopPropagation()}>
              <div
                ref={bar}
                className="vp-progress"
                onPointerDown={seekStart}
                onPointerMove={hover}
                onPointerLeave={() => setHoverX(null)}
              >
                <div className="vp-buffer" style={{ width: `${bufferedPct}%` }} />
                <div className="vp-played" style={{ width: `${playedPct}%` }} />
                <div className="vp-thumb" style={{ left: `${playedPct}%` }} />
                {hoverX !== null && (
                  <div className="vp-tip" style={{ left: hoverX }}>
                    {fmt(hoverTime)}
                  </div>
                )}
              </div>
              <div className="vp-row">
                {tb(playing ? 'Pause (K)' : 'Lire (K)', playing ? 'pause' : 'play_arrow', toggle)}
                {tb('Reculer de 10 s (J)', 'replay_10', () => skip(-10), ' hide-xs')}
                {tb('Avancer de 10 s (L)', 'forward_10', () => skip(10), ' hide-xs')}
                <div className="vp-volume">
                  {tb(muted ? 'Activer le son (M)' : 'Couper le son (M)', volumeIcon, toggleMute)}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muted ? 0 : volume}
                    onChange={(e) => setVolume(+e.target.value)}
                    aria-label="Volume"
                  />
                </div>
                <span className="vp-time">
                  {fmt(current)} / {fmt(duration)}
                </span>
                <span className="spacer" />
                {!!tracks.length &&
                  tb(
                    'Sous-titres (C)',
                    captions ? 'subtitles' : 'subtitles_off',
                    toggleCaptions,
                    captions ? ' on' : '',
                  )}
                <Tooltip title="Vitesse de lecture">
                  <button type="button" className="vp-btn rate" onClick={(e) => setRateMenu(e.currentTarget)}>
                    {rate === 1 ? '1×' : rate + '×'}
                  </button>
                </Tooltip>
                <Menu
                  anchorEl={rateMenu}
                  open={!!rateMenu}
                  onClose={() => setRateMenu(null)}
                  container={fullscreen ? shell.current : undefined}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
                >
                  {RATES.map((r) => (
                    <MenuItem
                      key={r}
                      className="mat-mdc-menu-item"
                      onClick={() => {
                        setRate(r);
                        setRateMenu(null);
                      }}
                    >
                      <MaterialIcon name={r === rate ? 'check' : ''} />
                      {r === 1 ? 'Normale' : r + '×'}
                    </MenuItem>
                  ))}
                </Menu>
                {pipSupported && tb('Image dans l’image', 'picture_in_picture_alt', pip, ' hide-xs')}
                {tb(
                  fullscreen ? 'Quitter le plein écran (F)' : 'Plein écran (F)',
                  fullscreen ? 'fullscreen_exit' : 'fullscreen',
                  toggleFullscreen,
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
