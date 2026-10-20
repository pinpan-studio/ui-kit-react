import type { M3Scheme, ThemeMode } from '../types/theme';
import {
  ELEVATION_VARS,
  M3_LEVELS,
  RADIUS_VARS,
  SHAPE_VARS,
  SPACING_VARS,
  STATE_LAYERS,
  TYPE_SYS,
  LAYOUT,
} from './tokens';

/**
 * Variables CSS posées sur <body>, mêmes noms qu'en Angular :
 * rôles `--mat-sys-*`, tokens d'app (`--space-*`, `--radius-*`, `--elevation-*`) et
 * alias dérivés (`--bg`, `--text-*`, `--primary-color`, success/warning/info…) comme dans styles.scss.
 */
export function buildCssVariables(scheme: M3Scheme, mode: ThemeMode): Record<string, string> {
  const dark = mode === 'dark';
  const sys = Object.fromEntries(Object.entries(scheme).map(([k, v]) => [`--mat-sys-${k}`, v]));
  return {
    ...sys,
    ...M3_LEVELS,
    ...SHAPE_VARS,
    ...STATE_LAYERS,
    ...TYPE_SYS,
    ...SPACING_VARS,
    ...RADIUS_VARS,
    ...ELEVATION_VARS[mode],
    '--sidebar-width': `${LAYOUT.sidebarWidth}px`,
    '--header-height': `${LAYOUT.headerHeight}px`,
    // Dérivés M3 (styles.scss .light / .dark)
    '--primary-color': 'var(--mat-sys-primary)',
    '--primary-color-light': `color-mix(in srgb, var(--mat-sys-primary) ${dark ? 14 : 8}%, transparent)`,
    '--tertiary-color': 'var(--mat-sys-tertiary)',
    '--tertiary-color-light': `color-mix(in srgb, var(--mat-sys-tertiary) ${dark ? 14 : 10}%, transparent)`,
    '--error-color': 'var(--mat-sys-error)',
    '--error-color-light': `color-mix(in srgb, var(--mat-sys-error) ${dark ? 16 : 10}%, transparent)`,
    '--error-color-text': dark ? '#f87171' : '#b91c1c',
    // Couleurs hors Material : fixes en :root, seul -text change en sombre (styles.scss l. 615-666)
    '--success-color': '#22c55e',
    '--success-color-light': 'color-mix(in srgb, var(--success-color) 15%, transparent)',
    '--success-color-text': dark ? '#4ade80' : '#15803d',
    '--warning-color': '#eab308',
    '--warning-color-light': 'color-mix(in srgb, var(--warning-color) 15%, transparent)',
    '--warning-color-text': dark ? '#fbbf24' : '#a16207',
    '--info-color': '#3b82f6',
    '--info-color-light': 'color-mix(in srgb, var(--info-color) 15%, transparent)',
    '--purple-color': '#a855f7',
    '--purple-color-light': 'color-mix(in srgb, var(--purple-color) 15%, transparent)',
    '--cyan-color': '#06b6d4',
    '--cyan-color-light': 'color-mix(in srgb, var(--cyan-color) 15%, transparent)',
    // Lot contraste (Angular 013fd19) : texte / icône de ton sur fond -light, contenus des fonds pleins.
    // light-dark() : suit le color-scheme local (aperçus .light dans le mode sombre).
    // Nouveaux jetons : les --*-color / --*-color-light / --*-color-text existants ne changent pas.
    '--tone-success-text': 'light-dark(#166534, #4ade80)',
    '--tone-success-icon': 'light-dark(#15803d, #4ade80)',
    '--tone-warning-text': 'light-dark(#854d0e, #fbbf24)',
    '--tone-warning-icon': 'light-dark(#a16207, #fbbf24)',
    '--tone-info-text': 'light-dark(#1d4ed8, #93c5fd)',
    '--tone-purple-text': 'light-dark(#7e22ce, #d8b4fe)',
    '--tone-cyan-text': 'light-dark(#155e75, #67e8f9)',
    '--tone-cyan-icon': 'light-dark(#0e7490, #67e8f9)',
    '--tone-error-text': 'light-dark(#b91c1c, var(--mat-sys-on-error-container))',
    '--tone-on-success': '#052e16',
    '--tone-on-warning': '#422006',
    '--tone-on-cyan': '#083344',
    '--tone-info-solid': '#2563eb',
    '--tone-purple-solid': '#9333ea',
    '--tone-error-solid': '#dc2626',
    '--bg': 'var(--mat-sys-surface)',
    '--background-default': 'var(--bg)',
    '--border': dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    '--border-color': 'var(--border)',
    '--text-primary': 'var(--mat-sys-on-surface)',
    '--text-secondary': 'var(--mat-sys-on-surface-variant)',
    '--text-muted': `color-mix(in srgb, var(--mat-sys-on-surface-variant) ${dark ? 65 : 70}%, transparent)`,
    '--card-bg': 'var(--mat-sys-surface-container-low)',
    '--hover-bg': 'var(--mat-sys-surface-container-high)',
    '--table-header-bg': 'var(--mat-sys-surface-container)',
  };
}
