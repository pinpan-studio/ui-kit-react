import { useState } from 'react';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ME_ID, chatInitials, exChat, useExChat } from './exChatStore';
import './chat-list.scss';

type Filter = 'all' | 'unread' | 'groups';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'unread', label: 'Non lus' },
  { id: 'groups', label: 'Groupes' },
];

const when = (d?: Date) => {
  if (!d) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d >= today) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (d >= y) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/** Liste des conversations : recherche, filtres, épinglées en tête, présence, aperçu, heure, non-lus, « écrit… ». */
export function ChatList({
  selected = null,
  compact = false,
  onPick,
}: {
  selected?: string | null;
  compact?: boolean;
  onPick: (id: string) => void;
}) {
  const { conversations } = useExChat();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const totalUnread = exChat.totalUnread();

  const query = q.trim().toLowerCase();
  const list = conversations
    .filter((c) => (filter !== 'unread' || c.unread) && (filter !== 'groups' || c.kind !== 'direct'))
    .filter(
      (c) =>
        !query ||
        exChat.title(c).toLowerCase().includes(query) ||
        c.messages.some((m) => m.text?.toLowerCase().includes(query)),
    )
    .sort((a, b) => +(exChat.last(b)?.at ?? 0) - +(exChat.last(a)?.at ?? 0));
  const groups = [
    { label: 'Épinglées', items: list.filter((c) => c.pinned) },
    { label: 'Conversations', items: list.filter((c) => !c.pinned) },
  ];

  return (
    <div className={`ex-chat-list${compact ? ' compact' : ''}`}>
      <div className="head">
        <label className="searchbox">
          <MaterialIcon name="search" />
          <input type="search" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              className={filter === f.id ? 'on' : ''}
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === 'unread' && totalUnread > 0 && <b>{totalUnread}</b>}
            </button>
          ))}
        </div>
      </div>
      <div className="items">
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.label}>
                <span className="sec">{g.label}</span>
                {g.items.map((c) => {
                  const last = exChat.last(c);
                  const peer = exChat.peer(c);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`item${c.id === selected ? ' on' : ''}${c.unread ? ' unread' : ''}`}
                      onClick={() => onPick(c.id)}
                    >
                      <span className="av">
                        {c.kind === 'direct' ? (
                          <>
                            <span className="ava" style={{ background: peer?.color }}>
                              {chatInitials(exChat.title(c))}
                            </span>
                            {peer?.online && <i className="online" />}
                          </>
                        ) : (
                          <span className="ava grp" style={{ background: c.color }}>
                            <MaterialIcon name={c.icon ?? 'group'} />
                          </span>
                        )}
                      </span>
                      <span className="body">
                        <span className="top">
                          <strong>
                            {c.kind === 'channel' ? '# ' : ''}
                            {exChat.title(c)}
                          </strong>
                          {c.muted && <MaterialIcon name="notifications_off" className="mini" />}
                          <time>{when(last?.at)}</time>
                        </span>
                        <span className="bottom">
                          {c.typing ? (
                            <em>{exChat.person(c.typing).name.split(' ')[0]} écrit…</em>
                          ) : (
                            <span className="pv">
                              {last && last.from === ME_ID ? (
                                <MaterialIcon
                                  name={last.status === 'sent' || last.status === 'sending' ? 'done' : 'done_all'}
                                  className={`mini${last.status === 'read' ? ' read' : ''}`}
                                />
                              ) : (
                                last &&
                                c.kind !== 'direct' &&
                                !last.system &&
                                `${exChat.person(last.from).name.split(' ')[0]} : `
                              )}
                              {exChat.preview(last)}
                            </span>
                          )}
                          {c.unread ? (
                            <b className={`badge${c.muted ? ' muted' : ''}`}>{c.unread}</b>
                          ) : (
                            c.pinned && <MaterialIcon name="push_pin" className="mini" />
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ),
        )}
        {list.length === 0 && <p className="none">Aucune conversation.</p>}
      </div>
    </div>
  );
}
