import { Button, CircularProgress, Tooltip } from '@mui/material';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { markdownToHtml } from '../../lib/markdown';
import { MaterialIcon } from '../ui/MaterialIcon';
import { nameInitials, type CommentAuthor } from './contentModels';
import './comment-composer.scss';

const TOOLS = [
  { icon: 'format_bold', label: 'Gras', before: '**', after: '**' },
  { icon: 'format_italic', label: 'Italique', before: '*', after: '*' },
  { icon: 'code', label: 'Code', before: '`', after: '`' },
  { icon: 'link', label: 'Lien', before: '[', after: '](https://)' },
  { icon: 'format_quote', label: 'Citation', before: '> ', after: '', line: true },
  { icon: 'format_list_bulleted', label: 'Liste', before: '- ', after: '', line: true },
];
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

const autosize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 320) + 'px';
};

/**
 * Saisie d'un commentaire : zone de texte auto-extensible, barre de mise en forme Markdown,
 * mentions @, onglet d'aperçu, compteur de caractères, envoi par ⌘/Ctrl + Entrée.
 */
export function CommentComposer({
  author = null,
  placeholder = 'Ajouter un commentaire…',
  submitLabel = 'Publier',
  maxLength = 1000,
  mentionables = [],
  cancelable = false,
  startOpen = false,
  initial = '',
  compact = false,
  autofocus = false,
  onSubmit,
  onCancel,
}: {
  author?: CommentAuthor | null;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  /** Personnes proposées après « @ ». */
  mentionables?: CommentAuthor[];
  /** Bouton Annuler toujours visible (réponse, édition). */
  cancelable?: boolean;
  /** Ouvert d'emblée (sinon : une ligne qui s'agrandit au focus). */
  startOpen?: boolean;
  /** Texte initial (édition d'un commentaire). */
  initial?: string;
  compact?: boolean;
  autofocus?: boolean;
  onSubmit?: (text: string) => void;
  onCancel?: () => void;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const [text, setText] = useState(initial);
  const [expanded, setExpanded] = useState(startOpen || !!initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const remaining = maxLength - text.length;
  const over = remaining < 0;
  const canSubmit = !!text.trim() && !over && !busy;
  const html = useMemo(() => markdownToHtml(text), [text]);
  const mentionList =
    mentionQuery === null
      ? []
      : mentionables.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5);

  useEffect(() => {
    if (!autofocus) return;
    const t = setTimeout(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      autosize(el);
    });
    return () => clearTimeout(t);
  }, [autofocus]);

  // Restaure le curseur après une mise en forme (la valeur est contrôlée).
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    autosize(el);
    if (caret.current !== null) {
      el.focus();
      el.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [text]);

  const setValue = (value: string, pos: number) => {
    caret.current = pos;
    setText(value);
  };

  const onInput = (el: HTMLTextAreaElement) => {
    setText(el.value);
    const before = el.value.slice(0, el.selectionStart);
    const m = before.match(/(?:^|\s)@([\p{L}-]{0,20})$/u);
    setMentionQuery(m ? (m[1] ?? '') : null);
    setMentionIndex(0);
  };

  const pickMention = (m: CommentAuthor) => {
    const el = area.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = el.value.slice(0, pos).replace(/@([\p{L}-]{0,20})$/u, `@${m.name.replace(/\s+/g, '-')} `);
    setValue(before + el.value.slice(pos), before.length);
    setMentionQuery(null);
  };

  /** Entoure la sélection (ou préfixe les lignes) avec la syntaxe Markdown de l'outil. */
  const format = (t: (typeof TOOLS)[number]) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    if (t.line) {
      const start = v.lastIndexOf('\n', s - 1) + 1;
      const block = v
        .slice(start, e)
        .split('\n')
        .map((l) => t.before + l)
        .join('\n');
      setValue(v.slice(0, start) + block + v.slice(e), start + block.length);
    } else {
      const sel = v.slice(s, e) || (t.before === '[' ? 'texte' : '');
      setValue(v.slice(0, s) + t.before + sel + t.after + v.slice(e), s + t.before.length + sel.length);
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    setBusy(true);
    // Délai simulé d'envoi (démonstration statique).
    setTimeout(() => {
      onSubmit?.(text.trim());
      setBusy(false);
      setText('');
      setPreview(false);
      if (!startOpen) setExpanded(false);
    }, 450);
  };

  const cancel = () => {
    setText('');
    setPreview(false);
    setExpanded(startOpen);
    setMentionQuery(null);
    onCancel?.();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionList.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionList.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionList.length) % mentionList.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const m = mentionList[mentionIndex];
        if (m) pickMention(m);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape' && !text) cancel();
  };

  return (
    <div className={`comment-composer${expanded ? ' open' : ''}${compact ? ' compact' : ''}`}>
      {author && (
        <span className="ava" style={{ background: author.color ?? 'var(--primary-color)' }}>
          {nameInitials(author.name)}
        </span>
      )}
      <div className={`box${over ? ' over' : ''}`}>
        {expanded && (
          <div className="bar">
            <div className="tabs" role="tablist">
              <button type="button" role="tab" className={!preview ? 'on' : ''} onClick={() => setPreview(false)}>
                Écrire
              </button>
              <button
                type="button"
                role="tab"
                className={preview ? 'on' : ''}
                onClick={() => setPreview(true)}
                disabled={!text.trim()}
              >
                Aperçu
              </button>
            </div>
            {!preview && (
              <span className="tools">
                {TOOLS.map((t) => (
                  <Tooltip key={t.icon} title={t.label}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => format(t)}
                      aria-label={t.label}
                    >
                      <MaterialIcon name={t.icon} />
                    </button>
                  </Tooltip>
                ))}
              </span>
            )}
          </div>
        )}
        {preview ? (
          <div className="preview kit-markdown" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <textarea
            ref={area}
            placeholder={placeholder}
            value={text}
            maxLength={maxLength + 50}
            rows={1}
            onFocus={() => setExpanded(true)}
            onChange={(e) => onInput(e.currentTarget)}
            onKeyDown={onKey}
            onBlur={() => setMentionQuery(null)}
            aria-label={placeholder}
          />
        )}
        {mentionList.length > 0 && (
          <ul className="mentions" role="listbox">
            {mentionList.map((m, i) => (
              <li
                key={m.name}
                role="option"
                aria-selected={i === mentionIndex}
                className={i === mentionIndex ? 'on' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(m);
                }}
              >
                <span className="ava xs" style={{ background: m.color ?? 'var(--primary-color)' }}>
                  {nameInitials(m.name)}
                </span>
                {m.name}
                {m.role && <small>{m.role}</small>}
              </li>
            ))}
          </ul>
        )}
        {expanded && (
          <div className="foot">
            <span className="hint">
              <MaterialIcon name="info" />
              **gras**, *italique*, @mention · <kbd>{MOD}</kbd>+<kbd>Entrée</kbd> pour publier
            </span>
            <span className={`count${remaining < 80 ? ' warn' : ''}${over ? ' over' : ''}`}>{remaining}</span>
            {(cancelable || text) && (
              <Button type="button" onClick={cancel}>
                Annuler
              </Button>
            )}
            <Button variant="contained" type="button" onClick={submit} disabled={!canSubmit} disableElevation>
              {busy ? <CircularProgress size={16} color="inherit" /> : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
