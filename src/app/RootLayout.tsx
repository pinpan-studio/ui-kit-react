import { Outlet } from 'react-router';
import { InteractionProvider } from '../components/interaction/InteractionProvider';

/** Racine : registre global des raccourcis, palette ⌘K, aide et visite guidée (dans le routeur pour naviguer). */
export function RootLayout() {
  return (
    <InteractionProvider>
      <Outlet />
    </InteractionProvider>
  );
}
