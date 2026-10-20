import { ClickAwayListener, Popper, type PopperPlacementType } from '@mui/material';
import { cloneElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

const PLACEMENT: Record<string, PopperPlacementType> = {
  bottom: 'bottom',
  top: 'top',
  right: 'right',
  left: 'left',
  'bottom-start': 'bottom-start',
};

interface TriggerProps {
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  ref?: React.Ref<HTMLElement>;
}

/** Popover riche (appPopover) : survol ou clic, délais, reste ouvert au survol de la carte, Échap / clic extérieur. */
export function Popover({
  children,
  content,
  trigger = 'hover',
  position = 'bottom',
  openDelay = 250,
  closeDelay = 150,
}: {
  children: ReactElement<TriggerProps>;
  content: (close: () => void) => ReactNode;
  trigger?: 'hover' | 'click';
  position?: keyof typeof PLACEMENT;
  openDelay?: number;
  closeDelay?: number;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const schedule = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const close = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);

  const hoverIn = () => trigger === 'hover' && schedule(() => setOpen(true), openDelay);
  const hoverOut = () => trigger === 'hover' && schedule(() => setOpen(false), closeDelay);
  const p = children.props;
  const child = cloneElement(children, {
    ref: setAnchor,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    onMouseEnter: (e: React.MouseEvent) => (p.onMouseEnter?.(e), hoverIn()),
    onMouseLeave: (e: React.MouseEvent) => (p.onMouseLeave?.(e), hoverOut()),
    onFocus: (e: React.FocusEvent) => (p.onFocus?.(e), hoverIn()),
    onBlur: (e: React.FocusEvent) => (p.onBlur?.(e), hoverOut()),
    onClick: (e: React.MouseEvent) => {
      p.onClick?.(e);
      if (trigger !== 'click') return;
      e.stopPropagation();
      setOpen((o) => !o);
    },
  } as TriggerProps);

  return (
    <>
      {child}
      <Popper
        open={open && !!anchor}
        anchorEl={anchor}
        placement={PLACEMENT[position]}
        className="kit-popover-pane"
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'preventOverflow', options: { padding: 8 } },
        ]}
      >
        <ClickAwayListener onClickAway={(e) => !anchor?.contains(e.target as Node) && close()}>
          <div onMouseEnter={() => trigger === 'hover' && clearTimeout(timer.current)} onMouseLeave={hoverOut}>
            {content(close)}
          </div>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
