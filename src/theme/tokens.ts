// Tokens exportés depuis le ui-kit Angular (fix/examples-responsive, c0789b6).
import tokens from './angular-design-tokens.json';
import palettes from './palettes.generated.json';
import type { M3Scheme, ThemeMode } from '../types/theme';

type ValueMap = Record<string, { value: string; resolved: string }>;

const resolved = (m: ValueMap): Record<string, string> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.resolved]));

/** Espacements et rayons applicatifs (`--space-*`, `--radius-*`, alias historiques). */
export const SPACING_VARS = resolved(tokens.spacing as ValueMap);
export const RADIUS_VARS = resolved(tokens.radius as ValueMap);
/** Élévations applicatives `--elevation-0..5` (plus marquées en sombre). */
export const ELEVATION_VARS: Record<ThemeMode, Record<string, string>> = {
  light: tokens.elevation.light,
  dark: tokens.elevation.dark,
};
/** Élévations M3 `--mat-sys-level0..5` (identiques en clair et sombre). */
export const M3_LEVELS: Record<string, string> = tokens.elevation['mat-sys'];
export const SHAPE_VARS: Record<string, string> = tokens.shape;
export const STATE_LAYERS: Record<string, string> = tokens.stateLayers;
export const TYPE_SYS: Record<string, string> = tokens.typography.sys;

export const FONTS = {
  body: tokens.typography.fonts.body,
  headings: tokens.typography.fonts.headings,
  mono: tokens.typography.fonts.mono,
};

export const LAYOUT = { sidebarWidth: 272, headerHeight: 68, mobileMaxWidth: 959.98 } as const;

/** Rôles M3 calculés par Angular pour chaque palette `theme-<id>` (voir scripts/extract-angular-palettes.mjs). */
export const SCHEMES = palettes as Record<string, Record<ThemeMode, M3Scheme>>;

export const stateOpacity = (state: 'hover' | 'focus' | 'pressed' | 'dragged'): number =>
  Number(STATE_LAYERS[`--mat-sys-${state}-state-layer-opacity`] ?? 0.08);
