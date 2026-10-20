import { DEFAULT_THEME_PALETTE, THEME_PALETTES, type ThemePalette } from './paletteMeta';
import { SCHEMES } from './tokens';
import type { M3Scheme, ThemeMode } from '../types/theme';

export { DEFAULT_THEME_PALETTE, THEME_PALETTES };
export type { ThemePalette };

export const PALETTE_IDS: readonly string[] = THEME_PALETTES.filter((p) => SCHEMES[p.id]).map((p) => p.id);

export function getScheme(paletteId: string, mode: ThemeMode): M3Scheme {
  const fallback = SCHEMES[DEFAULT_THEME_PALETTE];
  const scheme = SCHEMES[paletteId] ?? fallback;
  if (!scheme) throw new Error('Palette par défaut introuvable');
  return scheme[mode];
}
