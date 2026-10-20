import { useInteractions } from '../interaction/useInteractions';
import { IconButton } from '@mui/material';
import type { ReactNode } from 'react';
import { Kbd } from '../interaction/Kbd';
import { MaterialIcon } from '../ui/MaterialIcon';

interface TopbarProps {
  title: ReactNode;
  navOpen: boolean;
  onToggleNav: () => void;
  /** Boutons à droite de la recherche (propres à chaque shell). */
  actions?: ReactNode;
  /** Libellés du bouton de menu (catalogue : Fermer/Ouvrir ; ex-app-shell : Masquer/Afficher). */
  toggleLabels?: [open: string, closed: string];
}

/** Barre d'outils commune (mat-toolbar.kit-toolbar). */
export function Topbar({
  title,
  navOpen,
  onToggleNav,
  actions,
  toggleLabels = ['Fermer le menu', 'Ouvrir le menu'],
}: TopbarProps) {
  const { openPalette } = useInteractions();
  return (
    <header className="kit-toolbar">
      <IconButton
        onClick={onToggleNav}
        aria-label={navOpen ? toggleLabels[0] : toggleLabels[1]}
        aria-expanded={navOpen}
      >
        <MaterialIcon name={navOpen ? 'menu_open' : 'menu'} />
      </IconButton>
      <span className="toolbar-title">{title}</span>
      <span className="spacer" />
      <button type="button" className="palette-btn" aria-label="Rechercher (⌘K)" onClick={openPalette}>
        <MaterialIcon name="search" />
        <span className="pb-label">Rechercher…</span>
        <Kbd keys="mod+k" className="pb-kbd" />
      </button>
      {actions}
    </header>
  );
}
