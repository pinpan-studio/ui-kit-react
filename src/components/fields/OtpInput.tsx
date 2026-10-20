import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import './otp-input.scss';

export interface OtpInputHandle {
  clear: () => void;
}

/**
 * app-otp-input : cases séparées, auto-avance, retour arrière, flèches, collage d'un code complet,
 * autocomplétion SMS (`one-time-code`), masquage optionnel.
 */
export const OtpInput = forwardRef<
  OtpInputHandle,
  {
    value: string;
    onChange: (v: string) => void;
    length?: number;
    numeric?: boolean;
    mask?: boolean;
    separator?: boolean;
    invalid?: boolean;
    success?: boolean;
    disabled?: boolean;
    onCompleted?: (v: string) => void;
    onBlur?: () => void;
  }
>(function OtpInput(
  { value, onChange, length = 6, numeric = true, mask, separator, invalid, success, disabled, onCompleted, onBlur },
  ref,
) {
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  // État interne (cases vides conservées) ; la valeur exposée est la concaténation, comme le CVA Angular.
  const [chars, setChars] = useState<string[]>(() => value.slice(0, length).split(''));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    if (value !== chars.join('')) setChars(value.slice(0, length).split(''));
  }
  const allowed = (c: string) => (numeric ? /\d/.test(c) : /[a-z0-9]/i.test(c));
  const focus = (i: number) => cells.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  const set = (next: string[]) => {
    setChars(next);
    const v = next.join('');
    setLast(v);
    onChange(v);
    if (v.length === length && next.every(Boolean)) onCompleted?.(v);
  };
  useImperativeHandle(ref, () => ({
    clear: () => {
      set([]);
      focus(0);
    },
  }));

  const onInput = (i: number, e: FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const c = el.value.slice(-1);
    if (!c || !allowed(c)) {
      el.value = chars[i] ?? '';
      return;
    }
    const next = [...chars];
    next[i] = numeric ? c : c.toUpperCase();
    set(next);
    focus(i + 1);
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...chars];
      if (next[i]) next[i] = '';
      else if (i > 0) {
        next[i - 1] = '';
        focus(i - 1);
      }
      set(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(i + 1);
    }
  };
  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const txt = e.clipboardData.getData('text').split('').filter(allowed);
    if (!txt.length) return;
    const next = [...chars];
    txt.slice(0, length - i).forEach((c, k) => (next[i + k] = numeric ? c : c.toUpperCase()));
    set(next);
    focus(i + txt.length);
  };

  return (
    <span className="app-otp-input">
      <div
        className={`otp${invalid ? ' invalid' : ''}${success ? ' success' : ''}`}
        role="group"
        aria-label={`Code à ${length} caractères`}
      >
        {Array.from({ length }, (_, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {separator && i === Math.floor(length / 2) && length > 4 && <span className="sep">–</span>}
            <input
              ref={(el) => {
                cells.current[i] = el;
              }}
              type={mask ? 'password' : 'text'}
              inputMode={numeric ? 'numeric' : 'text'}
              maxLength={1}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              value={chars[i] ?? ''}
              disabled={disabled}
              className={chars[i] ? 'filled' : undefined}
              aria-label={`Caractère ${i + 1}`}
              onChange={(e) => onInput(i, e)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={onBlur}
            />
          </span>
        ))}
      </div>
    </span>
  );
});
