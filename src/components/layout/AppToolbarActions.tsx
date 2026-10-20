import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router';
import { CURRENT_USER, initials } from '../../lib/session';
import { Kbd } from '../interaction/Kbd';
import { NotificationCenter, type AppNotification } from '../interaction/NotificationCenter';
import { useInteractions } from '../interaction/useInteractions';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ThemePicker } from '../ui/ThemePicker';
import { ThemeToggle } from '../ui/ThemeToggle';

const EX_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Paiement reçu',
    message: 'Cacao Plus a réglé la facture FAC-2026-0981 (4,2 M FCFA).',
    at: new Date(Date.now() - 12 * 60e3),
    icon: 'payments',
    tone: 'success',
    category: 'Finance',
  },
  {
    id: 'n2',
    title: 'Aya Koné vous a mentionné',
    message: '« @Jean peux-tu valider le créneau de jeudi ? »',
    at: new Date(Date.now() - 2 * 3600e3),
    avatar: 'AK',
    category: 'Équipe',
    actions: [
      { id: 'reply', label: 'Répondre', primary: true },
      { id: 'later', label: 'Plus tard' },
    ],
  },
  {
    id: 'n3',
    title: '3 factures en retard',
    message: 'Relance automatique programmée demain à 9 h.',
    at: new Date(Date.now() - 5 * 3600e3),
    icon: 'schedule',
    tone: 'warning',
    category: 'Finance',
  },
  {
    id: 'n4',
    title: 'Version 2.4 disponible',
    message: 'Export PDF corrigé, nouveaux rapports.',
    at: new Date(Date.now() - 26 * 3600e3),
    icon: 'new_releases',
    tone: 'info',
    category: 'Système',
    read: true,
  },
];

/** Actions de la barre d'outils de ex-app-shell : thème, palette, Messages, Notifications, compte. */
export function AppToolbarActions({
  chatButton = true,
  chatOpen = false,
  chatUnread = 0,
  onToggleChat,
}: {
  chatButton?: boolean;
  /** Panneau de messagerie (sidenav droite) ouvert. */
  chatOpen?: boolean;
  chatUnread?: number;
  onToggleChat?: () => void;
}) {
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const { openPalette } = useInteractions();
  const close = () => setMenu(null);
  return (
    <>
      <span className="hide-sm">
        <ThemeToggle />
      </span>
      <span className="hide-sm">
        <ThemePicker />
      </span>
      {chatButton && (
        <Tooltip title="Messages">
          <IconButton className={`chat-btn${chatOpen ? ' on' : ''}`} aria-label="Messages" onClick={onToggleChat}>
            <MaterialIcon name={chatOpen ? 'chat_bubble' : 'chat_bubble_outline'} />
            {chatUnread > 0 && <span className="chat-n">{chatUnread}</span>}
          </IconButton>
        </Tooltip>
      )}
      <NotificationCenter notifications={EX_NOTIFICATIONS} />
      <button
        type="button"
        className="avatar-btn"
        aria-label="Mon compte"
        aria-haspopup="menu"
        onClick={(e) => setMenu(e.currentTarget)}
      >
        <span className="avatar">{initials(CURRENT_USER.fullname)}</span>
      </button>
      <Menu
        anchorEl={menu}
        open={!!menu}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className="menu-me">
          <strong>{CURRENT_USER.fullname}</strong>
          <small>{CURRENT_USER.mail}</small>
        </div>
        <Divider />
        <MenuItem component={Link} to="/examples/app/settings" onClick={close}>
          <ListItemIcon>
            <MaterialIcon name="person" />
          </ListItemIcon>
          Mon profil
        </MenuItem>
        <MenuItem component={Link} to="/examples/app/settings" onClick={close}>
          <ListItemIcon>
            <MaterialIcon name="settings" />
          </ListItemIcon>
          Paramètres
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            openPalette();
          }}
        >
          <ListItemIcon>
            <MaterialIcon name="keyboard_command_key" />
          </ListItemIcon>
          Commandes
          <Kbd className="menu-kbd" keys="mod+k" />
        </MenuItem>
        <Divider />
        <MenuItem component={Link} to="/examples/auth/lock" onClick={close}>
          <ListItemIcon>
            <MaterialIcon name="lock" />
          </ListItemIcon>
          Verrouiller
        </MenuItem>
        <MenuItem component={Link} to="/examples/auth/centered" onClick={close}>
          <ListItemIcon>
            <MaterialIcon name="logout" />
          </ListItemIcon>
          Se déconnecter
        </MenuItem>
      </Menu>
    </>
  );
}
