import { toneInk } from '../../theme/toneInk';
import type { CSSProperties, ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './result.scss';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning' | 'pending' | '403' | '404' | '500';
const PRESETS: Record<ResultStatus, { icon: string; tone: string; title: string; subtitle: string }> = {
  success: {
    icon: 'check',
    tone: 'success',
    title: 'Opération réussie',
    subtitle: 'Votre demande a bien été prise en compte.',
  },
  error: {
    icon: 'close',
    tone: 'error',
    title: 'L’opération a échoué',
    subtitle: 'Vérifiez les informations ci-dessous puis réessayez.',
  },
  info: { icon: 'info', tone: 'info', title: 'Information', subtitle: '' },
  warning: { icon: 'priority_high', tone: 'warning', title: 'Action requise', subtitle: '' },
  pending: {
    icon: 'hourglass_top',
    tone: 'info',
    title: 'Traitement en cours',
    subtitle: 'Cela peut prendre quelques instants.',
  },
  '403': {
    icon: 'lock',
    tone: 'warning',
    title: 'Accès refusé',
    subtitle: 'Vous n’avez pas les droits nécessaires pour consulter cette page.',
  },
  '404': {
    icon: 'travel_explore',
    tone: 'info',
    title: 'Page introuvable',
    subtitle: 'Le lien est peut-être erroné ou la page a été déplacée.',
  },
  '500': {
    icon: 'cloud_off',
    tone: 'error',
    title: 'Erreur du serveur',
    subtitle: 'Un incident technique est survenu. Nos équipes sont prévenues.',
  },
};

/** app-result : écran de fin d'action ou d'erreur (contenu = children, actions = prop). */
export function Result({
  status = 'success',
  title,
  subtitle,
  icon,
  compact,
  children,
  actions,
}: {
  status?: ResultStatus;
  title?: string;
  subtitle?: string;
  icon?: string;
  compact?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const p = PRESETS[status];
  const code = ['403', '404', '500'].includes(status) ? status : '';
  const sub = subtitle || p.subtitle;
  return (
    <div
      className={`rs${compact ? ' compact' : ''}`}
      style={{ '--tone': `var(--${p.tone}-color)`, '--tone-ink': toneInk(`var(--${p.tone}-color)`) } as CSSProperties}
    >
      {code && <span className="rs-code">{code}</span>}
      <div
        className={`rs-ic${status === 'pending' ? ' pending' : ''}${status === 'success' ? ' pop' : ''}`}
        key={status}
      >
        <MaterialIcon name={icon || p.icon} />
      </div>
      <h2>{title || p.title}</h2>
      {sub && <p>{sub}</p>}
      {children && <div className="rs-content">{children}</div>}
      {actions && <div className="rs-actions">{actions}</div>}
    </div>
  );
}
