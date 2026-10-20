import { useContext, useEffect, useRef } from 'react';
import { InteractionContext } from './interactionContext';
import type { InteractionApi, PaletteCommand, Shortcut } from './types';

export function useInteractions(): InteractionApi {
  const ctx = useContext(InteractionContext);
  if (!ctx) throw new Error('useInteractions doit être utilisé dans <InteractionProvider>');
  return ctx;
}

/** Enregistre des commandes de palette pendant la vie du composant (équivalent `register` + DestroyRef). */
export function usePaletteCommands(factory: () => PaletteCommand[], opts?: { prepend?: boolean }): void {
  const { registerCommands } = useInteractions();
  const f = useRef(factory);
  f.current = factory;
  const prepend = !!opts?.prepend;
  useEffect(() => registerCommands(f.current(), { prepend }), [registerCommands, prepend]);
}

/** Enregistre des raccourcis pendant la vie du composant (équivalent `registerFor`). */
export function useShortcuts(factory: () => Shortcut[]): void {
  const { registerShortcuts } = useInteractions();
  const f = useRef(factory);
  f.current = factory;
  useEffect(() => registerShortcuts(f.current()), [registerShortcuts]);
}
