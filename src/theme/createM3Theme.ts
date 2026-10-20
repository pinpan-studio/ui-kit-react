import { alpha, createTheme, type Shadows, type Theme } from '@mui/material/styles';
import type { M3Scheme, ThemeMode } from '../types/theme';
import { FONTS, M3_LEVELS, stateOpacity, TYPE_SYS } from './tokens';

declare module '@mui/material/styles' {
  interface Theme {
    /** Rôles de couleur Material 3 bruts (clés sans `--mat-sys-`). */
    m3: M3Scheme;
  }
  interface ThemeOptions {
    m3?: M3Scheme;
  }
}

const role = (s: M3Scheme, key: string): string => {
  const v = s[key];
  if (!v) throw new Error(`Rôle M3 manquant : ${key}`);
  return v;
};

/** Échelle typographique M3 lue dans l'export Angular (`--mat-sys-<style>-*`). */
function typeStyle(name: string) {
  const g = (p: string) => TYPE_SYS[`--mat-sys-${name}-${p}`];
  const isHeading = /^(display|headline)/.test(name);
  return {
    fontFamily: isHeading ? FONTS.headings : FONTS.body,
    fontSize: g('size'),
    lineHeight: g('line-height'),
    fontWeight: Number(g('weight') ?? 400),
    letterSpacing: g('tracking'),
  };
}

const level = (n: number) => M3_LEVELS[`--mat-sys-level${n}`] ?? 'none';

/** Ombres MUI 0..24 projetées sur les 6 niveaux M3. */
function m3Shadows(): Shadows {
  const map = [0, 1, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5];
  return Array.from({ length: 25 }, (_, i) => (i === 0 ? 'none' : level(map[i] ?? 5))) as Shadows;
}

export function createM3Theme(scheme: M3Scheme, mode: ThemeMode): Theme {
  const r = (k: string) => role(scheme, k);
  const hover = stateOpacity('hover');
  const pressed = stateOpacity('pressed');
  const focus = stateOpacity('focus');

  return createTheme({
    m3: scheme,
    palette: {
      mode,
      primary: {
        main: r('primary'),
        contrastText: r('on-primary'),
        light: r('primary-container'),
        dark: r('on-primary-container'),
      },
      secondary: {
        main: r('secondary'),
        contrastText: r('on-secondary'),
        light: r('secondary-container'),
        dark: r('on-secondary-container'),
      },
      error: {
        main: r('error'),
        contrastText: r('on-error'),
        light: r('error-container'),
        dark: r('on-error-container'),
      },
      // Hors Material : mêmes valeurs fixes que styles.scss Angular.
      success: { main: '#22c55e', dark: mode === 'dark' ? '#4ade80' : '#15803d' },
      warning: { main: '#eab308', dark: mode === 'dark' ? '#fbbf24' : '#a16207' },
      info: { main: '#3b82f6' },
      background: { default: r('surface'), paper: r('surface-container-low') },
      text: { primary: r('on-surface'), secondary: r('on-surface-variant'), disabled: alpha(r('on-surface'), 0.38) },
      divider: r('outline-variant'),
      action: {
        hover: alpha(r('on-surface'), hover),
        hoverOpacity: hover,
        selected: r('secondary-container'),
        focus: alpha(r('on-surface'), focus),
        focusOpacity: focus,
        activatedOpacity: pressed,
        disabled: alpha(r('on-surface'), 0.38),
        disabledBackground: alpha(r('on-surface'), 0.12),
      },
    },
    shape: { borderRadius: 12 },
    shadows: m3Shadows(),
    typography: {
      fontFamily: FONTS.body,
      h1: typeStyle('display-large'),
      h2: typeStyle('display-medium'),
      h3: typeStyle('display-small'),
      h4: typeStyle('headline-large'),
      h5: typeStyle('headline-medium'),
      h6: typeStyle('headline-small'),
      subtitle1: typeStyle('title-medium'),
      subtitle2: typeStyle('title-small'),
      body1: typeStyle('body-large'),
      body2: typeStyle('body-medium'),
      caption: typeStyle('body-small'),
      overline: { ...typeStyle('label-small'), textTransform: 'uppercase' },
      button: { ...typeStyle('label-large'), fontSize: '14px', fontWeight: 600, textTransform: 'none' },
    },
    breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 } },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // mat-typography : le corps suit body-medium (et non body-large comme MUI par défaut).
          body: { ...typeStyle('body-medium'), backgroundColor: r('surface'), color: r('on-surface') },
          'h1, h2, h3, h4, h5, h6': { fontFamily: FONTS.headings },
          code: { fontFamily: FONTS.mono },
        },
      },
      MuiButtonBase: { defaultProps: { disableRipple: false } },
      MuiButton: {
        defaultProps: { disableElevation: true, disableFocusRipple: true },
        variants: [
          {
            // mat-stroked-button color="primary" (styles.scss) : contour primaire sur fond de carte.
            props: { variant: 'outlined', color: 'primary' },
            style: {
              borderColor: r('primary'),
              color: r('primary'),
              backgroundColor: 'var(--card-bg)',
              '&:hover': { borderColor: r('primary'), backgroundColor: 'var(--card-bg)' },
            },
          },
          {
            props: { variant: 'outlined', color: 'error' },
            style: {
              borderColor: r('error'),
              color: r('error'),
              backgroundColor: 'var(--card-bg)',
              '&:hover': { borderColor: r('error'), backgroundColor: 'var(--error-color-light)' },
            },
          },
          {
            // Contour neutre (mat-stroked-button sans couleur, styles.scss) : <Button variant="outlined" color="inherit">.
            props: { variant: 'outlined', color: 'inherit' },
            style: {
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--card-bg)',
              '&:hover': { borderColor: r('primary'), color: r('primary'), backgroundColor: 'var(--card-bg)' },
            },
          },
        ],
        styleOverrides: {
          root: {
            height: 40,
            borderRadius: 'var(--radius-button)',
            paddingInline: 20,
            '&.Mui-focusVisible': {
              // État de focus M3 : calque de 12 % de la couleur du contenu sur tout le bouton (pas d'onde).
              backgroundImage:
                'linear-gradient(color-mix(in srgb, currentColor 12%, transparent), color-mix(in srgb, currentColor 12%, transparent))',
            },
          },
          // Icône 18 px + 8 px d'espacement (--mat-button-*-icon-spacing), sans marge négative MUI.
          startIcon: {
            marginLeft: -8,
            marginRight: 8,
            '& > *:nth-of-type(1)': { fontSize: 18, width: 18, height: 18 },
          },
          endIcon: {
            marginLeft: 8,
            marginRight: -8,
            '& > *:nth-of-type(1)': { fontSize: 18, width: 18, height: 18 },
          },
          // mat-button : 20 px sans icône, 16 px avec icône.
          text: {
            paddingInline: 20,
            '&:has(.MuiButton-startIcon), &:has(.MuiButton-endIcon)': { paddingInline: 16 },
            '& .MuiButton-startIcon': { marginLeft: -4 },
            '& .MuiButton-endIcon': { marginRight: -4 },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: r('on-surface-variant'),
            '&:hover': { backgroundColor: alpha(r('on-surface-variant'), hover) },
            '&.Mui-focusVisible': {
              // État de focus M3 : calque de 12 % de la couleur du contenu sur tout le bouton (pas d'onde).
              backgroundImage:
                'linear-gradient(color-mix(in srgb, currentColor 12%, transparent), color-mix(in srgb, currentColor 12%, transparent))',
            },
          },
        },
      },
      MuiFab: {
        defaultProps: { disableFocusRipple: true },
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: r('primary-container'),
            color: r('on-primary-container'),
            boxShadow: level(3),
            '&.Mui-focusVisible': {
              // État de focus M3 : calque de 12 % de la couleur du contenu sur tout le bouton (pas d'onde).
              backgroundImage:
                'linear-gradient(color-mix(in srgb, currentColor 12%, transparent), color-mix(in srgb, currentColor 12%, transparent))',
            },
          },
          // mat-fab extended M3 : 56 px, 20 px, graisse 500.
          extended: {
            height: 56,
            paddingInline: 20,
            gap: 4,
            fontWeight: 500,
            borderRadius: 16,
            '& .material-icons': { fontSize: 24 },
          },
        },
      },
      // mat-button-toggle-group M3 (segmented button) : contour, pilule, sélection secondary-container + coche.
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: { borderRadius: 9999, border: `1px solid ${r('outline')}`, overflow: 'hidden' },
          grouped: {
            border: 0,
            borderRadius: 0,
            '&:not(:first-of-type)': { borderLeft: `1px solid ${r('outline')}`, marginLeft: 0 },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            height: 40,
            paddingInline: 12,
            gap: 8,
            textTransform: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 500,
            color: r('on-surface'),
            '& .seg-check': { fontSize: 18 },
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: r('secondary-container'),
              color: r('on-secondary-container'),
            },
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 'var(--mat-sys-corner-medium)',
            backgroundColor: r('surface-container-low'),
            boxShadow: level(1),
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 'var(--mat-sys-corner-extra-small)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: r('outline') },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: r('on-surface') },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: r('primary'), borderWidth: 2 },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: 'var(--mat-sys-corner-extra-small-top)',
            backgroundColor: r('surface-container-highest'),
            '&:hover': { backgroundColor: r('surface-container-highest') },
            '&.Mui-focused': { backgroundColor: r('surface-container-highest') },
          },
        },
      },
      MuiTextField: { defaultProps: { variant: 'outlined' } },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: { root: { backgroundColor: 'var(--bg)', color: r('on-surface') } },
      },
      MuiToolbar: { styleOverrides: { root: { minHeight: 'var(--header-height) !important' } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: r('surface-container-low'), borderRight: 0 } } },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 'var(--radius-sm)',
            '&.Mui-selected, &.active': {
              backgroundColor: 'var(--primary-color-light)',
              color: r('primary'),
              '&:hover': { backgroundColor: 'var(--primary-color-light)' },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: r('inverse-surface'),
            color: r('inverse-on-surface'),
            borderRadius: 4,
            fontSize: 12,
          },
        },
      },
      MuiMenu: {
        styleOverrides: { paper: { backgroundColor: r('surface-container'), borderRadius: 4, boxShadow: level(2) } },
      },
      MuiDialog: {
        styleOverrides: { paper: { backgroundColor: r('surface-container-high'), borderRadius: 'var(--r-l)' } },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 52, height: 32, padding: 0 },
          switchBase: {
            padding: 4,
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: r('on-primary'),
              '& + .MuiSwitch-track': { backgroundColor: r('primary'), opacity: 1, border: 0 },
            },
          },
          thumb: { width: 24, height: 24, boxShadow: 'none' },
          track: {
            borderRadius: 16,
            backgroundColor: r('surface-container-highest'),
            border: `2px solid ${r('outline')}`,
            opacity: 1,
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    },
  });
}
