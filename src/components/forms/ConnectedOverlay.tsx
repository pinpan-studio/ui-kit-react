import { ClickAwayListener, Popper } from '@mui/material';
import type { ReactNode } from 'react';

/** Équivalent cdkConnectedOverlay : sous l'origine (début), repli au-dessus / alignement fin, décalage 6px, marge viewport 12px. */
export function ConnectedOverlay({
  anchor,
  open,
  onClose,
  width,
  className,
  children,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  width?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Popper
      open={open && !!anchor}
      anchorEl={anchor}
      placement="bottom-start"
      className={`cdk-overlay-pane ${className ?? ''}`}
      style={{ zIndex: 1300, ...(width ? { width, minWidth: width } : {}) }}
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
        { name: 'preventOverflow', options: { padding: 12 } },
      ]}
    >
      <ClickAwayListener
        onClickAway={(e) => {
          if (anchor && e.target instanceof Node && anchor.contains(e.target)) return;
          onClose();
        }}
      >
        <div>{children}</div>
      </ClickAwayListener>
    </Popper>
  );
}
