import { Button, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { CommentComposer } from '../../../../components/content/CommentComposer';
import { StatusBadge } from '../../../../components/content/StatusBadge';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { ContextMenu, type ContextMenuItem } from '../../../../components/interaction/ContextMenu';
import { Kbd } from '../../../../components/interaction/Kbd';
import { useShortcuts } from '../../../../components/interaction/useInteractions';
import { useExampleShell } from '../../../../components/layout/exampleShellContext';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ME } from '../../../../data/static/content.data';
import { EX_MESSAGES, type ExMessage } from '../../../../data/static/examples.data';
import { hue, initials } from '../../exUtils';
import '../../ex-page.scss';
import './inbox.scss';

type Msg = ExMessage & { archived?: boolean };

const FOLDERS = [
  { id: 'inbox', label: 'Boîte de réception', icon: 'inbox' },
  { id: 'starred', label: 'Suivis', icon: 'star_border' },
  { id: 'sent', label: 'Envoyés', icon: 'send' },
  { id: 'drafts', label: 'Brouillons', icon: 'drafts' },
  { id: 'archive', label: 'Archives', icon: 'archive' },
];
const LABELS = [
  ...new Map(EX_MESSAGES.flatMap((m) => (m.label ? [m.label] : [])).map((l) => [l.text, l] as const)).values(),
];
const MENU: ContextMenuItem[] = [
  { id: 'read', label: 'Marquer comme lu / non lu', icon: 'mark_email_unread' },
  { id: 'star', label: 'Suivre', icon: 'star_border', shortcut: 's' },
  { id: 'archive', label: 'Archiver', icon: 'archive', shortcut: 'e' },
  { divider: true },
  { id: 'delete', label: 'Supprimer', icon: 'delete', danger: true },
];

/**
 * /examples/app/inbox — maître / détail : dossiers, liste (clic droit = menu contextuel), lecture et réponse ;
 * raccourcis J / K / E / S ; une colonne à la fois sur mobile.
 */
export function InboxPage() {
  useExampleShell({ flush: true });
  const snack = useSnackbar();
  const [folder, setFolder] = useState('inbox');
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [all, setAll] = useState<Msg[]>(() => EX_MESSAGES.map((m) => ({ ...m })));
  /** Sur desktop, le premier message est ouvert d'emblée ; sur mobile, on commence par la liste. */
  const [current, setCurrent] = useState<ExMessage | null>(() =>
    window.innerWidth >= 768 ? (EX_MESSAGES[0] ?? null) : null,
  );

  const folderLabel = FOLDERS.find((f) => f.id === folder)?.label ?? '';
  const unreadCount = all.filter((m) => m.unread && !m.archived).length;
  const messages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (m) =>
        (folder === 'archive' ? m.archived : !m.archived) &&
        (folder !== 'starred' || m.starred) &&
        (folder === 'inbox' || folder === 'starred' || folder === 'archive') &&
        (!unreadOnly || m.unread) &&
        (!q || (m.from + m.subject + m.preview).toLowerCase().includes(q)),
    );
  }, [all, folder, query, unreadOnly]);
  const index = messages.findIndex((m) => m.id === current?.id);

  const count = (f: string) => (f === 'inbox' ? unreadCount : f === 'drafts' ? 1 : 0);
  const patch = (id: string, p: Partial<Msg>) => setAll((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const open = (m: ExMessage) => {
    patch(m.id, { unread: false });
    setCurrent({ ...m, unread: false });
  };
  const step = (d: number) => {
    const next = messages[Math.min(messages.length - 1, Math.max(0, index + d))];
    if (next) open(next);
  };
  const star = (m: ExMessage) => {
    patch(m.id, { starred: !m.starred });
    setCurrent((c) => (c?.id === m.id ? { ...c, starred: !m.starred } : c));
  };
  const markUnread = (m: ExMessage) => {
    patch(m.id, { unread: true });
    setCurrent(null);
  };
  const archive = (m: ExMessage) => {
    // Le message suivant prend la place de celui qu'on archive.
    const rest = messages.filter((x) => x.id !== m.id);
    patch(m.id, { archived: true });
    setCurrent(rest[Math.min(index, rest.length - 1)] ?? null);
    snack('Conversation archivée', { action: 'OK', duration: 2500 });
  };
  const remove = (m: ExMessage) => {
    setAll((l) => l.filter((x) => x.id !== m.id));
    setCurrent(null);
    snack('Conversation supprimée', { action: 'OK', duration: 2500 });
  };
  const reply = (m: ExMessage) => snack(`Réponse envoyée à ${m.from}`, { action: 'OK', duration: 2500 });
  const onMenu = (m: Msg, item: ContextMenuItem) => {
    if (item.id === 'read') patch(m.id, { unread: !m.unread });
    if (item.id === 'star') star(m);
    if (item.id === 'archive') archive(m);
    if (item.id === 'delete') remove(m);
  };

  // Les raccourcis sont enregistrés une fois : ils passent par une référence à jour.
  const live = useRef({ step, archive, star, current });
  live.current = { step, archive, star, current };
  useShortcuts(() => [
    { keys: 'j', description: 'Message suivant', group: 'Messagerie', action: () => live.current.step(1) },
    { keys: 'k', description: 'Message précédent', group: 'Messagerie', action: () => live.current.step(-1) },
    {
      keys: 'e',
      description: 'Archiver',
      group: 'Messagerie',
      action: () => live.current.current && live.current.archive(live.current.current),
    },
    {
      keys: 's',
      description: 'Suivre / ne plus suivre',
      group: 'Messagerie',
      action: () => live.current.current && live.current.star(live.current.current),
    },
  ]);

  return (
    <div className="ex-page ex-inbox">
      <div className={`split${current ? ' reading' : ''}`}>
        <nav className="folders" aria-label="Dossiers">
          <Button variant="contained" disableElevation className="compose" startIcon={<MaterialIcon name="edit" />}>
            Nouveau message
          </Button>
          {FOLDERS.map((f) => (
            <button key={f.id} className={`folder${folder === f.id ? ' on' : ''}`} onClick={() => setFolder(f.id)}>
              <MaterialIcon name={f.icon} />
              <span>{f.label}</span>
              {count(f.id) > 0 && <b>{count(f.id)}</b>}
            </button>
          ))}
          <span className="f-section">Libellés</span>
          {LABELS.map((l) => (
            <button key={l.text} className="folder">
              <i className="dot" style={{ background: `var(--${l.color}-color)` }} />
              <span>{l.text}</span>
            </button>
          ))}
        </nav>

        <section className="list" aria-label="Messages">
          <div className="list-head">
            <h1>{folderLabel}</h1>
            <label className="searchbox">
              <MaterialIcon name="search" />
              <input type="search" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <ToggleButtonGroup
              className="seg ex-seg"
              exclusive
              value={unreadOnly}
              onChange={(_, v: boolean | null) => v !== null && setUnreadOnly(v)}
            >
              <ToggleButton value={false}>Tous</ToggleButton>
              <ToggleButton value={true}>Non lus · {unreadCount}</ToggleButton>
            </ToggleButtonGroup>
          </div>
          <div className="items">
            {messages.map((m) => (
              <ContextMenu key={m.id} items={MENU} onSelect={(it) => onMenu(m, it)}>
                <button
                  type="button"
                  className={`item${current?.id === m.id ? ' on' : ''}${m.unread ? ' unread' : ''}`}
                  onClick={() => open(m)}
                >
                  <span className="ava" style={{ background: hue(m.from) }}>
                    {initials(m.from)}
                  </span>
                  <span className="i-body">
                    <span className="i-top">
                      <strong>{m.from}</strong>
                      <time>{m.at}</time>
                    </span>
                    <span className="i-subject">{m.subject}</span>
                    <span className="i-preview">{m.preview}</span>
                    {(m.label || !!m.attachments?.length || m.starred) && (
                      <span className="i-tags">
                        {m.label && <StatusBadge label={m.label.text} color={m.label.color} />}
                        {!!m.attachments?.length && (
                          <Tooltip title="Pièce jointe">
                            <span className="i-ic">
                              <MaterialIcon name="attach_file" />
                            </span>
                          </Tooltip>
                        )}
                        {m.starred && (
                          <Tooltip title="Suivi">
                            <span className="i-ic">
                              <MaterialIcon name="star" className="star" />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </ContextMenu>
            ))}
            {messages.length === 0 && (
              <EmptyState icon="inbox" title="Rien ici" subtitle="Aucun message ne correspond." />
            )}
          </div>
        </section>

        <article className="reader">
          {current ? (
            <>
              <header className="r-bar">
                <IconButton className="r-back" onClick={() => setCurrent(null)} aria-label="Retour">
                  <MaterialIcon name="arrow_back" />
                </IconButton>
                <Tooltip title="Archiver (E)">
                  <IconButton onClick={() => archive(current)} aria-label="Archiver">
                    <MaterialIcon name="archive" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton onClick={() => remove(current)} aria-label="Supprimer">
                    <MaterialIcon name="delete" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Marquer comme non lu">
                  <IconButton onClick={() => markUnread(current)} aria-label="Marquer comme non lu">
                    <MaterialIcon name="mark_email_unread" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={current.starred ? 'Ne plus suivre (S)' : 'Suivre (S)'}>
                  <IconButton onClick={() => star(current)} aria-label="Suivre">
                    <MaterialIcon
                      name={current.starred ? 'star' : 'star_border'}
                      className={current.starred ? 'star' : ''}
                    />
                  </IconButton>
                </Tooltip>
                <span className="spacer" />
                <span className="pos">
                  {index + 1} sur {messages.length}
                </span>
                <Tooltip title="Précédent (K)">
                  <span>
                    <IconButton onClick={() => step(-1)} disabled={index <= 0} aria-label="Message précédent">
                      <MaterialIcon name="chevron_left" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Suivant (J)">
                  <span>
                    <IconButton
                      onClick={() => step(1)}
                      disabled={index >= messages.length - 1}
                      aria-label="Message suivant"
                    >
                      <MaterialIcon name="chevron_right" />
                    </IconButton>
                  </span>
                </Tooltip>
              </header>
              <div className="r-body">
                <h2>{current.subject}</h2>
                <div className="r-from">
                  <span className="ava" style={{ background: hue(current.from) }}>
                    {initials(current.from)}
                  </span>
                  <span className="grow">
                    <strong>{current.from}</strong>
                    <small>{current.email} · à moi</small>
                  </span>
                  <time>{current.at}</time>
                </div>
                <div className="r-text">
                  {current.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {!!current.attachments?.length && (
                  <div className="files">
                    {current.attachments.map((a) => (
                      <a key={a} className="file" href="#" onClick={(e) => e.preventDefault()}>
                        <img src="/assets/icons-files/pdf.png" alt="" />
                        <span>
                          <strong>{a}</strong>
                          <small>PDF · 248 Ko</small>
                        </span>
                        <MaterialIcon name="download" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <footer className="r-reply">
                <CommentComposer
                  key={current.id}
                  author={ME}
                  placeholder={`Répondre à ${current.from.split(' ')[0]}…`}
                  submitLabel="Envoyer"
                  maxLength={2000}
                  compact
                  onSubmit={() => reply(current)}
                />
              </footer>
            </>
          ) : (
            <div className="r-empty">
              <EmptyState
                icon="drafts"
                title="Aucun message sélectionné"
                subtitle="Choisissez une conversation dans la liste."
              />
              <p className="hint">
                <Kbd keys="j" /> <Kbd keys="k" /> pour naviguer · <Kbd keys="shift+?" /> tous les raccourcis
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
