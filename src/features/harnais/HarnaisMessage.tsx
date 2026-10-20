import { Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { memo, useState } from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import {
  HARNAIS_WIDGET_TYPES,
  type HarnaisArtifact,
  type HarnaisBlock,
  type HarnaisMessage as Message,
  type HarnaisToolKind,
  type HarnaisWidget,
  type HzOption,
} from '../../data/static/harnais.data';
import { attachmentIcon, inlineSegments } from './harnaisUtils';
import { HzWidget } from './widgets/HzWidget';
import './message.scss';

const TOOL_ICONS: Record<HarnaisToolKind, string> = {
  read: 'description',
  search: 'search',
  bash: 'terminal',
  edit: 'edit_note',
  web: 'travel_explore',
};

type ToolBlock = Extract<HarnaisBlock, { type: 'tool' }>;
type BlockGroup = { kind: 'tools'; start: number; items: ToolBlock[] } | { kind: 'block'; index: number; block: HarnaisBlock };

/** Texte enrichi : `code` et **gras**, sans innerHTML. */
const Segments = ({ text }: { text: string }) =>
  inlineSegments(text).map((s, i) =>
    s.code ? <code key={i}>{s.text}</code> : s.bold ? <strong key={i}>{s.text}</strong> : <span key={i}>{s.text}</span>,
  );

const Spinner = () => <CircularProgress size={14} thickness={6.3} />;

/** Un message du fil : bulle pour l'utilisateur, blocs riches (réflexion, outils, code, artefact) pour l'assistant. */
export const HarnaisMessage = memo(function HarnaisMessage({
  message: msg,
  artifacts,
  last,
  busy,
  onOpenArtifact,
  onFeedback,
  onRetry,
  onCopy,
  onFormSubmit,
  onChoose,
}: {
  message: Message;
  artifacts: HarnaisArtifact[];
  /** Dernière réponse du fil : seule à proposer « Régénérer ». */
  last: boolean;
  /** L'agent génère : les widgets interactifs sont gelés. */
  busy: boolean;
  onOpenArtifact: (id: string) => void;
  onFeedback: (msgId: string, v: 'up' | 'down') => void;
  onRetry: () => void;
  onCopy: (text: string) => void;
  onFormSubmit: (msgId: string, index: number, values: Record<string, unknown>) => void;
  onChoose: (msgId: string, index: number, option: HzOption) => void;
}) {
  /** Blocs dépliés (index de bloc). */
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const isOpen = (i: number) => expanded.has(i);
  const toggle = (i: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const plainText = () =>
    msg.blocks
      .map((b) => {
        switch (b.type) {
          case 'text':
            return b.text;
          case 'list':
            return b.items.map((i) => '• ' + i).join('\n');
          case 'code':
            return b.code;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');

  const copyBtn = (
    <Tooltip title="Copier">
      <IconButton className="mini" aria-label="Copier" onClick={() => onCopy(plainText())}>
        <MaterialIcon name="content_copy" />
      </IconButton>
    </Tooltip>
  );

  if (msg.role === 'user') {
    return (
      <div className="hz-message">
        {/* ── Message utilisateur : bulle alignée à droite ── */}
        <div className="user-row">
          {!!msg.attachments?.length && (
            <div className="attachments">
              {msg.attachments.map((a) => (
                <div key={a.name} className="attachment">
                  <MaterialIcon name={attachmentIcon(a.kind)} />
                  <span className="name">{a.name}</span>
                  <span className="size">{a.size}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bubble">{msg.blocks.map((b, i) => b.type === 'text' && <p key={i}>{b.text}</p>)}</div>
          <div className="user-actions">
            <span className="time">{msg.time}</span>
            {copyBtn}
          </div>
        </div>
      </div>
    );
  }

  /** Outils consécutifs regroupés en une seule carte « étapes ». */
  const groups: BlockGroup[] = [];
  msg.blocks.forEach((block, i) => {
    const prev = groups[groups.length - 1];
    if (block.type === 'tool') {
      if (prev?.kind === 'tools') prev.items.push(block);
      else groups.push({ kind: 'tools', start: i, items: [block] });
    } else {
      groups.push({ kind: 'block', index: i, block });
    }
  });
  const lastIndex = groups.length - 1;

  const renderBlock = (b: HarnaisBlock, index: number, isLast: boolean) => {
    if (b.type === 'thinking') {
      return (
        <div key={index} className={`thinking${isOpen(index) ? ' open' : ''}`}>
          <button
            type="button"
            className="thinking-head"
            onClick={() => toggle(index)}
            aria-expanded={isOpen(index)}
          >
            <MaterialIcon name="psychology" className="lead" />
            <span className={b.running ? 'shimmer' : undefined}>
              {b.running ? 'Réflexion en cours…' : 'Réflexion pendant ' + (b.duration ?? '')}
            </span>
            <MaterialIcon name="expand_more" className="chevron" />
          </button>
          {isOpen(index) && <p className="thinking-text">{b.text}</p>}
        </div>
      );
    }
    if (b.type === 'text') {
      return (
        <p key={index} className="text">
          <Segments text={b.text} />
          {msg.streaming && isLast && <span className="caret" />}
        </p>
      );
    }
    if (b.type === 'list') {
      return (
        <ul key={index} className="list">
          {b.items.map((item, i) => (
            <li key={i}>
              <Segments text={item} />
            </li>
          ))}
        </ul>
      );
    }
    if (b.type === 'code') {
      return (
        <div key={index} className="code-block">
          <div className="code-head">
            <MaterialIcon name="code" />
            <span>{b.file ?? b.lang}</span>
            <span className="spacer" />
            <Button className="mini-btn" onClick={() => onCopy(b.code)}>
              <MaterialIcon name="content_copy" />
              Copier
            </Button>
          </div>
          <pre>
            <code>{b.code}</code>
          </pre>
        </div>
      );
    }
    if (HARNAIS_WIDGET_TYPES.has(b.type)) {
      return (
        <HzWidget
          key={index}
          block={b as HarnaisWidget}
          busy={busy}
          onFormSubmit={(values) => onFormSubmit(msg.id, index, values)}
          onChoose={(option) => onChoose(msg.id, index, option)}
        />
      );
    }
    if (b.type === 'artifact') {
      const art = artifacts.find((a) => a.id === b.artifactId);
      if (!art) return null;
      return (
        <button key={index} type="button" className="artifact-card" onClick={() => onOpenArtifact(art.id)}>
          <span className="art-icon">
            <MaterialIcon name={art.kind === 'code' ? 'data_object' : 'article'} />
          </span>
          <span className="art-text">
            <span className="art-title">{art.title}</span>
            <span className="art-sub">
              {art.kind === 'code' ? 'Code' : 'Document'} · version {art.version} · cliquez pour ouvrir
            </span>
          </span>
          <MaterialIcon name="open_in_new" className="art-open" />
        </button>
      );
    }
    return null;
  };

  return (
    <div className="hz-message">
      {/* ── Réponse de l'assistant ── */}
      <div className="assistant-row">
        <div className={`avatar${msg.streaming ? ' pulse' : ''}`}>
          <MaterialIcon name="auto_awesome" />
        </div>

        <div className="body">
          {groups.map((g, gi) => {
            if (g.kind === 'block') return renderBlock(g.block, g.index, gi === lastIndex);
            const lastTool = g.items[g.items.length - 1];
            return (
              /* Étapes d'outils regroupées */
              <div key={g.start} className={`steps${isOpen(g.start) ? ' open' : ''}`}>
                <button
                  type="button"
                  className="steps-head"
                  onClick={() => toggle(g.start)}
                  aria-expanded={isOpen(g.start)}
                >
                  {g.items.some((t) => t.status === 'running') ? (
                    <Spinner />
                  ) : (
                    <MaterialIcon name="checklist" className="lead" />
                  )}
                  <span>
                    {g.items.length} étape{g.items.length > 1 ? 's' : ''}
                  </span>
                  <span className="preview">
                    {lastTool?.label} · {lastTool?.target}
                  </span>
                  <MaterialIcon name="expand_more" className="chevron" />
                </button>
                {isOpen(g.start) && (
                  <ol className="steps-list">
                    {g.items.map((t, i) => (
                      <li key={i} className={`step ${t.status}`}>
                        <span className="step-icon">
                          <MaterialIcon name={TOOL_ICONS[t.tool]} />
                        </span>
                        <div className="step-main">
                          <div className="step-title">
                            <strong>{t.label}</strong>
                            <code>{t.target}</code>
                          </div>
                          {t.output && <div className="step-output">{t.output}</div>}
                        </div>
                        {t.status === 'running' ? (
                          <Spinner />
                        ) : t.status === 'done' ? (
                          <MaterialIcon name="check_circle" className="state ok" />
                        ) : (
                          <MaterialIcon name="error" className="state ko" />
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}

          {msg.stopped && (
            <div className="stopped">
              <MaterialIcon name="block" />
              Réponse interrompue
            </div>
          )}

          {!msg.streaming && (
            <div className="actions">
              {copyBtn}
              <Tooltip title="Bonne réponse">
                <IconButton
                  className={`mini${msg.feedback === 'up' ? ' on' : ''}`}
                  aria-label="Bonne réponse"
                  onClick={() => onFeedback(msg.id, 'up')}
                >
                  <MaterialIcon name="thumb_up" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mauvaise réponse">
                <IconButton
                  className={`mini${msg.feedback === 'down' ? ' on' : ''}`}
                  aria-label="Mauvaise réponse"
                  onClick={() => onFeedback(msg.id, 'down')}
                >
                  <MaterialIcon name="thumb_down" />
                </IconButton>
              </Tooltip>
              {last && (
                <Tooltip title="Régénérer">
                  <IconButton className="mini" aria-label="Régénérer" onClick={onRetry}>
                    <MaterialIcon name="refresh" />
                  </IconButton>
                </Tooltip>
              )}
              <span className="time">{msg.time}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
