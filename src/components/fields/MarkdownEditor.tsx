import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { markdownToHtml } from '../../lib/markdown';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Tip } from './Tip';
import './markdown-editor.scss';

export type MdMode = 'write' | 'preview' | 'split';
const TOOLS = [
  { icon: 'format_bold', label: 'Gras (Ctrl+B)', before: '**', after: '**', line: false },
  { icon: 'format_italic', label: 'Italique (Ctrl+I)', before: '*', after: '*', line: false },
  { icon: 'title', label: 'Titre', before: '## ', after: '', line: true },
  { icon: 'format_list_bulleted', label: 'Liste', before: '- ', after: '', line: true },
  { icon: 'checklist', label: 'Tâche', before: '- [ ] ', after: '', line: true },
  { icon: 'format_quote', label: 'Citation', before: '> ', after: '', line: true },
  { icon: 'data_object', label: 'Code', before: '`', after: '`', line: false },
  { icon: 'link', label: 'Lien (Ctrl+K)', before: '[', after: '](https://)', line: false },
];

/**
 * app-markdown-editor : onglets Écrire / Aperçu / Côte à côte, barre d'insertion, Ctrl+B/I/K,
 * Tab pour indenter, continuation des listes à Entrée. Valeur : texte Markdown.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Rédigez en Markdown…',
  minHeight = '220px',
  mode: initialMode = 'write',
  disabled = false,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
  mode?: MdMode;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<MdMode>(initialMode);
  const html = useMemo(() => markdownToHtml(value), [value]);
  const words = (value.match(/[\p{L}\p{N}’']+/gu) || []).length;

  const commit = (el: HTMLTextAreaElement, next: string, s: number, e: number) => {
    onChange(next);
    el.value = next;
    el.focus();
    el.setSelectionRange(s, e);
  };
  /** Entoure la sélection (ou préfixe la ligne) puis restaure la sélection. */
  const apply = (before: string, after: string, line: boolean) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value: v } = el;
    if (line) {
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      commit(el, v.slice(0, ls) + before + v.slice(ls), a + before.length, b + before.length);
    } else {
      const sel = v.slice(a, b) || 'texte';
      const s = a + before.length;
      commit(el, v.slice(0, a) + before + sel + after + v.slice(b), s, s + sel.length);
    }
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === 'b') {
      e.preventDefault();
      apply('**', '**', false);
      return;
    }
    if (mod && k === 'i') {
      e.preventDefault();
      apply('*', '*', false);
      return;
    }
    if (mod && k === 'k') {
      e.preventDefault();
      apply('[', '](https://)', false);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: a, value: v } = el;
      commit(el, v.slice(0, a) + '  ' + v.slice(el.selectionEnd), a + 2, a + 2);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      const { selectionStart: a, value: v } = el;
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      const cur = v.slice(ls, a);
      const m = cur.match(/^(\s*)([-*+]\s(?:\[[ xX]\]\s)?|(\d+)([.)])\s)/);
      if (!m) return;
      e.preventDefault();
      const marker = m[2] ?? '';
      if (cur.trim() === marker.trim()) {
        commit(el, v.slice(0, ls) + v.slice(a), ls, ls);
        return;
      } // élément vide : sortie de liste
      const bullet = m[3] ? `${+m[3] + 1}${m[4] ?? '.'} ` : marker.replace(/\[[xX]\]/, '[ ]');
      const ins = '\n' + (m[1] ?? '') + bullet;
      commit(el, v.slice(0, a) + ins + v.slice(el.selectionEnd), a + ins.length, a + ins.length);
    }
  };

  return (
    <div className="app-markdown-editor">
      <div className={`md${disabled ? ' disabled' : ''}`}>
        <div className="md-bar">
          <div className="md-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={mode === 'write' ? 'on' : undefined}
              onClick={() => setMode('write')}
            >
              Écrire
            </button>
            <button
              type="button"
              role="tab"
              className={mode === 'preview' ? 'on' : undefined}
              onClick={() => setMode('preview')}
            >
              Aperçu
            </button>
            <button
              type="button"
              role="tab"
              className={`hide-sm${mode === 'split' ? ' on' : ''}`}
              onClick={() => setMode('split')}
            >
              Côte à côte
            </button>
          </div>
          <span className="spacer" />
          {mode !== 'preview' &&
            TOOLS.map((t) => (
              <Tip key={t.icon} title={t.label}>
                <button
                  type="button"
                  className="tool"
                  onClick={() => apply(t.before, t.after, t.line)}
                  disabled={disabled}
                >
                  <MaterialIcon name={t.icon} />
                </button>
              </Tip>
            ))}
        </div>
        <div className={`md-body${mode === 'split' ? ' split' : ''}`} style={{ minHeight }}>
          {mode !== 'preview' && (
            <textarea
              ref={ta}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              spellCheck
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKey}
              onBlur={onBlur}
            />
          )}
          {mode !== 'write' && (
            <>
              <div className="md-preview kit-markdown" dangerouslySetInnerHTML={{ __html: html }} />
              {!value.trim() && <div className="md-empty">Rien à prévisualiser.</div>}
            </>
          )}
        </div>
        <div className="md-foot">
          <MaterialIcon name="code" />
          Markdown pris en charge · {words} mot{words > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
