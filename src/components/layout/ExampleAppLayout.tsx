import { Suspense } from 'react';
import { Outlet, useMatches } from 'react-router';
import type { ComponentEntry } from '../../types/routes';
import { MaterialIcon } from '../ui/MaterialIcon';
import { AppToolbarActions } from './AppToolbarActions';
import { EXAMPLE_APP_NAV, EXAMPLE_SHELL_HEADERS } from './nav';
import { NavShell } from './NavShell';
import { RouteFallback } from './RouteFallback';

/** Shell des écrans d'exemple /examples/app/** et des formulaires (ex-app-shell Angular). */
export function ExampleAppLayout() {
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
