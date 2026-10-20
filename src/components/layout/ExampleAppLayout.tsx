import { Drawer } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useMatches, useSearchParams } from 'react-router';
import { ChatPanel } from '../../features/examples/app/chat/ChatPanel';
import { exChat, useExChat } from '../../features/examples/app/chat/exChatStore';
import { useMediaQuery } from '@mui/material';
import type { ComponentEntry } from '../../types/routes';
import { MaterialIcon } from '../ui/MaterialIcon';
import { AppToolbarActions } from './AppToolbarActions';
import { usePaletteCommands } from '../interaction/useInteractions';
import { ExampleShellContext } from './exampleShellContext';
import { EXAMPLE_APP_NAV, EXAMPLE_SHELL_HEADERS, type ExampleShellHeader } from './nav';
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
  // Messagerie : sidenav droite (carte flottante, même style que la gauche), latérale dès 1600 px.
  const { panelOpen } = useExChat();
  const isWide = useMediaQuery('(min-width: 1600px)');
  const [params] = useSearchParams();
  const chatParam = params.get('chat');
  useEffect(() => {
    // Lien direct : ?chat=1 ouvre le panneau, ?chat=<id de conversation> ouvre directement la conversation.
    if (!chatParam) return;
    exChat.setPanelOpen(true);
    if (chatParam !== '1') exChat.setPanelConv(chatParam);
  }, [chatParam]);
  const entry = useMatches().at(-1)?.handle as ComponentEntry | undefined;
  // En-tête fourni par la page elle-même (titre dynamique d'une fiche, contenu sans marges…).
  const [override, setOverride] = useState<Partial<ExampleShellHeader> | null>(null);
  const header: ExampleShellHeader = {
    ...((entry && EXAMPLE_SHELL_HEADERS[entry.path]) ?? { title: entry?.title ?? '' }),
    ...override,
  };
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
      actions={
        <AppToolbarActions
          chatButton={!header.hideChatButton}
          chatOpen={panelOpen}
          chatUnread={exChat.totalUnread()}
          onToggleChat={() => exChat.setPanelOpen(!panelOpen)}
        />
      }
      contentClassName={header.flush ? 'flush' : undefined}
      endPanel={
        isWide ? (
          panelOpen && (
            <aside className="chat-side">
              <div className="chat-inner">
                <ChatPanel />
              </div>
            </aside>
          )
        ) : (
          <Drawer
            anchor="right"
            open={panelOpen}
            onClose={() => exChat.setPanelOpen(false)}
            slotProps={{ paper: { className: 'chat-drawer' } }}
            disableAutoFocus
          >
            <div className="chat-inner">{panelOpen && <ChatPanel />}</div>
          </Drawer>
        )
      }
    >
      <ExampleShellContext.Provider value={setOverride}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </ExampleShellContext.Provider>
    </NavShell>
  );
}
