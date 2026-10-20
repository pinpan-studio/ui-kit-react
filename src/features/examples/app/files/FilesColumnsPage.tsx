import { Button } from '@mui/material';
import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { useDialog } from '../../../../components/feedback/dialogs/useDialog';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { Kbd } from '../../../../components/interaction/Kbd';
import { useExampleShell } from '../../../../components/layout/exampleShellContext';
import { AudioPlayer } from '../../../../components/media/AudioPlayer';
import { useFileViewer } from '../../../../components/media/FileViewer';
import { VideoPlayer } from '../../../../components/media/VideoPlayer';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize, useExFiles, type FmItem } from './exFilesStore';
import { askName } from './NameDialog';
import '../../ex-page.scss';
import './files-columns.scss';

interface Column {
  parent: string | null;
  items: FmItem[];
  selected: string | null;
}

const icon = (f: FmItem) => FILE_ICON_BASE + FM_KINDS[f.kind].img;
const where = (f: FmItem) => ['Mon disque', ...exFiles.path(f.parent).map((p) => p.name)].join(' / ');
const sorted = (l: FmItem[]) =>
  [...l].sort((a, b) =>
    (a.kind === 'folder') !== (b.kind === 'folder')
      ? a.kind === 'folder'
        ? -1
        : 1
      : a.name.localeCompare(b.name, 'fr'),
  );
const fullDate = (d: Date) =>
  `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

/**
 * /examples/app/files/columns — autre disposition du gestionnaire : explorateur en colonnes (type Finder).
 * Une colonne par niveau de dossier, panneau d'aperçu riche (image, vidéo, audio, PDF, texte), navigation
 * au clavier (↑ ↓ ← →, Entrée, Espace = aperçu plein écran), barre d'état ; mêmes données que la vue grille.
 */
export function FilesColumnsPage() {
  useExampleShell({ flush: true });
  const items = useExFiles();
  const viewer = useFileViewer();
  const dialog = useDialog();
  const snack = useSnackbar();
  const colsEl = useRef<HTMLDivElement>(null);
  const explorerEl = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);

  /** Chemin sélectionné : un identifiant par colonne (le dernier peut être un fichier). */
  const [trail, setTrail] = useState<string[]>(['docs', 'contracts']);
  const [focusCol, setFocusCol] = useState(1);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');

  const get = (id: string | null) => (id ? items.find((i) => i.id === id) : undefined);
  const columns = useMemo<Column[]>(() => {
    const children = (p: string | null) => sorted(items.filter((i) => i.parent === p));
    const cols: Column[] = [{ parent: null, items: children(null), selected: trail[0] ?? null }];
    trail.forEach((id, i) => {
      const it = items.find((x) => x.id === id);
      if (it?.kind === 'folder') cols.push({ parent: id, items: children(id), selected: trail[i + 1] ?? null });
    });
    return cols;
  }, [items, trail]);
  const selected = get(trail.at(-1) ?? null) ?? null;
  const file = selected && selected.kind !== 'folder' ? selected : null;
  const folder = selected?.kind === 'folder' ? selected : null;
  const pathItems = trail.map((id) => get(id)).filter((x): x is FmItem => !!x);
  const q = query.trim().toLowerCase();
  const results = q ? items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 40) : [];
  const pct = Math.round((exFiles.used() / exFiles.quota) * 100);
  const lastCol = columns.at(-1);
  const statusText =
    `${lastCol?.items.length ?? 0} élément(s)` +
    (selected
      ? ` · « ${selected.name} » sélectionné${selected.kind === 'folder' ? '' : ' · ' + fmSize(selected.size)}`
      : '');

  // Faire défiler jusqu'à la dernière colonne ; lire le contenu texte pour l'aperçu.
  useEffect(() => {
    queueMicrotask(() => {
      const el = colsEl.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    });
  }, [columns]);
  useEffect(() => {
    setText('');
    if (file?.kind === 'text' && file.blob) void file.blob.text().then(setText);
  }, [file?.id, file?.kind, file?.blob]);

  /** Sélectionne `id` dans la colonne `ci` (−1 = racine, vide le chemin). */
  const selectAt = (ci: number, id: string | null) => {
    setTrail((t) => (id ? [...t.slice(0, ci), id] : t.slice(0, Math.max(0, ci))));
    setFocusCol(Math.max(0, ci));
    explorerEl.current?.focus({ preventScroll: true });
  };
  /** Affiche un élément trouvé (recherche ou fil d'Ariane) à sa place dans les colonnes. */
  const reveal = (f: FmItem) => {
    const ids = [...exFiles.path(f.parent).map((p) => p.id), f.id];
    setQuery('');
    setTrail(ids);
    setFocusCol(ids.length - 1);
  };
  const preview = (f: FmItem) => {
    if (!f.url) {
      snack('Aperçu indisponible (exemple statique)', { action: 'OK', duration: 2000 });
      return;
    }
    const siblings = exFiles.children(f.parent).filter((i) => i.kind !== 'folder' && i.url);
    viewer(
      exFiles.toViewer(siblings),
      siblings.findIndex((s) => s.id === f.id),
    );
  };
  const toggleStar = (f: FmItem) => exFiles.patch(f.id, { starred: !f.starred });
  const rename = async (f: FmItem) => {
    const name = await askName(dialog, {
      title: 'Renommer',
      label: 'Nouveau nom',
      value: f.name,
      confirm: 'Renommer',
      icon: 'drive_file_rename_outline',
    });
    if (name) exFiles.patch(f.id, { name });
  };
  const currentFolderId = () => (selected ? (selected.kind === 'folder' ? selected.id : selected.parent) : null);
  const newFolder = async () => {
    const parent = currentFolderId();
    const name = await askName(dialog, {
      title: 'Nouveau dossier',
      label: 'Nom du dossier',
      value: 'Nouveau dossier',
      confirm: 'Créer',
      icon: 'create_new_folder',
    });
    if (name) reveal(exFiles.createFolder(name, parent));
  };
  const upload = (files: FileList | File[]) => {
    const added = exFiles.addFiles(files, currentFolderId());
    if (added[0]) reveal(added[0]);
    snack(`${added.length} fichier(s) importé(s)`, { action: 'OK', duration: 2000 });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) upload(e.dataTransfer.files);
  };

  /** ↑ ↓ dans la colonne, → entre dans le dossier, ← remonte, Entrée / Espace : aperçu. */
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    const ci = Math.min(focusCol, columns.length - 1);
    const col = columns[ci];
    if (!col) return;
    const idx = col.items.findIndex((i) => i.id === col.selected);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = col.items[Math.min(col.items.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (next) selectAt(ci, next.id);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const first = columns[ci + 1]?.items[0];
      if (first) selectAt(ci + 1, first.id);
    } else if (e.key === 'ArrowLeft' && ci > 0) {
      e.preventDefault();
      setTrail((t) => t.slice(0, ci));
      setFocusCol(ci - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && file) {
      e.preventDefault();
      preview(file);
    }
  };

  const stats = folder ? exFiles.folderStats(folder.id) : null;

  return (
    <div className="ex-page ex-files-columns">
      <div className="wrap">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow">Ressources</span>
            <h1>Fichiers</h1>
            <p>
              Explorateur en colonnes · {fmSize(exFiles.used())} utilisés sur {fmSize(exFiles.quota)}
            </p>
          </div>
          <div className="actions">
            <div className="layout-switch" role="group" aria-label="Disposition">
              <Link to="/examples/app/files">
                <MaterialIcon name="grid_view" />
                Grille
              </Link>
              <a className="on" aria-current="page">
                <MaterialIcon name="view_week" />
                Colonnes
              </a>
            </div>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => void newFolder()}
              startIcon={<MaterialIcon name="create_new_folder" />}
            >
              Dossier
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => input.current?.click()}
              startIcon={<MaterialIcon name="upload" />}
            >
              Importer
            </Button>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) upload(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <section
          ref={explorerEl}
          className="card explorer"
          tabIndex={0}
          onKeyDown={onKey}
          aria-label="Explorateur de fichiers"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="bar">
            <nav className="path" aria-label="Emplacement">
              <button type="button" onClick={() => selectAt(-1, null)}>
                <MaterialIcon name="cloud" />
                Mon disque
              </button>
              {pathItems.map((p) => (
                <Fragment key={p.id}>
                  <MaterialIcon name="chevron_right" className="sep" />
                  <button type="button" onClick={() => reveal(p)}>
                    {p.name}
                  </button>
                </Fragment>
              ))}
            </nav>
            <span className="spacer" />
            <label className="searchbox">
              <MaterialIcon name="search" />
              <input type="search" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>

          <div className="body">
            <div className="columns" ref={colsEl}>
              {query ? (
                <div className="col results">
                  <div className="col-head">{results.length} résultat(s)</div>
                  {results.map((f) => (
                    <button key={f.id} type="button" className="row" onClick={() => reveal(f)}>
                      {f.kind === 'folder' ? (
                        <MaterialIcon name="folder" className="fi" style={{ color: f.color }} />
                      ) : (
                        <img className="ic" src={icon(f)} alt="" />
                      )}
                      <span className="nm">
                        {f.name}
                        <small>{where(f)}</small>
                      </span>
                    </button>
                  ))}
                  {results.length === 0 && <p className="none">Aucun fichier ne correspond.</p>}
                </div>
              ) : (
                columns.map((c, ci) => (
                  <div key={c.parent ?? 'root'} className={`col${ci === focusCol ? ' active' : ''}`}>
                    {c.items.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`row${c.selected === f.id ? ' sel' : ''}${c.selected === f.id && ci === focusCol ? ' focus' : ''}`}
                        onClick={() => selectAt(ci, f.id)}
                        onDoubleClick={() => f.kind !== 'folder' && preview(f)}
                      >
                        {f.kind === 'folder' ? (
                          <MaterialIcon name="folder" className="fi" style={{ color: f.color }} />
                        ) : f.kind === 'image' && f.url ? (
                          <img className="th" src={f.url} alt="" />
                        ) : (
                          <img className="ic" src={icon(f)} alt="" />
                        )}
                        <span className="nm">{f.name}</span>
                        {f.starred && <MaterialIcon name="star" className="star" />}
                        {f.kind === 'folder' && <MaterialIcon name="chevron_right" className="chev" />}
                      </button>
                    ))}
                    {c.items.length === 0 && <p className="none">Dossier vide</p>}
                  </div>
                ))
              )}
            </div>

            <aside className="preview" aria-label="Aperçu">
              {file ? (
                <>
                  <div className="pv-media">
                    {file.kind === 'image' ? (
                      <img src={file.url} alt={file.name} onClick={() => preview(file)} />
                    ) : file.kind === 'video' ? (
                      <VideoPlayer src={file.url ?? null} />
                    ) : file.kind === 'audio' ? (
                      <div className="pv-audio">
                        <AudioPlayer tracks={[{ title: file.name, src: file.url ?? '', blob: file.blob }]} />
                      </div>
                    ) : file.kind === 'text' ? (
                      <pre className="pv-text">{text}</pre>
                    ) : (
                      <div className="pv-icon" onClick={() => file.url && preview(file)}>
                        <img src={icon(file)} alt="" />
                        {file.kind === 'pdf' && <span>Cliquez pour ouvrir le PDF</span>}
                      </div>
                    )}
                  </div>
                  <h2 title={file.name}>{file.name}</h2>
                  <span className="pv-kind">
                    {FM_KINDS[file.kind].label} · {fmSize(file.size)}
                  </span>
                  <dl>
                    <dt>Emplacement</dt>
                    <dd>{where(file)}</dd>
                    <dt>Propriétaire</dt>
                    <dd>{file.owner}</dd>
                    <dt>Modifié</dt>
                    <dd>{fullDate(file.modified)}</dd>
                    {file.mime && (
                      <>
                        <dt>Format</dt>
                        <dd className="mono">{file.mime}</dd>
                      </>
                    )}
                    <dt>Partage</dt>
                    <dd>{file.shared ? 'Partagé (4 personnes)' : 'Privé'}</dd>
                  </dl>
                  <div className="pv-actions">
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => preview(file)}
                      disabled={!file.url}
                      startIcon={<MaterialIcon name="open_in_full" />}
                    >
                      Ouvrir
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={() => toggleStar(file)}>
                      <MaterialIcon name={file.starred ? 'star' : 'star_border'} />
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={() => void rename(file)} aria-label="Renommer">
                      <MaterialIcon name="drive_file_rename_outline" />
                    </Button>
                  </div>
                </>
              ) : folder && stats ? (
                <>
                  <div className="pv-folder">
                    <MaterialIcon name="folder" style={{ color: folder.color }} />
                  </div>
                  <h2>{folder.name}</h2>
                  <span className="pv-kind">
                    Dossier · {stats.count} élément(s) · {fmSize(stats.size)}
                  </span>
                  <dl>
                    <dt>Propriétaire</dt>
                    <dd>{folder.owner}</dd>
                    <dt>Modifié</dt>
                    <dd>
                      {folder.modified.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </dd>
                    <dt>Partage</dt>
                    <dd>{folder.shared ? 'Partagé' : 'Privé'}</dd>
                  </dl>
                </>
              ) : (
                <div className="pv-empty">
                  <MaterialIcon name="preview" />
                  <p>Sélectionnez un fichier pour l’aperçu.</p>
                  <small>
                    <Kbd keys="up" /> <Kbd keys="down" /> parcourir · <Kbd keys="right" /> ouvrir · <Kbd keys="space" />{' '}
                    plein écran
                  </small>
                </div>
              )}
            </aside>
          </div>

          <footer className="status">
            <span>{statusText}</span>
            <span className="spacer" />
            <span className="quota">
              <i style={{ width: pct + '%' }} />
            </span>
            <span>{pct} % utilisés</span>
          </footer>
        </section>
      </div>
    </div>
  );
}
