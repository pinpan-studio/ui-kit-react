import { createContext } from 'react';
import type { ThemeMode, ThemeModePreference } from '../types/theme';

export const MODE_KEY = 'ui-kit-theme';
export const PALETTE_KEY = 'ui-kit-palette';

export interface ThemeModeState {
  preference: ThemeModePreference;
  mode: ThemeMode;
  paletteId: string;
  toggle: () => void;
  setMode: (pref: ThemeModePreference) => void;
  setPalette: (id: string) => void;
}

export const ThemeModeContext = createContext<ThemeModeState | null>(null);
