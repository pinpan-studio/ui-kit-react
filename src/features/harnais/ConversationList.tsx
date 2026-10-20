import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { HARNAIS_GROUPS, type HarnaisConversation } from '../../data/static/harnais.data';
import { CURRENT_USER, initials } from '../../lib/session';
import './conversation-list.scss';
import './harnais-menu.scss';

const USER = { ...CURRENT_USER, role: 'Administrateur' };
const INITIALS = initials(USER.fullname).toUpperCase();

/** Colonne gauche : nouvelle conversation, recherche, épinglées, historique groupé par période, utilisateur. */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onTogglePin,
  onRemove,
  onCollapse,
}: {
  conversations: HarnaisConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
  onCollapse: () => void;
}) {
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<{ el: HTMLElement; c: HarnaisConversation } | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
  const pinned = filtered.filter((c) => c.pinned);
  const groups = HARNAIS_GROUPS.map((label) => ({
    label,
    items: filtered.filter((c) => !c.pinned && c.group === label),
  })).filter((g) => g.items.length > 0);

  const row = (c: HarnaisConversation) => (
    <div key={c.id} className={`item${c.id === activeId ? ' active' : ''}`}>
      <button
        type="button"
        className="item-main"
        onClick={() => onSelect(c.id)}
        aria-current={c.id === activeId ? 'page' : undefined}
      >
        <span className="item-title">{c.title}</span>
        {c.project && <span className="item-project">{c.project}</span>}
      </button>
      <IconButton
        className="item-more"
        aria-label="Actions"
        aria-expanded={menu?.c.id === c.id}
        onClick={(e) => setMenu({ el: e.currentTarget, c })}
      >
        <MaterialIcon name="more_horiz" />
      </IconButton>
    </div>
  );

  return (
    <div className="hz-conv-list">
      <div className="head">
        <div className="brand">
          <span className="logo">
            <MaterialIcon name="auto_awesome" />
          </span>
          <span className="title">Harnais</span>
        </div>
        <Tooltip title="Masquer l'historique">
          <IconButton className="icon-btn" aria-label="Masquer l'historique" onClick={onCollapse}>
            <MaterialIcon name="menu_open" />
          </IconButton>
        </Tooltip>
      </div>

      <button type="button" className="new-btn" onClick={onCreate}>
        <MaterialIcon name="add" />
        <span>Nouvelle conversation</span>
        <kbd>⌘K</kbd>
      </button>

      <label className="search">
        <MaterialIcon name="search" />
        <input
          type="search"
          placeholder="Rechercher"
          aria-label="Rechercher une conversation"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <nav className="list" aria-label="Conversations">
        {pinned.length > 0 && (
          <>
            <div className="group-label">
              <MaterialIcon name="push_pin" />
              Épinglées
            </div>
            {pinned.map(row)}
          </>
        )}
        {groups.map((g) => (
          <div key={g.label} style={{ display: 'contents' }}>
            <div className="group-label">{g.label}</div>
            {g.items.map(row)}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty">
            <MaterialIcon name="search_off" />
            Aucune conversation pour « {query} »
          </div>
        )}
      </nav>

      <div className="me">
        <span className="me-avatar">{INITIALS}</span>
        <span className="me-text">
          <span className="me-name">{USER.fullname}</span>
          <span className="me-role">{USER.role}</span>
        </span>
      </div>

      <Menu
        anchorEl={menu?.el}
        open={!!menu}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: 'harnais-menu' } }}
      >
        <MenuItem
          onClick={() => {
            if (menu) onTogglePin(menu.c.id);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <MaterialIcon name="push_pin" />
          </ListItemIcon>
          {menu?.c.pinned ? 'Désépingler' : 'Épingler'}
        </MenuItem>
        <MenuItem disabled>
          <ListItemIcon>
            <MaterialIcon name="edit" />
          </ListItemIcon>
          Renommer
        </MenuItem>
        <Divider />
        <MenuItem
          className="danger"
          onClick={() => {
            if (menu) onRemove(menu.c.id);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <MaterialIcon name="delete" />
          </ListItemIcon>
          Supprimer
        </MenuItem>
      </Menu>
    </div>
  );
}
