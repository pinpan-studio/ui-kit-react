import { Badge, Button, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { GoogleAuthDialog, ProfilDialog, ResetPasswordDialog } from '../../components/feedback/dialogs/AccountDialogs';
import { useDialog } from '../../components/feedback/dialogs/useDialog';
import { useModal } from '../../components/feedback/dialogs/useModal';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { ThemePicker } from '../../components/ui/ThemePicker';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { CURRENT_USER, NOTIFICATIONS, type StaticNotification } from '../../lib/session';
import { NotificationsPanel, UserSettingsPanel, type SettingMode } from './AccountPanels';
import './main-shell.scss';

/** Breakpoints.Handset + Breakpoints.TabletPortrait du CDK Angular. */
const MOBILE_QUERY =
  '(max-width: 599.98px) and (orientation: portrait), (max-width: 959.98px) and (orientation: landscape), (min-width: 600px) and (max-width: 839.98px) and (orientation: portrait)';

/** Rail du shell : vide pour l'instant (menu.data.ts Angular : MAIN_MENU = []). */
const MAIN_MENU: { libelle: string; icon: string; type: string }[] = [];

const initiales = (fullname: string) =>
  fullname
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

/**
 * /main — shell applicatif (AppShellComponent) : rail d'icônes à gauche, barre d'outils, zone de contenu,
 * drawer droit (compte / notifications). 100 % statique.
 */
export function MainShellPage() {
  const isMobile = useMediaQuery(MOBILE_QUERY, { noSsr: true });
  const open = useDialog();
  const modal = useModal();
  const [user, setUser] = useState<typeof CURRENT_USER | null>(CURRENT_USER);
  const [messages, setMessages] = useState<StaticNotification[]>(() => NOTIFICATIONS.filter((m) => !m.lu));
  const [navOpen, setNavOpen] = useState(!isMobile);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sideShow, setSideShow] = useState<'user-settings' | 'notifications'>('user-settings');
  useEffect(() => setNavOpen(!isMobile), [isMobile]);

  const openSideRight = () => {
    setSideShow('user-settings');
    setDrawerOpen(true);
  };
  const openNotification = () => {
    setSideShow('notifications');
    setDrawerOpen(true);
  };
  const closeSideRight = () => setDrawerOpen(false);

  const openGoogleAuthModal = () =>
    void open<boolean>((d) => <GoogleAuthDialog dialog={d} data={{ errorMessage: null }} />, {
      backdropClass: 'startBackDrop',
      panelClass: 'google-auth-dialog-panel',
      width: '440px',
    }).then((ok) => {
      if (ok) setUser(CURRENT_USER);
    });

  const onSettingSelect = (setting: SettingMode) => {
    switch (setting) {
      case '_PROFIL_':
        void open<undefined>((d) => <ProfilDialog dialog={d} />, {
          width: '400px',
          backdropClass: 'startBackDrop',
          disableClose: true,
        });
        break;
      case '_RESET_PASSWORD_':
        void open<undefined>((d) => <ResetPasswordDialog dialog={d} />, {
          width: '400px',
          backdropClass: 'startBackDrop',
          disableClose: true,
        });
        break;
      case '_DISCONNECT_':
        void modal.bottomConfirm({ title: 'Confirmation', message: 'Voulez-vous vous déconnecter ?' }).then((yes) => {
          if (yes) {
            setUser(null);
            setDrawerOpen(false);
          }
        });
        break;
    }
  };

  const onMessageSelect = (message: StaticNotification) =>
    void modal
      .showPushMessage({ title: message.objet, message: message.contenu })
      .then(() => setMessages((list) => list.filter((m) => m._id !== message._id)));

  const avatar = user ? initiales(user.fullname) : '';
  const over = isMobile ? ' over' : '';

  return (
    <div className="main-shell">
      <div className="shell-container">
        {/* ── Sidenav (rail d'icônes ; chaque module a sa propre sous-navigation) ── */}
        <aside className={`shell-sidenav${over}${navOpen ? '' : ' closed'}`}>
          <div className="sidenav-inner">
            <div className="sidenav-header">
              <Tooltip title="SC Storage" placement="right">
                <img src="/assets/logo.png" className="brand-logo" alt="SC Storage" />
              </Tooltip>
            </div>

            <div className="nav-scrollbar">
              <div className="nav-rail">
                {MAIN_MENU.map((item) => (
                  <Tooltip key={item.type} title={item.libelle} placement="right">
                    <Link
                      className="nav-rail-item"
                      to={`/main/${item.type}`}
                      onClick={() => isMobile && setNavOpen(false)}
                    >
                      <MaterialIcon name={item.icon} />
                    </Link>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Utilisateur connecté */}
            {user && (
              <Tooltip title={user.fullname} placement="right">
                <button type="button" className="user-avatar-btn" onClick={openSideRight}>
                  <div className="avatar">{avatar}</div>
                </button>
              </Tooltip>
            )}
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <div className="shell-main">
          <div className="shell-toolbar">
            <IconButton aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
              <MaterialIcon name={navOpen ? 'menu_open' : 'menu'} />
            </IconButton>

            <span className="page-title">Referentiel unique</span>

            <span className="spacer" />

            <Tooltip title="Retour au catalogue UI Kit">
              <IconButton
                component={Link}
                to="/ui-showcase"
                className="ui-kit-btn"
                aria-label="Retour au catalogue UI Kit"
              >
                <MaterialIcon name="widgets" />
              </IconButton>
            </Tooltip>

            <ThemeToggle />
            <ThemePicker />

            {user ? (
              <>
                <Tooltip title="Notifications">
                  <IconButton aria-label="Notifications" onClick={openNotification}>
                    <Badge badgeContent={messages.length} color="error">
                      <MaterialIcon name="notifications" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Mon compte">
                  <IconButton className="avatar-btn" aria-label="Mon compte" onClick={openSideRight}>
                    <div className="avatar">{avatar}</div>
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button
                variant="contained"
                className="signin-btn"
                startIcon={<MaterialIcon name="login" />}
                onClick={openGoogleAuthModal}
              >
                Connexion
              </Button>
            )}
          </div>

          <div className="content-area">
            <div className="content-inner" />
          </div>
        </div>

        {/* ── Drawer droit (profil / notifications) ── */}
        {drawerOpen && (
          <aside className={`right-drawer${over}`}>
            <div className="sidenav-inner">
              {sideShow === 'user-settings' ? (
                <UserSettingsPanel onLeave={closeSideRight} onSelect={onSettingSelect} />
              ) : (
                <NotificationsPanel
                  initial={NOTIFICATIONS}
                  onLeave={closeSideRight}
                  onSelect={onMessageSelect}
                  onGoBack={() => setSideShow('user-settings')}
                />
              )}
            </div>
          </aside>
        )}

        {isMobile && (navOpen || drawerOpen) && (
          <div
            className="shell-backdrop"
            onClick={() => {
              setNavOpen(false);
              setDrawerOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
