import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Tip } from './Tip';
import './rich-text-editor.scss';

type Cmd = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'insertUnorderedList' | 'insertOrderedList';
const BUTTONS: { cmd: Cmd; icon: string; label: string }[] = [
  { cmd: 'bold', icon: 'format_bold', label: 'Gras (Ctrl+B)' },
  { cmd: 'italic', icon: 'format_italic', label: 'Italique (Ctrl+I)' },
  { cmd: 'underline', icon: 'format_underlined', label: 'Souligné (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: 'strikethrough_s', label: 'Barré' },
  { cmd: 'insertUnorderedList', icon: 'format_list_bulleted', label: 'Liste à puces' },
  { cmd: 'insertOrderedList', icon: 'format_list_numbered', label: 'Liste numérotée' },
];

/**
 * app-rich-text-editor : contenteditable sans dépendance (gras, italique, titres, listes, citation, lien,
 * nettoyage, annuler / rétablir, compteur). Collage converti en texte brut. Valeur : HTML.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Saisissez votre texte…',
  minHeight = '140px',
  maxLength = null,
  plainPaste = true,
  disabled = false,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number | null;
  plainPaste?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastEmitted = useRef<string | null>(null);
  const [active, setActive] = useState<Partial<Record<Cmd, boolean>>>({});
  const [block, setBlock] = useState('p');
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [length, setLength] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);

  // writeValue : n'écrase le DOM que si la valeur vient de l'extérieur.
  useEffect(() => {
    const el = editor.current;
    if (!el || value === lastEmitted.current) return;
    el.innerHTML = value ?? '';
    setEmpty(!el.innerText.trim());
    setLength(el.innerText.trim().length);
  }, [value]);

  const refresh = () => {
    const el = editor.current;
    const sel = window.getSelection();
    if (!el || !sel?.anchorNode || !el.contains(sel.anchorNode)) return;
    const st: Partial<Record<Cmd, boolean>> = {};
    for (const b of BUTTONS) st[b.cmd] = document.queryCommandState(b.cmd);
    setActive(st);
    const v = String(document.queryCommandValue('formatBlock') || 'p').toLowerCase();
    setBlock(['h2', 'h3', 'blockquote'].includes(v) ? v : 'p');
  };
  useEffect(() => {
    document.addEventListener('selectionchange', refresh);
    return () => document.removeEventListener('selectionchange', refresh);
  }, []);

  const onInput = () => {
    const el = editor.current;
    if (!el) return;
    const text = el.innerText.replace(/\n$/, '');
    const isEmpty = !text.trim() && !el.querySelector('img, li');
    setEmpty(isEmpty);
    setLength(text.length);
    const v = isEmpty ? '' : el.innerHTML;
    lastEmitted.current = v;
    onChange(v);
    refresh();
  };
  const exec = (cmd: string, arg?: string) => {
    editor.current?.focus();
    document.execCommand(cmd, false, arg);
    onInput();
  };
  const formatBlock = (tag: string) => exec('formatBlock', tag);
  const toggleLink = () => {
    const sel = window.getSelection();
    savedRange.current =
      sel && sel.rangeCount && editor.current?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    setLinkOpen((o) => !o);
    setTimeout(() => linkInput.current?.focus());
  };
  const applyLink = (raw: string) => {
    let url = raw.trim();
    if (url && !/^(https?:|mailto:|tel:|\/)/.test(url)) url = 'https://' + url;
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    if (url) {
      if (sel?.isCollapsed)
        exec('insertHTML', `<a href="${url.replace(/"/g, '&quot;')}">${url.replace(/</g, '&lt;')}</a>`);
      else exec('createLink', url);
    }
    setLinkOpen(false);
  };
  const onPaste = (e: ClipboardEvent) => {
    if (!plainPaste) return;
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  };

  return (
    <div className="app-rich-text-editor">
      <div className={`rte${focused ? ' focused' : ''}${disabled ? ' disabled' : ''}`}>
        <div
          className="rte-toolbar"
          onMouseDown={(e) => {
            if (!(e.target instanceof HTMLSelectElement)) e.preventDefault();
          }}
        >
          <select
            className="rte-block"
            value={block}
            onChange={(e) => formatBlock(e.target.value)}
            aria-label="Style de paragraphe"
            disabled={disabled}
          >
            <option value="p">Paragraphe</option>
            <option value="h2">Titre</option>
            <option value="h3">Sous-titre</option>
            <option value="blockquote">Citation</option>
          </select>
          <span className="sep" />
          {BUTTONS.map((b) => (
            <span key={b.cmd} style={{ display: 'contents' }}>
              <Tip title={b.label}>
                <button
                  type="button"
                  className={active[b.cmd] ? 'on' : undefined}
                  onClick={() => exec(b.cmd)}
                  disabled={disabled}
                >
                  <MaterialIcon name={b.icon} />
                </button>
              </Tip>
              {b.cmd === 'strikeThrough' && <span className="sep" />}
            </span>
          ))}
          <span className="sep" />
          <Tip title="Lien">
            <button type="button" className={linkOpen ? 'on' : undefined} onClick={toggleLink} disabled={disabled}>
              <MaterialIcon name="link" />
            </button>
          </Tip>
          <Tip title="Effacer la mise en forme">
            <button
              type="button"
              onClick={() => {
                exec('removeFormat');
                formatBlock('p');
              }}
              disabled={disabled}
            >
              <MaterialIcon name="format_clear" />
            </button>
          </Tip>
          <span className="spacer" />
          <Tip title="Annuler (Ctrl+Z)">
            <button type="button" onClick={() => exec('undo')} disabled={disabled}>
              <MaterialIcon name="undo" />
            </button>
          </Tip>
          <Tip title="Rétablir (Ctrl+Y)">
            <button type="button" onClick={() => exec('redo')} disabled={disabled}>
              <MaterialIcon name="redo" />
            </button>
          </Tip>
        </div>
        {linkOpen && (
          <div className="rte-link">
            <MaterialIcon name="link" />
            <input
              ref={linkInput}
              type="url"
              placeholder="https://…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink(e.currentTarget.value);
                } else if (e.key === 'Escape') setLinkOpen(false);
              }}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyLink(linkInput.current?.value ?? '')}
            >
              Appliquer
            </button>
            <button
              type="button"
              className="ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                exec('unlink');
                setLinkOpen(false);
              }}
            >
              Retirer
            </button>
          </div>
        )}
        <div
          ref={editor}
          className={`rte-content${empty ? ' empty' : ''}`}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder={placeholder}
          style={{ minHeight }}
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onPaste={onPaste}
          onKeyUp={refresh}
          onMouseUp={refresh}
        />
        {maxLength ? (
          <div className={`rte-foot${length > maxLength ? ' over' : ''}`}>
            {length} / {maxLength}
          </div>
        ) : null}
      </div>
    </div>
  );
}
