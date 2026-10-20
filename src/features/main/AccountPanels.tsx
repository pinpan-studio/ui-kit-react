import { IconButton, LinearProgress, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useModal } from '../../components/feedback/dialogs/useModal';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import type { StaticNotification } from '../../lib/session';
import './notifications-panel.scss';
import './user-settings-panel.scss';

export type SettingMode = '_PROFIL_' | '_RESET_PASSWORD_' | '_DISCONNECT_';

/** Panneau « Paramètres du compte » du drawer droit (UserSettingsComponent). */
export function UserSettingsPanel({ onLeave, onSelect }: { onLeave: () => void; onSelect: (m: SettingMode) => void }) {
  const [mode, setMode] = useState<SettingMode>('_PROFIL_');
  const select = (m: SettingMode) => {
    setMode(m);
    onSelect(m);
  };
  const item = (m: SettingMode, icon: string, label: string, sub: string, danger = false) => (
    <button
      type="button"
      className={`menu-item-btn${danger ? ' danger-item' : ''}${!danger && mode === m ? ' active' : ''}`}
      onClick={() => select(m)}
    >
      <div className={`item-icon-box${danger ? ' danger' : ''}`}>
        <MaterialIcon name={icon} />
      </div>
      <div className="item-content">
        <span className="item-label">{label}</span>
        <span className="item-sub">{sub}</span>
      </div>
      <MaterialIcon name="chevron_right" className="item-arrow" />
    </button>
  );

  return (
    <div className="user-settings-panel">
      <div className="user-settings-drawer">
        <div className="sidenav-header">
          <div className="header-icon-box">
            <MaterialIcon name="manage_accounts" />
          </div>
          <div className="header-text">
            <span className="app-title">Paramètres du compte</span>
            <span className="app-subtitle">Profil & sécurité</span>
          </div>
          <span className="spacer" />
          <Tooltip title="Fermer">
            <IconButton className="action-icon-btn" aria-label="Fermer" onClick={onLeave}>
              <MaterialIcon name="close" />
            </IconButton>
          </Tooltip>
        </div>

        <div className="settings-scrollbar">
          <div className="sidenav-menu-wrapper">
            <div className="menu-section">
              <div className="section-header active-section">
                <MaterialIcon name="person" className="section-icon" />
                <span className="section-title">Gestion de profil</span>
              </div>
              <div className="section-items">
                {item('_PROFIL_', 'badge', 'Paramètres personnels', 'Modifiez vos données personnelles')}
                {item('_RESET_PASSWORD_', 'lock_reset', 'Mot de passe', 'Changez votre mot de passe')}
              </div>
            </div>

            <div className="menu-section">
              <div className="section-header">
                <MaterialIcon name="power_settings_new" className="section-icon" />
                <span className="section-title">Connexion</span>
              </div>
              <div className="section-items">
                {item('_DISCONNECT_', 'logout', 'Déconnexion', 'Fermer la session en cours', true)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ddMMHHmm = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Panneau « Notifications » du drawer droit (NotificationsComponent) — liste statique, suppression locale. */
export function NotificationsPanel({
  initial,
  onGoBack,
  onLeave,
  onSelect,
}: {
  initial: StaticNotification[];
  onGoBack: () => void;
  onLeave: () => void;
  onSelect: (m: StaticNotification) => void;
}) {
  const modal = useModal();
  const [messages, setMessages] = useState(() => initial.map((m) => ({ ...m })));
  const [loading, setLoading] = useState(false);

  const selectMessage = (m: StaticNotification) => {
    setMessages((list) => list.map((x) => (x._id === m._id ? { ...x, lu: true } : x)));
    onSelect(m);
  };
  const deleteAll = () =>
    void modal
      .confirm({ title: 'Notifications', message: 'Voulez-vous supprimer toutes les notifications ?' })
      .then((yes) => {
        if (!yes) return;
        setLoading(true);
        setTimeout(() => {
          setMessages([]);
          setLoading(false);
        }, 600);
      });

  return (
    <div className="notifications-panel">
      <div className="notifications-drawer">
        <div className="sidenav-header">
          <Tooltip title="Retour aux paramètres">
            <IconButton className="action-icon-btn back-btn" aria-label="Retour aux paramètres" onClick={onGoBack}>
              <MaterialIcon name="arrow_back" />
            </IconButton>
          </Tooltip>
          <div className="header-icon-box orange">
            <MaterialIcon name="notifications" />
          </div>
          <div className="header-text">
            <span className="app-title">Notifications</span>
            <span className="app-subtitle">
              {messages.length} message{messages.length > 1 ? 's' : ''}
            </span>
          </div>
          <span className="spacer" />
          {messages.length > 0 && (
            <Tooltip title="Supprimer toutes les notifications">
              <IconButton
                className="action-icon-btn"
                aria-label="Supprimer toutes les notifications"
                onClick={deleteAll}
              >
                <MaterialIcon name="delete_sweep" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Fermer">
            <IconButton className="action-icon-btn" aria-label="Fermer" onClick={onLeave}>
              <MaterialIcon name="close" />
            </IconButton>
          </Tooltip>
        </div>

        {loading && <LinearProgress />}

        <div className="notif-scrollbar">
          <div className="notif-list">
            {messages.length === 0 ? (
              <div className="notif-empty">
                <div className="empty-icon-box">
                  <MaterialIcon name="notifications_off" />
                </div>
                <span className="empty-title">Aucune notification</span>
                <span className="empty-sub">Vous êtes à jour !</span>
              </div>
            ) : (
              messages.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  className={`notif-card${m.lu ? '' : ' unread'}`}
                  onClick={() => selectMessage(m)}
                >
                  <div className={`notif-icon-box${m.lu ? '' : ' unread'}`}>
                    <MaterialIcon name={m.lu ? 'mark_chat_read' : 'mark_unread_chat_alt'} />
                  </div>
                  <div className="notif-content">
                    <div className="notif-top">
                      <span className="notif-type">{m.type || 'Notification'}</span>
                      {m.envoyeLe && <span className="notif-time">{ddMMHHmm(m.envoyeLe)}</span>}
                    </div>
                    <div className="notif-text">{m.contenu}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
