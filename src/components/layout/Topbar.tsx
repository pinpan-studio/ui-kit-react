import { IconButton } from '@mui/material';
import type { ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ThemePicker } from '../ui/ThemePicker';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  title: string;
  navOpen: boolean;
  onToggleNav: () => void;
  actions?: ReactNode;
}

/** Barre d'outils du catalogue (mat-toolbar.kit-toolbar). */
export function Topbar({ title, navOpen, onToggleNav, actions }: TopbarProps) {
  return (
    <header className="kit-toolbar">
      <IconButton
        onClick={onToggleNav}
        aria-label={navOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={navOpen}
      >
        <MaterialIcon name={navOpen ? 'menu_open' : 'menu'} />
      </IconButton>
      <span className="toolbar-title">{title}</span>
      <span className="spacer" />
      {/* La palette de commandes ⌘K sera portée avec les composants « Interactions ». */}
      <button type="button" className="palette-btn" aria-label="Rechercher (⌘K)" disabled title="Bientôt disponible">
        <MaterialIcon name="search" />
        <span className="pb-label">Rechercher…</span>
        <kbd className="kbd">⌘K</kbd>
      </button>
      {actions}
      <ThemeToggle />
      <ThemePicker />
    </header>
  );
}
