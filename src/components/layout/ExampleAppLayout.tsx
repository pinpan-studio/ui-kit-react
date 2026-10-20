import { Suspense } from 'react';
import { Outlet, useMatches } from 'react-router';
import type { ComponentEntry } from '../../types/routes';
import { MaterialIcon } from '../ui/MaterialIcon';
import { AppToolbarActions } from './AppToolbarActions';
import { usePaletteCommands } from '../interaction/useInteractions';
import { EXAMPLE_APP_NAV, EXAMPLE_SHELL_HEADERS } from './nav';
import { NavShell } from './NavShell';
import { RouteFallback } from './RouteFallback';

/** Shell des écrans d'exemple /examples/app/** et des formulaires (ex-app-shell Angular). */
export function ExampleAppLayout() {
  usePaletteCommands(
    () => [
      ...[...EXAMPLE_APP_NAV.top, ...EXAMPLE_APP_NAV.groups.flatMap((g) => g.items)].map((n) => ({
        id: 'ex-nav-' + n.path,
        label: n.label,
        group: 'Aller à',
        icon: n.icon,
        route: n.path,
      })),
      {
        id: 'ex-new-client',
        label: 'Nouveau client',
        group: 'Actions',
        icon: 'person_add',
        hint: 'CRM',
        route: '/examples/app/clients',
      },
      {
        id: 'ex-new-invoice',
        label: 'Nouvelle facture',
        group: 'Actions',
        icon: 'receipt_long',
        hint: 'Facturation',
        route: '/examples/app/dashboard',
      },
      {
        id: 'ex-new-task',
        label: 'Nouvelle tâche',
        group: 'Actions',
        icon: 'add_task',
        hint: 'Planning',
        route: '/examples/app/board',
      },
      {
        id: 'ex-compose',
        label: 'Rédiger un message',
        group: 'Actions',
        icon: 'edit',
        hint: 'Messagerie',
        route: '/examples/app/inbox',
      },
      { id: 'ex-lock', label: 'Verrouiller la session', group: 'Compte', icon: 'lock', route: '/examples/auth/lock' },
      { id: 'ex-logout', label: 'Se déconnecter', group: 'Compte', icon: 'logout', route: '/examples/auth/centered' },
    ],
    { prepend: true },
  );
  const entry = useMatches().at(-1)?.handle as ComponentEntry | undefined;
  const header = (entry && EXAMPLE_SHELL_HEADERS[entry.path]) ?? { title: entry?.title ?? '' };
  const title = (
    <>
      {header.crumb && (
        <>
          <span className="crumb">{header.crumb}</span>
          <MaterialIcon name="chevron_right" className="sep" />
        </>
      )}
      <span className="cur">{header.title}</span>
    </>
  );
  return (
    <NavShell
      config={EXAMPLE_APP_NAV}
      variant="app"
      title={title}
      actions={<AppToolbarActions chatButton={!header.hideChatButton} />}
    >
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </NavShell>
  );
}
