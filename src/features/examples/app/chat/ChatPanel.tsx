import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';
import { CHAT_CONTACTS, chatInitials, exChat, useExChat } from './exChatStore';
import './chat-panel.scss';

/**
 * Messagerie dans la sidenav droite du shell : liste des conversations, puis conversation ouverte
 * (retour à la liste, appel, passage en plein écran) avec le même fil que la page /examples/app/chat.
 */
export function ChatPanel() {
  const { panelConv } = useExChat();
  const navigate = useNavigate();
  const [newMenu, setNewMenu] = useState<HTMLElement | null>(null);
  const c = exChat.conv(panelConv);
  const totalUnread = exChat.totalUnread();

  const full = (id: string) => {
    exChat.setPanelOpen(false);
    void navigate({ pathname: '/examples/app/chat', search: `?c=${id}` });
  };

  if (c) {
    const peer = exChat.peer(c);
    return (
      <div className="ex-chat-panel">
        <div className="panel">
          <header className="ph conv">
            <IconButton onClick={() => exChat.setPanelConv(null)} aria-label="Retour aux conversations">
              <MaterialIcon name="arrow_back" />
            </IconButton>
            {c.kind === 'direct' ? (
              <span className="ava" style={{ background: peer?.color }}>
                {chatInitials(exChat.title(c))}
                {peer?.online && <i />}
              </span>
            ) : (
              <span className="ava grp" style={{ background: c.color }}>
                <MaterialIcon name={c.icon ?? 'group'} />
              </span>
            )}
            <span className="who">
              <strong>
                {c.kind === 'channel' ? '# ' : ''}
                {exChat.title(c)}
              </strong>
              <small>
                {c.typing
                  ? exChat.person(c.typing).name.split(' ')[0] + ' écrit…'
                  : c.kind === 'direct'
                    ? peer?.online
                      ? 'En ligne'
                      : 'Hors ligne'
                    : c.members.length + ' membres'}
              </small>
            </span>
            <Tooltip title="Appel">
              <IconButton aria-label="Appel">
                <MaterialIcon name="call" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ouvrir en plein écran">
              <IconButton aria-label="Ouvrir en plein écran" onClick={() => full(c.id)}>
                <MaterialIcon name="open_in_full" />
              </IconButton>
            </Tooltip>
          </header>
          <ChatThread convId={c.id} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="ex-chat-panel">
      <div className="panel">
        <header className="ph">
          <strong>Messages</strong>
          {totalUnread > 0 && <span className="n">{totalUnread}</span>}
          <span className="spacer" />
          <Tooltip title="Nouvelle conversation">
            <IconButton aria-label="Nouvelle conversation" onClick={(e) => setNewMenu(e.currentTarget)}>
              <MaterialIcon name="edit_square" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={newMenu}
            open={!!newMenu}
            onClose={() => setNewMenu(null)}
            slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
          >
            {CHAT_CONTACTS.map((p) => (
              <MenuItem
                key={p.id}
                onClick={() => {
                  setNewMenu(null);
                  exChat.setPanelConv(exChat.startDirect(p.id));
                }}
              >
                <ListItemIcon>
                  <MaterialIcon name="person" />
                </ListItemIcon>
                {p.name}
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Ouvrir la messagerie">
            <IconButton
              component={Link}
              to="/examples/app/chat"
              aria-label="Ouvrir la messagerie"
              onClick={() => exChat.setPanelOpen(false)}
            >
              <MaterialIcon name="open_in_full" />
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => exChat.setPanelOpen(false)} aria-label="Fermer">
            <MaterialIcon name="close" />
          </IconButton>
        </header>
        <ChatList compact selected={null} onPick={(id) => exChat.setPanelConv(id)} />
      </div>
    </div>
  );
}
