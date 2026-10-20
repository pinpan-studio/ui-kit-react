import { Dialog, Tooltip } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { AudioPlayer } from './AudioPlayer';
import { PdfViewer } from './PdfViewer';
import { VideoPlayer } from './VideoPlayer';
import { MEDIA_ICON, mediaKind, type MediaKind } from './mediaUtils';
import './file-viewer.scss';

export interface ViewerFile {
  name: string;
  url: string;
  /** Type MIME (sinon déduit de l'extension). */
  type?: string;
  size?: number;
  /** Fichier source (forme d'onde audio, nombre de pages PDF, contenu texte). */
  blob?: Blob;
}

const KIND_LABEL: Record<MediaKind, string> = {
  image: 'Image',
  pdf: 'Document PDF',
  video: 'Vidéo',
  audio: 'Audio',
  text: 'Texte',
  other: 'Fichier',
};
const kindOf = (f: ViewerFile) => mediaKind(f.name, f.type);
const size = (b: number) =>
  b > 1e6
    ? `${(b / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(b / 1024))} Ko`;

/**
 * app-file-viewer : visionneuse plein écran — image zoomable/pivotable, PDF, vidéo, audio, texte, sinon
 * « aperçu indisponible » ; navigation ←/→, bandeau de vignettes, téléchargement.
 */
export function FileViewer({
  files,
  initialIndex,
  onClose,
}: {
  files: ViewerFile[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, files.length - 1)));
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [text, setText] = useState<string | null>(null);
  const file = files[index] ?? files[0];
  const kind = file ? kindOf(file) : 'other';

  useEffect(() => {
    setText(null);
    if (!file || kindOf(file) !== 'text') return;
    let alive = true;
    void (file.blob ? file.blob.text() : Promise.resolve('(contenu non disponible)')).then((t) => {
      if (alive) setText(t.slice(0, 200_000));
    });
    return () => {
      alive = false;
    };
  }, [file]);

  const resetView = () => {
    setZoom(1);
    setRotate(0);
    setPan({ x: 0, y: 0 });
  };
  const select = (i: number) => {
    setIndex(i);
    resetView();
  };
  const go = (d: number) => {
    const i = index + d;
    if (i >= 0 && i < files.length) select(i);
  };
  const zoomBy = (d: number) => {
    const z = Math.max(0.25, Math.min(6, zoom + d));
    setZoom(z);
    if (z <= 1) setPan({ x: 0, y: 0 });
  };
  const panStart = (e: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const o = { ...pan },
      sx = e.clientX,
      sy = e.clientY;
    const move = (ev: globalThis.PointerEvent) => setPan({ x: o.x + ev.clientX - sx, y: o.y + ev.clientY - sy });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true });
  };

  // Raccourcis clavier et molette (écouteur natif non passif pour preventDefault).
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  keyRef.current = (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, .vp')) return;
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (kind === 'image' && (e.key === '+' || e.key === '=')) zoomBy(0.25);
    else if (kind === 'image' && e.key === '-') zoomBy(-0.25);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
  const wheelRef = useRef<(e: WheelEvent) => void>(() => undefined);
  wheelRef.current = (e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
  };
  const imageEl = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const h = (e: WheelEvent) => wheelRef.current(e);
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  if (!file) return null;
  const tb = (tip: string, icon: string, fn: () => void) => (
    <Tooltip title={tip}>
      <button type="button" className="fv-btn" onClick={fn}>
        <MaterialIcon name={icon} />
      </button>
    </Tooltip>
  );

  return (
    <div className="fv">
      <header className="fv-head">
        <MaterialIcon name={MEDIA_ICON[kind]} className={`fv-kind k-${kind}`} />
        <div className="fv-title">
          <strong title={file.name}>{file.name}</strong>
          <span>
            {KIND_LABEL[kind]}
            {file.size ? ` · ${size(file.size)}` : ''}
            {files.length > 1 ? ` · ${index + 1} / ${files.length}` : ''}
          </span>
        </div>
        <span className="spacer" />
        {kind === 'image' && (
          <>
            {tb('Zoom arrière', 'zoom_out', () => zoomBy(-0.25))}
            <span className="fv-zoom">{Math.round(zoom * 100)} %</span>
            {tb('Zoom avant', 'zoom_in', () => zoomBy(0.25))}
            {tb('Pivoter', 'rotate_right', () => setRotate(rotate + 90))}
            {tb('Ajuster', 'fit_screen', resetView)}
          </>
        )}
        <Tooltip title="Télécharger">
          <a className="fv-btn" href={file.url} download={file.name}>
            <MaterialIcon name="download" />
          </a>
        </Tooltip>
        {tb('Fermer (Échap)', 'close', onClose)}
      </header>
      <div className={`fv-stage${kind === 'image' || kind === 'video' ? ' dark' : ''}`}>
        {files.length > 1 && (
          <>
            <button
              type="button"
              className="fv-nav prev"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Précédent"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <button
              type="button"
              className="fv-nav next"
              onClick={() => go(1)}
              disabled={index === files.length - 1}
              aria-label="Suivant"
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </>
        )}
        {kind === 'image' ? (
          <div
            ref={imageEl}
            className="fv-image"
            onPointerDown={panStart}
            onDoubleClick={() => (zoom > 1 ? resetView() : zoomBy(1))}
          >
            <img
              src={file.url}
              alt={file.name}
              draggable={false}
              style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom}) rotate(${rotate}deg)` }}
            />
          </div>
        ) : kind === 'pdf' ? (
          <PdfViewer className="fv-fill" src={file.url} blob={file.blob ?? null} name={file.name} height="100%" />
        ) : kind === 'video' ? (
          <div className="fv-center">
            <VideoPlayer className="fv-video" src={file.url} title={file.name} />
          </div>
        ) : kind === 'audio' ? (
          <div className="fv-center">
            <AudioPlayer className="fv-audio" tracks={[{ src: file.url, title: file.name, blob: file.blob }]} />
          </div>
        ) : kind === 'text' ? (
          <pre className="fv-text">{text ?? 'Chargement…'}</pre>
        ) : (
          <div className="fv-none">
            <MaterialIcon name={MEDIA_ICON[kind]} />
            <strong>Aperçu indisponible</strong>
            <span>Ce type de fichier ne peut pas être affiché dans le navigateur.</span>
            <a href={file.url} download={file.name}>
              <MaterialIcon name="download" />
              Télécharger le fichier
            </a>
          </div>
        )}
      </div>
      {files.length > 1 && (
        <div className="fv-strip">
          {files.map((f, i) => (
            <Tooltip key={f.url} title={f.name}>
              <button type="button" className={`fv-thumb${i === index ? ' active' : ''}`} onClick={() => select(i)}>
                {kindOf(f) === 'image' ? <img src={f.url} alt="" /> : <MaterialIcon name={MEDIA_ICON[kindOf(f)]} />}
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

type OpenFn = (files: ViewerFile | ViewerFile[], index?: number) => void;
const Ctx = createContext<OpenFn | null>(null);

/** Équivalent de FileViewerService : fournit `open(files, index)` et affiche la visionneuse en modale plein écran. */
export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ files: ViewerFile[]; index: number; key: number } | null>(null);
  const open = useCallback<OpenFn>(
    (files, index = 0) => setState({ files: Array.isArray(files) ? files : [files], index, key: Date.now() }),
    [],
  );
  return (
    <Ctx.Provider value={open}>
      {children}
      <Dialog
        open={!!state}
        onClose={() => setState(null)}
        fullScreen
        className="kit-file-viewer-panel"
        disableAutoFocus
      >
        {state && (
          <FileViewer key={state.key} files={state.files} initialIndex={state.index} onClose={() => setState(null)} />
        )}
      </Dialog>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook compagnon du fournisseur
export function useFileViewer(): OpenFn {
  const open = useContext(Ctx);
  if (!open) throw new Error('useFileViewer doit être utilisé sous <FileViewerProvider>');
  return open;
}
