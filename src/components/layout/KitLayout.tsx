import { Button } from '@mui/material';
import { Link, Outlet } from 'react-router';
import { MaterialIcon } from '../ui/MaterialIcon';
import { useThemeMode } from '../../hooks/useThemeMode';
import { THEME_PALETTES } from '../../theme/palettes';
import { usePaletteCommands } from '../interaction/useInteractions';
import { COMPONENT_CATEGORIES, KIT_NAV, SHOWCASE_SECTIONS } from './nav';
import { useNavigate } from 'react-router';
import { NavShell } from './NavShell';
import { RouteFallback } from './RouteFallback';
import { Suspense } from 'react';
import { ThemePicker } from '../ui/ThemePicker';
import { ThemeToggle } from '../ui/ThemeToggle';

/** Layout « kit » du catalogue (KitLayoutComponent). */
export function KitLayout() {
  const theme = useThemeMode();
  const navigate = useNavigate();
  // Palette ⌘K : navigation vers tout le catalogue + actions globales (kit-layout.component.ts).
  usePaletteCommands(
    () => [
      {
        id: 'nav-showcase',
        label: 'UI Showcase',
        group: 'Navigation',
        icon: 'auto_awesome_mosaic',
        route: '/ui-showcase',
      },
      {
        id: 'nav-theme-studio',
        label: 'Studio de thème',
        group: 'Navigation',
        icon: 'tune',
        route: '/theme-studio',
        keywords: ['thème', 'couleur', 'palette', 'nuances', 'custom', 'personnalisé'],
      },
      {
        id: 'nav-components',
        label: 'Tous les composants',
        group: 'Navigation',
        icon: 'widgets',
        route: '/components',
      },
      ...COMPONENT_CATEGORIES.map((c) => ({
        id: 'nav-' + c.path,
        label: c.label,
        group: 'Composants',
        icon: c.icon,
        route: c.path,
        hint: c.description,
        keywords: (c.description ?? '').split(/[,.]\s*/),
      })),
      ...SHOWCASE_SECTIONS.filter((s) => s.fragment).map((s) => ({
        id: `sec-${s.path}-${s.fragment}`,
        label: s.label,
        group: 'Sections',
        icon: s.icon,
        hint: s.path,
        action: () => void navigate({ pathname: s.path, hash: s.fragment }),
      })),
      {
        id: 'nav-showcases',
        label: 'Showcases',
        group: 'Navigation',
        icon: 'devices',
        route: '/showcases',
        keywords: ['aperçu', 'iframe', 'mobile', 'tablette', 'appareil'],
      },
      { id: 'nav-layouts', label: 'Galerie des layouts', group: 'Navigation', icon: 'view_compact', route: '/layouts' },
      { id: 'nav-pages', label: 'Toutes les pages', group: 'Navigation', icon: 'grid_view', route: '/pages' },
      ...(KIT_NAV.groups.find((g) => g.id === 'pages')?.subgroups ?? []).flatMap((g) =>
        g.pages.map((p) => ({
          id: 'page-' + p.path,
          label: p.label,
          group: 'Pages · ' + g.label,
          icon: p.icon || g.icon,
          route: p.path,
        })),
      ),
      {
        id: 'act-theme',
        label: 'Basculer le thème clair / sombre',
        group: 'Actions',
        icon: 'dark_mode',
        keywords: ['sombre', 'clair', 'dark', 'light'],
        action: () => theme.toggle(),
      },
      {
        id: 'act-mode-system',
        label: 'Thème : suivre le système',
        group: 'Actions',
        icon: 'brightness_auto',
        keywords: ['système', 'auto', 'thème'],
        action: () => theme.setMode('system'),
      },
      ...THEME_PALETTES.map((p) => ({
        id: 'act-palette-' + p.id,
        label: 'Couleur du thème : ' + p.label,
        group: 'Thèmes',
        icon: 'palette',
        keywords: ['thème', 'couleur', 'palette', p.id],
        action: () => theme.setPalette(p.id),
      })),
      { id: 'act-app', label: 'Ouvrir l’application', group: 'Actions', icon: 'open_in_new', route: '/main' },
    ],
    { prepend: true },
  );
  return (
    <NavShell
      config={KIT_NAV}
      actions={
        <>
          <Button
            variant="outlined"
            color="inherit"
            className="app-link"
            component={Link}
            to="/harnais"
            startIcon={<MaterialIcon name="auto_awesome" />}
          >
            <span className="label">Harnais</span>
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            className="app-link"
            component={Link}
            to="/main"
            startIcon={<MaterialIcon name="open_in_new" />}
          >
            <span className="label">Ouvrir l'application</span>
          </Button>
          <ThemeToggle />
          <ThemePicker />
        </>
      }
    >
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </NavShell>
  );
}
