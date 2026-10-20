import { useContext } from 'react';
import { SnackbarContext, type SnackFn } from './snackbarContext';

/** Équivalent MatSnackBar.open(message, 'Fermer', { duration }). */
export function useSnackbar(): SnackFn {
  return useContext(SnackbarContext) ?? (() => undefined);
}
