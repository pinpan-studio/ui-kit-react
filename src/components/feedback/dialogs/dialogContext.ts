import { createContext, type ReactNode } from 'react';

export interface DialogConfig {
  /** Largeur demandée (dialog.open({ width })). */
  width?: string;
  /** Équivalent panelClass : lève le cap global de 402px pour certaines classes. */
  panelClass?: string | string[];
  /** startBackDrop = voile sombre 75 %. */
  backdropClass?: string;
  disableClose?: boolean;
  /** Feuille ancrée en bas (MatBottomSheet). */
  bottomSheet?: boolean;
  /** `false` : aucun élément ne reçoit le focus à l'ouverture (MatDialog autoFocus: false). */
  autoFocus?: boolean;
}

export interface DialogRef<R> {
  close: (result?: R) => void;
}

export type OpenDialog = <R = unknown>(
  render: (ref: DialogRef<R>) => ReactNode,
  config?: DialogConfig,
) => Promise<R | undefined>;

export const DialogContext = createContext<OpenDialog | null>(null);
