import { Button, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DeviceFrame, type DeviceFrameHandle } from './DeviceFrame';
import { DEVICES, DEVICE_SPECS } from './deviceSpecs';
import { SHOWCASES, SHOWCASE_GROUPS, showcaseById, type DeviceKind, type Showcase } from './showcases.data';
import './showcase-viewer.scss';

const GROUPS = SHOWCASE_GROUPS.map((g) => ({ ...g, items: SHOWCASES.filter((s) => s.group === g.id) }));
const ZOOMS: { label: string; value: 'fit' | number }[] = [
  { label: 'Ajuster', value: 'fit' },
  { label: '50 %', value: 0.5 },
  { label: '75 %', value: 0.75 },
  { label: '100 %', value: 1 },
];

/**
 * /showcases/:id — aperçu d'un écran dans un cadre d'appareil, avec bascule
 * ordinateur / tablette / mobile, rotation, zoom et suivi de l'URL affichée.
 * L'appareil et l'orientation sont dans l'URL (?device=phone&landscape=1) : le lien se partage tel quel.
 */
export function ShowcaseViewerPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const frame = useRef<DeviceFrameHandle>(null);
  const [zoom, setZoom] = useState<'fit' | number>('fit');
  const [path, setPath] = useState('');
  const [listMenu, setListMenu] = useState<HTMLElement | null>(null);
  const [zoomMenu, setZoomMenu] = useState<HTMLElement | null>(null);

  const showcase = showcaseById(id) ?? (SHOWCASES[0] as Showcase);
  const group = GROUPS.find((g) => g.id === showcase.group) as (typeof GROUPS)[number];
  const d = params.get('device');
  const currentDevice: DeviceKind = d && d in DEVICE_SPECS ? (d as DeviceKind) : (showcase.device ?? 'desktop');
  const isLandscape = params.get('landscape') === '1' && currentDevice !== 'desktop';
  const zoomLabel = ZOOMS.find((z) => z.value === zoom)?.label ?? 'Ajuster';
  const index = SHOWCASES.indexOf(showcase);
  const prev = SHOWCASES[(index - 1 + SHOWCASES.length) % SHOWCASES.length] as Showcase;
  const next = SHOWCASES[(index + 1) % SHOWCASES.length] as Showcase;

  useEffect(() => {
    document.title = 'Showcase · UI Kit';
  }, []);

  const setDevice = (dev: DeviceKind) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('device', dev);
        if (dev === 'desktop') p.delete('landscape');
        return p;
      },
      { replace: true },
    );
  const rotate = () => {
    if (currentDevice === 'desktop') return;
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (isLandscape) p.delete('landscape');
        else p.set('landscape', '1');
        return p;
      },
      { replace: true },
    );
  };
  const open = (sid: string) => navigate({ pathname: `/showcases/${sid}`, search: params.toString() });
  const openInTab = () => window.open(path || showcase.path, '_blank', 'noopener');

  // Raccourcis : 1 / 2 / 3 appareil, R rotation, ← → écran précédent / suivant.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e) => {
    const t = e.target as HTMLElement | null;
    if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, [contenteditable], [role="combobox"]'))
      return;
    const map: Record<string, () => void> = {
      '1': () => setDevice('desktop'),
      '2': () => setDevice('tablet'),
      '3': () => setDevice('phone'),
      r: rotate,
      ArrowLeft: () => open(prev.id),
      ArrowRight: () => open(next.id),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="showcase-viewer">
      <div className="viewer">
        <header className="bar">
          <Tooltip title="Tous les showcases">
            <IconButton component={Link} to="/showcases" className="back" aria-label="Tous les showcases">
              <MaterialIcon name="arrow_back" />
            </IconButton>
          </Tooltip>

          <button type="button" className="picker" onClick={(e) => setListMenu(e.currentTarget)}>
            <span className="p-icon">
              <MaterialIcon name={showcase.icon} />
            </span>
            <span className="p-text">
              <small>{group.label}</small>
              <strong>{showcase.label}</strong>
            </span>
            <MaterialIcon name="expand_more" className="caret" />
          </button>
          <Menu
            anchorEl={listMenu}
            open={!!listMenu}
            onClose={() => setListMenu(null)}
            slotProps={{ paper: { className: 'showcase-menu', sx: { maxHeight: '70vh' } } }}
          >
            {GROUPS.flatMap((g) => [
              <MenuItem key={'g-' + g.id} className="menu-group" disabled>
                {g.label}
              </MenuItem>,
              ...g.items.map((s) => (
                <MenuItem
                  key={s.id}
                  className={s.id === showcase.id ? 'current' : ''}
                  selected={s.id === showcase.id}
                  onClick={() => {
                    setListMenu(null);
                    open(s.id);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name={s.icon} />
                  </ListItemIcon>
                  {s.label}
                </MenuItem>
              )),
            ])}
          </Menu>

          <div className="nav-arrows">
            <Tooltip title={`Précédent : ${prev.label} (←)`}>
              <IconButton onClick={() => open(prev.id)} aria-label="Précédent">
                <MaterialIcon name="chevron_left" />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Suivant : ${next.label} (→)`}>
              <IconButton onClick={() => open(next.id)} aria-label="Suivant">
                <MaterialIcon name="chevron_right" />
              </IconButton>
            </Tooltip>
          </div>

          <span className="spacer" />

          <div className="segmented" role="radiogroup" aria-label="Appareil">
            {DEVICES.map((dev, i) => (
              <Tooltip key={dev} title={`${DEVICE_SPECS[dev].model} (${i + 1})`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentDevice === dev}
                  className={currentDevice === dev ? 'on' : ''}
                  onClick={() => setDevice(dev)}
                >
                  <MaterialIcon name={DEVICE_SPECS[dev].icon} />
                  <span className="seg-label">{DEVICE_SPECS[dev].label}</span>
                </button>
              </Tooltip>
            ))}
          </div>

          <div className="tools">
            <Tooltip title="Pivoter (R)">
              <span>
                <IconButton onClick={rotate} disabled={currentDevice === 'desktop'} aria-label="Pivoter">
                  <MaterialIcon name="screen_rotation" className={isLandscape ? 'turned' : ''} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Zoom">
              <Button
                className="zoom-btn"
                color="inherit"
                onClick={(e) => setZoomMenu(e.currentTarget)}
                startIcon={<MaterialIcon name="zoom_in" />}
              >
                {zoomLabel}
              </Button>
            </Tooltip>
            <Menu anchorEl={zoomMenu} open={!!zoomMenu} onClose={() => setZoomMenu(null)}>
              {ZOOMS.map((z) => (
                <MenuItem
                  key={z.label}
                  onClick={() => {
                    setZoom(z.value);
                    setZoomMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name={zoom === z.value ? 'check' : ''} />
                  </ListItemIcon>
                  {z.label}
                </MenuItem>
              ))}
            </Menu>
            <Tooltip title="Recharger l’aperçu">
              <IconButton onClick={() => frame.current?.reload()} aria-label="Recharger l’aperçu">
                <MaterialIcon name="refresh" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ouvrir dans un nouvel onglet">
              <IconButton onClick={openInTab} aria-label="Ouvrir dans un nouvel onglet">
                <MaterialIcon name="open_in_new" />
              </IconButton>
            </Tooltip>
          </div>
        </header>

        <div className={`stage${zoom !== 'fit' ? ' zoomed' : ''}`}>
          <DeviceFrame
            ref={frame}
            src={showcase.path}
            device={currentDevice}
            landscape={isLandscape}
            zoom={zoom}
            title={showcase.label}
            onUrlChange={setPath}
          />
        </div>

        <footer className="foot">
          <div className="info">
            <p>{showcase.description}</p>
            <div className="meta">
              <span className="chip">
                <MaterialIcon name={DEVICE_SPECS[currentDevice].icon} />
                {DEVICE_SPECS[currentDevice].model}
                {isLandscape ? ' · paysage' : ''}
              </span>
              <code>{path || showcase.path}</code>
              {(showcase.tags ?? []).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <nav className="siblings" aria-label="Écrans du groupe">
            {group.items.map((s) => (
              <Tooltip key={s.id} title={s.description}>
                <button type="button" onClick={() => open(s.id)} className={s.id === showcase.id ? 'on' : ''}>
                  <MaterialIcon name={s.icon} />
                  {s.label}
                </button>
              </Tooltip>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
}
