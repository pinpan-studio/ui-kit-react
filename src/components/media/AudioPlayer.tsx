import { Tooltip } from '@mui/material';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { computePeaks, formatMediaTime as fmt, pseudoPeaks } from './mediaUtils';
import type { AudioPlayerVariant, AudioTrack } from './mediaTypes';
import './audio-player.scss';

const RATES = [1, 1.5, 2, 0.75];

/**
 * app-audio-player : lecteur audio à forme d'onde cliquable.
 * `default` (carte, ±15 s, vitesse, volume), `compact` (note vocale), `playlist` (liste, enchaînement automatique).
 */
export function AudioPlayer({
  className,
  tracks = [],
  variant = 'default',
  bars = 56,
  onTrackChange,
}: {
  className?: string;
  tracks?: AudioTrack[];
  variant?: AudioPlayerVariant;
  bars?: number;
  onTrackChange?: (t: AudioTrack) => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const autoplay = useRef(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const track = tracks[index] ?? null;
  const n = variant === 'compact' ? Math.min(bars, 36) : bars;
  const [peaks, setPeaks] = useState<number[]>([]);
  const ratio = duration ? current / duration : 0;

  useEffect(() => {
    setError(false);
    setCurrent(0);
    if (!track) {
      setPeaks(pseudoPeaks('vide', n).map(() => 0.12));
      return;
    }
    setPeaks(pseudoPeaks(track.src + track.title, n));
    let alive = true;
    if (track.blob)
      void computePeaks(track.blob, n).then((p) => {
        if (alive) setPeaks(p);
      });
    return () => {
      alive = false;
    };
  }, [track, n]);

  const a = () => audio.current;
  const toggle = () => {
    const el = a();
    if (!el) return;
    if (el.paused) void el.play().catch(() => setError(true));
    else el.pause();
  };
  const skip = (s: number) => {
    const el = a();
    if (el) el.currentTime = Math.max(0, Math.min(duration, el.currentTime + s));
  };
  const cycleRate = () => {
    const r = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
    const el = a();
    if (el) el.playbackRate = r;
    setRate(r);
  };
  const onMeta = () => {
    const el = a();
    if (!el) return;
    if (isFinite(el.duration)) setDuration(el.duration);
    el.playbackRate = rate;
    if (autoplay.current) {
      autoplay.current = false;
      void el.play().catch(() => undefined);
    }
  };
  const select = (i: number, play: boolean) => {
    if (i < 0 || i >= tracks.length) return;
    if (i === index) {
      if (play) toggle();
      return;
    }
    autoplay.current = play;
    setIndex(i);
    const t = tracks[i];
    if (t) onTrackChange?.(t);
  };
  const onEnded = () => {
    setPlaying(false);
    if (variant === 'playlist' && index < tracks.length - 1) select(index + 1, true);
  };
  const seek = (e: PointerEvent<HTMLDivElement>) => {
    const el = wave.current;
    const au = a();
    if (!duration || !el || !au) return;
    el.setPointerCapture(e.pointerId);
    const move = (ev: { clientX: number }) => {
      const r = el.getBoundingClientRect();
      au.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * duration;
      setCurrent(au.currentTime);
    };
    move(e);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true });
  };
  const waveKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      skip(e.key === 'ArrowLeft' ? -5 : 5);
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };
  const btn = (title: string, icon: string, onClick: () => void, disabled = false) => (
    <Tooltip title={title}>
      <button type="button" className="ap-btn" onClick={onClick} disabled={disabled}>
        <MaterialIcon name={icon} />
      </button>
    </Tooltip>
  );

  return (
    <div className={className ? `app-audio-player ${className}` : 'app-audio-player'}>
      <audio
        ref={audio}
        src={track?.src || undefined}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onDurationChange={onMeta}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={() => setError(!!track)}
      />
      <div className={`ap ap--${variant}`}>
        {variant !== 'compact' && (
          <div className="ap-head">
            <div className={`ap-cover${playing ? ' spin' : ''}`}>
              <MaterialIcon name={track?.icon || 'graphic_eq'} />
            </div>
            <div className="ap-meta">
              <strong>{track?.title || 'Aucune piste'}</strong>
              {track?.artist && <span>{track.artist}</span>}
            </div>
            {error && (
              <span className="ap-error">
                <MaterialIcon name="error" />
                Format non pris en charge
              </span>
            )}
          </div>
        )}
        <div className="ap-main">
          {variant === 'playlist'
            ? btn('Précédente', 'skip_previous', () => select(index - 1, playing), index === 0)
            : variant === 'default' && btn('−15 s', 'replay', () => skip(-15))}
          <button
            type="button"
            className="ap-play"
            onClick={toggle}
            disabled={!track || error}
            aria-label={playing ? 'Pause' : 'Lire'}
          >
            <MaterialIcon name={playing ? 'pause' : 'play_arrow'} />
          </button>
          {variant === 'playlist'
            ? btn('Suivante', 'skip_next', () => select(index + 1, playing), index >= tracks.length - 1)
            : variant === 'default' && btn('+15 s', 'forward_media', () => skip(15))}
          <div
            ref={wave}
            className="ap-wave"
            role="slider"
            tabIndex={0}
            aria-label="Position de lecture"
            aria-valuemax={duration}
            aria-valuenow={current}
            onPointerDown={seek}
            onKeyDown={waveKey}
          >
            {peaks.map((p, i) => (
              <span
                key={i}
                style={{ height: `${p * 100}%` }}
                className={i / peaks.length < ratio ? 'done' : undefined}
              />
            ))}
          </div>
          <span className="ap-time">
            {variant === 'compact' && !playing && !current ? fmt(duration) : fmt(current)}
          </span>
          {variant !== 'compact' ? (
            <>
              <span className="ap-time muted">/ {fmt(duration)}</span>
              <Tooltip title="Vitesse">
                <button type="button" className="ap-rate" onClick={cycleRate}>
                  {rate}×
                </button>
              </Tooltip>
              {btn(muted ? 'Activer le son' : 'Couper le son', muted ? 'volume_off' : 'volume_up', () => {
                const el = a();
                if (el) {
                  el.muted = !el.muted;
                  setMuted(el.muted);
                }
              })}
            </>
          ) : (
            <button type="button" className="ap-rate" onClick={cycleRate}>
              {rate}×
            </button>
          )}
        </div>
        {variant === 'playlist' && (
          <ol className="ap-list">
            {tracks.map((t, i) => (
              <li key={t.src} className={i === index ? 'active' : undefined} onClick={() => select(i, true)}>
                <span className="num">{i === index && playing ? <MaterialIcon name="equalizer" /> : ` ${i + 1} `}</span>
                <span className="t">{t.title}</span>
                <span className="a">{t.artist}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
