import { Button, Snackbar } from '@mui/material';
import { useCallback, useState, type ReactNode } from 'react';
import { SnackbarContext, type SnackFn } from './snackbarContext';

interface Snack {
  key: number;
  message: string;
  action: string;
  duration: number;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null);
  const open = useCallback<SnackFn>((message, opts) => {
    setSnack({ key: Date.now(), message, action: opts?.action ?? 'Fermer', duration: opts?.duration ?? 2000 });
  }, []);
  const close = () => setSnack(null);
  return (
    <SnackbarContext.Provider value={open}>
      {children}
      <Snackbar
        key={snack?.key}
        open={!!snack}
        message={snack?.message}
        autoHideDuration={snack?.duration}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button color="inherit" size="small" onClick={close} sx={{ color: 'var(--mat-sys-inverse-primary)' }}>
            {snack?.action}
          </Button>
        }
        slotProps={{
          content: {
            sx: {
              bgcolor: 'var(--mat-sys-inverse-surface)',
              color: 'var(--mat-sys-inverse-on-surface)',
              borderRadius: '4px',
            },
          },
        }}
      />
    </SnackbarContext.Provider>
  );
}
