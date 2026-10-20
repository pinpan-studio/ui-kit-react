// Porté depuis ui-kit Angular (harnais/components/widgets/modal-dialog.component.ts).
import { Button, DialogActions, DialogContent, IconButton } from '@mui/material';
import type { DialogRef } from '../../../components/feedback/dialogs/dialogContext';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import type { HarnaisWidget } from '../../../data/static/harnais.data';
import { HzWidget } from './HzWidget';
import './modal-dialog.scss';

export interface HzModalData {
  title: string;
  subtitle?: string;
  icon?: string;
  blocks: HarnaisWidget[];
}

/** Modale de détail ouverte depuis une réponse : peut contenir n'importe quels widgets. */
export function HzModalDialog({ data, dialog }: { data: HzModalData; dialog: DialogRef<undefined> }) {
  return (
    <div className="hz-modal">
      <header className="head">
        <span className="icon">
          <MaterialIcon name={data.icon ?? 'open_in_full'} />
        </span>
        <div className="text">
          <h2>{data.title}</h2>
          {data.subtitle && <span>{data.subtitle}</span>}
        </div>
        <IconButton aria-label="Fermer" onClick={() => dialog.close()}>
          <MaterialIcon name="close" />
        </IconButton>
      </header>
      <DialogContent className="body">
        {data.blocks.map((b, i) => (
          <HzWidget key={i} block={b} />
        ))}
      </DialogContent>
      <DialogActions className="actions">
        <Button onClick={() => dialog.close()}>Fermer</Button>
      </DialogActions>
    </div>
  );
}
