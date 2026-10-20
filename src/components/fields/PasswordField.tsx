import { Tooltip } from '@mui/material';
import { useState, type KeyboardEvent } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { DEFAULT_PASSWORD_RULES, passwordScore, type PasswordRule } from './passwordRules';
import './password-field.scss';

const LEVELS = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];

/** app-password-field : afficher/masquer, jauge de robustesse, règles, verr. maj., générateur. */
export function PasswordField({
  value,
  onChange,
  placeholder = 'Mot de passe',
  rules = DEFAULT_PASSWORD_RULES,
  meter = true,
  generator,
  showRulesEmpty,
  autoComplete = 'new-password',
  disabled,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rules?: PasswordRule[];
  meter?: boolean;
  generator?: boolean;
  showRulesEmpty?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const score = passwordScore(value);
  const caps = (e: KeyboardEvent) => setCapsOn(!!e.getModifierState?.('CapsLock'));
  const generate = () => {
    const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%&*?-_+='];
    const rnd = (n: number) => (crypto.getRandomValues(new Uint32Array(1))[0] as number) % n;
    const all = sets.join('');
    const chars = sets.map((s) => s[rnd(s.length)] as string);
    while (chars.length < 16) chars.push(all[rnd(all.length)] as string);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [chars[i], chars[j]] = [chars[j] as string, chars[i] as string];
    }
    onChange(chars.join(''));
    setVisible(true);
  };
  return (
    <div className="app-password-field">
      <div className="form-field kit-field">
        <div className={`field-box${disabled ? ' is-disabled' : ''}`}>
          <MaterialIcon name="lock" />
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-label={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyUp={caps}
            onKeyDown={caps}
            onBlur={() => {
              setCapsOn(false);
              onBlur?.();
            }}
          />
          {generator && !disabled && (
            <Tooltip title="Générer un mot de passe robuste">
              <button type="button" className="pf-btn" onClick={generate} aria-label="Générer un mot de passe robuste">
                <MaterialIcon name="auto_fix_high" />
              </button>
            </Tooltip>
          )}
          <Tooltip title={visible ? 'Masquer' : 'Afficher'}>
            <span style={{ display: 'contents' }}>
              <button
                type="button"
                className="pf-btn"
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                aria-label={visible ? 'Masquer' : 'Afficher'}
              >
                <MaterialIcon name={visible ? 'visibility_off' : 'visibility'} />
              </button>
            </span>
          </Tooltip>
        </div>
      </div>
      {capsOn && (
        <span className="pf-caps">
          <MaterialIcon name="keyboard_capslock" />
          Verrouillage majuscules activé
        </span>
      )}
      {meter && (
        <div className="pf-meter" data-score={value ? score : -1}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={value && i < Math.max(1, score) ? 'on' : undefined} />
          ))}
          <em>{value ? LEVELS[score] : ''}</em>
        </div>
      )}
      {rules.length > 0 && (value || showRulesEmpty) && (
        <ul className="pf-rules">
          {rules.map((r) => (
            <li key={r.label} className={r.test(value) ? 'ok' : undefined}>
              <MaterialIcon name={r.test(value) ? 'check_circle' : 'radio_button_unchecked'} />
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
