import { Button, CircularProgress, IconButton, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MaterialIcon } from '../../ui/MaterialIcon';
import type { DialogRef } from './dialogContext';
import './legacy-dialogs.scss';

/** Paramètres des dialogs génériques du ModalService d'origine. */
export interface ParamDialog {
  title?: string;
  subTitle?: string;
  message?: string | string[];
  actionBtn?: { label: string; link: string };
}

/** AlertComponent (ModalService.alert) — surface transparente sur voile sombre. */
export function AlertDialog({ data, dialog }: { data: ParamDialog; dialog: DialogRef<undefined> }) {
  return (
    <div className="dTheme route legacy-col">
      <div className="ng-pad legacy-center">
        <div className="mat-headline capitalize">{data.title}</div>
        <div className="mat-body-1">{data.message}</div>
        <div className="ng-pad" />
        <div className="ng-pad">
          <Button variant="contained" onClick={() => dialog.close()}>
            <span className="mat-body-2 capitalize">OK</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** ConfirmComponent (ModalService.confirm) — carte centrée avec pastille d'icône. */
export function ConfirmCard({ data, dialog }: { data?: ParamDialog; dialog?: DialogRef<boolean> }) {
  return (
    <div className="confirm-card">
      <div className="icon-badge">
        <MaterialIcon name="help_outline" />
      </div>
      {data?.title && <h2 className="confirm-title">{data.title}</h2>}
      <p className="confirm-message">{data?.message}</p>
      <div className="confirm-actions">
        <Button onClick={() => dialog?.close(false)}>
          <span>Annuler</span>
        </Button>
        <Button variant="contained" onClick={() => dialog?.close(true)}>
          <span>Confirmer</span>
        </Button>
      </div>
    </div>
  );
}

/** PromptComponent (ModalService.prompt) — saisie libre. */
export function PromptDialog({ data, dialog }: { data: ParamDialog; dialog: DialogRef<string> }) {
  const [value, setValue] = useState('');
  return (
    <>
      <h2 className="mat-mdc-dialog-title prompt-title">{data.title}</h2>
      <div className="mat-mdc-dialog-content">
        {data.message && <p className="prompt-message">{data.message}</p>}
        <div className="field-box textarea-box">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Votre réponse…"
            aria-label="Votre réponse"
          />
        </div>
      </div>
      <div className="mat-mdc-dialog-actions">
        <Button onClick={() => dialog.close()}>Annuler</Button>
        <Button variant="contained" startIcon={<MaterialIcon name="check" />} onClick={() => dialog.close(value)}>
          Valider
        </Button>
      </div>
    </>
  );
}

/** ConfirmBottomSheetComponent (ModalService.bottomConfirm). */
export function ConfirmBottomSheet({ data, dialog }: { data: ParamDialog; dialog: DialogRef<boolean> }) {
  return (
    <List className="mat-nav-list legacy-col" component="nav">
      <div className="legacy-row">
        <p className="mat-title no-wrap">{data.message}</p>
      </div>
      <div className="legacy-row">
        <ListItemButton onClick={() => dialog.close(true)}>
          <ListItemIcon>
            <MaterialIcon name="check_circle" />
          </ListItemIcon>
          <ListItemText primary="Confirmer" secondary="Cliquer ici pour confirmer" />
        </ListItemButton>
        <ListItemButton onClick={() => dialog.close(false)}>
          <ListItemIcon>
            <MaterialIcon name="cancel" />
          </ListItemIcon>
          <ListItemText primary="Annuler" secondary="Cliquer ici pour annuler" />
        </ListItemButton>
      </div>
    </List>
  );
}

/** PushMessageComponent (ModalService.showPushMessage). */
export function PushMessageDialog({ data, dialog }: { data: ParamDialog; dialog: DialogRef<undefined> }) {
  const navigate = useNavigate();
  return (
    <div className="mat-card dTheme ng-pad legacy-col kit-push-message">
      <div className="ng-pad legacy-col">
        <div className="ng-pad legacy-row start">
          <div className="mat-headline capitalize ng-pad-sm" style={{ fontWeight: 100, margin: 0, flex: 1 }}>
            {data.title}
          </div>
          <IconButton aria-label="Fermer" onClick={() => dialog.close()}>
            <MaterialIcon name="close" />
          </IconButton>
        </div>
        <div className="ng-pad legacy-col">
          <div className="ng-pad legacy-col">
            {data.message && (
              <div className="mat-body-2 capitalize" style={{ fontWeight: 100 }}>
                {data.message}
              </div>
            )}
            {data.actionBtn && (
              <div className="ng-pad">
                <Button
                  variant="contained"
                  onClick={() => {
                    dialog.close();
                    void navigate(data.actionBtn?.link ?? '/');
                  }}
                >
                  <span className="mat-body-2 capitalize">{data.actionBtn.label}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** PriorityMessageComponent (ModalService.showPriorityMessage). */
export function PriorityMessageDialog({ data, dialog }: { data: ParamDialog; dialog: DialogRef<undefined> }) {
  const navigate = useNavigate();
  const msgs = Array.isArray(data.message) ? data.message : data.message ? [data.message] : [];
  return (
    <div className="dTheme route legacy-col kit-priority-message">
      <div className="ng-pad legacy-center">
        {data.subTitle && (
          <div className="mat-h3 capitalize" style={{ opacity: 0.7 }}>
            {data.subTitle}
          </div>
        )}
        <div className="mat-h2 capitalize">{data.title}</div>
        {msgs.length > 0 && (
          <div
            className="mat-body-1"
            style={{
              maxWidth: '85%',
              lineHeight: 1.6,
              marginTop: 24,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
            }}
          >
            {msgs.map((m) => (
              <div key={m} style={{ marginBottom: Array.isArray(data.message) ? 12 : 0, whiteSpace: 'pre-wrap' }}>
                {m}
              </div>
            ))}
          </div>
        )}
        {data.actionBtn && (
          <div className="ng-pad">
            <Button
              variant="contained"
              onClick={() => {
                dialog.close();
                void navigate(data.actionBtn?.link ?? '/');
              }}
            >
              <span className="mat-body-2 capitalize">{data.actionBtn.label}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Voile de chargement (app-overlay-spiner). */
export function OverlaySpinner({ progress }: { progress: { loading: boolean; label: string } }) {
  if (!progress.loading) return null;
  return (
    <div
      className="mat-overlay-spinner"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
    >
      <CircularProgress size={60} />
      <div className="mat-body-2 mat-padding-small">{progress.label}</div>
    </div>
  );
}
