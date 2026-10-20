import { ClickAwayListener, Popper } from '@mui/material';
import type { ReactNode } from 'react';

/** Overlay de mat-datepicker : sous l'origine (début), repli au-dessus, conteneur .mat-datepicker-content. */
export function DatePopup({
  anchor,
  open,
  onClose,
  children,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Popper
      className="cdk-overlay-pane"
      open={open && !!anchor}
      anchorEl={anchor}
      placement="bottom-start"
      style={{ zIndex: 1300 }}
      modifiers={[
        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
        { name: 'preventOverflow', options: { padding: 8 } },
      ]}
    >
      <ClickAwayListener
        onClickAway={(e) => {
          if (!(anchor && e.target instanceof Node && anchor.contains(e.target))) onClose();
        }}
      >
        <div
          className="mat-datepicker-content"
          role="dialog"
          aria-label="Calendrier"
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <div className="mat-datepicker-content-container">{children}</div>
        </div>
      </ClickAwayListener>
    </Popper>
  );
}
