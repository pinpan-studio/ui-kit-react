import { createContext, type ReactNode } from 'react';

export interface SnackOptions {
  /** Libellé du bouton d'action (défaut « Fermer »). */
  action?: string;
  duration?: number;
  /** Équivalent panelClass : snackbar-success | snackbar-error | snackbar-info | kit-undo-panel. */
  panelClass?: string;
  vertical?: 'top' | 'bottom';
  horizontal?: 'start' | 'center' | 'end';
  /** Appelé au clic sur l'action (MatSnackBarRef.onAction). */
  onAction?: () => void;
  /** Appelé à la fermeture, quelle qu'en soit la cause (afterDismissed). */
  onClose?: (byAction: boolean) => void;
  /** Contenu personnalisé (openFromComponent) ; reçoit de quoi déclencher l'action. */
  content?: (api: { action: () => void; close: () => void }) => ReactNode;
}

export type SnackFn = (message: string, opts?: SnackOptions) => void;
export const SnackbarContext = createContext<SnackFn | null>(null);
