import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { readStored, writeStored } from '../lib/storage';
import type { ThemeModePreference } from '../types/theme';
import { buildCssVariables } from './cssVariables';
import { createM3Theme } from './createM3Theme';
import { DEFAULT_THEME_PALETTE, getScheme, PALETTE_IDS } from './palettes';
import { MODE_KEY, PALETTE_KEY, ThemeModeContext, type ThemeModeState } from './themeContext';

const PREFS = ['light', 'dark', 'system'] as const;
const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(cb: () => void) {
  const mq = globalThis.matchMedia?.(DARK_QUERY);
  mq?.addEventListener?.('change', cb);
  return () => mq?.removeEventListener?.('change', cb);
}
const systemDark = () => !!globalThis.matchMedia?.(DARK_QUERY).matches;

/**
 * Équivalent du ThemeService Angular : mode clair/sombre/système et palette M3,
 * persistés dans localStorage (`ui-kit-theme`, `ui-kit-palette`), classes `light|dark` et `theme-<id>` sur <body>.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemeModePreference>(() => readStored(MODE_KEY, PREFS, 'light'));
  const [paletteId, setPaletteId] = useState<string>(() => readStored(PALETTE_KEY, PALETTE_IDS, DEFAULT_THEME_PALETTE));
  const isSystemDark = useSyncExternalStore(subscribeSystem, systemDark, () => false);
  const mode = preference === 'system' ? (isSystemDark ? 'dark' : 'light') : preference;

  const setMode = useCallback((pref: ThemeModePreference) => {
    setPreference(pref);
    writeStored(MODE_KEY, pref);
  }, []);
  const setPalette = useCallback((id: string) => {
    if (!PALETTE_IDS.includes(id)) return;
    setPaletteId(id);
    writeStored(PALETTE_KEY, id);
  }, []);
  const toggle = useCallback(() => setMode(mode === 'light' ? 'dark' : 'light'), [mode, setMode]);

  // Synchronisation entre onglets / iframes (comme Angular).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MODE_KEY) setPreference(readStored(MODE_KEY, PREFS, 'light'));
      if (e.key === PALETTE_KEY) setPaletteId(readStored(PALETTE_KEY, PALETTE_IDS, DEFAULT_THEME_PALETTE));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const scheme = useMemo(() => getScheme(paletteId, mode), [paletteId, mode]);
  const theme = useMemo(() => createM3Theme(scheme, mode), [scheme, mode]);

  useLayoutEffect(() => {
    const body = document.body;
    body.classList.remove('light', 'dark', ...[...body.classList].filter((c) => c.startsWith('theme-')));
    body.classList.add(mode, `theme-${paletteId}`);
    body.style.colorScheme = mode;
    for (const [k, v] of Object.entries(buildCssVariables(scheme, mode))) body.style.setProperty(k, v);
  }, [mode, paletteId, scheme]);

  const value = useMemo<ThemeModeState>(
    () => ({ preference, mode, paletteId, toggle, setMode, setPalette }),
    [preference, mode, paletteId, toggle, setMode, setPalette],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
