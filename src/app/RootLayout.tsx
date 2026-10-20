import { Outlet } from 'react-router';
import { DialogProvider } from '../components/feedback/dialogs/DialogProvider';
import { InteractionProvider } from '../components/interaction/InteractionProvider';

/** Racine : registre global des raccourcis, palette ⌘K, aide, visite guidée et dialogs (dans le routeur pour naviguer). */
export function RootLayout() {
  return (
    <InteractionProvider>
      <DialogProvider>
        <Outlet />
      </DialogProvider>
    </InteractionProvider>
  );
}
