import { Button, IconButton } from '@mui/material';
import { useRef, useState } from 'react';
import type { DialogRef, OpenDialog } from '../../../../components/feedback/dialogs/dialogContext';
import type { ViewMode } from '../../../../components/interaction/ViewModeToggle';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize, type FmItem, type FmKind } from './exFilesStore';
import { FileBrowser, type FileBrowserHandle, type FmScope } from './FileBrowser';
import './file-picker.scss';

export interface FilePickerOptions {
  title?: string;
  /** Sélection multiple (par défaut : oui). */
  multiple?: boolean;
  /** Types acceptés ; les autres sont grisés. */
  accept?: FmKind[] | null;
  /** Libellé du bouton de validation. */
  confirmLabel?: string;
}

/** Ouvre le sélecteur de fichiers ; résout la sélection validée, ou `undefined` si annulé. */
// eslint-disable-next-line react-refresh/only-export-components -- ouverture de la modale associée
export function openFilePicker(open: OpenDialog, options: FilePickerOptions = {}): Promise<FmItem[] | undefined> {
  return open<FmItem[]>((ref) => <FilePickerDialog data={options} dialog={ref} />, {
    panelClass: 'ex-file-picker-panel',
    autoFocus: false,
  });
}

const PLACES: { id: FmScope; label: string; icon: string }[] = [
  { id: 'drive', label: 'Mon disque', icon: 'cloud' },
  { id: 'recent', label: 'Récents', icon: 'schedule' },
  { id: 'starred', label: 'Favoris', icon: 'star_border' },
  { id: 'shared', label: 'Partagés', icon: 'group' },
];
const ACCEPT_LABEL: Record<FmKind, string> = {
  image: 'images',
  video: 'vidéos',
  audio: 'audio',
  pdf: 'PDF',
  sheet: 'tableurs',
  slides: 'présentations',
  doc: 'documents',
  text: 'textes',
  archive: 'archives',
  folder: 'dossiers',
};

/**
 * Sélecteur de fichiers en modale : emplacements à gauche, navigateur (grille / liste, recherche, tri),
 * sélection multiple avec cases, import depuis l'ordinateur, récapitulatif et validation.
 */
export function FilePickerDialog({ data, dialog }: { data: FilePickerOptions; dialog: DialogRef<FmItem[]> }) {
  const browser = useRef<FileBrowserHandle>(null);
  const input = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<FmScope>('drive');
  const [folder, setFolder] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('card');
  const [selection, setSelection] = useState<FmItem[]>([]);

  const total = fmSize(selection.reduce((s, f) => s + f.size, 0));
  const acceptLabel = (data.accept ?? []).map((k) => ACCEPT_LABEL[k]).join(', ');

  /** Import depuis l'ordinateur : ajoute au dossier courant puis présélectionne. */
  const upload = (files: FileList | File[]) => {
    const added = exFiles.addFiles(files, scope === 'drive' ? folder : null);
    const ok = added.filter((f) => !data.accept || data.accept.includes(f.kind));
    if (!ok.length) return;
    setScope('drive');
    dialog.close(data.multiple === false ? ok.slice(0, 1) : ok);
  };

  return (
    <div className="fp">
      <header className="fp-head">
        <h2>{data.title ?? 'Sélectionner des fichiers'}</h2>
        {!!data.accept?.length && <span className="hint">Types acceptés : {acceptLabel}</span>}
        <span className="spacer" />
        <IconButton onClick={() => dialog.close()} aria-label="Fermer">
          <MaterialIcon name="close" />
        </IconButton>
      </header>

      <div className="fp-body">
        <nav className="places" aria-label="Emplacements">
          {PLACES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={scope === p.id ? 'on' : ''}
              onClick={() => {
                setScope(p.id);
                setFolder(null);
              }}
            >
              <MaterialIcon name={p.icon} />
              {p.label}
            </button>
          ))}
          <hr />
          <button type="button" onClick={() => input.current?.click()}>
            <MaterialIcon name="computer" />
            Depuis l’ordinateur
          </button>
          <input
            ref={input}
            type="file"
            hidden
            multiple={data.multiple !== false}
            onChange={(e) => {
              if (e.target.files) upload(e.target.files);
              e.target.value = '';
            }}
          />
        </nav>
        <div className="browser">
          <FileBrowser
            ref={browser}
            picker
            multiple={data.multiple !== false}
            accept={data.accept ?? null}
            scope={scope}
            folder={folder}
            onFolderChange={setFolder}
            view={view}
            onViewChange={setView}
            onSelectionChange={setSelection}
            onOpened={(f) => dialog.close([f])}
            onDropped={upload}
          />
        </div>
      </div>

      <footer className="fp-foot">
        {selection.length ? (
          <div className="picked">
            {selection
              .slice(0, 4)
              .map((f) =>
                f.kind === 'image' && f.url ? (
                  <img key={f.id} src={f.url} alt="" />
                ) : (
                  <img key={f.id} className="ic" src={FILE_ICON_BASE + FM_KINDS[f.kind].img} alt="" />
                ),
              )}
            <span>
              <strong>{selection.length} fichier(s)</strong> · {total}
            </span>
            <Button onClick={() => browser.current?.clear()}>Effacer</Button>
          </div>
        ) : (
          <span className="none">
            {data.multiple === false
              ? 'Choisissez un fichier.'
              : 'Cliquez pour cocher, Maj + clic pour une plage, double-clic pour valider.'}
          </span>
        )}
        <span className="spacer" />
        <Button onClick={() => dialog.close()}>Annuler</Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!selection.length}
          onClick={() => dialog.close(selection)}
        >
          {data.confirmLabel ?? 'Sélectionner'}
          {selection.length > 1 && ` (${selection.length})`}
        </Button>
      </footer>
    </div>
  );
}
