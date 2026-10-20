import { IconButton, Popover, Tooltip } from '@mui/material';
import { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { ThemeSettings } from './ThemeSettings';

/** Bouton de barre d'outils « Apparence » (équivalent `<app-theme-picker>`). */
export function ThemePicker() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tooltip title="Apparence : mode et couleur">
        <IconButton
          aria-label="Apparence : mode et couleur"
          aria-haspopup="dialog"
          aria-expanded={!!anchor}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <MaterialIcon name="palette" />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': 'Apparence',
            sx: {
              width: 'min(380px, calc(100vw - 32px))',
              p: '20px',
              bgcolor: 'var(--mat-sys-surface-container)',
              borderRadius: 'var(--mat-sys-corner-large)',
              boxShadow: 'var(--mat-sys-level2)',
            },
          },
        }}
      >
        <ThemeSettings onStudio={() => setAnchor(null)} />
      </Popover>
    </>
  );
}
