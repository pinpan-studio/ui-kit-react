import { Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DescriptionList } from '../../../../components/data/DescriptionList';
import type { DescriptionItem } from '../../../../components/data/descriptionTypes';
import { ConfirmDialog } from '../../../../components/feedback/dialogs/ConfirmDialog';
import { useDialog } from '../../../../components/feedback/dialogs/useDialog';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { CopyField } from '../../../../components/fields/CopyField';
import type { ViewMode } from '../../../../components/interaction/ViewModeToggle';
import { useFileViewer } from '../../../../components/media/FileViewer';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize, useExFiles, type FmItem } from './exFilesStore';
import { FileBrowser, type FileBrowserHandle, type FmScope } from './FileBrowser';
import { openFilePicker } from './FilePickerDialog';
import { askName } from './NameDialog';
import '../../ex-page.scss';
import './files.scss';

const sharedWith = (f: FmItem): { n: string; i: string; c: string }[] => {
  const me = {
    n: f.owner,
    i: f.owner
      .split(' ')
      .map((p) => p[0] ?? '')
      .join('')
      .slice(0, 2),
    c: '#0f766e',
  };
  return f.shared
    ? [
        me,
        { n: 'Fatou Diabaté', i: 'FD', c: '#7c3aed' },
        { n: 'Marc Yao', i: 'MY', c: '#059669' },
        { n: 'Aya Koné', i: 'AK', c: '#b45309' },
      ]
    : [me];
};

/**
 * /examples/app/files — gestionnaire de fichiers : emplacements, jauge de stockage par type, navigateur
 * (grille / liste, recherche, tri, sélection multiple, glisser-déposer, menu contextuel), panneau de détails,
 * aperçu plein écran (images, PDF, vidéo, audio, texte), nouveau dossier, partage, suppression confirmée,
 * et démonstration du sélecteur de fichiers en modale.
 */
export function FilesPage() {
  const items = useExFiles();
  const viewer = useFileViewer();
  const dialog = useDialog();
  const snack = useSnackbar();
  const [params] = useSearchParams();
  const browser = useRef<FileBrowserHandle>(null);
  const input = useRef<HTMLInputElement>(null);
  const [newMenu, setNewMenu] = useState<HTMLElement | null>(null);

  const [scope, setScope] = useState<FmScope>('drive');
  const [folder, setFolder] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(() => (window.innerWidth < 768 ? 'list' : 'card'));
  const [selection, setSelection] = useState<FmItem[]>([]);
  /** Élément affiché dans le panneau de détails (sélection simple, toujours à jour avec le disque). */
  const current = selection.length === 1 ? (items.find((i) => i.id === selection[0]?.id) ?? null) : null;

  const fileCount = items.filter((i) => i.kind !== 'folder').length;
  const used = exFiles.used();
  const pct = Math.round((used / exFiles.quota) * 100);
  const usage = exFiles.usageByKind().map((u) => ({ ...u, pct: (u.bytes / exFiles.quota) * 100 }));
  const places = [
    { id: 'drive' as FmScope, label: 'Mon disque', icon: 'cloud', count: 0 },
    { id: 'recent' as FmScope, label: 'Récents', icon: 'schedule', count: 0 },
    { id: 'starred' as FmScope, label: 'Favoris', icon: 'star_border', count: items.filter((i) => i.starred).length },
    { id: 'shared' as FmScope, label: 'Partagés', icon: 'group', count: items.filter((i) => i.shared).length },
  ];

  const info: DescriptionItem[] = (() => {
    const f = current;
    if (!f) return [];
    const where =
      exFiles
        .path(f.parent)
        .map((p) => p.name)
        .join(' / ') || 'Mon disque';
    const s = f.kind === 'folder' ? exFiles.folderStats(f.id) : null;
    return [
      { label: 'Type', value: FM_KINDS[f.kind].label + (f.mime ? ` (${f.mime})` : '') },
      { label: 'Taille', value: s ? `${fmSize(s.size)} · ${s.count} élément(s)` : fmSize(f.size) },
      { label: 'Emplacement', value: where },
      { label: 'Propriétaire', value: f.owner },
      {
        label: 'Modifié',
        value: f.modified.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
    ];
  })();

  const go = (s: FmScope) => {
    setScope(s);
    setFolder(null);
  };

  const preview = (f: FmItem) => {
    const siblings = exFiles.getItems().filter((i) => i.parent === f.parent && i.kind !== 'folder' && i.url);
    if (!f.url) {
      snack(`Aperçu indisponible pour « ${f.name} » (exemple statique)`, { action: 'OK', duration: 2500 });
      return;
    }
    viewer(
      exFiles.toViewer(siblings),
      Math.max(
        0,
        siblings.findIndex((s) => s.id === f.id),
      ),
    );
  };

  const upload = (files: FileList | File[]) => {
    const added = exFiles.addFiles(files, scope === 'drive' ? folder : null);
    setScope('drive');
    snack(`${added.length} fichier(s) importé(s)`, { action: 'OK', duration: 2500 });
  };

  const newFolder = async () => {
    const name = await askName(dialog, {
      title: 'Nouveau dossier',
      label: 'Nom du dossier',
      value: 'Nouveau dossier',
      confirm: 'Créer',
      icon: 'create_new_folder',
    });
    if (!name) return;
    setScope('drive');
    exFiles.createFolder(name, folder);
  };

  const download = (list: FmItem[]) => {
    const files = list.filter((i) => i.url);
    for (const f of files) {
      const a = document.createElement('a');
      a.href = f.url ?? '';
      a.download = f.name;
      a.click();
    }
    if (files.length < list.length)
      snack('Certains éléments ne sont pas téléchargeables (exemple statique)', { action: 'OK', duration: 2500 });
  };

  const confirmDelete = async (list: FmItem[]) => {
    const ok = await dialog<boolean>(
      (ref) => (
        <ConfirmDialog
          dialog={ref}
          data={{
            title: list.length > 1 ? `Supprimer ${list.length} éléments ?` : `Supprimer « ${list[0]?.name} » ?`,
            message:
              'Les éléments seront placés dans la corbeille pendant 30 jours. Le contenu des dossiers est supprimé avec eux.',
            confirmLabel: 'Supprimer',
            type: 'danger',
          }}
        />
      ),
      { width: '440px' },
    );
    if (!ok) return;
    exFiles.remove(list.map((i) => i.id));
    browser.current?.clear();
    snack(`${list.length} élément(s) supprimé(s)`, { action: 'OK', duration: 2500 });
  };

  const act = async (id: string, list: FmItem[]) => {
    const one = list[0];
    if (!one) return;
    switch (id) {
      case 'open':
        if (one.kind === 'folder') {
          setScope('drive');
          setFolder(one.id);
        } else preview(one);
        break;
      case 'star': {
        const on = !one.starred;
        list.forEach((i) => exFiles.patch(i.id, { starred: on }));
        break;
      }
      case 'rename': {
        const name = await askName(dialog, {
          title: 'Renommer',
          label: 'Nouveau nom',
          value: one.name,
          confirm: 'Renommer',
          icon: 'drive_file_rename_outline',
        });
        if (name) exFiles.patch(one.id, { name });
        break;
      }
      case 'share':
        list.forEach((i) => exFiles.patch(i.id, { shared: true }));
        snack('Lien de partage copié', { action: 'OK', duration: 2500 });
        break;
      case 'download':
        download(list);
        break;
      case 'delete':
        void confirmDelete(list);
        break;
    }
  };

  /** Démonstration : ouvre le sélecteur en modale et affiche la sélection. */
  const pickDemo = async () => {
    const files = await openFilePicker(dialog, { title: 'Joindre des fichiers', confirmLabel: 'Joindre' });
    if (files?.length)
      snack(
        `Sélection : ${files
          .map((f) => f.name)
          .slice(0, 2)
          .join(', ')}${files.length > 2 ? ` et ${files.length - 2} autre(s)` : ''}`,
        { action: 'OK', duration: 3500 },
      );
  };

  // Lien direct vers la version modale : /examples/app/files?picker=1
  const pickerParam = params.has('picker');
  const pickRef = useRef(pickDemo);
  pickRef.current = pickDemo;
  useEffect(() => {
    if (!pickerParam) return;
    const t = setTimeout(() => void pickRef.current());
    return () => clearTimeout(t);
  }, [pickerParam]);

  return (
    <div className="ex-page ex-files">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Ressources</span>
          <h1>Fichiers</h1>
          <p>
            {fileCount} fichiers · {fmSize(used)} utilisés sur {fmSize(exFiles.quota)}
          </p>
        </div>
        <div className="actions">
          <div className="layout-switch" role="group" aria-label="Disposition">
            <a className="on" aria-current="page">
              <MaterialIcon name="grid_view" />
              Grille
            </a>
            <Link to="/examples/app/files/columns">
              <MaterialIcon name="view_week" />
              Colonnes
            </Link>
          </div>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => void pickDemo()}
            startIcon={<MaterialIcon name="file_open" />}
          >
            Sélecteur (modale)
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={(e) => setNewMenu(e.currentTarget)}
            startIcon={<MaterialIcon name="add" />}
          >
            Nouveau
          </Button>
          <Menu
            anchorEl={newMenu}
            open={!!newMenu}
            onClose={() => setNewMenu(null)}
            slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
          >
            <MenuItem
              onClick={() => {
                setNewMenu(null);
                void newFolder();
              }}
            >
              <ListItemIcon>
                <MaterialIcon name="create_new_folder" />
              </ListItemIcon>
              Nouveau dossier
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setNewMenu(null);
                input.current?.click();
              }}
            >
              <ListItemIcon>
                <MaterialIcon name="upload_file" />
              </ListItemIcon>
              Importer des fichiers
            </MenuItem>
          </Menu>
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

      <div className={`layout${current ? ' with-details' : ''}`}>
        <aside className="places">
          <nav aria-label="Emplacements">
            {places.map((p) => (
              <button key={p.id} type="button" className={scope === p.id ? 'on' : ''} onClick={() => go(p.id)}>
                <MaterialIcon name={p.icon} />
                <span>{p.label}</span>
                {p.count > 0 && <b>{p.count}</b>}
              </button>
            ))}
          </nav>
          <section className="storage" aria-label="Stockage">
            <div className="s-top">
              <strong>Stockage</strong>
              <span>{pct} %</span>
            </div>
            <div className="bar">
              {usage.map((u) => (
                <Tooltip key={u.kind} title={u.label + ' · ' + fmSize(u.bytes)}>
                  <i style={{ width: u.pct + '%', background: u.color }} />
                </Tooltip>
              ))}
            </div>
            <ul>
              {usage.map((u) => (
                <li key={u.kind}>
                  <i style={{ background: u.color }} />
                  {u.label}
                  <span>{fmSize(u.bytes)}</span>
                </li>
              ))}
            </ul>
            <Button variant="outlined" color="inherit" className="more">
              Augmenter l’espace
            </Button>
          </section>
        </aside>

        <section className="main card">
          {selection.length > 1 && (
            <div className="bulk">
              <IconButton onClick={() => browser.current?.clear()} aria-label="Désélectionner">
                <MaterialIcon name="close" />
              </IconButton>
              <strong>{selection.length} sélectionné(s)</strong>
              <span className="spacer" />
              <Button onClick={() => void act('download', selection)} startIcon={<MaterialIcon name="download" />}>
                <span className="hide-sm">Télécharger</span>
              </Button>
              <Button onClick={() => void act('share', selection)} startIcon={<MaterialIcon name="person_add" />}>
                <span className="hide-sm">Partager</span>
              </Button>
              <Button
                color="error"
                onClick={() => void act('delete', selection)}
                startIcon={<MaterialIcon name="delete" />}
              >
                <span className="hide-sm">Supprimer</span>
              </Button>
            </div>
          )}
          <FileBrowser
            ref={browser}
            scope={scope}
            folder={folder}
            onFolderChange={setFolder}
            view={view}
            onViewChange={setView}
            onSelectionChange={setSelection}
            onOpened={preview}
            onAction={(e) => void act(e.id, e.items)}
            onDropped={upload}
          />
        </section>

        {current && (
          <aside className="details card" aria-label="Détails">
            <header>
              <strong>Détails</strong>
              <IconButton onClick={() => browser.current?.clear()} aria-label="Fermer les détails">
                <MaterialIcon name="close" />
              </IconButton>
            </header>
            <div className="d-thumb">
              {current.kind === 'folder' ? (
                <MaterialIcon name="folder" style={{ color: current.color }} />
              ) : current.kind === 'image' && current.url ? (
                <img src={current.url} alt={current.name} />
              ) : (
                <img className="ic" src={FILE_ICON_BASE + FM_KINDS[current.kind].img} alt="" />
              )}
            </div>
            <h2 title={current.name}>{current.name}</h2>
            <div className="d-actions">
              {current.kind !== 'folder' && (
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => preview(current)}
                  startIcon={<MaterialIcon name="visibility" />}
                >
                  Aperçu
                </Button>
              )}
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => void act('star', [current])}
                startIcon={<MaterialIcon name={current.starred ? 'star' : 'star_border'} />}
              >
                {current.starred ? 'Favori' : 'Ajouter'}
              </Button>
            </div>
            <DescriptionList items={info} columns={1} layout="horizontal" />
            <div className="d-share">
              <span className="lbl">Lien de partage</span>
              <CopyField value={`https://scstorage.ci/f/${current.id}-7Hk2`} icon="link" label="le lien" />
              <div className="people">
                <span className="ava-stack">
                  {sharedWith(current).map((p) => (
                    <Tooltip key={p.n} title={p.n}>
                      <span className="ava sm" style={{ background: p.c }}>
                        {p.i}
                      </span>
                    </Tooltip>
                  ))}
                </span>
                <span className="muted">{current.shared ? 'Partagé avec 3 personnes' : 'Privé'}</span>
              </div>
            </div>
            <div className="d-activity">
              <span className="lbl">Activité</span>
              <p>
                <strong>{current.owner}</strong> a{' '}
                {current.kind === 'folder' ? 'créé ce dossier' : 'importé ce fichier'} ·{' '}
                {current.modified.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })},{' '}
                {current.modified.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {current.shared && (
                <p>
                  <strong>Fatou Diabaté</strong> a consulté · hier
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
