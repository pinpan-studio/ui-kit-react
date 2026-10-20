import { useEffect, useState, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './banner.scss';
import { useNetworkStatus } from './networkStatus';

export type BannerTone = 'info' | 'success' | 'warning' | 'error' | 'maintenance' | 'offline' | 'promo';
const TONE_ICON: Record<BannerTone, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
  maintenance: 'engineering',
  offline: 'wifi_off',
  promo: 'campaign',
};

const storedClosed = (k: string) => {
  try {
    return !!k && localStorage.getItem('kit-banner-' + k) === '1';
  } catch {
    return false;
  }
};

/** app-banner : message global pleine largeur, fermeture mémorisable (dismissKey). */
export function Banner({
  tone = 'info',
  title = '',
  icon = '',
  spin,
  actionLabel = '',
  dismissible = true,
  compact,
  dismissKey = '',
  onAction,
  onClose,
  children,
}: {
  tone?: BannerTone;
  title?: string;
  icon?: string;
  spin?: boolean;
  actionLabel?: string;
  dismissible?: boolean;
  compact?: boolean;
  dismissKey?: string;
  onAction?: () => void;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const [closed, setClosed] = useState(() => storedClosed(dismissKey));
  if (closed) return null;
  const dismiss = () => {
    setClosed(true);
    if (dismissKey)
      try {
        localStorage.setItem('kit-banner-' + dismissKey, '1');
      } catch {
        /* stockage indisponible */
      }
    onClose?.();
  };
  return (
    <div
      className={`bn bn--${tone}${compact ? ' compact' : ''}`}
      role={tone === 'error' || tone === 'offline' ? 'alert' : 'status'}
    >
      <MaterialIcon name={icon || TONE_ICON[tone]} className={`bn-ic${spin ? ' spin' : ''}`} />
      <div className="bn-text">
        {title && <strong>{title}</strong>}
        <span>{children}</span>
      </div>
      {actionLabel && (
        <button type="button" className="bn-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {dismissible && (
        <button type="button" className="bn-close" onClick={dismiss} aria-label="Fermer">
          <MaterialIcon name="close" />
        </button>
      )}
    </div>
  );
}

/** app-offline-banner : « Vous êtes hors ligne » puis « Connexion rétablie » 3,5 s. */
export function OfflineBanner({ compact = true }: { compact?: boolean }) {
  const { online, restoredAt } = useNetworkStatus();
  const [restored, setRestored] = useState<number | null>(null);
  useEffect(() => {
    if (!restoredAt) return;
    setRestored(restoredAt);
    const t = setTimeout(() => setRestored(null), 3500);
    return () => clearTimeout(t);
  }, [restoredAt]);
  return (
    <div style={{ display: 'block' }}>
      {!online ? (
        <Banner tone="offline" title="Vous êtes hors ligne" dismissible={false} compact={compact}>
          Les modifications seront synchronisées au retour de la connexion.
        </Banner>
      ) : restored ? (
        <Banner
          key={restored}
          tone="success"
          title="Connexion rétablie"
          dismissible={false}
          compact={compact}
          icon="wifi"
        >
          Vos données sont à jour.
        </Banner>
      ) : null}
    </div>
  );
}
