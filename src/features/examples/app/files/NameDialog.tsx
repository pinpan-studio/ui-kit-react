import { Button } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { DialogRef, OpenDialog } from '../../../../components/feedback/dialogs/dialogContext';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';

interface NameData {
  title: string;
  label: string;
  value: string;
  confirm: string;
  icon: string;
}

/** Demande un nom (nouveau dossier, renommage) ; résout le nom saisi ou `undefined`. */
export function askName(open: OpenDialog, data: NameData): Promise<string | undefined> {
  return open<string>((ref) => <NameDialog data={data} dialog={ref} />, { width: '420px' });
}

/** Saisie d'un nom sur une ligne : nom présélectionné hors extension, Entrée pour valider. */
// eslint-disable-next-line react-refresh/only-export-components -- composant privé de askName
function NameDialog({ data, dialog }: { data: NameData; dialog: DialogRef<string> }) {
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(data.value);

  useEffect(() => {
    const t = setTimeout(() => {
      const el = field.current;
      if (!el) return;
      el.focus();
      const dot = el.value.lastIndexOf('.');
      el.setSelectionRange(0, dot > 0 ? dot : el.value.length);
    });
    return () => clearTimeout(t);
  }, []);

  const ok = () => {
    if (value.trim()) dialog.close(value.trim());
  };

  return (
    <>
      <h2 className="mat-mdc-dialog-title ex-name-title">{data.title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ok();
        }}
      >
        <div className="mat-mdc-dialog-content">
          <div className="form-field">
            <label className="field-label" htmlFor="ex-name">
              {data.label}
            </label>
            <div className="field-box">
              <MaterialIcon name={data.icon} />
              <input
                ref={field}
                id="ex-name"
                name="name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
        <div className="mat-mdc-dialog-actions">
          <Button type="button" onClick={() => dialog.close()}>
            Annuler
          </Button>
          <Button variant="contained" disableElevation type="submit" disabled={!value.trim()}>
            {data.confirm}
          </Button>
        </div>
      </form>
    </>
  );
}
