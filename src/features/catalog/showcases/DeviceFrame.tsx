import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEVICE_SPECS } from './deviceSpecs';
import type { DeviceKind } from './showcases.data';
import './device-frame.scss';

/** Épaisseurs du cadre autour de la zone d'affichage (bordure, barre du navigateur, pied d'écran). */
const BEZEL = {
  desktop: { x: 14, top: 14 + 84, bottom: 26 + 96 },
  tablet: { x: 22, top: 22, bottom: 22 },
  phone: { x: 13, top: 13, bottom: 13 },
};
/** Barre d'état iOS / iPadOS, posée au-dessus de l'iframe. */
const STATUS_BAR = { desktop: 0, tablet: 24, phone: 54 };
const CLOCK = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
  new Date(2026, 0, 1, 9, 41),
);

export interface DeviceFrameHandle {
  reload: () => void;
}

/**
 * Cadre d'appareil autour d'une iframe : ordinateur (écran + navigateur), tablette (iPad) ou téléphone (iPhone).
 * Le cadre garde ses dimensions réelles et est mis à l'échelle pour tenir dans son conteneur
 * (`zoom="fit"`), ou affiché à une échelle fixe. Les media queries de la page affichée
 * réagissent donc à la vraie largeur de l'appareil.
 */
export function DeviceFrame({
  src,
  device = 'desktop',
  landscape = false,
  zoom = 'fit',
  thumbnail = false,
  title = 'Aperçu',
  onUrlChange,
  ref,
}: {
  src: string;
  device?: DeviceKind;
  landscape?: boolean;
  zoom?: 'fit' | number;
  thumbnail?: boolean;
  title?: string;
  onUrlChange?: (path: string) => void;
  ref?: Ref<DeviceFrameHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const addr = useRef<HTMLInputElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const isDesktop = device === 'desktop';

  // L'ordinateur et les appareils mobiles n'ont pas le même cadre : passer de l'un à l'autre recrée l'iframe,
  // qui reprend alors la page où l'on était.
  const resume = useRef({ src: '', path: '' });
  const [frameSrc, setFrameSrc] = useState(src);
  useLayoutEffect(() => {
    const r = resume.current;
    setFrameSrc(r.path && r.src === src ? r.path : src);
    r.src = src;
    setLoading(true);
  }, [src, isDesktop]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const win = () => iframe.current?.contentWindow ?? null;

  const trackLocation = useCallback(() => {
    if (thumbnail) return;
    try {
      const w = iframe.current?.contentWindow;
      if (!w || w.location.href === 'about:blank') return;
      const path = w.location.pathname + w.location.search + w.location.hash;
      if (path !== resume.current.path) {
        resume.current.path = path;
        setCurrentPath(path);
        onUrlChange?.(path);
      }
      setPageTitle(w.document.title);
    } catch {
      /* document d'une autre origine : rien à suivre */
    }
  }, [thumbnail, onUrlChange]);

  // Le routeur de l'application affichée navigue sans recharger l'iframe : on suit son URL.
  useEffect(() => {
    const timer = setInterval(trackLocation, 600);
    return () => clearInterval(timer);
  }, [trackLocation]);

  const reload = () => {
    setLoading(true);
    win()?.location.reload();
  };
  useImperativeHandle(ref, () => ({ reload }));

  /** Navigue dans l'iframe (saisie dans la barre d'adresse). */
  const go = (value: string) => {
    const path = value.trim().replace(/^https?:\/\/[^/]+/, '') || '/';
    const w = win();
    if (!w) return;
    setLoading(true);
    w.location.href = path.startsWith('/') ? path : '/' + path;
  };

  const spec = DEVICE_SPECS[device];
  const rotate = landscape && !isDesktop;
  const screen = rotate ? { w: spec.height, h: spec.width } : { w: spec.width, h: spec.height };
  const statusBar = device === 'phone' && landscape ? 0 : STATUS_BAR[device];
  const b = BEZEL[device];
  const frame = { w: screen.w + b.x * 2, h: screen.h + b.top + b.bottom };
  let scale: number;
  if (zoom !== 'fit') scale = zoom;
  else if (!box.w || !box.h) scale = 0.0001;
  else {
    const pad = thumbnail ? 0 : 32;
    scale = Math.min(1, (box.w - pad) / frame.w, (box.h - pad) / frame.h);
  }

  // Remonte l'adresse affichée quand la page de l'iframe change (champ non contrôlé, comme [value] en Angular).
  useEffect(() => {
    if (addr.current && document.activeElement !== addr.current) addr.current.value = currentPath || src;
  }, [currentPath, src]);

  const viewport = (
    <>
      {loading && (
        <div className="loader">
          <span className="spinner" />
        </div>
      )}
      <iframe
        key={isDesktop ? 'd' : 'm'}
        ref={iframe}
        src={frameSrc}
        title={title}
        loading={thumbnail ? 'lazy' : undefined}
        tabIndex={thumbnail ? -1 : undefined}
        onLoad={() => {
          setLoading(false);
          trackLocation();
        }}
      />
    </>
  );

  return (
    <div ref={host} className={`device-frame${thumbnail ? ' thumb' : ''}${zoom !== 'fit' ? ' scrollable' : ''}`}>
      <div className="sizer" style={{ width: frame.w * scale, height: frame.h * scale }}>
        <div
          className={`device ${device}${landscape ? ' landscape' : ''}`}
          style={{ width: frame.w, height: frame.h, transform: `scale(${scale})` }}
        >
          {isDesktop ? (
            <>
              <div className="monitor">
                <div className="browser">
                  <div className="tabbar">
                    <div className="lights">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="tab">
                      <img src="/favicon.ico" alt="" />
                      <span>{pageTitle || title}</span>
                      <MaterialIcon name="close" />
                    </div>
                    <MaterialIcon name="add" className="new-tab" />
                  </div>
                  <div className="toolbar">
                    <button
                      type="button"
                      onClick={() => win()?.history.back()}
                      aria-label="Précédent"
                      disabled={thumbnail}
                    >
                      <MaterialIcon name="arrow_back" />
                    </button>
                    <button
                      type="button"
                      onClick={() => win()?.history.forward()}
                      aria-label="Suivant"
                      disabled={thumbnail}
                    >
                      <MaterialIcon name="arrow_forward" />
                    </button>
                    <button type="button" onClick={reload} aria-label="Recharger" disabled={thumbnail}>
                      <MaterialIcon name="refresh" />
                    </button>
                    <label className="omnibox">
                      <MaterialIcon name="lock" className="lock" />
                      <span className="host">{location.host}</span>
                      <input
                        ref={addr}
                        type="text"
                        defaultValue={currentPath || src}
                        readOnly={thumbnail}
                        spellCheck={false}
                        aria-label="Adresse"
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          go(e.currentTarget.value);
                          e.currentTarget.blur();
                        }}
                      />
                      <MaterialIcon name="star_outline" className="star" />
                    </label>
                    <span className="avatar">JK</span>
                    <MaterialIcon name="more_vert" className="more" />
                  </div>
                  <div className="screen">{viewport}</div>
                </div>
                <div className="chin">
                  <span className="brand">UI KIT</span>
                  <i className="led" />
                </div>
              </div>
              <div className="stand">
                <div className="neck" />
                <div className="base" />
              </div>
            </>
          ) : (
            <>
              <span className="btn power" />
              {device === 'phone' && <span className="btn action" />}
              <span className="btn vol-up" />
              <span className="btn vol-down" />
              <div className="glass">
                {statusBar > 0 && (
                  <div className="statusbar" style={{ height: statusBar }}>
                    <span className="time">{CLOCK}</span>
                    {device === 'tablet' && <span className="date">ven. 17 oct.</span>}
                    <span className="spacer" />
                    <span className="icons">
                      <svg viewBox="0 0 18 12" aria-hidden="true">
                        <rect x="0" y="8" width="3" height="4" rx="1" />
                        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                        <rect x="10" y="3" width="3" height="9" rx="1" />
                        <rect x="15" y="0" width="3" height="12" rx="1" />
                      </svg>
                      <svg viewBox="0 0 16 12" aria-hidden="true">
                        <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .8 10.4 10.4 0 0 0 .8 3.7L2 5a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4.4c-1.8 0-3.4.7-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.5c-.6 0-1.1.2-1.5.6L8 12l1.5-1.7c-.4-.4-.9-.6-1.5-.6Z" />
                      </svg>
                      <span className="battery">
                        <i />
                      </span>
                    </span>
                  </div>
                )}
                {device === 'phone' ? <span className="island" /> : <span className="camera" />}
                <div className="screen" style={{ top: statusBar }}>
                  {viewport}
                </div>
                {device === 'phone' && <span className="home-indicator" />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
