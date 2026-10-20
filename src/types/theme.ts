export type ThemeMode = 'light' | 'dark';
/** Préférence enregistrée (comme Angular : light | dark | system, défaut light). */
export type ThemeModePreference = ThemeMode | 'system';
/** Rôles de couleur M3 (clés sans le préfixe `--mat-sys-`). */
export type M3Scheme = Record<string, string>;
