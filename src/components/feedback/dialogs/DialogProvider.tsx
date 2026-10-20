import { Dialog, Drawer } from '@mui/material';
import { useCallback, useState, type ReactNode } from 'react';
import { DialogContext, type DialogConfig, type DialogRef, type OpenDialog } from './dialogContext';
import './dialogs.scss';

interface Entry {
  id: number;
  render: (ref: DialogRef<unknown>) => ReactNode;
  config: DialogConfig;
  resolve: (v: unknown) => void;
  open: boolean;
}

let seq = 0;

const TABBABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function focusFirstTabbable(node: HTMLElement) {
  const paper = node.querySelector<HTMLElement>('.mat-mdc-dialog-surface') ?? node;
  const el = [...paper.querySelectorAll<HTMLElement>(TABBABLE)].find((e) => e.getClientRects().length > 0);
  el?.focus();
}

/** Pile de dialogs (MatDialog) et de bottom sheets (MatBottomSheet). */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Entry[]>([]);
  const open = useCallback<OpenDialog>(
    (render, config = {}) =>
      new Promise((resolve) => {
        const e: Entry = {
          id: ++seq,
          render: render as Entry['render'],
          config,
          resolve: resolve as Entry['resolve'],
          open: true,
        };
        setStack((s) => [...s, e]);
      }),
    [],
  );
  const close = (id: number, result?: unknown) => {
    setStack((s) => s.map((e) => (e.id === id && e.open ? (e.resolve(result), { ...e, open: false }) : e)));
    setTimeout(() => setStack((s) => s.filter((e) => e.id !== id)), 300);
  };
  return (
    <DialogContext.Provider value={open}>
      {children}
      {stack.map((e) => {
        const ref: DialogRef<unknown> = { close: (r) => close(e.id, r) };
        const panel = [e.config.panelClass ?? []].flat().join(' ');
        const onClose = () => !e.config.disableClose && close(e.id);
        if (e.config.bottomSheet) {
          return (
            <Drawer
              key={e.id}
              anchor="bottom"
              open={e.open}
              onClose={onClose}
              PaperProps={{ className: `kit-bottom-sheet-paper ${panel}` }}
            >
              {e.render(ref)}
            </Drawer>
          );
        }
        return (
          <Dialog
            key={e.id}
            open={e.open}
            onClose={onClose}
            maxWidth={false}
            disableAutoFocus={e.config.autoFocus === false}
            className={`kit-dialog ${panel}`}
            slotProps={{
              backdrop: { className: e.config.backdropClass ?? '' },
              // MatDialog autoFocus « first-tabbable » : premier élément focalisable du contenu.
              transition: {
                onEntered: (node: HTMLElement) => e.config.autoFocus !== false && focusFirstTabbable(node),
              },
            }}
            PaperProps={{
              className: 'mat-mdc-dialog-surface',
              style: e.config.width ? { width: e.config.width } : undefined,
            }}
          >
            {e.render(ref)}
          </Dialog>
        );
      })}
    </DialogContext.Provider>
  );
}
