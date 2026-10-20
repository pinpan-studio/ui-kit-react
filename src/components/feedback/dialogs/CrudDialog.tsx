import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { useState } from 'react';
import { BoxSelect } from '../../fields/BoxSelect';
import { MaterialIcon } from '../../ui/MaterialIcon';
import type { DialogRef } from './dialogContext';

export interface CrudDialogField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export interface CrudDialogConfig {
  title: string;
  subtitle?: string;
  fields: CrudDialogField[];
  data?: Record<string, unknown>;
  mode: 'create' | 'edit' | 'view';
  saveLabel?: string;
  cancelLabel?: string;
}

type Value = string | string[] | boolean | number;

const FIELD_ICON: Record<string, string> = {
  email: 'alternate_email',
  number: 'tag',
  date: 'event',
  select: 'list',
  multiselect: 'checklist',
};
const MODE_ICON = {
  create: ['add_circle', 'var(--primary-color)'],
  edit: ['edit', 'var(--warning-color)'],
  view: ['visibility', 'var(--text-secondary)'],
} as const;

/** CrudDialogComponent : formulaire générique piloté par une liste de champs. */
export function CrudDialog({ config, dialog }: { config: CrudDialogConfig; dialog: DialogRef<Record<string, Value>> }) {
  const [values, setValues] = useState<Record<string, Value>>(() =>
    Object.fromEntries(
      config.fields.map((f) => {
        const raw = config.data?.[f.key];
        const v = raw ?? (f.type === 'multiselect' ? [] : f.type === 'checkbox' ? false : '');
        return [f.key, f.type === 'date' && v ? new Date(String(v)).toISOString().slice(0, 10) : (v as Value)];
      }),
    ),
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const view = config.mode === 'view';
  const missing = (f: CrudDialogField) => {
    const v = values[f.key];
    return !!f.required && (v === '' || v === false || (Array.isArray(v) && !v.length));
  };
  const invalid = config.fields.some(missing);
  const set = (k: string, v: Value) => setValues((s) => ({ ...s, [k]: v }));
  const touch = (k: string) => setTouched((t) => new Set(t).add(k));
  const save = () => {
    if (invalid) return;
    const out = { ...values };
    for (const f of config.fields) if (f.type === 'number' && out[f.key] !== '') out[f.key] = Number(out[f.key]);
    dialog.close(out);
  };
  const [icon, color] = MODE_ICON[config.mode];
  return (
    <div className="kit-crud-dialog">
      <h2 className="mat-mdc-dialog-title crud-title">
        <MaterialIcon name={icon} style={{ verticalAlign: 'middle', marginRight: 8, color }} />
        {config.title}
      </h2>
      {config.subtitle && (
        <div
          className="mat-mdc-dialog-content"
          style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}
        >
          {config.subtitle}
        </div>
      )}
      <div className="mat-mdc-dialog-content">
        <form className="form-grid" style={{ paddingTop: 4 }} onSubmit={(e) => (e.preventDefault(), save())}>
          {config.fields.map((f) => {
            const dis = view || f.disabled;
            const v = values[f.key];
            const span = f.fullWidth || f.type === 'textarea' || f.type === 'checkbox';
            return (
              <div key={f.key} className={`form-field${span ? ' span-2' : ''}`}>
                <label className="field-label" htmlFor={`crud-${f.key}`}>
                  {f.label}
                </label>
                {(f.type === 'text' || f.type === 'email' || f.type === 'number' || f.type === 'date') && (
                  <div className={`field-box${dis ? ' is-disabled' : ''}`}>
                    <MaterialIcon name={f.icon ?? FIELD_ICON[f.type] ?? 'edit'} />
                    <input
                      id={`crud-${f.key}`}
                      type={f.type}
                      value={String(v ?? '')}
                      disabled={dis}
                      placeholder={f.placeholder ?? (f.type === 'date' ? 'JJ/MM/AAAA' : '')}
                      onChange={(e) => set(f.key, e.target.value)}
                      onBlur={() => touch(f.key)}
                    />
                  </div>
                )}
                {(f.type === 'select' || f.type === 'multiselect') && (
                  <div className={`field-box select-box${dis ? ' is-disabled' : ''}`}>
                    <MaterialIcon name={f.icon ?? FIELD_ICON[f.type] ?? 'list'} />
                    <BoxSelect
                      ariaLabel={f.label}
                      value={f.type === 'multiselect' ? ((v as string[]) ?? []) : String(v ?? '')}
                      multiple={f.type === 'multiselect'}
                      disabled={dis}
                      options={f.options ?? []}
                      onChange={(x) => set(f.key, x)}
                    />
                  </div>
                )}
                {f.type === 'textarea' && (
                  <div className={`field-box textarea-box${dis ? ' is-disabled' : ''}`}>
                    <textarea
                      id={`crud-${f.key}`}
                      rows={3}
                      value={String(v ?? '')}
                      disabled={dis}
                      placeholder={f.placeholder ?? ''}
                      onChange={(e) => set(f.key, e.target.value)}
                      onBlur={() => touch(f.key)}
                    />
                  </div>
                )}
                {f.type === 'checkbox' && (
                  <FormControlLabel
                    style={{ marginTop: 8 }}
                    control={<Checkbox checked={!!v} disabled={dis} onChange={(e) => set(f.key, e.target.checked)} />}
                    label={f.placeholder}
                  />
                )}
                {missing(f) && touched.has(f.key) && <span className="field-error">{f.label} est requis</span>}
              </div>
            );
          })}
        </form>
      </div>
      <div className="mat-mdc-dialog-actions">
        <Button onClick={() => dialog.close()}>{config.cancelLabel ?? 'Annuler'}</Button>
        {!view && (
          <Button
            variant="contained"
            className="kit-raised primary"
            startIcon={<MaterialIcon name="save" />}
            disabled={invalid}
            onClick={save}
          >
            {config.saveLabel ?? 'Enregistrer'}
          </Button>
        )}
      </div>
    </div>
  );
}
