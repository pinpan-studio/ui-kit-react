import { CircularProgress, Fab, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './photo-upload.scss';

/** app-file-upload mode="photo" : vignette ronde 160 px, sélection locale (aucun envoi). */
export function PhotoUpload({
  placeholder = 'Photo',
  accept = 'image/*',
  disabled,
  onUpload,
}: {
  placeholder?: string;
  accept?: string;
  disabled?: boolean;
  onUpload?: (f: File | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const select = () => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      setTimeout(() => {
        setUrl(URL.createObjectURL(file));
        setBusy(false);
        onUpload?.(file);
      }, 300);
    };
    input.click();
  };
  return (
    <div className="photo-upload">
      {url ? (
        <div className="photo-frame">
          <img src={url} alt="" />
          <Tooltip title="Supprimer">
            <Fab
              size="small"
              color="error"
              className="photo-delete"
              disabled={disabled}
              onClick={() => {
                setUrl(null);
                onUpload?.(null);
              }}
              aria-label="Supprimer"
            >
              <MaterialIcon name="delete" />
            </Fab>
          </Tooltip>
        </div>
      ) : (
        <button
          type="button"
          className={`photo-frame empty${disabled ? ' is-disabled' : ''}`}
          disabled={disabled}
          onClick={select}
        >
          {busy ? <CircularProgress size={24} /> : <MaterialIcon name="add_a_photo" />}
          <span>{placeholder}</span>
        </button>
      )}
    </div>
  );
}
