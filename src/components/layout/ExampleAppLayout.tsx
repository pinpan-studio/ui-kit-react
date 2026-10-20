import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { EXAMPLE_APP_NAV } from './nav';
import { NavShell } from './NavShell';
import { RouteFallback } from './RouteFallback';

/** Shell des écrans d'exemple /examples/app/** et des formulaires (ex-app-shell Angular). */
export function ExampleAppLayout() {
  return (
    <NavShell config={EXAMPLE_APP_NAV}>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </NavShell>
  );
}
