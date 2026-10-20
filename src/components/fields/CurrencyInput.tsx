import { useRef, useState, type KeyboardEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { amountInWords } from './amountInWords';
import './currency-input.scss';

interface CurrencyDef {
  code: string;
  symbol: string;
  decimals: number;
}
const CURRENCIES: Record<string, CurrencyDef> = {
  XOF: { code: 'XOF', symbol: 'FCFA', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
  USD: { code: 'USD', symbol: '$', decimals: 2 },
};
const def = (c: string): CurrencyDef => CURRENCIES[c] ?? { code: c, symbol: c, decimals: 2 };
const NNBSP = /\u202f/g;

/** app-currency-input : formatage fr-FR au fil de la frappe, curseur préservé, devise, montant en lettres. */
export function CurrencyInput({
  value,
  onChange,
  currency = 'XOF',
  currencies = [],
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  placeholder = '0',
  icon = 'payments',
  inWords,
  disabled,
  onBlur,
  'aria-label': ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  currency?: string;
  currencies?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
  icon?: string;
  inWords?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  'aria-label'?: string;
}) {
  const el = useRef<HTMLInputElement>(null);
  const [override, setOverride] = useState<string | null>(null);
  const code = override ?? currency;
  const format = (n: number | null, decimals = def(code).decimals) =>
    n === null
      ? ''
      : n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).replace(NNBSP, ' ');
  const [editing, setEditing] = useState<string | null>(null);

  const onInput = (input: HTMLInputElement) => {
    const dec = def(code).decimals;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, caret).replace(/[^\d,.]/g, '').length;
    let raw = input.value.replace(/[^\d,.]/g, '').replace('.', ',');
    const [int = '', ...rest] = raw.split(',');
    const frac = dec ? rest.join('').slice(0, dec) : '';
    raw = int.replace(/^0+(?=\d)/, '');
    if (!raw && !frac) {
      setEditing('');
      onChange(null);
      return;
    }
    let n = parseFloat(`${raw || '0'}.${frac || '0'}`);
    if (n > max) n = max;
    const intTxt = Math.floor(n).toLocaleString('fr-FR').replace(NNBSP, ' ');
    const txt = dec && rest.length ? `${intTxt},${frac}` : intTxt;
    setEditing(txt);
    let pos = 0;
    let seen = 0;
    while (pos < txt.length && seen < digitsBefore) {
      if (/[\d,]/.test(txt[pos] as string)) seen++;
      pos++;
    }
    requestAnimationFrame(() => el.current?.setSelectionRange(pos, pos));
    onChange(n);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? 10000 : 1000;
    onChange(Math.max(min, Math.min(max, (value ?? 0) + (e.key === 'ArrowUp' ? step : -step))));
    setEditing(null);
  };
  const d = def(code);

  return (
    <div className="app-currency-input">
      <div className="form-field kit-field">
        <div className={`field-box cur${disabled ? ' is-disabled' : ''}`}>
          <MaterialIcon name={icon} />
          <input
            ref={el}
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={editing ?? format(value)}
            disabled={disabled}
            aria-label={ariaLabel}
            onChange={(e) => onInput(e.currentTarget)}
            onKeyDown={onKey}
            onBlur={() => {
              if (value !== null && value < min) onChange(min);
              setEditing(null);
              onBlur?.();
            }}
          />
          {currencies.length > 1 ? (
            <select
              className="cur-select"
              value={code}
              onChange={(e) => {
                setOverride(e.target.value);
                setEditing(null);
              }}
              aria-label="Devise"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {def(c).symbol}
                </option>
              ))}
            </select>
          ) : (
            <span className="cur-symbol">{d.symbol}</span>
          )}
        </div>
      </div>
      {inWords && value !== null && code === 'XOF' && (
        <span className="field-hint words">{`${amountInWords(value)} francs CFA`}</span>
      )}
    </div>
  );
}
