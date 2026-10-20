import { createContext, useContext, useEffect } from 'react';
import type { ExampleShellHeader } from './nav';

/** Surcharge de l'en-tête de ex-app-shell par la page affichée (titre dynamique, contenu sans marges…). */
export const ExampleShellContext = createContext<((h: Partial<ExampleShellHeader> | null) => void) | null>(null);

/**
 * Équivalent des entrées `[title]`, `crumb`, `flush` passées à <ex-app-shell> par une page Angular :
 * la valeur s'applique tant que la page est montée.
 */
export function useExampleShell(header: Partial<ExampleShellHeader>): void {
  const set = useContext(ExampleShellContext);
  const key = JSON.stringify(header);
  useEffect(() => {
    set?.(JSON.parse(key) as Partial<ExampleShellHeader>);
    return () => set?.(null);
  }, [set, key]);
}
