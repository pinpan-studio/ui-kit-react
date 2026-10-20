import { Button } from '@mui/material';
import { Link, Outlet } from 'react-router';
import { MaterialIcon } from '../ui/MaterialIcon';
import { KIT_NAV } from './nav';
import { NavShell } from './NavShell';
import { RouteFallback } from './RouteFallback';
import { Suspense } from 'react';

/** Layout « kit » du catalogue (KitLayoutComponent). */
export function KitLayout() {
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
        </>
      }
    >
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </NavShell>
  );
}
