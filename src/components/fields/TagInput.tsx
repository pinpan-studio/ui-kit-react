import { Popper } from '@mui/material';
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './tag-input.scss';

/** app-tag-input : étiquettes avec suggestions, création, validation, normalisation, max, collage multiple, édition au double-clic. */
export function TagInput({
  value: tags,
  onChange,
  suggestions = [],
  placeholder = 'Ajouter…',
  icon = 'sell',
  max = null,
  allowCustom = true,
  validator = null,
  invalidMessage = 'Valeur invalide',
  transform = null,
  disabled,
  onBlur,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  icon?: string;
  max?: number | null;
  allowCustom?: boolean;
  validator?: ((t: string) => boolean) | null;
  invalidMessage?: string;
  transform?: ((t: string) => string) | null;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const origin = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(280);
  const cur = useRef(tags);
  cur.current = tags;
  const full = !!max && tags.length >= max;
  const q = text.trim().toLowerCase();
  const have = new Set(tags.map((t) => t.toLowerCase()));
  const options = suggestions
    .filter((s) => !have.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q)))
    .slice(0, 8)
    .map((v) => ({ value: v, create: false }));
  if (q && allowCustom && !have.has(q) && !options.some((o) => o.value.toLowerCase() === q))
    options.push({ value: text.trim(), create: true });
  const valid = (t: string) => !validator || validator(t);

  const commit = (v: string[]) => {
    cur.current = v;
    onChange(v);
  };
  const add = (raw: string) => {
    const t = transform ? transform(raw.trim()) : raw.trim();
    if (!t || (!!max && cur.current.length >= max)) return;
    if (cur.current.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setText('');
      return;
    }
    if (!allowCustom && !suggestions.some((s) => s.toLowerCase() === t.toLowerCase())) return;
    commit([...cur.current, t]);
    setText('');
  };
  const remove = (i: number) => commit(cur.current.filter((_, k) => k !== i));
  const edit = (i: number) => {
    if (disabled) return;
    const t = cur.current[i] ?? '';
    remove(i);
    setText(t);
    setTimeout(() => {
      inp.current?.focus();
      inp.current?.select();
    });
  };
  const focus = () => {
    setWidth(origin.current?.getBoundingClientRect().width ?? 280);
    inp.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ',' || e.key === ';' || (e.key === 'Tab' && text.trim())) {
      e.preventDefault();
      const o = options[active];
      add(o && (e.key === 'Enter' || e.key === 'Tab') ? o.value : text);
    } else if (e.key === 'Backspace' && !text && tags.length) remove(tags.length - 1);
    else if (e.key === 'Escape') setFocused(false);
  };
  const onPaste = (e: ClipboardEvent) => {
    const txt = e.clipboardData.getData('text');
    if (!/[,;\n]/.test(txt)) return;
    e.preventDefault();
    txt.split(/[,;\n]+/).forEach(add);
  };

  return (
    <div className="app-tag-input">
      <div className="form-field kit-field">
        <div ref={origin} className={`field-box tg${disabled ? ' is-disabled' : ''}`} onClick={focus}>
          {icon && <MaterialIcon name={icon} />}
          <div className="tg-wrap">
            {tags.map((t, i) => (
              <span
                key={t}
                className={`tg-tag${valid(t) ? '' : ' bad'}`}
                onDoubleClick={() => edit(i)}
                title={valid(t) ? 'Double-clic pour modifier' : invalidMessage}
              >
                {t}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(i);
                    }}
                    aria-label={`Retirer ${t}`}
                  >
                    <MaterialIcon name="close" />
                  </button>
                )}
              </span>
            ))}
            {!full && (
              <input
                ref={inp}
                placeholder={tags.length ? '' : placeholder}
                value={text}
                disabled={disabled}
                aria-label={placeholder}
                onChange={(e) => {
                  setText(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKey}
                onPaste={onPaste}
                onFocus={() => {
                  setWidth(origin.current?.getBoundingClientRect().width ?? 280);
                  setFocused(true);
                }}
                onBlur={() => {
                  setFocused(false);
                  if (text.trim() && allowCustom) add(text);
                  onBlur?.();
                }}
              />
            )}
          </div>
          {!!max && (
            <span className="tg-count">
              {tags.length}/{max}
            </span>
          )}
        </div>
      </div>
      <Popper
        open={focused && options.length > 0 && !!origin.current}
        anchorEl={origin.current}
        placement="bottom-start"
        className="cdk-overlay-pane"
        style={{ zIndex: 1300, width, display: 'flex' }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
        ]}
      >
        <div className="kit-suggest-panel" onMouseDown={(e) => e.preventDefault()} role="listbox">
          {options.map((o, i) => (
            <div
              key={o.value + String(o.create)}
              role="option"
              aria-selected={i === active}
              className={`sg-item${i === active ? ' active' : ''}${o.create ? ' create' : ''}`}
              onClick={() => add(o.value)}
              onMouseEnter={() => setActive(i)}
            >
              <MaterialIcon name={o.create ? 'add' : 'sell'} />
              <span className="sg-text">
                <span>{o.create ? `Créer « ${o.value} »` : o.value}</span>
              </span>
            </div>
          ))}
        </div>
      </Popper>
    </div>
  );
}
