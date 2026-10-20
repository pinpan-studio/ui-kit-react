import { Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { PdfZoom } from './mediaTypes';
import './pdf-viewer.scss';

const ZOOMS = [50, 75, 100, 125, 150, 200];
const supported =
  typeof navigator === 'undefined' ||
  (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false;

/**
 * app-pdf-viewer : moteur PDF natif du navigateur piloté par une barre d'outils maison
 * (pages, sommaire, zoom, téléchargement, impression, plein écran) ; repli ouvrir / télécharger.
 */
export function PdfViewer({
  className,
  src = null,
  blob = null,
  pages = null,
  name = 'document.pdf',
  height = '620px',
  emptyLabel = 'Sélectionnez un fichier PDF pour l’afficher.',
}: {
  className?: string;
  src?: string | null;
  blob?: Blob | null;
  pages?: number | null;
  name?: string;
  height?: string;
  emptyLabel?: string;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoomS] = useState<PdfZoom>('page-width');
  const [sidebar, setSidebar] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [detected, setDetected] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [zoomMenu, setZoomMenu] = useState<HTMLElement | null>(null);
  const pageCount = pages ?? detected;
  const zoomLabel = zoom === 'page-fit' ? 'Page' : zoom === 'page-width' ? 'Largeur' : `${zoom} %`;
  const frameUrl = `${src}#page=${page}&zoom=${zoom}&toolbar=0&navpanes=0&view=FitH`;

  useEffect(() => {
    setPage(1);
    setDetected(0);
    if (!blob) return;
    let alive = true;
    void blob.text().then((t) => {
      if (alive) setDetected((t.match(/\/Type\s*\/Page(?![s\w])/g) || []).length);
    });
    return () => {
      alive = false;
    };
  }, [blob]);
  useEffect(() => {
    const onFs = () => setFullscreen(!!shell.current && document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /** Le moteur natif ne réagit pas toujours au seul changement de fragment : on recrée l'iframe. */
  const reload = () => setFrameKey((k) => k + 1);
  const goto = (p: number) => {
    const max = pageCount || Infinity;
    const n = Math.max(1, Math.min(max, Math.round(p) || 1));
    if (n === page) return;
    setPage(n);
    reload();
  };
  const setZoom = (z: PdfZoom) => {
    setZoomS(z);
    reload();
    setZoomMenu(null);
  };
  const stepZoom = (d: 1 | -1) => {
    const cur = typeof zoom === 'number' ? zoom : 100;
    const next = d > 0 ? ZOOMS.find((x) => x > cur) : [...ZOOMS].reverse().find((x) => x < cur);
    setZoom(next ?? cur);
  };
  const print = () => {
    try {
      frame.current?.contentWindow?.print();
    } catch {
      if (src) window.open(src, '_blank');
    }
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.current?.requestFullscreen?.();
  };
  const tb = (tip: string, icon: string, fn: () => void, opts: { cls?: string; disabled?: boolean } = {}) => (
    <Tooltip title={tip} describeChild>
      <span style={{ display: 'contents' }}>
        <button
          type="button"
          aria-label={tip}
          className={`pv-btn${opts.cls ?? ''}`}
          onClick={fn}
          disabled={opts.disabled}
        >
          <MaterialIcon name={icon} />
        </button>
      </span>
    </Tooltip>
  );

  return (
    <div className={className ? `app-pdf-viewer ${className}` : 'app-pdf-viewer'}>
      <div
        ref={shell}
        className={`pv${fullscreen ? ' is-fullscreen' : ''}`}
        style={{ height: fullscreen ? '100vh' : height }}
      >
        <div className="pv-toolbar">
          {pageCount > 1 && tb('Pages', 'view_sidebar', () => setSidebar(!sidebar), { cls: sidebar ? ' on' : '' })}
          <div className="pv-name">
            <MaterialIcon name="picture_as_pdf" />
            <span title={name}>{name}</span>
          </div>
          <span className="spacer" />
          {src && supported && (
            <>
              <div className="pv-pager">
                {tb('Page précédente', 'chevron_left', () => goto(page - 1), { disabled: page <= 1 })}
                <input
                  key={page}
                  type="number"
                  min="1"
                  max={pageCount || undefined}
                  defaultValue={page}
                  onChange={(e) => {
                    if (document.activeElement !== e.target) goto(+e.target.value);
                  }}
                  onBlur={(e) => goto(+e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goto(+e.currentTarget.value);
                  }}
                  aria-label="Page"
                />
                {!!pageCount && <span>/ {pageCount}</span>}
                {tb('Page suivante', 'chevron_right', () => goto(page + 1), {
                  disabled: !!pageCount && page >= pageCount,
                })}
              </div>
              <div className="pv-zoom hide-sm">
                {tb('Zoom arrière', 'zoom_out', () => stepZoom(-1))}
                <button type="button" className="pv-zoom-label" onClick={(e) => setZoomMenu(e.currentTarget)}>
                  {zoomLabel}
                  <MaterialIcon name="arrow_drop_down" />
                </button>
                {tb('Zoom avant', 'zoom_in', () => stepZoom(1))}
              </div>
              <Menu
                anchorEl={zoomMenu}
                open={!!zoomMenu}
                onClose={() => setZoomMenu(null)}
                container={fullscreen ? shell.current : undefined}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
              >
                <MenuItem className="mat-mdc-menu-item" onClick={() => setZoom('page-fit')}>
                  Page entière
                </MenuItem>
                <MenuItem className="mat-mdc-menu-item" onClick={() => setZoom('page-width')}>
                  Pleine largeur
                </MenuItem>
                {ZOOMS.map((z) => (
                  <MenuItem key={z} className="mat-mdc-menu-item" onClick={() => setZoom(z)}>
                    {z} %
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {src && (
            <>
              {tb('Imprimer', 'print', print, { cls: ' hide-xs' })}
              <Tooltip title="Télécharger">
                <a className="pv-btn" href={src} download={name}>
                  <MaterialIcon name="download" />
                </a>
              </Tooltip>
              {tb(
                fullscreen ? 'Quitter le plein écran' : 'Plein écran',
                fullscreen ? 'fullscreen_exit' : 'fullscreen',
                toggleFullscreen,
                { cls: ' hide-xs' },
              )}
            </>
          )}
        </div>
        <div className="pv-body">
          {sidebar && pageCount > 1 && supported && src && (
            <nav className="pv-pages" aria-label="Pages du document">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pv-page${p === page ? ' active' : ''}`}
                  onClick={() => goto(p)}
                >
                  <span className="sheet">
                    <i />
                    <i />
                    <i />
                    <i className="short" />
                  </span>
                  <span className="num">{p}</span>
                </button>
              ))}
            </nav>
          )}
          <div className="pv-stage">
            {!src ? (
              <div className="pv-state">
                <MaterialIcon name="description" />
                <strong>Aucun document</strong>
                <span>{emptyLabel}</span>
              </div>
            ) : !supported ? (
              <div className="pv-state">
                <MaterialIcon name="picture_as_pdf" />
                <strong>Aperçu indisponible sur cet appareil</strong>
                <span>Ce navigateur n’affiche pas les PDF intégrés.</span>
                <div className="pv-actions">
                  <a href={src} target="_blank" rel="noopener">
                    <MaterialIcon name="open_in_new" />
                    Ouvrir
                  </a>
                  <a href={src} download={name}>
                    <MaterialIcon name="download" />
                    Télécharger
                  </a>
                </div>
              </div>
            ) : (
              <iframe key={frameKey} ref={frame} src={frameUrl} title={name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
