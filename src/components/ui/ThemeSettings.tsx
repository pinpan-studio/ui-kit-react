import { Box, Button, ButtonBase, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { Link } from 'react-router';
import { useThemeMode } from '../../hooks/useThemeMode';
import { THEME_PALETTES } from '../../theme/palettes';
import type { ThemeModePreference } from '../../types/theme';
import { MaterialIcon } from './MaterialIcon';

const MODES: { value: ThemeModePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Clair', icon: 'light_mode' },
  { value: 'dark', label: 'Sombre', icon: 'dark_mode' },
  { value: 'system', label: 'Système', icon: 'brightness_auto' },
];

// .ts-title (Angular) : font title-small, aligné sur la ligne de base.
const TITLE = {
  m: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  font: 'var(--mat-sys-title-small)',
  color: 'var(--mat-sys-on-surface)',
} as const;

/** Réglages d'apparence (équivalent `<app-theme-settings>`) : mode + palette M3. */
export function ThemeSettings({
  showStudioLink = true,
  onStudio,
}: {
  /** Affiche le lien vers le studio de thème (masqué dans le studio lui-même). */
  showStudioLink?: boolean;
  /** Clic sur le lien du studio (le panneau flottant se ferme). */
  onStudio?: () => void;
} = {}) {
  const { preference, mode, paletteId, setMode, setPalette } = useThemeMode();
  const current = THEME_PALETTES.find((p) => p.id === paletteId);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Typography id="ts-mode" component="h3" sx={TITLE}>
          Mode
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={preference}
          aria-labelledby="ts-mode"
          onChange={(_, v: ThemeModePreference | null) => v && setMode(v)}
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: 'var(--radius-button)',
              textTransform: 'none',
              gap: 0.5,
              borderColor: 'var(--mat-sys-outline)',
            },
            '& .Mui-selected': {
              bgcolor: 'var(--mat-sys-secondary-container) !important',
              color: 'var(--mat-sys-on-secondary-container)',
            },
          }}
        >
          {MODES.map((m) => (
            <ToggleButton key={m.value} value={m.value}>
              <MaterialIcon name={m.icon} size={18} /> {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Typography id="ts-color" component="h3" sx={TITLE}>
          Couleur{' '}
          <Box component="span" sx={{ font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)' }}>
            {current?.label}
          </Box>
        </Typography>
        <Box
          role="radiogroup"
          aria-labelledby="ts-color"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 48px)',
            gap: '4px',
            justifyContent: 'space-between',
          }}
        >
          {THEME_PALETTES.map((p) => {
            const s = mode === 'dark' ? p.dark : p.light;
            const selected = p.id === paletteId;
            return (
              <Tooltip key={p.id} title={p.label}>
                <ButtonBase
                  role="radio"
                  aria-checked={selected}
                  aria-label={p.label}
                  onClick={() => setPalette(p.id)}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&.Mui-focusVisible': { outline: '2px solid var(--mat-sys-primary)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: `conic-gradient(from 90deg, ${s.tertiary} 0 25%, ${s.secondary} 0 50%, ${s.primary} 0 100%)`,
                      boxShadow: selected
                        ? `0 0 0 3px var(--mat-sys-surface-container), 0 0 0 5px ${s.primary}`
                        : 'inset 0 0 0 1px color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent)',
                      transform: selected ? 'scale(0.85)' : 'none',
                      transition: 'transform 150ms',
                    }}
                  >
                    {selected && (
                      <MaterialIcon
                        name="check"
                        size={20}
                        sx={{
                          borderRadius: '50%',
                          bgcolor: 'var(--mat-sys-surface-container-highest)',
                          color: 'var(--mat-sys-on-surface)',
                        }}
                      />
                    )}
                  </Box>
                </ButtonBase>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
      {showStudioLink && (
        <Button
          component={Link}
          to="/theme-studio"
          onClick={onStudio}
          variant="contained"
          disableElevation
          startIcon={<MaterialIcon name="tune" size={18} />}
          sx={{
            alignSelf: 'stretch',
            bgcolor: 'var(--mat-sys-secondary-container)',
            color: 'var(--mat-sys-on-secondary-container)',
            '&:hover': { bgcolor: 'var(--mat-sys-secondary-container)', boxShadow: 'var(--mat-sys-level1)' },
          }}
        >
          Studio de thème : couleurs, styles, nuances
        </Button>
      )}
    </Box>
  );
}
