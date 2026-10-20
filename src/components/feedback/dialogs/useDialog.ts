import { useContext } from 'react';
import { DialogContext, type OpenDialog } from './dialogContext';

/** Équivalent MatDialog.open / MatBottomSheet.open : renvoie une promesse du résultat (afterClosed). */
export function useDialog(): OpenDialog {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog() doit être utilisé sous <DialogProvider>');
  return ctx;
}
