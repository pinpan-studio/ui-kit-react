import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { useExampleShell } from '../../../../components/layout/exampleShellContext';
import { useFileViewer } from '../../../../components/media/FileViewer';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FILE_ICON_BASE, FM_KINDS, fmSize } from '../files/exFilesStore';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';
import { CHAT_CONTACTS, ME_ID, chatInitials, exChat, useExChat, type ChatAttachment } from './exChatStore';
import '../../ex-page.scss';
import './chat.scss';

/**
 * /examples/app/chat — messagerie plein écran : conversations (recherche, filtres, épinglées), discussion
 * (même fil que le panneau latéral), panneau de détails (membres, médias et fichiers partagés, réglages).
 * Mobile : une colonne à la fois (liste → discussion → détails).
 */
export function ChatPage() {
  useExampleShell({ flush: true });
  useExChat();
  const snack = useSnackbar();
  const viewer = useFileViewer();
  const [params] = useSearchParams();
  const [newMenu, setNewMenu] = useState<HTMLElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(() => {
    const q = params.get('c');
    return q && exChat.conv(q) ? q : window.innerWidth >= 768 ? 'c-aya' : null;
  });
  const [info, setInfo] = useState(() => window.innerWidth >= 1500);
  const current = exChat.conv(currentId);

  // La page visible ne doit pas accumuler de non-lus sur la conversation ouverte.
  useEffect(() => {
    exChat.activePage = currentId;
    return () => {
      exChat.activePage = null;
    };
  }, [currentId]);

  const status = (() => {
    const c = current;
    if (!c) return '';
    if (c.typing) return exChat.person(c.typing).name.split(' ')[0] + ' est en train d’écrire…';
    if (c.kind === 'direct') return exChat.peer(c)?.online ? 'En ligne' : 'Vu aujourd’hui à 09:12';
    const online = c.members.filter((m) => exChat.person(m).online).length;
    return `${c.members.length} membres · ${online} en ligne`;
  })();
  const shared = (current?.messages ?? []).flatMap((m) => m.attachments ?? []);
  const media = shared.filter((a) => a.kind === 'image' && a.url);
  const docs = shared.filter((a) => !(a.kind === 'image' && a.url));

  const call = (kind: string) =>
    current &&
    snack(`Appel ${kind} avec ${exChat.title(current)} (exemple statique)`, { action: 'Raccrocher', duration: 3000 });
  const open = (list: ChatAttachment[], a: ChatAttachment) => {
    const ok = list.filter((x) => x.url);
    if (!a.url) return;
    viewer(
      ok.map((x) => ({ name: x.name, url: x.url ?? '', type: x.mime, size: x.size, blob: x.blob })),
      ok.indexOf(a),
    );
  };

  const peer = current ? exChat.peer(current) : undefined;

  return (
    <div className="ex-page ex-chat">
      <div className={`chat${current ? ' has-conv' : ''}${info && current ? ' info-open' : ''}`}>
        <aside className="list">
          <header className="lh">
            <h1>Discussions</h1>
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
                    setCurrentId(exChat.startDirect(p.id));
                  }}
                >
                  <ListItemIcon>
                    <MaterialIcon name="person" />
                  </ListItemIcon>
                  {p.name}
                </MenuItem>
              ))}
            </Menu>
          </header>
          <ChatList selected={currentId} onPick={setCurrentId} />
        </aside>

        <section className="main">
          {current ? (
            <>
              <header className="mh">
                <IconButton className="back" onClick={() => setCurrentId(null)} aria-label="Retour">
                  <MaterialIcon name="arrow_back" />
                </IconButton>
                <button type="button" className="who" onClick={() => setInfo((v) => !v)}>
                  {current.kind === 'direct' ? (
                    <span className="ava" style={{ background: peer?.color }}>
                      {chatInitials(exChat.title(current))}
                      {peer?.online && <i />}
                    </span>
                  ) : (
                    <span className="ava grp" style={{ background: current.color }}>
                      <MaterialIcon name={current.icon ?? 'group'} />
                    </span>
                  )}
                  <span className="txt">
                    <strong>
                      {current.kind === 'channel' ? '# ' : ''}
                      {exChat.title(current)}
                    </strong>
                    <small className={current.typing ? 'typing' : ''}>{status}</small>
                  </span>
                </button>
                <span className="spacer" />
                <Tooltip title="Appel vocal">
                  <IconButton onClick={() => call('vocal')} aria-label="Appel vocal">
                    <MaterialIcon name="call" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Appel vidéo">
                  <IconButton onClick={() => call('vidéo')} aria-label="Appel vidéo">
                    <MaterialIcon name="videocam" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Détails">
                  <IconButton className={info ? 'on' : ''} onClick={() => setInfo((v) => !v)} aria-label="Détails">
                    <MaterialIcon name="info" />
                  </IconButton>
                </Tooltip>
              </header>
              <ChatThread convId={current.id} />
            </>
          ) : (
            <div className="placeholder">
              <MaterialIcon name="forum" />
              <h2>Vos discussions</h2>
              <p>Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
            </div>
          )}
        </section>

        {info && current && (
          <aside className="info">
            <header className="ih">
              <IconButton className="back" onClick={() => setInfo(false)} aria-label="Fermer les détails">
                <MaterialIcon name="close" />
              </IconButton>
              <strong>Détails</strong>
            </header>
            <div className="profile">
              {current.kind === 'direct' ? (
                <span className="ava xl" style={{ background: peer?.color }}>
                  {chatInitials(exChat.title(current))}
                </span>
              ) : (
                <span className="ava xl grp" style={{ background: current.color }}>
                  <MaterialIcon name={current.icon ?? 'group'} />
                </span>
              )}
              <h2>
                {current.kind === 'channel' ? '# ' : ''}
                {exChat.title(current)}
              </h2>
              <small>
                {current.kind === 'direct'
                  ? `${peer?.role} · ${peer?.online ? 'en ligne' : 'hors ligne'}`
                  : current.members.length + ' membres'}
              </small>
              {current.description && <p>{current.description}</p>}
              <div className="quick">
                <button type="button" onClick={() => call('vocal')}>
                  <MaterialIcon name="call" />
                  Appeler
                </button>
                <button type="button" onClick={() => exChat.toggleMute(current.id)}>
                  <MaterialIcon name={current.muted ? 'notifications_off' : 'notifications'} />
                  {current.muted ? 'Réactiver' : 'Sourdine'}
                </button>
                <button type="button" onClick={() => exChat.togglePin(current.id)}>
                  <MaterialIcon name="push_pin" />
                  {current.pinned ? 'Désépingler' : 'Épingler'}
                </button>
              </div>
            </div>
            {current.kind !== 'direct' && (
              <section>
                <h3>Membres · {current.members.length}</h3>
                {current.members.map((m) => (
                  <div key={m} className="member">
                    <span className="ava sm" style={{ background: exChat.person(m).color }}>
                      {chatInitials(exChat.person(m).name)}
                      {exChat.person(m).online && <i />}
                    </span>
                    <span>
                      <strong>{m === ME_ID ? 'Vous' : exChat.person(m).name}</strong>
                      <small>{exChat.person(m).role}</small>
                    </span>
                  </div>
                ))}
              </section>
            )}
            <section>
              <h3>Médias · {media.length}</h3>
              {media.length ? (
                <div className="media">
                  {media.slice(0, 9).map((a) => (
                    <button key={a.id} type="button" onClick={() => open(media, a)}>
                      <img src={a.url} alt={a.name} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="none">Aucun média partagé.</p>
              )}
            </section>
            <section>
              <h3>Fichiers · {docs.length}</h3>
              {docs.map((a) => (
                <button key={a.id} type="button" className="doc" onClick={() => open(docs, a)}>
                  <img src={FILE_ICON_BASE + FM_KINDS[a.kind].img} alt="" />
                  <span>
                    <strong>{a.name}</strong>
                    <small>{fmSize(a.size)}</small>
                  </span>
                </button>
              ))}
              {docs.length === 0 && <p className="none">Aucun fichier partagé.</p>}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
