import { Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useDialog } from '../../../../components/feedback/dialogs/useDialog';
import { AudioPlayer } from '../../../../components/media/AudioPlayer';
import { useFileViewer } from '../../../../components/media/FileViewer';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { buildSampleWav } from '../../../../data/static/media.data';
import { markdownInline } from '../../../../lib/markdown';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize } from '../files/exFilesStore';
import { openFilePicker } from '../files/FilePickerDialog';
import {
  ME_ID,
  chatInitials,
  exChat,
  toAttachment,
  useExChat,
  type ChatAttachment,
  type ChatMessage,
} from './exChatStore';
import './chat-thread.scss';

type Row =
  | { kind: 'day'; label: string; key: string }
  | { kind: 'msg'; m: ChatMessage; key: string; first: boolean; last: boolean; mine: boolean };

const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '🙏', '👏', '🔥', '✅', '👀', '😅', '🙌', '💯', '🚀', '😢', '🤝'];
const QUICK = ['👍', '❤️', '😂', '🎉', '🙏'];
const WAVE = Array.from({ length: 16 }, (_, i) => i + 1);

const dayLabel = (d: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = Math.round((+today - +x) / 86_400_000);
  return diff === 0
    ? 'Aujourd’hui'
    : diff === 1
      ? 'Hier'
      : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const images = (m: ChatMessage) => m.attachments?.filter((a) => a.kind === 'image' && a.url) ?? [];
const others = (m: ChatMessage) => m.attachments?.filter((a) => !(a.kind === 'image' && a.url)) ?? [];
const reactors = (r: { by: string[] }) =>
  r.by.map((b) => (b === ME_ID ? 'Vous' : exChat.person(b).name.split(' ')[0])).join(', ');
const hhmm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const autosize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
};

/**
 * Fil de discussion + zone de saisie, partagé par le panneau latéral et la page plein écran :
 * séparateurs de jours, regroupement des messages consécutifs, réponses citées, réactions, pièces jointes
 * (images en mosaïque, fichiers), notes vocales, accusés de lecture, « en train d'écrire » ; saisie avec
 * emojis, pièces jointes (ordinateur ou sélecteur de fichiers), note vocale simulée, Entrée pour envoyer.
 */
export function ChatThread({ convId, compact = false }: { convId: string; compact?: boolean }) {
  const { conversations } = useExChat();
  const viewer = useFileViewer();
  const dialog = useDialog();
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const local = useRef<HTMLInputElement>(null);
  const recTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recording, setRecording] = useState(0);
  const [msgMenu, setMsgMenu] = useState<{ el: HTMLElement; m: ChatMessage; mine: boolean } | null>(null);
  const [attachMenu, setAttachMenu] = useState<HTMLElement | null>(null);
  const [emojiMenu, setEmojiMenu] = useState<HTMLElement | null>(null);

  const conv = conversations.find((c) => c.id === convId);
  const msgs = conv?.messages ?? [];
  const rows: Row[] = [];
  let day = '';
  const near = (a?: ChatMessage, b?: ChatMessage) =>
    !!a &&
    !!b &&
    a.from === b.from &&
    !a.system &&
    !b.system &&
    Math.abs(+a.at - +b.at) < 5 * 60_000 &&
    dayLabel(a.at) === dayLabel(b.at);
  msgs.forEach((m, i) => {
    const d = dayLabel(m.at);
    if (d !== day) {
      rows.push({ kind: 'day', label: d, key: 'd' + m.id });
      day = d;
    }
    rows.push({
      kind: 'msg',
      m,
      key: m.id,
      first: !near(msgs[i - 1], m),
      last: !near(m, msgs[i + 1]),
      mine: m.from === ME_ID,
    });
  });
  const typing = conv?.typing ? exChat.person(conv.typing) : null;
  const canSend = !!draft.trim() || pending.length > 0;
  const isGroup = conv?.kind !== 'direct';
  const recLabel = (() => {
    const s = Math.max(0, recording - 1);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  })();
  const quoted = (id?: string) => (id ? msgs.find((m) => m.id === id) : undefined);

  // Descend en bas à l'ouverture et à chaque nouveau message ; marque la conversation comme lue.
  useLayoutEffect(() => {
    exChat.markRead(convId);
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  }, [convId, msgs.length, typing?.id]);
  // Changer de conversation vide la saisie.
  useEffect(() => {
    setDraft('');
    setPending([]);
    setReplyTo(null);
  }, [convId]);
  useEffect(() => () => clearInterval(recTimer.current), []);
  // Reste collé en bas quand la zone change de taille (mise en page « flush », pièces jointes, saisie).
  const atBottom = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => (atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40);
    const ro = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  // ─── Actions sur un message ──────────────────────────────────
  const react = (m: ChatMessage, e: string) => exChat.toggleReaction(convId, m.id, e);
  const reply = (m: ChatMessage) => {
    setReplyTo(m);
    field.current?.focus();
  };
  const copy = (m: ChatMessage) => void navigator.clipboard?.writeText(m.text ?? '').catch(() => undefined);
  const open = (list: ChatAttachment[], a: ChatAttachment) => {
    const ok = list.filter((x) => x.url);
    if (!a.url) return;
    viewer(
      ok.map((x) => ({ name: x.name, url: x.url ?? '', type: x.mime, size: x.size, blob: x.blob })),
      ok.indexOf(a),
    );
  };

  // ─── Saisie ──────────────────────────────────────────────────
  const send = () => {
    if (!canSend) return;
    exChat.send(convId, draft, pending, replyTo?.id);
    setDraft('');
    setPending([]);
    setReplyTo(null);
    const el = field.current;
    if (el) {
      el.style.height = 'auto';
      el.focus();
    }
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape' && replyTo) setReplyTo(null);
  };
  const insertEmoji = (e: string) => {
    const el = field.current;
    const at = el?.selectionStart ?? draft.length;
    setDraft(draft.slice(0, at) + e + draft.slice(el?.selectionEnd ?? at));
    queueMicrotask(() => {
      el?.focus();
      el?.setSelectionRange(at + e.length, at + e.length);
    });
  };
  const attachLocal = (list: FileList | null) => {
    if (!list?.length) return;
    const added = exFiles.addFiles(list, null).map(toAttachment);
    setPending((l) => [...l, ...added]);
  };
  const attachFromDrive = async () => {
    const items = await openFilePicker(dialog, { title: 'Envoyer des fichiers', confirmLabel: 'Joindre' });
    if (items?.length)
      setPending((l) => [...l, ...items.filter((i) => !l.some((x) => x.id === i.id)).map(toAttachment)]);
  };
  const unattach = (a: ChatAttachment) => setPending((l) => l.filter((x) => x.id !== a.id));

  /** Note vocale simulée : chronomètre, puis envoi d'un son généré localement. */
  const toggleRecord = () => {
    if (!recording) {
      setRecording(1);
      recTimer.current = setInterval(() => setRecording((s) => s + 1), 1000);
      return;
    }
    clearInterval(recTimer.current);
    const secs = Math.max(2, recording);
    setRecording(0);
    const blob = buildSampleWav(secs, secs);
    exChat.send(convId, '', [], replyTo?.id, { src: URL.createObjectURL(blob), blob, duration: secs });
    setReplyTo(null);
  };
  const cancelRecord = () => {
    clearInterval(recTimer.current);
    setRecording(0);
  };

  return (
    <div className={`ex-chat-thread${compact ? ' compact' : ''}`}>
      <div className="thread" ref={scroller} role="log" aria-live="polite">
        {rows.map((r) => {
          if (r.kind === 'day')
            return (
              <div key={r.key} className="day">
                <span>{r.label}</span>
              </div>
            );
          const m = r.m;
          if (m.system)
            return (
              <div key={r.key} className="system">
                {m.text}
              </div>
            );
          const pics = images(m);
          const files = others(m);
          const q = quoted(m.replyTo);
          return (
            <div
              key={r.key}
              className={`msg${r.mine ? ' mine' : ''}${r.first ? ' first' : ''}${r.last ? ' last' : ''}`}
            >
              {!r.mine && (
                <span className="ava-slot">
                  {r.last && (
                    <span className="ava" style={{ background: exChat.person(m.from).color }}>
                      {chatInitials(exChat.person(m.from).name)}
                    </span>
                  )}
                </span>
              )}
              <div className="col">
                {r.first && !r.mine && isGroup && (
                  <span className="author" style={{ color: exChat.person(m.from).color }}>
                    {exChat.person(m.from).name}
                  </span>
                )}
                <div className="bubble-wrap">
                  <div
                    className={`bubble${m.deleted ? ' deleted' : ''}${!m.text && !m.voice && !files.length && pics.length && !m.replyTo ? ' media-only' : ''}`}
                  >
                    {m.deleted ? (
                      <span className="del">
                        <MaterialIcon name="block" />
                        Message supprimé
                      </span>
                    ) : (
                      <>
                        {q && (
                          <div className="quote">
                            <strong>{q.from === ME_ID ? 'Vous' : exChat.person(q.from).name}</strong>
                            <span>{exChat.preview(q)}</span>
                          </div>
                        )}
                        {pics.length > 0 && (
                          <div className="pics" data-n={pics.length > 3 ? 3 : pics.length}>
                            {pics.slice(0, 3).map((a, i) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => open(pics, a)}
                                aria-label={'Agrandir ' + a.name}
                              >
                                <img src={a.url} alt={a.name} loading="lazy" />
                                {i === 2 && pics.length > 3 && <span className="more">+{pics.length - 3}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {files.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className="file"
                            onClick={() => open(files, a)}
                            disabled={!a.url}
                          >
                            <img src={FILE_ICON_BASE + FM_KINDS[a.kind].img} alt="" />
                            <span>
                              <strong>{a.name}</strong>
                              <small>
                                {FM_KINDS[a.kind].label} · {fmSize(a.size)}
                              </small>
                            </span>
                          </button>
                        ))}
                        {m.voice && (
                          <div className="voice">
                            <AudioPlayer
                              tracks={[{ title: 'Note vocale', src: m.voice.src, blob: m.voice.blob }]}
                              variant="compact"
                            />
                          </div>
                        )}
                        {m.text && <p className="text" dangerouslySetInnerHTML={{ __html: markdownInline(m.text) }} />}
                      </>
                    )}
                    <span className="meta">
                      {hhmm(m.at)}
                      {r.mine && !m.deleted && (
                        <Tooltip
                          title={
                            m.status === 'read'
                              ? 'Lu'
                              : m.status === 'delivered'
                                ? 'Distribué'
                                : m.status === 'sent'
                                  ? 'Envoyé'
                                  : 'Envoi…'
                          }
                        >
                          <span className="tick-wrap">
                            <MaterialIcon
                              name={m.status === 'sending' ? 'schedule' : m.status === 'sent' ? 'done' : 'done_all'}
                              className={`tick${m.status === 'read' ? ' read' : ''}`}
                            />
                          </span>
                        </Tooltip>
                      )}
                    </span>
                  </div>
                  {!m.deleted && (
                    <div className="hover-actions">
                      {QUICK.slice(0, compact ? 3 : 5).map((e) => (
                        <button
                          key={e}
                          type="button"
                          className="qe"
                          onClick={() => react(m, e)}
                          aria-label={'Réagir ' + e}
                        >
                          {e}
                        </button>
                      ))}
                      <Tooltip title="Répondre">
                        <button type="button" onClick={() => reply(m)} aria-label="Répondre">
                          <MaterialIcon name="reply" />
                        </button>
                      </Tooltip>
                      <button
                        type="button"
                        aria-label="Plus d’actions"
                        onClick={(e) => setMsgMenu({ el: e.currentTarget, m, mine: r.mine })}
                      >
                        <MaterialIcon name="more_horiz" />
                      </button>
                    </div>
                  )}
                </div>
                {!!m.reactions?.length && (
                  <div className="reactions">
                    {m.reactions.map((x) => (
                      <Tooltip key={x.emoji} title={reactors(x)}>
                        <button
                          type="button"
                          className={x.by.includes(ME_ID) ? 'on' : ''}
                          onClick={() => react(m, x.emoji)}
                        >
                          {x.emoji}
                          <b>{x.by.length}</b>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="empty">
            <MaterialIcon name="waving_hand" />
            <strong>Démarrez la conversation</strong>
            <span>Envoyez un premier message.</span>
          </div>
        )}
        {typing && (
          <div className="msg first last typing-row">
            <span className="ava-slot">
              <span className="ava" style={{ background: typing.color }}>
                {chatInitials(typing.name)}
              </span>
            </span>
            <div className="col">
              <div className="bubble typing" aria-label={typing.name + ' écrit…'}>
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="composer">
        {replyTo && (
          <div className="reply-bar">
            <MaterialIcon name="reply" />
            <div>
              <strong>Réponse à {replyTo.from === ME_ID ? 'vous-même' : exChat.person(replyTo.from).name}</strong>
              <span>{exChat.preview(replyTo)}</span>
            </div>
            <IconButton onClick={() => setReplyTo(null)} aria-label="Annuler la réponse">
              <MaterialIcon name="close" />
            </IconButton>
          </div>
        )}
        {pending.length > 0 && (
          <div className="pending">
            {pending.map((a) => (
              <span key={a.id} className="pj">
                {a.kind === 'image' && a.url ? (
                  <img src={a.url} alt="" />
                ) : (
                  <img className="ic" src={FILE_ICON_BASE + FM_KINDS[a.kind].img} alt="" />
                )}
                <span className="pj-name">{a.name}</span>
                <button type="button" onClick={() => unattach(a)} aria-label={'Retirer ' + a.name}>
                  <MaterialIcon name="close" />
                </button>
              </span>
            ))}
          </div>
        )}
        {recording ? (
          <div className="rec">
            <Tooltip title="Annuler">
              <IconButton onClick={cancelRecord} aria-label="Annuler l’enregistrement">
                <MaterialIcon name="delete" />
              </IconButton>
            </Tooltip>
            <span className="rec-dot" />
            <span className="rec-time">{recLabel}</span>
            <span className="rec-wave">
              {WAVE.map((i) => (
                <i key={i} style={{ animationDelay: i * 70 + 'ms' }} />
              ))}
            </span>
            <Button
              variant="contained"
              disableElevation
              onClick={toggleRecord}
              startIcon={<MaterialIcon name="send" />}
            >
              Envoyer
            </Button>
          </div>
        ) : (
          <div className="box">
            <Tooltip title="Joindre">
              <IconButton aria-label="Joindre" onClick={(e) => setAttachMenu(e.currentTarget)}>
                <MaterialIcon name="add_circle_outline" />
              </IconButton>
            </Tooltip>
            <input
              ref={local}
              type="file"
              hidden
              multiple
              onChange={(e) => {
                attachLocal(e.target.files);
                e.target.value = '';
              }}
            />
            <textarea
              ref={field}
              rows={1}
              placeholder={compact ? 'Message…' : 'Écrire un message…'}
              title="Entrée pour envoyer · Maj + Entrée pour aller à la ligne"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                autosize(e.target);
              }}
              onKeyDown={onKey}
              aria-label="Message"
            />
            <Tooltip title="Emoji">
              <IconButton aria-label="Emoji" onClick={(e) => setEmojiMenu(e.currentTarget)}>
                <MaterialIcon name="sentiment_satisfied" />
              </IconButton>
            </Tooltip>
            {canSend ? (
              <IconButton className="send" onClick={send} aria-label="Envoyer">
                <MaterialIcon name="send" />
              </IconButton>
            ) : (
              <Tooltip title="Note vocale">
                <IconButton onClick={toggleRecord} aria-label="Enregistrer une note vocale">
                  <MaterialIcon name="mic" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )}
      </footer>

      <Menu
        anchorEl={msgMenu?.el}
        open={!!msgMenu}
        onClose={() => setMsgMenu(null)}
        slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
      >
        {msgMenu && [
          <MenuItem
            key="reply"
            onClick={() => {
              reply(msgMenu.m);
              setMsgMenu(null);
            }}
          >
            <ListItemIcon>
              <MaterialIcon name="reply" />
            </ListItemIcon>
            Répondre
          </MenuItem>,
          ...(msgMenu.m.text
            ? [
                <MenuItem
                  key="copy"
                  onClick={() => {
                    copy(msgMenu.m);
                    setMsgMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="content_copy" />
                  </ListItemIcon>
                  Copier le texte
                </MenuItem>,
              ]
            : []),
          <MenuItem key="fwd" onClick={() => setMsgMenu(null)}>
            <ListItemIcon>
              <MaterialIcon name="forward" />
            </ListItemIcon>
            Transférer
          </MenuItem>,
          ...(msgMenu.mine
            ? [
                <Divider key="div" />,
                <MenuItem
                  key="del"
                  className="danger"
                  onClick={() => {
                    exChat.remove(convId, msgMenu.m.id);
                    setMsgMenu(null);
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="delete" />
                  </ListItemIcon>
                  Supprimer
                </MenuItem>,
              ]
            : []),
        ]}
      </Menu>
      <Menu
        anchorEl={attachMenu}
        open={!!attachMenu}
        onClose={() => setAttachMenu(null)}
        slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
      >
        <MenuItem
          onClick={() => {
            setAttachMenu(null);
            local.current?.click();
          }}
        >
          <ListItemIcon>
            <MaterialIcon name="add_photo_alternate" />
          </ListItemIcon>
          Photos et fichiers
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAttachMenu(null);
            void attachFromDrive();
          }}
        >
          <ListItemIcon>
            <MaterialIcon name="folder_open" />
          </ListItemIcon>
          Depuis mes fichiers
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={emojiMenu}
        open={!!emojiMenu}
        onClose={() => setEmojiMenu(null)}
        slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
      >
        <div className="ex-emoji-grid">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => insertEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      </Menu>
    </div>
  );
}
