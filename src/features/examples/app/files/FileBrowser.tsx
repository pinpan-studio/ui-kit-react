import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { ContextMenu, type ContextMenuItem } from '../../../../components/interaction/ContextMenu';
import { ViewModeToggle, type ViewMode } from '../../../../components/interaction/ViewModeToggle';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize, useExFiles, type FmItem, type FmKind } from './exFilesStore';
import './file-browser.scss';

export type FmScope = 'drive' | 'recent' | 'starred' | 'shared';
type SortKey = 'name' | 'modified' | 'size';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'name', label: 'Nom' },
  { id: 'modified', label: 'Date de modification' },
  { id: 'size', label: 'Taille' },
];
const MENU: ContextMenuItem[] = [
  { id: 'open', label: 'Ouvrir', icon: 'open_in_new' },
  { id: 'download', label: 'Télécharger', icon: 'download' },
  { id: 'share', label: 'Partager', icon: 'person_add' },
  { id: 'star', label: 'Ajouter / retirer des favoris', icon: 'star_border' },
  { id: 'rename', label: 'Renommer', icon: 'drive_file_rename_outline' },
  { divider: true },
  { id: 'delete', label: 'Supprimer', icon: 'delete', danger: true },
];
const NO_MENU: ContextMenuItem[] = [];
const SCOPE_LABEL: Record<FmScope, string> = {
  drive: 'Mon disque',
  recent: 'Récents',
  starred: 'Favoris',
  shared: 'Partagés avec moi',
};
const shortDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const longDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export interface FileBrowserHandle {
  clear: () => void;
  selectAll: () => void;
}

/**
 * Navigateur de fichiers partagé par le gestionnaire (/examples/app/files) et le sélecteur en modale :
 * fil d'Ariane, recherche, tri, vues grille / liste, sélection (Ctrl/⌘ + clic, Maj + clic), glisser-déposer,
 * filtre de types (`accept`), menu contextuel en mode gestionnaire.
 */
export function FileBrowser({
  picker = false,
  multiple = true,
  accept = null,
  scope = 'drive',
  folder,
  onFolderChange,
  view,
  onViewChange,
  onSelectionChange,
  onOpened,
  onAction,
  onDropped,
  ref,
}: {
  /** Mode sélecteur : cases à cocher, pas de menu contextuel, double-clic = valider. */
  picker?: boolean;
  multiple?: boolean;
  /** Types acceptés (les autres sont grisés) ; `null` = tous. */
  accept?: FmKind[] | null;
  scope?: FmScope;
  folder: string | null;
  onFolderChange: (id: string | null) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onSelectionChange?: (l: FmItem[]) => void;
  /** Double-clic sur un fichier (aperçu en gestionnaire, validation en sélecteur). */
  onOpened?: (f: FmItem) => void;
  /** Action du menu contextuel. */
  onAction?: (e: { id: string; items: FmItem[] }) => void;
  onDropped?: (files: File[]) => void;
  ref?: Ref<FileBrowserHandle>;
}) {
  const items = useExFiles();
  const [selection, setSel] = useState<FmItem[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSortState] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  const [dragging, setDragging] = useState(false);
  const [sortMenu, setSortMenu] = useState<HTMLElement | null>(null);
  const anchor = useRef<FmItem | null>(null);

  const setSelection = (l: FmItem[]) => {
    setSel(l);
    onSelectionChange?.(l);
  };
  // Changer de dossier ou de vue réinitialise la sélection.
  const resetKey = `${folder}|${scope}|${query}`;
  const prevKey = useRef(resetKey);
  useEffect(() => {
    if (prevKey.current === resetKey) return;
    prevKey.current = resetKey;
    setSel([]);
    onSelectionChange?.([]);
  }, [resetKey, onSelectionChange]);

  // La sélection suit les mises à jour du disque (favori, renommage…).
  const selected = selection.map((s) => items.find((i) => i.id === s.id) ?? s);
  const path = exFiles.path(folder);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: FmItem[];
    if (q) list = items.filter((i) => i.name.toLowerCase().includes(q));
    else if (scope === 'recent')
      list = items
        .filter((i) => i.kind !== 'folder')
        .sort((a, b) => +b.modified - +a.modified)
        .slice(0, 12);
    else if (scope === 'starred') list = items.filter((i) => i.starred);
    else if (scope === 'shared') list = items.filter((i) => i.shared);
    else list = items.filter((i) => i.parent === folder);
    if (scope === 'recent' && !q) return list;
    const { key, dir } = sort;
    const val = (i: FmItem) => (key === 'name' ? i.name.toLowerCase() : key === 'size' ? i.size : +i.modified);
    return [...list].sort((a, b) =>
      (a.kind === 'folder') !== (b.kind === 'folder')
        ? a.kind === 'folder'
          ? -1
          : 1
        : (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * dir,
    );
  }, [items, query, scope, folder, sort]);
  const folders = rows.filter((i) => i.kind === 'folder');
  const files = rows.filter((i) => i.kind !== 'folder');

  const accepts = (f: FmItem) => f.kind === 'folder' || !accept || accept.includes(f.kind);
  const isSel = (f: FmItem) => selected.some((s) => s.id === f.id);
  const stats = (f: FmItem) => exFiles.folderStats(f.id).count + ' élément(s)';
  const sortIcon = (k: SortKey) => (sort.key !== k ? '' : sort.dir === 1 ? 'arrow_upward' : 'arrow_downward');
  const setSort = (k: SortKey) =>
    setSortState((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : k === 'name' ? 1 : -1 }));

  const click = (f: FmItem, e: MouseEvent) => {
    const pickable = !picker || f.kind !== 'folder';
    if (!pickable) {
      setSelection([]);
      return;
    }
    if (multiple && e.shiftKey && anchor.current) {
      const a0 = anchor.current;
      const list = rows.filter((r) => accepts(r) && (r.kind === 'folder') === (f.kind === 'folder'));
      const [a, b] = [list.findIndex((r) => r.id === a0.id), list.findIndex((r) => r.id === f.id)].sort(
        (x, y) => x - y,
      );
      setSelection(list.slice(a, (b ?? 0) + 1));
      return;
    }
    // En sélecteur multiple, un simple clic bascule (comme une case à cocher).
    if (multiple && (e.metaKey || e.ctrlKey || picker)) {
      setSelection(isSel(f) ? selected.filter((s) => s.id !== f.id) : [...selected, f]);
    } else {
      setSelection([f]);
    }
    anchor.current = f;
  };
  const select = (f: FmItem) => {
    if (!isSel(f)) {
      setSelection([f]);
      anchor.current = f;
    }
  };
  useImperativeHandle(ref, () => ({
    clear: () => setSelection([]),
    selectAll: () => setSelection(rows.filter((r) => accepts(r) && (!picker || r.kind !== 'folder'))),
  }));

  const open = (f: FmItem) => {
    if (f.kind === 'folder') {
      setQuery('');
      onFolderChange(f.id);
      return;
    }
    if (accepts(f)) onOpened?.(f);
  };
  const onLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = [...(e.dataTransfer?.files ?? [])];
    if (dropped.length) onDropped?.(dropped);
  };

  // Menu contextuel : sélectionne l'élément visé puis relaie l'action sur la sélection.
  const withMenu = (f: FmItem, el: ReactElement<{ onContextMenu?: (e: MouseEvent) => void }>) => (
    <ContextMenu
      key={f.id}
      items={picker ? NO_MENU : MENU}
      onOpen={() => select(f)}
      onSelect={(it) => onAction?.({ id: it.id ?? '', items: isSel(f) ? selected : [f] })}
    >
      {el}
    </ContextMenu>
  );

  return (
    <div
      className={`fb${picker ? ' picker' : ''}${dragging ? ' dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={onLeave}
      onDrop={onDrop}
    >
      <div className="fb-bar">
        <nav className="crumbs" aria-label="Emplacement">
          {scope === 'drive' && !query ? (
            <>
              <button type="button" onClick={() => onFolderChange(null)} className={!folder ? 'cur' : ''}>
                Mon disque
              </button>
              {path.map((p, i) => (
                <span key={p.id} className="crumb">
                  <MaterialIcon name="chevron_right" />
                  <button
                    type="button"
                    onClick={() => onFolderChange(p.id)}
                    className={i === path.length - 1 ? 'cur' : ''}
                  >
                    {p.name}
                  </button>
                </span>
              ))}
            </>
          ) : (
            <span className="cur">{query ? `Résultats pour « ${query} »` : SCOPE_LABEL[scope]}</span>
          )}
        </nav>
        <span className="spacer" />
        <label className="searchbox">
          <MaterialIcon name="search" />
          <input
            type="search"
            placeholder="Rechercher un fichier"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Tooltip title="Trier">
          <IconButton aria-label="Trier" onClick={(e) => setSortMenu(e.currentTarget)}>
            <MaterialIcon name="sort" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={sortMenu}
          open={!!sortMenu}
          onClose={() => setSortMenu(null)}
          slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
        >
          {SORTS.map((s) => (
            <MenuItem
              key={s.id}
              onClick={() => {
                setSort(s.id);
                setSortMenu(null);
              }}
            >
              <ListItemIcon>
                <MaterialIcon
                  name={sort.key === s.id ? (sort.dir === 1 ? 'arrow_upward' : 'arrow_downward') : 'remove'}
                />
              </ListItemIcon>
              {s.label}
            </MenuItem>
          ))}
        </Menu>
        <ViewModeToggle mode={view} onChange={onViewChange} />
      </div>

      {!rows.length ? (
        <EmptyState
          icon={query ? 'search_off' : 'folder_open'}
          title={query ? 'Aucun résultat' : 'Dossier vide'}
          subtitle={picker ? 'Aucun fichier compatible ici.' : 'Glissez des fichiers ici ou utilisez « Importer ».'}
        />
      ) : view === 'card' ? (
        <>
          {folders.length > 0 && (
            <>
              <div className="group-label">Dossiers</div>
              <div className="folders">
                {folders.map((f) =>
                  withMenu(
                    f,
                    <button
                      type="button"
                      className={`folder${isSel(f) ? ' sel' : ''}`}
                      onClick={(e) => click(f, e)}
                      onDoubleClick={() => open(f)}
                    >
                      <MaterialIcon name="folder" style={{ color: f.color }} />
                      <span className="nm">{f.name}</span>
                      {f.shared && (
                        <Tooltip title="Partagé">
                          <span className="badge-wrap">
                            <MaterialIcon name="group" className="badge-ic" />
                          </span>
                        </Tooltip>
                      )}
                    </button>,
                  ),
                )}
              </div>
            </>
          )}
          {files.length > 0 && (
            <>
              <div className="group-label">Fichiers</div>
              <div className="grid">
                {files.map((f) =>
                  withMenu(
                    f,
                    <button
                      type="button"
                      className={`tile${isSel(f) ? ' sel' : ''}${!accepts(f) ? ' off' : ''}`}
                      disabled={!accepts(f)}
                      onClick={(e) => click(f, e)}
                      onDoubleClick={() => open(f)}
                    >
                      <span className="thumb">
                        {f.kind === 'image' && f.url ? (
                          <img src={f.url} alt={f.name} loading="lazy" />
                        ) : (
                          <img className="ic" src={FILE_ICON_BASE + FM_KINDS[f.kind].img} alt="" />
                        )}
                        {f.kind === 'video' && <MaterialIcon name="play_circle" className="play" />}
                        {(picker || isSel(f)) && (
                          <span className={`check${isSel(f) ? ' on' : ''}`}>
                            <MaterialIcon name="check" />
                          </span>
                        )}
                      </span>
                      <span className="meta">
                        <span className="nm" title={f.name}>
                          {f.name}
                        </span>
                        <small>
                          {fmSize(f.size)} · {shortDate(f.modified)}
                        </small>
                      </span>
                      {f.starred && <MaterialIcon name="star" className="star" />}
                    </button>,
                  ),
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="table-wrap">
          <table className="list">
            <thead>
              <tr>
                <th className="c-name" onClick={() => setSort('name')}>
                  Nom
                  <MaterialIcon name={sortIcon('name')} />
                </th>
                <th className="hide-sm">Propriétaire</th>
                <th onClick={() => setSort('modified')}>
                  Modifié
                  <MaterialIcon name={sortIcon('modified')} />
                </th>
                <th className="r" onClick={() => setSort('size')}>
                  Taille
                  <MaterialIcon name={sortIcon('size')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) =>
                withMenu(
                  f,
                  <tr
                    className={`${isSel(f) ? 'sel' : ''}${!accepts(f) ? ' off' : ''}`}
                    onClick={(e) => accepts(f) && click(f, e)}
                    onDoubleClick={() => open(f)}
                  >
                    <td className="c-name">
                      <span className="nm-cell">
                        {f.kind === 'folder' ? (
                          <MaterialIcon name="folder" className="fi" style={{ color: f.color }} />
                        ) : f.kind === 'image' && f.url ? (
                          <img className="th" src={f.url} alt="" />
                        ) : (
                          <img className="th ic" src={FILE_ICON_BASE + FM_KINDS[f.kind].img} alt="" />
                        )}
                        <span className="nm">{f.name}</span>
                        {f.starred && <MaterialIcon name="star" className="star" />}
                        {f.shared && (
                          <Tooltip title="Partagé">
                            <span className="badge-wrap">
                              <MaterialIcon name="group" className="shared" />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                    </td>
                    <td className="hide-sm muted">{f.owner}</td>
                    <td className="muted">{longDate(f.modified)}</td>
                    <td className="r muted">{f.kind === 'folder' ? stats(f) : fmSize(f.size)}</td>
                  </tr>,
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
      {dragging && !picker && (
        <div className="drop">
          <MaterialIcon name="cloud_upload" />
          Déposez pour importer dans « {path.at(-1)?.name ?? 'Mon disque'} »
        </div>
      )}
    </div>
  );
}
