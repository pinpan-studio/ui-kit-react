import { useCallback, useRef } from 'react';
import { UndoSnack } from './UndoSnack';
import { useSnackbar } from './useSnackbar';

export interface UndoOptions {
  message: string;
  /** Rétablit l'état précédent (clic sur « Annuler »). */
  undo: () => void;
  /** Exécute réellement l'action une fois le délai écoulé sans annulation. */
  commit?: () => void;
  duration?: number;
  icon?: string;
  actionLabel?: string;
}

let pending: (() => void) | null = null;
/** Valide sans attendre l'action en attente (ex. avant une navigation). */
export function flushUndo() {
  const p = pending;
  pending = null;
  p?.();
}

/** UndoService : action optimiste + snackbar « Annuler » avec compte à rebours, commit à l'expiration. */
export function useUndo() {
  const snack = useSnackbar();
  const snackRef = useRef(snack);
  snackRef.current = snack;
  const run = useCallback((o: UndoOptions) => {
    // Une nouvelle action valide immédiatement la précédente encore en attente.
    flushUndo();
    const duration = o.duration ?? 5000;
    let undone = false;
    const mine = () => {
      if (!undone) o.commit?.();
    };
    pending = mine;
    snackRef.current(o.message, {
      duration,
      panelClass: 'kit-undo-panel',
      horizontal: 'center',
      vertical: 'bottom',
      content: ({ action }) => <UndoSnack o={o} duration={duration} action={action} />,
      onAction: () => {
        undone = true;
        if (pending === mine) pending = null;
        o.undo();
      },
      onClose: () => {
        if (pending === mine) flushUndo();
      },
    });
  }, []);
  return { run, flush: flushUndo };
}
