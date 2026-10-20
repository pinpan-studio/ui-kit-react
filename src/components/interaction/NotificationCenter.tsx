import { ClickAwayListener, Popper, Tooltip } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { ago } from './ago';
import './interaction.scss';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  at: string | Date;
  read?: boolean;
  icon?: string;
  tone?: string;
  category?: string;
  actions?: { id: string; label: string; primary?: boolean }[];
  avatar?: string;
}

/** Centre de notifications (app-notification-center) : cloche + compteur, onglets, groupes par jour, actions. */
export function NotificationCenter({
  notifications,
  settings = true,
  footer = 'Voir toutes les notifications',
  onOpen,
  onAction,
  onSettings,
  onViewAll,
}: {
  notifications: AppNotification[];
  settings?: boolean;
  footer?: string;
  onOpen?: (n: AppNotification) => void;
  onAction?: (e: { notification: AppNotification; action: string }) => void;
  onSettings?: () => void;
  onViewAll?: () => void;
}) {
  const [list, setList] = useState(() => notifications.map((n) => ({ ...n })));
  const [opened, setOpened] = useState(false);
  const [tab, setTab] = useState('all');
  const [ping, setPing] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const seen = useRef(new Set<string>());

  // Comme le linkedSignal Angular : l'état local suit l'entrée ; animation de la pastille à l'arrivée.
  useEffect(() => {
    setList(notifications.map((n) => ({ ...n })));
    const fresh = seen.current.size > 0 && notifications.some((n) => !n.read && !seen.current.has(n.id));
    notifications.forEach((n) => seen.current.add(n.id));
    if (fresh) {
      setPing(false);
      const t = setTimeout(() => setPing(true));
      return () => clearTimeout(t);
    }
  }, [notifications]);
  useEffect(() => {
    if (!opened) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpened(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [opened]);

  const unread = list.filter((n) => !n.read).length;
  const tabs = useMemo(() => {
    const cats = [...new Set(list.map((n) => n.category).filter((c): c is string => !!c))];
    return [
      { id: 'all', label: 'Toutes', count: 0 },
      { id: 'unread', label: 'Non lues', count: unread },
      ...cats.map((c) => ({ id: 'cat:' + c, label: c, count: list.filter((n) => n.category === c && !n.read).length })),
    ];
  }, [list, unread]);
  const groups = useMemo(() => {
    const items = list
      .filter((n) => tab === 'all' || (tab === 'unread' ? !n.read : n.category === tab.slice(4)))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
    const today = new Date().toDateString();
    const yest = new Date(Date.now() - 864e5).toDateString();
    const map = new Map<string, AppNotification[]>();
    for (const n of items) {
      const d = new Date(n.at).toDateString();
      const label = d === today ? 'Aujourd’hui' : d === yest ? 'Hier' : 'Plus ancien';
      map.set(label, [...(map.get(label) ?? []), n]);
    }
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [list, tab]);

  const markRead = (n: AppNotification) =>
    !n.read && setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  const markAll = () => setList((l) => l.map((x) => ({ ...x, read: true })));
  const remove = (n: AppNotification) => setList((l) => l.filter((x) => x.id !== n.id));
  const openItem = (n: AppNotification) => {
    markRead(n);
    onOpen?.(n);
  };

  return (
    <span className="nc-host">
      <Tooltip title="Notifications">
        <button
          type="button"
          ref={setAnchor}
          className={`nc-bell${opened ? ' on' : ''}`}
          onClick={() => setOpened((o) => !o)}
          aria-label={`Notifications, ${unread} non lues`}
        >
          <MaterialIcon name={unread ? 'notifications_active' : 'notifications'} />
          {!!unread && <span className={`nc-count${ping ? ' ping' : ''}`}>{unread > 99 ? '99+' : unread}</span>}
        </button>
      </Tooltip>
      <Popper
        open={opened}
        anchorEl={anchor}
        placement="bottom-end"
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'flip', options: { fallbackPlacements: ['bottom-start'] } },
        ]}
      >
        <ClickAwayListener onClickAway={(e) => !anchor?.contains(e.target as Node) && setOpened(false)}>
          <div className="kit-notif" role="dialog" aria-label="Notifications">
            <div className="nf-head">
              <strong>Notifications</strong>
              {!!unread && <span className="nf-badge">{unread}</span>}
              <span className="spacer" />
              <Tooltip title="Tout marquer comme lu">
                <span>
                  <button
                    type="button"
                    className="nf-icon"
                    onClick={markAll}
                    disabled={!unread}
                    aria-label="Tout marquer comme lu"
                  >
                    <MaterialIcon name="done_all" />
                  </button>
                </span>
              </Tooltip>
              {settings && (
                <Tooltip title="Préférences">
                  <button type="button" className="nf-icon" onClick={onSettings} aria-label="Préférences">
                    <MaterialIcon name="settings" />
                  </button>
                </Tooltip>
              )}
            </div>
            <div className="nf-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? 'on' : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {!!t.count && <em>{t.count}</em>}
                </button>
              ))}
            </div>
            <div className="nf-list">
              {groups.map((g) => (
                <div key={g.label} style={{ display: 'contents' }}>
                  <div className="nf-day">{g.label}</div>
                  {g.items.map((n) => (
                    <div
                      key={n.id}
                      className={`nf-item${n.read ? '' : ' unread'}`}
                      onClick={() => openItem(n)}
                      onKeyDown={(e) => e.key === 'Enter' && openItem(n)}
                      role="button"
                      tabIndex={0}
                    >
                      {n.avatar ? (
                        <span className="nf-av">{n.avatar}</span>
                      ) : (
                        <span
                          className="nf-ic"
                          style={{ '--tone': `var(--${n.tone || 'primary'}-color)` } as React.CSSProperties}
                        >
                          <MaterialIcon name={n.icon || 'notifications'} />
                        </span>
                      )}
                      <div className="nf-body">
                        <div className="nf-title">{n.title}</div>
                        {n.message && <div className="nf-msg">{n.message}</div>}
                        {!!n.actions?.length && (
                          <div className="nf-actions">
                            {n.actions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                className={a.primary ? 'primary' : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAction?.({ notification: n, action: a.id });
                                  markRead(n);
                                }}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="nf-time">
                          {ago(n.at)}
                          {n.category && ` · ${n.category}`}
                        </span>
                      </div>
                      <div className="nf-side">
                        {!n.read && (
                          <Tooltip title="Marquer comme lu">
                            <span
                              className="nf-dot"
                              aria-label="Marquer comme lu"
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(n);
                              }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="Supprimer">
                          <button
                            type="button"
                            className="nf-del"
                            aria-label="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(n);
                            }}
                          >
                            <MaterialIcon name="close" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {!groups.length && (
                <div className="nf-empty">
                  <MaterialIcon name={tab === 'unread' ? 'mark_email_read' : 'notifications_off'} />
                  <strong>{tab === 'unread' ? 'Vous êtes à jour' : 'Aucune notification'}</strong>
                  <span>
                    {tab === 'unread'
                      ? 'Toutes les notifications ont été lues.'
                      : 'Les nouvelles notifications apparaîtront ici.'}
                  </span>
                </div>
              )}
            </div>
            {footer && (
              <button
                type="button"
                className="nf-foot"
                onClick={() => {
                  onViewAll?.();
                  setOpened(false);
                }}
              >
                {footer}
                <MaterialIcon name="arrow_forward" />
              </button>
            )}
          </div>
        </ClickAwayListener>
      </Popper>
    </span>
  );
}
