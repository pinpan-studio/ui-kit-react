import { Tooltip } from '@mui/material';
import type { ReactElement } from 'react';

/** matTooltip : enveloppe inline-flex pour que l'infobulle fonctionne aussi sur un bouton désactivé. */
export function Tip({ title, children }: { title: string; children: ReactElement }) {
  return (
    <Tooltip title={title}>
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  );
}
