import { Button } from '@mui/material';
import { MaterialIcon } from '../../ui/MaterialIcon';
import type { DialogRef } from './dialogContext';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
}

const ICON_COLOR = { danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' } as const;

/** ConfirmDialogComponent : titre + icône de type, message, Annuler / Confirmer. */
export function ConfirmDialog({ data, dialog }: { data: ConfirmDialogData; dialog: DialogRef<boolean> }) {
  const type = data.type ?? 'info';
  const icon = data.icon ?? (type === 'danger' ? 'warning' : type === 'warning' ? 'help_outline' : 'info_outline');
  return (
    <>
      <h2 className="mat-mdc-dialog-title">
        <MaterialIcon name={icon} style={{ verticalAlign: 'middle', marginRight: 8, color: ICON_COLOR[type] }} />
        {data.title}
      </h2>
      <div className="mat-mdc-dialog-content">
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{data.message}</p>
      </div>
      <div className="mat-mdc-dialog-actions">
        <Button onClick={() => dialog.close(false)}>{data.cancelLabel ?? 'Annuler'}</Button>
        <Button className="kit-raised" onClick={() => dialog.close(true)}>
          {data.confirmLabel ?? 'Confirmer'}
        </Button>
      </div>
    </>
  );
}
