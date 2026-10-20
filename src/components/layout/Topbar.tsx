import { IconButton } from '@mui/material';
import type { ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';

interface TopbarProps {
  title: ReactNode;
  navOpen: boolean;
  onToggleNav: () => void;
  /** Boutons à droite de la recherche (propres à chaque shell). */
  actions?: ReactNode;
}

/** Barre d'outils commune (mat-toolbar.kit-toolbar). */
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
    </header>
  );
}
