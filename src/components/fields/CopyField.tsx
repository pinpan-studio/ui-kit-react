import { Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './copy-field.scss';

/** app-copy-field : valeur en lecture seule + bouton Copier (secret masqué, régénération, multiligne). */
export function CopyField({
  value,
  label = '',
  icon = '',
  secret,
  multiline,
  regenerable,
  onCopied,
  onRegenerate,
}: {
  value: string;
  label?: string;
  icon?: string;
  secret?: boolean;
  multiline?: boolean;
  regenerable?: boolean;
  onCopied?: (v: string) => void;
  onRegenerate?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const shown =
    !secret || revealed
      ? value
      : value.length <= 8
        ? '•'.repeat(value.length)
        : value.slice(0, 4) + '•'.repeat(Math.min(24, value.length - 8)) + value.slice(-4);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    onCopied?.(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="app-copy-field">
      <div className="form-field kit-field">
        <div className={`field-box cf${multiline ? ' multiline' : ''}${copied ? ' copied' : ''}`}>
          {icon && <MaterialIcon name={icon} />}
          {multiline ? (
            <pre className="cf-value">{shown}</pre>
          ) : (
            <input
              className="cf-value"
              value={shown}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              aria-label={label || 'Valeur'}
            />
          )}
          {secret && (
            <Tooltip title={revealed ? 'Masquer' : 'Afficher'}>
              <button
                type="button"
                className="cf-btn"
                onClick={() => setRevealed((r) => !r)}
                aria-label={revealed ? 'Masquer' : 'Afficher'}
              >
                <MaterialIcon name={revealed ? 'visibility_off' : 'visibility'} />
              </button>
            </Tooltip>
          )}
          {regenerable && (
            <Tooltip title="Régénérer">
              <button type="button" className="cf-btn" onClick={onRegenerate} aria-label="Régénérer">
                <MaterialIcon name="autorenew" />
              </button>
            </Tooltip>
          )}
          <button
            type="button"
            className="cf-copy"
            onClick={() => void copy()}
            aria-label={`Copier ${label || 'la valeur'}`}
          >
            <MaterialIcon name={copied ? 'check' : 'content_copy'} />
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
