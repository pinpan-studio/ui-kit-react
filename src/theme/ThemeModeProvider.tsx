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
import { normalizeConfig, schemeColors, type CustomThemeConfig } from './customTheme';
import { DEFAULT_THEME_PALETTE, getScheme, PALETTE_IDS, THEME_PALETTES } from './palettes';
import { CUSTOM_KEY, MODE_KEY, PALETTE_KEY, SOURCE_KEY, ThemeModeContext, type ThemeModeState } from './themeContext';

const PREFS = ['light', 'dark', 'system'] as const;
const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(cb: () => void) {
  const mq = globalThis.matchMedia?.(DARK_QUERY);
  mq?.addEventListener?.('change', cb);
  return () => mq?.removeEventListener?.('change', cb);
}
const systemDark = () => !!globalThis.matchMedia?.(DARK_QUERY).matches;
const SOURCES = ['preset', 'custom'] as const;
type Source = (typeof SOURCES)[number];
const FALLBACK_SEED = THEME_PALETTES[0]?.seed ?? '#006a6a';

function readCustom(): CustomThemeConfig | null {
  try {
    const raw = globalThis.localStorage?.getItem(CUSTOM_KEY);
    return raw ? normalizeConfig(JSON.parse(raw) as Partial<CustomThemeConfig>, FALLBACK_SEED) : null;
  } catch {
    return null;
  }
}

/**
 * Équivalent du ThemeService Angular : mode clair/sombre/système et palette M3,
 * persistés dans localStorage (`ui-kit-theme`, `ui-kit-palette`), classes `light|dark` et `theme-<id>` sur <body>.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemeModePreference>(() => readStored(MODE_KEY, PREFS, 'light'));
  const [paletteId, setPaletteId] = useState<string>(() => readStored(PALETTE_KEY, PALETTE_IDS, DEFAULT_THEME_PALETTE));
  const [custom, setCustom] = useState<CustomThemeConfig | null>(readCustom);
  const [source, setSourceS] = useState<Source>(() =>
    readCustom() ? readStored(SOURCE_KEY, SOURCES, 'preset') : 'preset',
  );
  const setSource = useCallback((s: Source) => {
    setSourceS(s);
    writeStored(SOURCE_KEY, s);
  }, []);
  const isCustom = source === 'custom' && !!custom;
  const isSystemDark = useSyncExternalStore(subscribeSystem, systemDark, () => false);
  const mode = preference === 'system' ? (isSystemDark ? 'dark' : 'light') : preference;

  const setMode = useCallback((pref: ThemeModePreference) => {
    setPreference(pref);
    writeStored(MODE_KEY, pref);
  }, []);
  const setPalette = useCallback(
    (id: string) => {
      if (!PALETTE_IDS.includes(id)) return;
      setPaletteId(id);
      writeStored(PALETTE_KEY, id);
      setSource('preset');
    },
    [setSource],
  );
  const palette = THEME_PALETTES.find((p) => p.id === paletteId) ?? THEME_PALETTES[0];
  const seed = palette?.seed ?? FALLBACK_SEED;
  const applyCustom = useCallback(
    (cfg: CustomThemeConfig) => {
      const c = normalizeConfig(cfg, seed);
      setCustom(c);
      writeStored(CUSTOM_KEY, JSON.stringify(c));
      setSource('custom');
    },
    [seed, setSource],
  );
  const activateCustom = useCallback(() => {
    if (custom) setSource('custom');
  }, [custom, setSource]);
  const customSwatch = useMemo(() => {
    if (!custom) return null;
    const sw = (dark: boolean) => {
      const c = schemeColors(custom, dark);
      return {
        primary: c['primary'] ?? '',
        secondary: c['secondary'] ?? '',
        tertiary: c['tertiary'] ?? '',
        container: c['primary-container'] ?? '',
      };
    };
    return { light: sw(false), dark: sw(true) };
  }, [custom]);
  const toggle = useCallback(() => setMode(mode === 'light' ? 'dark' : 'light'), [mode, setMode]);

  // Synchronisation entre onglets / iframes (comme Angular).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MODE_KEY) setPreference(readStored(MODE_KEY, PREFS, 'light'));
      if (e.key === PALETTE_KEY) setPaletteId(readStored(PALETTE_KEY, PALETTE_IDS, DEFAULT_THEME_PALETTE));
      if (e.key === CUSTOM_KEY) setCustom(readCustom());
      if (e.key === SOURCE_KEY) setSourceS(readCustom() ? readStored(SOURCE_KEY, SOURCES, 'preset') : 'preset');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const scheme = useMemo(
    () => (isCustom && custom ? schemeColors(custom, mode === 'dark') : getScheme(paletteId, mode)),
    [isCustom, custom, paletteId, mode],
  );
  const themeClass = isCustom ? 'theme-custom' : `theme-${paletteId}`;
  const theme = useMemo(() => createM3Theme(scheme, mode), [scheme, mode]);

  useLayoutEffect(() => {
    const body = document.body;
    body.classList.remove('light', 'dark', ...[...body.classList].filter((c) => c.startsWith('theme-')));
    body.classList.add(mode, themeClass);
    body.style.colorScheme = mode;
    for (const [k, v] of Object.entries(buildCssVariables(scheme, mode))) body.style.setProperty(k, v);
  }, [mode, themeClass, scheme]);

  const value = useMemo<ThemeModeState>(
    () => ({
      preference,
      mode,
      paletteId,
      toggle,
      setMode,
      setPalette,
      custom,
      isCustom,
      label: isCustom ? 'Personnalisé' : (palette?.label ?? ''),
      customSwatch,
      applyCustom,
      activateCustom,
    }),
    [
      preference,
      mode,
      paletteId,
      toggle,
      setMode,
      setPalette,
      custom,
      isCustom,
      palette,
      customSwatch,
      applyCustom,
      activateCustom,
    ],
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
