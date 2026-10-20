// Porté depuis ui-kit Angular (harnais/harnais.component.{ts,html}) : module autonome /harnais et /harnais/:id.
// mat-sidenav-container → trois colonnes flex ; en superposition (compact < 960 px, narrow < 1280 px) avec voile.
import { Button, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSnackbar } from '../../components/feedback/useSnackbar';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { ThemePicker } from '../../components/ui/ThemePicker';
import { HARNAIS_ARTIFACTS, HARNAIS_MODELS, HARNAIS_SUGGESTIONS } from '../../data/static/harnais.data';
import { useThemeMode } from '../../hooks/useThemeMode';
import { Composer, type ComposerHandle } from './Composer';
import { ConversationList } from './ConversationList';
import { HarnaisMessage } from './HarnaisMessage';
import { harnaisStore, useHarnais, type HarnaisSendEvent } from './harnaisStore';
import { copyText } from './harnaisUtils';
import { SidePanel, type HarnaisPanelTab } from './SidePanel';
import './harnais.scss';

/** Prénom de l'utilisateur de démonstration (Angular : CURRENT_USER.prenoms). */
const FIRST_NAME = 'Jean';

/**
 * Harnais : interface conversationnelle façon assistant IA. Trois colonnes — historique · fil + saisie · panneau
 * (artefact / contexte / tâches). Les réponses sont simulées localement par `harnaisStore`, sans appel réseau.
 */
export function HarnaisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const snack = useSnackbar();
  const { mode, toggle } = useThemeMode();
  const { conversations, generatingId } = useHarnais();

  const compact = useMediaQuery('(max-width: 959.98px)', { noSsr: true });
  const narrow = useMediaQuery('(max-width: 1279.98px)', { noSsr: true });

  const [draftModel, setDraftModel] = useState('opus');
  const [leftOpen, setLeftOpen] = useState(!compact);
  const [rightOpen, setRightOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<HarnaisPanelTab>('artifact');
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [greeting] = useState(() => (new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'));

  const thread = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);

  // Volets en superposition sur petits écrans : fermés par défaut.
  useEffect(() => setLeftOpen(!compact), [compact]);
  useEffect(() => {
    if (narrow) setRightOpen(false);
  }, [narrow]);

  const active = conversations.find((c) => c.id === id);
  const messages = useMemo(() => active?.messages ?? [], [active]);
  const modelId = active?.model ?? draftModel;
  const generating = generatingId !== null;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  /** Artefacts cités dans la conversation active. */
  const artifacts = useMemo(() => {
    const ids = new Set(
      messages.flatMap((m) => m.blocks.flatMap((b) => (b.type === 'artifact' ? [b.artifactId] : []))),
    );
    return HARNAIS_ARTIFACTS.filter((a) => ids.has(a.id));
  }, [messages]);

  /** Défile en bas du fil — seulement si l'utilisateur y était déjà, pour ne pas le déranger s'il relit. */
  const scrollToBottom = useCallback((onlyIfNear = true) => {
    requestAnimationFrame(() => {
      const el = thread.current;
      if (!el) return;
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
      if (!onlyIfNear || near) el.scrollTo?.({ top: el.scrollHeight, behavior: onlyIfNear ? 'smooth' : 'auto' });
    });
  }, []);

  // Changement de conversation : on repart en bas du fil, panneau sur le premier artefact.
  useEffect(() => {
    setArtifactId(null);
    scrollToBottom(false);
  }, [id, scrollToBottom]);

  useEffect(() => {
    harnaisStore.onProgress = () => scrollToBottom();
    return () => {
      harnaisStore.onProgress = () => undefined;
    };
  }, [scrollToBottom]);

  // ─── Navigation ─────────────────────────────────────────────
  const open = (cid: string) => {
    navigate(`/harnais/${cid}`);
    if (compact) setLeftOpen(false);
  };
  const newConversation = useCallback(() => {
    navigate('/harnais');
    if (compact) setLeftOpen(false);
  }, [navigate, compact]);
  const remove = (cid: string) => {
    harnaisStore.remove(cid);
    if (id === cid) navigate('/harnais');
    snack('Conversation supprimée', { duration: 2000 });
  };

  // ⌘K / Ctrl+K : nouvelle conversation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Prioritaire sur le raccourci global mod+k (palette, écouteur document en capture) :
        // sur /harnais, ⌘K ouvre seulement une nouvelle conversation, comme Angular.
        e.preventDefault();
        e.stopPropagation();
        newConversation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [newConversation]);

  const setModel = (model: string) => {
    if (active) harnaisStore.setModel(active.id, model);
    else setDraftModel(model);
  };

  // ─── Panneau droit ──────────────────────────────────────────
  const openArtifact = useCallback((aid: string) => {
    setArtifactId(aid);
    setPanelTab('artifact');
    setRightOpen(true);
  }, []);
  const copy = useCallback(
    (text: string) => {
      copyText(text);
      snack('Copié dans le presse-papiers', { duration: 1600 });
    },
    [snack],
  );

  // ─── Échanges ───────────────────────────────────────────────
  const send = (e: HarnaisSendEvent) => {
    let conv = active;
    if (!conv) {
      conv = harnaisStore.create(e.text, draftModel);
      navigate(`/harnais/${conv.id}`);
    }
    harnaisStore.send(conv.id, e);
    scrollToBottom(false);
  };

  const composerProps = {
    models: HARNAIS_MODELS,
    modelId,
    onModelIdChange: setModel,
    generating,
    onSend: send,
    onStop: () => harnaisStore.stop(),
  };
  const leftOver = compact;
  const rightOver = narrow;
  const backdrop = (leftOver && leftOpen) || (rightOver && rightOpen);

  return (
    <div className="harnais-page">
      <div className="harnais mat-sidenav-container">
        {/* ── Historique des conversations ── */}
        {leftOpen && (
          <aside className={`pane-left mat-drawer${leftOver ? ' mat-drawer-over' : ''}`}>
            <div className="pane">
              <ConversationList
                conversations={conversations}
                activeId={id ?? null}
                onSelect={open}
                onCreate={newConversation}
                onTogglePin={harnaisStore.togglePin}
                onRemove={remove}
                onCollapse={() => setLeftOpen(false)}
              />
            </div>
          </aside>
        )}

        {/* ── Fil de conversation ── */}
        <main className="center">
          <header className="topbar">
            {!leftOpen && (
              <>
                <Tooltip title="Afficher l'historique">
                  <IconButton className="icon-btn" aria-label="Afficher l'historique" onClick={() => setLeftOpen(true)}>
                    <MaterialIcon name="menu" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Nouvelle conversation (⌘K)">
                  <IconButton className="icon-btn" aria-label="Nouvelle conversation" onClick={newConversation}>
                    <MaterialIcon name="rate_review" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <div className="conv-title">
              <h1>{active ? active.title : 'Nouvelle conversation'}</h1>
              {active?.project && (
                <span className="project">
                  <MaterialIcon name="folder" />
                  {active.project}
                </span>
              )}
            </div>
            <span className="spacer" />
            {active && (
              <Button
                variant="outlined"
                className="share-btn"
                onClick={() => copy('https://harnais.example/c/' + active.id)}
              >
                <MaterialIcon name="ios_share" />
                <span>Partager</span>
              </Button>
            )}
            <Tooltip title="Artefacts, contexte et tâches">
              <IconButton
                className={`icon-btn${rightOpen ? ' on' : ''}`}
                aria-label="Artefacts, contexte et tâches"
                aria-pressed={rightOpen}
                onClick={() => setRightOpen((o) => !o)}
              >
                <MaterialIcon name="view_sidebar" />
              </IconButton>
            </Tooltip>
            <span className="topbar-sep" />
            <Tooltip title="Changer de thème">
              <IconButton className="icon-btn" aria-label="Changer de thème" onClick={toggle}>
                <MaterialIcon name={mode === 'light' ? 'dark_mode' : 'light_mode'} />
              </IconButton>
            </Tooltip>
            <ThemePicker />
            <Tooltip title="Retour au catalogue UI Kit">
              <IconButton
                className="icon-btn"
                component={Link}
                to="/ui-showcase"
                aria-label="Retour au catalogue UI Kit"
              >
                <MaterialIcon name="widgets" />
              </IconButton>
            </Tooltip>
          </header>

          {messages.length ? (
            <>
              <div className="thread" ref={thread}>
                <div className="column">
                  {messages.map((m) => (
                    <HarnaisMessage
                      key={m.id}
                      message={m}
                      artifacts={artifacts}
                      last={m.id === lastAssistantId && !generating}
                      busy={generating}
                      onOpenArtifact={openArtifact}
                      onCopy={copy}
                      onFeedback={(mid, v) => active && harnaisStore.feedback(active.id, mid, v)}
                      onRetry={() => active && harnaisStore.retry(active.id)}
                      onFormSubmit={(mid, i, values) => active && harnaisStore.submitForm(active.id, mid, i, values)}
                      onChoose={(mid, i, o) => active && harnaisStore.choose(active.id, mid, i, o)}
                    />
                  ))}
                </div>
              </div>
              <div className="dock">
                <div className="column">
                  <Composer ref={composer} {...composerProps} placeholder="Répondre…" />
                  <p className="disclaimer">
                    Les réponses sont simulées localement — démonstration statique du UI Kit.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Accueil : salutation, saisie centrée, suggestions */
            <div className="welcome" ref={thread}>
              <div className="column">
                <div className="hello">
                  <span className="spark">
                    <MaterialIcon name="auto_awesome" />
                  </span>
                  <h2>
                    {greeting}, {FIRST_NAME}
                  </h2>
                </div>
                <Composer ref={composer} {...composerProps} placeholder="Comment puis-je vous aider aujourd'hui ?" />
                <div className="suggestions">
                  {HARNAIS_SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className="suggestion"
                      onClick={() => composer.current?.fill(s.prompt)}
                    >
                      <MaterialIcon name={s.icon} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Artefact / contexte / tâches ── */}
        {rightOpen && (
          <aside className={`pane-right mat-drawer${rightOver ? ' mat-drawer-over' : ''}`}>
            <div className="pane">
              <SidePanel
                artifacts={artifacts}
                artifactId={artifactId}
                onArtifactIdChange={setArtifactId}
                tab={panelTab}
                onTabChange={setPanelTab}
                onClose={() => setRightOpen(false)}
                onCopy={copy}
              />
            </div>
          </aside>
        )}

        {backdrop && (
          <div
            className="mat-drawer-backdrop"
            aria-hidden="true"
            onClick={() => {
              if (leftOver) setLeftOpen(false);
              if (rightOver) setRightOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
