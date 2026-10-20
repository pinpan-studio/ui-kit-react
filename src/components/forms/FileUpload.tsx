import { CircularProgress, Fab, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './file-upload.scss';

/** Fichier « local » sélectionné : aucune donnée n'est envoyée, l'aperçu utilise un blob URL. */
export interface LocalFile {
  _id: string;
  nom: string;
  taille: number;
  type?: string;
  url: string;
}

const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/** app-file-upload (modes « champ » et « photo ») : lecture locale, aucun envoi réseau. */
export function FileUpload({
  fichier: initial = null,
  disabled,
  mode,
  accept,
  placeholder,
  onUpload,
}: {
  fichier?: LocalFile | null;
  disabled?: boolean;
  mode?: 'photo';
  accept?: string;
  placeholder?: string;
  onUpload?: (f: LocalFile | null) => void;
}) {
  const [fichier, setFichier] = useState<LocalFile | null>(initial);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const cur = useRef(fichier);
  cur.current = fichier;
  useEffect(
    () => () => {
      if (cur.current?.url.startsWith('blob:')) URL.revokeObjectURL(cur.current.url);
    },
    [],
  );

  const selectFile = () => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      setTimeout(() => {
        const local: LocalFile = {
          _id: 'local-' + Date.now(),
          nom: file.name,
          taille: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        };
        setFichier(local);
        setBusy(false);
        onUpload?.(local);
      }, 600);
    });
    input.click();
  };
  const remove = () => {
    setMenu(null);
    if (fichier?.url.startsWith('blob:')) URL.revokeObjectURL(fichier.url);
    setFichier(null);
    onUpload?.(null);
  };

  if (mode === 'photo')
    return (
      <div className="app-file-upload">
        <div className="photo-upload">
          {fichier?._id || fichier?.url ? (
            <div className="photo-frame">
              <img src={fichier.url} alt="" />
              <Tooltip title="Supprimer">
                <span className="photo-delete">
                  <Fab size="small" color="error" disabled={disabled} onClick={remove}>
                    <MaterialIcon name="delete" />
                  </Fab>
                </span>
              </Tooltip>
            </div>
          ) : (
            <button
              type="button"
              className={`photo-frame empty${disabled ? ' is-disabled' : ''}`}
              disabled={disabled}
              onClick={selectFile}
            >
              {busy ? <CircularProgress size={24} /> : <MaterialIcon name="add_a_photo" />}
              <span>{placeholder || 'Photo'}</span>
            </button>
          )}
        </div>
      </div>
    );

  return (
    <div className="app-file-upload">
      <div className="form-field">
        <div
          className={`field-box upload-box${disabled ? ' is-disabled' : ''}${fichier?._id ? ' has-file' : ''}`}
          onClick={() => !fichier?._id && selectFile()}
        >
          {busy ? <CircularProgress size={20} /> : <MaterialIcon name={fichier?._id ? 'description' : 'attach_file'} />}
          {fichier?._id ? (
            <>
              <span className="file-name" title={fichier.nom}>
                {fichier.nom}
              </span>
              <span className="file-size">{fmt.format(fichier.taille / 1_000_000)} Mo</span>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(e.currentTarget);
                }}
                aria-label="Actions du fichier"
              >
                <MaterialIcon name="more_vert" />
              </IconButton>
              <Menu
                anchorEl={menu}
                open={!!menu}
                onClose={() => setMenu(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
              >
                <MenuItem
                  className="mat-mdc-menu-item"
                  onClick={() => {
                    setMenu(null);
                    if (fichier.url) window.open(fichier.url, '_blank');
                  }}
                >
                  <MaterialIcon name="download" /> Télécharger
                </MenuItem>
                <MenuItem className="mat-mdc-menu-item" disabled={disabled} onClick={remove}>
                  <MaterialIcon name="backspace" /> Supprimer
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <span className="file-placeholder">{placeholder || 'Choisir un fichier…'}</span>
              <span className="browse">Parcourir</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
