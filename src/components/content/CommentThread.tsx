import { Button, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { markdownToHtml } from '../../lib/markdown';
import { MaterialIcon } from '../ui/MaterialIcon';
import { CommentComposer } from './CommentComposer';
import { countComments, nameInitials, type CommentAuthor, type CommentItem } from './contentModels';
import './comment-thread.scss';

type SortMode = 'top' | 'new' | 'old';
const SORT_LABELS: Record<SortMode, string> = { top: 'Les plus pertinents', new: 'Plus récents', old: 'Plus anciens' };
const SORT_MODES = Object.keys(SORT_LABELS) as SortMode[];
const EMOJIS = ['👍', '❤️', '🎉', '😄', '🤔', '👀'];

/** Markdown + mise en évidence des @mentions. */
const render = (text: string) =>
  markdownToHtml(text).replace(/(^|[\s>(])@([\p{L}][\p{L}-]*)/gu, '$1<span class="mention">@$2</span>');

/**
 * Fil de commentaires : saisie, tri, réponses imbriquées (2 niveaux), j'aime, réactions,
 * épinglage, modification et suppression de ses propres messages. État local (aucun backend) ;
 * chaque changement est aussi émis via `onChange` pour l'hôte.
 */
export function CommentThread({
  comments = [],
  me = null,
  mentionables = [],
  title = 'Commentaires',
  compact = false,
  moderator = false,
  visibleReplies = 2,
  onChange,
}: {
  comments?: CommentItem[];
  me?: CommentAuthor | null;
  mentionables?: CommentAuthor[];
  title?: string;
  /** Variante resserrée (fil d'actualité, panneau latéral) : pas d'en-tête, saisie en bas. */
  compact?: boolean;
  /** Le lecteur peut épingler (modérateur). */
  moderator?: boolean;
  /** Réponses affichées avant « Afficher N réponses ». */
  visibleReplies?: number;
  onChange?: (list: CommentItem[]) => void;
}) {
  /** Copie locale modifiable, réinitialisée si l'hôte fournit une nouvelle liste. */
  const [list, setList] = useState<CommentItem[]>(() => structuredClone(comments));
  useEffect(() => setList(structuredClone(comments)), [comments]);
  const [sort, setSort] = useState<SortMode>('top');
  const [replyTo, setReplyTo] = useState<{ root: string; target: CommentItem } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [sortMenu, setSortMenu] = useState<HTMLElement | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; c: CommentItem; depth: number } | null>(null);
  const [emoMenu, setEmoMenu] = useState<{ el: HTMLElement; c: CommentItem } | null>(null);

  const total = countComments(list);
  const sorted = useMemo(() => {
    const pinned = (c: CommentItem) => (c.pinned ? 1 : 0);
    const idx = new Map(list.map((c, i) => [c.id, i]));
    const order: Record<SortMode, (a: CommentItem, b: CommentItem) => number> = {
      top: (a, b) =>
        pinned(b) - pinned(a) || b.likes + (b.replies?.length ?? 0) * 2 - (a.likes + (a.replies?.length ?? 0) * 2),
      new: (a, b) => pinned(b) - pinned(a) || (idx.get(b.id) ?? 0) - (idx.get(a.id) ?? 0),
      old: (a, b) => pinned(b) - pinned(a) || (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0),
    };
    return [...list].sort(order[sort]);
  }, [list, sort]);

  const isMine = (c: CommentItem) => !!me && c.author.name === me.name;
  // Les changements « publiés » (ajout, réponse, édition, suppression, épinglage) sont émis après rendu.
  const pendingEmit = useRef(false);
  useEffect(() => {
    if (!pendingEmit.current) return;
    pendingEmit.current = false;
    onChange?.(list);
  }, [list, onChange]);
  const update = (fn: (l: CommentItem[]) => CommentItem[], emit = true) => {
    if (emit) pendingEmit.current = true;
    setList(fn);
  };
  const patch = (id: string, fn: (c: CommentItem) => CommentItem, emit = false) => {
    const walk = (l: CommentItem[]): CommentItem[] =>
      l.map((x) => (x.id === id ? fn(x) : x.replies ? { ...x, replies: walk(x.replies) } : x));
    update(walk, emit);
  };
  const highlight = (id: string) => {
    setFlash(id);
    setTimeout(() => setFlash(null), 1600);
  };
  const create = (text: string): CommentItem => ({
    id: 'n' + Date.now().toString(36),
    author: me ?? { name: 'Invité' },
    text,
    at: 'À l’instant',
    likes: 0,
  });

  const add = (text: string) => {
    const c = create(text);
    // Le nouveau commentaire s'affiche en tête quel que soit le tri.
    update((l) => [c, ...l]);
    if (sort === 'old') setSort('new');
    highlight(c.id);
  };
  const reply = (parent: CommentItem, text: string) => {
    const c = create(text);
    update((l) => l.map((x) => (x.id === parent.id ? { ...x, replies: [...(x.replies ?? []), c] } : x)));
    setExpanded((s) => new Set(s).add(parent.id));
    setReplyTo(null);
    highlight(c.id);
  };
  /** Préfixe de réponse : mentionne l'auteur quand on répond à une réponse. */
  const replyPrefix = (c: CommentItem, root: CommentItem) =>
    c.id === root.id || isMine(c) ? '' : `@${c.author.name.replace(/\s+/g, '-')} `;
  const edit = (c: CommentItem, text: string) => {
    patch(c.id, (x) => ({ ...x, text, edited: true }), true);
    setEditing(null);
  };
  const remove = (c: CommentItem) => {
    const drop = (l: CommentItem[]): CommentItem[] =>
      l.flatMap((x): CommentItem[] =>
        x.id === c.id
          ? x.replies?.length
            ? [{ ...x, deleted: true, text: '' }]
            : []
          : [{ ...x, replies: x.replies ? drop(x.replies) : x.replies }],
      );
    update(drop);
  };
  const like = (c: CommentItem) => patch(c.id, (x) => ({ ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }));
  const react = (c: CommentItem, emoji: string) =>
    patch(c.id, (x) => {
      const r = [...(x.reactions ?? [])];
      const i = r.findIndex((e) => e.emoji === emoji);
      if (i < 0) r.push({ emoji, count: 1, mine: true });
      else {
        const e = r[i] as (typeof r)[number];
        const next = { ...e, mine: !e.mine, count: e.count + (e.mine ? -1 : 1) };
        if (next.count) r[i] = next;
        else r.splice(i, 1);
      }
      return { ...x, reactions: r };
    });
  const pin = (c: CommentItem) => update((l) => l.map((x) => ({ ...x, pinned: x.id === c.id ? !x.pinned : false })));
  const toggleReplies = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const shownReplies = (c: CommentItem) => {
    const r = c.replies ?? [];
    return expanded.has(c.id) ? r : r.slice(0, visibleReplies);
  };
  const copyLink = (c: CommentItem) =>
    navigator.clipboard?.writeText(location.href.split('#')[0] + '#comment-' + c.id).catch(() => undefined);

  const item = (c: CommentItem, root: CommentItem, depth: number) => (
    <article
      className={`comment${flash === c.id ? ' flash' : ''}${c.pinned ? ' pinned' : ''}${depth > 0 ? ' reply' : ''}`}
      id={'comment-' + c.id}
    >
      <span
        className="ava"
        style={{ background: c.deleted ? 'var(--text-muted)' : (c.author.color ?? 'var(--primary-color)') }}
      >
        {c.deleted ? '–' : nameInitials(c.author.name)}
      </span>
      <div className="body">
        {c.deleted ? (
          <p className="deleted">
            <MaterialIcon name="block" />
            Ce commentaire a été supprimé.
          </p>
        ) : (
          <>
            <header>
              <strong>{c.author.name}</strong>
              {c.byAuthor && <span className="badge author">Auteur</span>}
              {c.author.role && <span className="role">{c.author.role}</span>}
              {c.pinned && (
                <span className="badge pin">
                  <MaterialIcon name="push_pin" />
                  Épinglé
                </span>
              )}
              <span className="dot">·</span>
              <time>{c.at}</time>
              {c.edited && <span className="edited">(modifié)</span>}
              <IconButton
                className="menu"
                aria-label="Actions"
                onClick={(e) => setMenu({ el: e.currentTarget, c, depth })}
              >
                <MaterialIcon name="more_horiz" />
              </IconButton>
            </header>

            {editing === c.id ? (
              <CommentComposer
                initial={c.text}
                submitLabel="Enregistrer"
                cancelable
                startOpen
                autofocus
                compact
                onSubmit={(t) => edit(c, t)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="text kit-markdown" dangerouslySetInnerHTML={{ __html: render(c.text) }} />
            )}

            {!!c.reactions?.length && (
              <div className="reactions">
                {c.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    type="button"
                    className={r.mine ? 'mine' : ''}
                    onClick={() => react(c, r.emoji)}
                    aria-pressed={!!r.mine}
                  >
                    {r.emoji} <b>{r.count}</b>
                  </button>
                ))}
              </div>
            )}

            <footer>
              <button
                type="button"
                className={`act${c.liked ? ' on' : ''}`}
                onClick={() => like(c)}
                aria-pressed={!!c.liked}
              >
                <MaterialIcon name={c.liked ? 'favorite' : 'favorite_border'} />
                {c.likes || 'J’aime'}
              </button>
              <button type="button" className="act" onClick={() => setReplyTo({ root: root.id, target: c })}>
                <MaterialIcon name="chat_bubble_outline" />
                Répondre
              </button>
              <button
                type="button"
                className="act icon"
                aria-label="Ajouter une réaction"
                onClick={(e) => setEmoMenu({ el: e.currentTarget, c })}
              >
                <MaterialIcon name="add_reaction" />
              </button>
            </footer>
          </>
        )}
      </div>
    </article>
  );

  const composerFor = (placeholder?: string) => (
    <CommentComposer
      author={me}
      mentionables={mentionables}
      placeholder={placeholder}
      compact={compact}
      onSubmit={add}
    />
  );

  return (
    <div className={`comment-thread${compact ? ' compact' : ''}`}>
      <section className="thread" aria-label="Commentaires">
        {!compact && (
          <>
            <header className="head">
              <h2>
                {title} <span className="n">{total}</span>
              </h2>
              <Button
                className="sort"
                onClick={(e) => setSortMenu(e.currentTarget)}
                startIcon={<MaterialIcon name="sort" />}
              >
                {SORT_LABELS[sort]}
              </Button>
              <Menu anchorEl={sortMenu} open={!!sortMenu} onClose={() => setSortMenu(null)}>
                {SORT_MODES.map((s) => (
                  <MenuItem
                    key={s}
                    onClick={() => {
                      setSort(s);
                      setSortMenu(null);
                    }}
                  >
                    <ListItemIcon>
                      <MaterialIcon name={sort === s ? 'check' : ''} />
                    </ListItemIcon>
                    {SORT_LABELS[s]}
                  </MenuItem>
                ))}
              </Menu>
            </header>
            {composerFor()}
          </>
        )}

        <ol className="list">
          {sorted.map((c) => (
            <li key={c.id} className="root">
              {item(c, c, 0)}
              {!!c.replies?.length && (
                <>
                  <ol className="replies">
                    {shownReplies(c).map((r) => (
                      <li key={r.id}>{item(r, c, 1)}</li>
                    ))}
                  </ol>
                  {c.replies.length > visibleReplies && (
                    <button type="button" className="more" onClick={() => toggleReplies(c.id)}>
                      <MaterialIcon name={expanded.has(c.id) ? 'expand_less' : 'subdirectory_arrow_right'} />
                      {expanded.has(c.id)
                        ? 'Masquer les réponses'
                        : `Afficher ${c.replies.length - visibleReplies} autre(s) réponse(s)`}
                    </button>
                  )}
                </>
              )}
              {replyTo?.root === c.id && (
                // Recréé quand la cible change, pour reprendre la mention @ de la bonne personne.
                <div className="reply-box" key={replyTo.target.id}>
                  <CommentComposer
                    author={me}
                    mentionables={mentionables}
                    initial={replyPrefix(replyTo.target, c)}
                    placeholder="Votre réponse…"
                    submitLabel="Répondre"
                    cancelable
                    startOpen
                    autofocus
                    compact
                    onSubmit={(t) => reply(c, t)}
                    onCancel={() => setReplyTo(null)}
                  />
                </div>
              )}
            </li>
          ))}
          {sorted.length === 0 && (
            <li className="empty">
              <MaterialIcon name="forum" />
              <strong>Aucun commentaire pour l’instant</strong>
              <span>Lancez la discussion !</span>
            </li>
          )}
        </ol>

        {compact && composerFor('Écrire un commentaire…')}
      </section>

      <Menu
        anchorEl={menu?.el}
        open={!!menu}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menu && [
          ...(isMine(menu.c)
            ? [
                <MenuItem
                  key="edit"
                  onClick={() => {
                    setEditing(menu.c.id);
                    setMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="edit" />
                  </ListItemIcon>
                  Modifier
                </MenuItem>,
                <MenuItem
                  key="del"
                  className="danger"
                  onClick={() => {
                    remove(menu.c);
                    setMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="delete" />
                  </ListItemIcon>
                  Supprimer
                </MenuItem>,
              ]
            : []),
          ...(moderator && menu.depth === 0
            ? [
                <MenuItem
                  key="pin"
                  onClick={() => {
                    pin(menu.c);
                    setMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="push_pin" />
                  </ListItemIcon>
                  {menu.c.pinned ? 'Désépingler' : 'Épingler en haut'}
                </MenuItem>,
              ]
            : []),
          <MenuItem
            key="link"
            onClick={() => {
              copyLink(menu.c);
              setMenu(null);
            }}
          >
            <ListItemIcon>
              <MaterialIcon name="link" />
            </ListItemIcon>
            Copier le lien
          </MenuItem>,
          ...(!isMine(menu.c)
            ? [
                <MenuItem key="flag" onClick={() => setMenu(null)}>
                  <ListItemIcon>
                    <MaterialIcon name="flag" />
                  </ListItemIcon>
                  Signaler
                </MenuItem>,
              ]
            : []),
        ]}
      </Menu>

      <Menu
        anchorEl={emoMenu?.el}
        open={!!emoMenu}
        onClose={() => setEmoMenu(null)}
        slotProps={{ list: { sx: { p: 0.5 } } }}
      >
        <div className="emoji-row">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                if (emoMenu) react(emoMenu.c, e);
                setEmoMenu(null);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </Menu>
    </div>
  );
}
