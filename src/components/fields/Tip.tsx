import { Tooltip } from '@mui/material';
import { cloneElement, type ReactElement } from 'react';

type Labelled = { 'aria-label'?: string; onClick?: unknown; type?: string };

/**
 * matTooltip : enveloppe inline-flex pour que l'infobulle fonctionne aussi sur un bouton désactivé.
 * Le libellé est porté par le déclencheur (bouton) ou, pour une icône décorative, par l'enveloppe en role="img".
 */
export function Tip({ title, children }: { title: string; children: ReactElement<Labelled> }) {
  const p = children.props;
  const interactive = children.type === 'button' || p.onClick !== undefined || p.type !== undefined;
  const child = interactive && !p['aria-label'] ? cloneElement(children, { 'aria-label': title }) : children;
  return (
    <Tooltip title={title}>
      <span style={{ display: 'inline-flex' }} {...(interactive ? {} : { role: 'img', 'aria-label': title })}>
        {child}
      </span>
    </Tooltip>
  );
}
