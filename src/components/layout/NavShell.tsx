import { Drawer } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { NavConfig } from './nav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './shell.css';

/**
 * Cadre commun du catalogue et des écrans d'exemple : sidenav « side » ouverte sur desktop,
 * tiroir superposé sous 960 px (même seuil que le BreakpointObserver Angular).
 */
interface NavShellProps {
  config: NavConfig;
  /** Titre de la barre d'outils (par défaut : config.toolbarTitle). */
  title?: ReactNode;
  actions?: ReactNode;
  /** Variante (`app` : barre d'outils et contenu de ex-app-shell). */
  variant?: 'kit' | 'app';
  children: ReactNode;
}

export function NavShell({ config, title, actions, variant = 'kit', children }: NavShellProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);
  useEffect(() => setOpen(!isMobile), [isMobile]);
  const sidebar = <Sidebar config={config} isMobile={isMobile} onClose={() => setOpen(false)} />;

  return (
    <div className={`kit-container ${variant}-shell`}>
      {isMobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none' } } }}
        >
          <div className="kit-sidenav mobile">{sidebar}</div>
        </Drawer>
      ) : (
        <aside className={`kit-sidenav${open ? '' : ' closed'}`} aria-hidden={!open} inert={!open}>
          {sidebar}
        </aside>
      )}
      <div className="kit-main">
        <Topbar
          title={title ?? config.toolbarTitle}
          navOpen={open}
          onToggleNav={() => setOpen((o) => !o)}
          toggleLabels={variant === 'app' ? ['Masquer le menu', 'Afficher le menu'] : undefined}
          actions={actions}
        />
        <main className={variant === 'app' ? 'kit-content content' : 'kit-content'} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
