import { Tooltip } from '@mui/material';
import { useEffect, useImperativeHandle, useRef, useState, type PointerEvent, type Ref } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './image-cropper.scss';

const PAD = 28;
export interface ImageCropperHandle {
  crop: () => string | null;
}

/**
 * app-image-cropper : recadrage local (canvas) — glisser, molette / curseur pour zoomer, rotation 90°,
 * cadre rond ou rectangulaire. `ref.crop()` renvoie une data URL.
 */
export function ImageCropper({
  className,
  src = null,
  aspect = 1,
  round = false,
  frameSize = 240,
  outputWidth = 512,
  format = 'image/png',
  actions = true,
  onCropped,
  onCancel,
  ref,
}: {
  className?: string;
  src?: string | null;
  aspect?: number;
  round?: boolean;
  frameSize?: number;
  outputWidth?: number;
  format?: 'image/png' | 'image/jpeg';
  actions?: boolean;
  onCropped?: (url: string) => void;
  onCancel?: () => void;
  ref?: Ref<ImageCropperHandle>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoomS] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frameW = frameSize;
  const frameH = Math.round(frameSize / aspect);

  const dimsFor = (rot: number) => {
    if (!img) return { w: 1, h: 1 };
    return Math.abs(rot / 90) % 2 === 1
      ? { w: img.naturalHeight, h: img.naturalWidth }
      : { w: img.naturalWidth, h: img.naturalHeight };
  };
  const scaleFor = (z: number, rot: number) => {
    const d = dimsFor(rot);
    return Math.max(frameW / d.w, frameH / d.h) * z;
  };
  const scale = scaleFor(zoom, rotation);
  const clamp = (p: { x: number; y: number }, z = zoom, rot = rotation) => {
    const d = dimsFor(rot),
      s = scaleFor(z, rot);
    const mx = Math.max(0, (d.w * s - frameW) / 2),
      my = Math.max(0, (d.h * s - frameH) / 2);
    setPos({ x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) });
  };
  const reset = () => {
    setZoomS(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  };
  const setZoom = (z: number) => {
    const n = Math.max(1, Math.min(4, z));
    setZoomS(n);
    clamp(pos, n);
  };
  const rotateBy = (d: number) => {
    const r = rotation + d;
    setRotation(r);
    clamp(pos, zoom, r);
  };

  useEffect(() => {
    setImg(null);
    reset();
    if (!src) return;
    let alive = true;
    const im = new Image();
    im.onload = () => {
      if (alive) setImg(im);
    };
    im.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  // Molette : écouteur natif non passif pour pouvoir bloquer le défilement de la page (comme (wheel) + preventDefault).
  const stage = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<(e: WheelEvent) => void>(() => undefined);
  wheelRef.current = (e: WheelEvent) => {
    if (!img) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  };
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const h = (e: WheelEvent) => wheelRef.current(e);
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);
  const dragStart = (e: PointerEvent<HTMLDivElement>) => {
    if (!img) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const o = pos,
      sx = e.clientX,
      sy = e.clientY;
    const move = (ev: globalThis.PointerEvent) => clamp({ x: o.x + ev.clientX - sx, y: o.y + ev.clientY - sy });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true });
  };

  const crop = (): string | null => {
    if (!img) return null;
    const k = outputWidth / frameW;
    const c = document.createElement('canvas');
    c.width = outputWidth;
    c.height = Math.round(frameH * k);
    const g = c.getContext('2d');
    if (!g) return null;
    if (format === 'image/jpeg') {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
    }
    if (round) {
      g.beginPath();
      g.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      g.clip();
    }
    g.translate(c.width / 2 + pos.x * k, c.height / 2 + pos.y * k);
    g.rotate((rotation * Math.PI) / 180);
    g.scale(scale * k, scale * k);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return c.toDataURL(format, 0.92);
  };
  useImperativeHandle(ref, () => ({ crop }));
  const apply = () => {
    const url = crop();
    if (url) onCropped?.(url);
  };
  const tool = (title: string, icon: string, fn: () => void) => (
    <Tooltip title={title} describeChild>
      <span style={{ display: 'contents' }}>
        <button type="button" aria-label={title} onClick={fn} disabled={!img}>
          <MaterialIcon name={icon} />
        </button>
      </span>
    </Tooltip>
  );

  return (
    <div className={className ? `app-image-cropper ${className}` : 'app-image-cropper'}>
      <div className="ic">
        <div
          className="ic-stage"
          style={{ width: frameW + PAD * 2, height: frameH + PAD * 2 }}
          ref={stage}
          onPointerDown={dragStart}
        >
          {img ? (
            <img
              src={src ?? undefined}
              alt=""
              draggable={false}
              style={{
                width: img.naturalWidth,
                height: img.naturalHeight,
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${rotation}deg) scale(${scale})`,
              }}
            />
          ) : (
            <div className="ic-empty">
              <MaterialIcon name="add_photo_alternate" />
              <span>Aucune image</span>
            </div>
          )}
          <div
            className={`ic-frame${round ? ' round' : ''}`}
            style={{ width: frameW, height: frameH, left: PAD, top: PAD }}
          >
            {!round && (
              <>
                <i className="g1" />
                <i className="g2" />
                <i className="g3" />
                <i className="g4" />
              </>
            )}
          </div>
        </div>
        <div className="ic-tools">
          <MaterialIcon name="photo_size_select_small" />
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
            aria-label="Zoom"
            disabled={!img}
          />
          <MaterialIcon name="photo_size_select_large" />
          {tool('Pivoter à gauche', 'rotate_left', () => rotateBy(-90))}
          {tool('Pivoter à droite', 'rotate_right', () => rotateBy(90))}
          {tool('Réinitialiser', 'restart_alt', reset)}
        </div>
        {actions && (
          <div className="ic-actions">
            <button type="button" className="ghost" onClick={() => onCancel?.()}>
              Annuler
            </button>
            <button type="button" className="primary" onClick={apply} disabled={!img}>
              <MaterialIcon name="crop" />
              Appliquer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
