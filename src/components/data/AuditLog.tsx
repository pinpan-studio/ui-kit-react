import { toneIcon } from '../../theme/toneInk';
import { useState, type CSSProperties } from 'react';
import { Tip } from '../fields/Tip';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { AuditAction, AuditEntry } from './auditTypes';
import './audit-log.scss';

const ACTIONS: Record<AuditAction, { label: string; icon: string; tone: string }> = {
  create: { label: 'a créé', icon: 'add_circle', tone: 'success' },
  update: { label: 'a modifié', icon: 'edit', tone: 'info' },
  delete: { label: 'a supprimé', icon: 'delete', tone: 'error' },
  status: { label: 'a changé le statut de', icon: 'swap_horiz', tone: 'warning' },
  comment: { label: 'a commenté', icon: 'chat', tone: 'purple' },
  login: { label: 's’est connecté', icon: 'login', tone: 'primary' },
  export: { label: 'a exporté', icon: 'download', tone: 'primary' },
};
const ACTION_NAME: Record<AuditAction, string> = {
  create: 'Créations',
  update: 'Modifications',
  delete: 'Suppressions',
  status: 'Statuts',
  comment: 'Commentaires',
  login: 'Connexions',
  export: 'Exports',
};
const initials = (u: { name: string; initials?: string }) =>
  u.initials ??
  u.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
const isNone = (v: unknown) => v === null || v === undefined || v === '';
const fmt = (v: unknown): string => {
  if (isNone(v)) return 'vide';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (typeof v === 'number') return v.toLocaleString('fr-FR');
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};
const hhmm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const longDate = (d: Date) =>
  `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${d.toLocaleTimeString('fr-FR')}`;

/** app-audit-log : fil chronologique groupé par jour, filtres action / auteur, détail « avant → après » repliable. */
export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const [action, setAction] = useState<AuditAction | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const used = [...new Set(entries.map((e) => e.action))];
  const users = [...new Map(entries.map((e) => [e.user.name, e.user])).values()];
  const filtered = entries
    .filter((e) => (!action || e.action === action) && (!user || e.user.name === user))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const map = new Map<string, AuditEntry[]>();
  for (const e of filtered) {
    const k = new Date(e.at).toDateString();
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  const today = new Date().toDateString(),
    yest = new Date(Date.now() - 864e5).toDateString();
  const groups = [...map.entries()].map(([day, items]) => ({
    day,
    items,
    label:
      day === today
        ? 'Aujourd’hui'
        : day === yest
          ? 'Hier'
          : new Date(day).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
  }));
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="app-audit-log">
      <div className="al-filters">
        <button type="button" className={`chip${!action ? ' on' : ''}`} onClick={() => setAction(null)}>
          Tout <em>{entries.length}</em>
        </button>
        {used.map((a) => (
          <button
            key={a}
            type="button"
            className={`chip${action === a ? ' on' : ''}`}
            onClick={() => setAction(action === a ? null : a)}
          >
            <MaterialIcon name={ACTIONS[a].icon} style={{ color: toneIcon(`var(--${ACTIONS[a].tone}-color)`) }} />
            {ACTION_NAME[a]}
            <em>{entries.filter((e) => e.action === a).length}</em>
          </button>
        ))}
        <span className="spacer" />
        <div className="al-users">
          {users.map((u) => (
            <Tip key={u.name} title={u.name}>
              <button
                type="button"
                className={`av${user && user !== u.name ? ' off' : ''}`}
                style={{ background: u.color || 'var(--primary-color)' }}
                onClick={() => setUser(user === u.name ? null : u.name)}
              >
                {initials(u)}
              </button>
            </Tip>
          ))}
        </div>
      </div>
      {groups.map((g) => (
        <div key={g.day} style={{ display: 'contents' }}>
          <div className="al-day">{g.label}</div>
          <ol className="al-list">
            {g.items.map((e) => {
              const d = new Date(e.at);
              const isOpen = open.has(e.id);
              return (
                <li key={e.id} className="al-item">
                  <span
                    className="al-dot"
                    style={
                      {
                        '--tone': `var(--${ACTIONS[e.action].tone}-color)`,
                        '--tone-icon': toneIcon(`var(--${ACTIONS[e.action].tone}-color)`),
                      } as CSSProperties
                    }
                  >
                    <MaterialIcon name={ACTIONS[e.action].icon} />
                  </span>
                  <div className="al-main">
                    <div className="al-line">
                      <span className="av sm" style={{ background: e.user.color || 'var(--primary-color)' }}>
                        {initials(e.user)}
                      </span>
                      <span>
                        <strong>{e.user.name}</strong> {ACTIONS[e.action].label}{' '}
                        {e.target && <strong className="tgt">{e.target}</strong>}
                      </span>
                      <span className="spacer" />
                      <Tip title={longDate(d)}>
                        <time dateTime={d.toISOString()}>{hhmm(d)}</time>
                      </Tip>
                    </div>
                    {e.comment && <blockquote>{e.comment}</blockquote>}
                    {!!e.changes?.length && (
                      <>
                        <button type="button" className="al-toggle" onClick={() => toggle(e.id)}>
                          <MaterialIcon name="chevron_right" className={isOpen ? 'open' : undefined} />
                          {e.changes.length} champ(s) modifié(s)
                          {!isOpen && (
                            <>
                              {' '}
                              <span className="muted">· {e.changes.map((c) => c.label || c.field).join(', ')}</span>
                            </>
                          )}
                        </button>
                        {isOpen && (
                          <table className="al-changes">
                            <thead>
                              <tr>
                                <th>Champ</th>
                                <th>Avant</th>
                                <th />
                                <th>Après</th>
                              </tr>
                            </thead>
                            <tbody>
                              {e.changes.map((c) => (
                                <tr key={c.field}>
                                  <td className="f">{c.label || c.field}</td>
                                  <td>
                                    <span className={`old${isNone(c.before) ? ' none' : ''}`}>{fmt(c.before)}</span>
                                  </td>
                                  <td className="arrow">
                                    <MaterialIcon name="arrow_forward" />
                                  </td>
                                  <td>
                                    <span className={`new${isNone(c.after) ? ' none' : ''}`}>{fmt(c.after)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}
                    {e.meta && (
                      <span className="al-meta">
                        <MaterialIcon name="devices" />
                        {e.meta}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      {!groups.length && (
        <div className="al-empty">
          <MaterialIcon name="history" />
          Aucune activité pour ce filtre.
        </div>
      )}
    </div>
  );
}
