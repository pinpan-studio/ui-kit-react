import { Button, Snackbar, SnackbarContent } from '@mui/material';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { SnackbarContext, type SnackFn, type SnackOptions } from './snackbarContext';
import './snackbar.scss';

interface Snack extends SnackOptions {
  key: number;
  message: string;
}

const H = { start: 'left', center: 'center', end: 'right' } as const;

/** Équivalent MatSnackBar : un seul snackbar à la fois, le suivant remplace le précédent. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null);
  const current = useRef<Snack | null>(null);
  const finish = useCallback((byAction: boolean) => {
    const s = current.current;
    if (!s) return;
    current.current = null;
    setSnack(null);
    if (byAction) s.onAction?.();
    s.onClose?.(byAction);
  }, []);
  const open = useCallback<SnackFn>(
    (message, opts) => {
      finish(false);
      const s: Snack = { key: Date.now() + Math.random(), message, duration: 2000, ...opts };
      current.current = s;
      setSnack(s);
    },
    [finish],
  );
  const action = () => finish(true);
  const close = () => finish(false);
  return (
    <SnackbarContext.Provider value={open}>
      {children}
      <Snackbar
        key={snack?.key}
        open={!!snack}
        autoHideDuration={snack?.duration}
        onClose={(_, reason) => reason !== 'clickaway' && close()}
        anchorOrigin={{ vertical: snack?.vertical ?? 'bottom', horizontal: H[snack?.horizontal ?? 'center'] }}
        className={`kit-snackbar ${snack?.panelClass ?? ''}`}
      >
        <SnackbarContent
          className="kit-snackbar-surface"
          message={snack?.content ? snack.content({ action, close }) : snack?.message}
          action={
            snack?.content ? undefined : (
              <Button color="inherit" onClick={action} className="kit-snackbar-action">
                {snack?.action ?? 'Fermer'}
              </Button>
            )
          }
        />
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
