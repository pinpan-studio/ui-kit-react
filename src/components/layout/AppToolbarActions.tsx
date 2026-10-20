import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router';
import { CHAT_UNREAD, CURRENT_USER, initials, NOTIFICATIONS_UNREAD } from '../../lib/session';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ThemePicker } from '../ui/ThemePicker';
import { ThemeToggle } from '../ui/ThemeToggle';

/** Actions de la barre d'outils de ex-app-shell : thème, palette, Messages, Notifications, compte. */
export function AppToolbarActions({ chatButton = true }: { chatButton?: boolean }) {
  const [menu, setMenu] = useState<HTMLElement | null>(null);
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
          <IconButton className="chat-btn" aria-label="Messages">
            <MaterialIcon name="chat_bubble_outline" />
            {CHAT_UNREAD > 0 && <span className="chat-n">{CHAT_UNREAD}</span>}
          </IconButton>
        </Tooltip>
      )}
      {/* Le centre de notifications (panneau) sera porté avec les composants « Interactions ». */}
      <Tooltip title="Notifications">
        <button type="button" className="nc-bell" aria-label={`Notifications, ${NOTIFICATIONS_UNREAD} non lues`}>
          <MaterialIcon name={NOTIFICATIONS_UNREAD ? 'notifications_active' : 'notifications'} />
          {NOTIFICATIONS_UNREAD > 0 && <span className="nc-count">{NOTIFICATIONS_UNREAD}</span>}
        </button>
      </Tooltip>
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
