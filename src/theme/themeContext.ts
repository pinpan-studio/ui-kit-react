import { createContext } from 'react';
import type { ThemeMode, ThemeModePreference } from '../types/theme';
import type { CustomThemeConfig } from './customTheme';
import type { ThemeSwatch } from './paletteMeta';

export const MODE_KEY = 'ui-kit-theme';
export const PALETTE_KEY = 'ui-kit-palette';
export const CUSTOM_KEY = 'ui-kit-custom-theme';
export const SOURCE_KEY = 'ui-kit-theme-source';

export interface ThemeModeState {
  preference: ThemeModePreference;
  mode: ThemeMode;
  paletteId: string;
  toggle: () => void;
  setMode: (pref: ThemeModePreference) => void;
  setPalette: (id: string) => void;
  /** Dernier thème personnalisé (conservé même quand une palette prédéfinie est active). */
  custom: CustomThemeConfig | null;
  isCustom: boolean;
  /** Libellé du thème de couleur courant (« Personnalisé » ou nom de la palette). */
  label: string;
  customSwatch: { light: ThemeSwatch; dark: ThemeSwatch } | null;
  /** Enregistre et active un thème personnalisé. */
  applyCustom: (cfg: CustomThemeConfig) => void;
  /** Réactive le dernier thème personnalisé enregistré (`useCustom()` côté Angular ; renommé pour ne pas passer pour un hook). */
  activateCustom: () => void;
}

export const ThemeModeContext = createContext<ThemeModeState | null>(null);
