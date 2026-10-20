import { Button, CircularProgress, IconButton, TextField } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PhotoUpload } from '../../fields/PhotoUpload';
import { MaterialIcon } from '../../ui/MaterialIcon';
import { useSnackbar } from '../useSnackbar';
import type { DialogRef } from './dialogContext';
import { OverlaySpinner } from './LegacyDialogs';
import './account-dialogs.scss';

const CURRENT_USER = {
  _id: 'u-001',
  fullname: 'Jean Kouassi',
  mail: 'jean.kouassi@example.com',
  phone: '+225 07 07 12 34 56',
};

/** mat-form-field appearance="outline" + matSuffix. */
function OutlineField({
  label,
  icon,
  ...p
}: { label: string; icon: string } & Omit<React.ComponentProps<typeof TextField>, 'label'>) {
  return (
    <TextField
      className="kit-outline-field"
      variant="outlined"
      label={label}
      autoComplete="off"
      slotProps={{ input: { endAdornment: <MaterialIcon name={icon} className="kit-suffix" /> } }}
      {...p}
    />
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mat-mdc-dialog-title ng-pad acc-head">
      <div className="ng-pad acc-title">{title}</div>
      <IconButton onClick={onClose} aria-label="Fermer">
        <MaterialIcon name="close" />
      </IconButton>
    </div>
  );
}

/** ProfilComponent : « Paramètres personnels ». */
export function ProfilDialog({ dialog }: { dialog: DialogRef<undefined> }) {
  const snack = useSnackbar();
  const [v, setV] = useState(CURRENT_USER);
  const [loading, setLoading] = useState(false);
  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dialog.close();
      snack('Profil mis à jour', { duration: 2000 });
    }, 800);
  };
  return (
    <div className="dTheme acc-col">
      <Header title="Paramètres personnels" onClose={() => dialog.close()} />
      <div className="acc-col ng-pad" style={{ flex: 1 }}>
        <form className="inscription-form ng-pad acc-col" style={{ flex: 1 }} onSubmit={(e) => e.preventDefault()}>
          <div className="ng-pad acc-center">
            <PhotoUpload placeholder="document" accept="application/images" />
          </div>
          <div className="ng-pad acc-col" style={{ flex: 1 }}>
            <OutlineField
              label="Nom complet"
              icon="person"
              placeholder="Prénom(s) Nom"
              value={v.fullname}
              disabled={loading}
              required
              error={!v.fullname}
              onChange={(e) => setV({ ...v, fullname: e.target.value })}
            />
            <div className="ng-pad-sm" />
            <OutlineField
              label="Email"
              icon="alternate_email"
              placeholder="Adresse email"
              value={v.mail}
              disabled={loading}
              onChange={(e) => setV({ ...v, mail: e.target.value })}
            />
            <OutlineField
              label="Téléphone"
              icon="phone"
              placeholder="Numéro de téléphone"
              value={v.phone}
              disabled={loading}
              onChange={(e) => setV({ ...v, phone: e.target.value })}
            />
          </div>
        </form>
        <div className="ng-pad acc-row">
          <div className="ng-pad-sm" style={{ flex: 1 }} />
          <Button variant="contained" disabled={!v.fullname || loading} onClick={save}>
            {loading && <CircularProgress size={25} />}
            <span className="ng-pad-sm" />
            <span>Valider</span>
            <span className="ng-pad-sm" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** ResetPasswordComponent : « Modifiez votre mot de passe ». */
export function ResetPasswordDialog({ dialog }: { dialog: DialogRef<undefined> }) {
  const snack = useSnackbar();
  const [f, setF] = useState({ pass: '', newpass: '', cpass: '' });
  const [loading, setLoading] = useState(false);
  const invalid = !f.pass || f.newpass.length < 6 || !f.cpass;
  const mismatch = f.newpass !== f.cpass;
  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dialog.close();
      snack('Mot de passe modifié', { duration: 2000 });
    }, 800);
  };
  return (
    <div className="acc-reset">
      <OverlaySpinner progress={{ loading, label: 'Modification en cours...' }} />
      <Header title="Modifiez votre mot de passe" onClose={() => dialog.close()} />
      <div className="acc-col" style={{ flex: 1 }}>
        <form className="inscription-form ng-pad acc-col" style={{ flex: 1 }} onSubmit={(e) => e.preventDefault()}>
          <div className="ng-pad acc-col">
            <OutlineField
              label="Mot de passe actuel"
              icon="more_horiz"
              type="password"
              placeholder="Entrez votre mot de passe actuel"
              value={f.pass}
              onChange={(e) => setF({ ...f, pass: e.target.value })}
            />
            <div className="mat-padding-small" />
            <OutlineField
              label="Nouveau mot de passe"
              icon="more_horiz"
              type="password"
              placeholder="Entrez votre nouveau mot de passe"
              value={f.newpass}
              onChange={(e) => setF({ ...f, newpass: e.target.value })}
            />
            <OutlineField
              label="Confirmez le mot de passe"
              icon="more_horiz"
              type="password"
              placeholder="Confirmez le mot de passe"
              value={f.cpass}
              error={mismatch}
              helperText={mismatch ? 'La confirmation du nouveau mot de passe est incorrecte' : undefined}
              onChange={(e) => setF({ ...f, cpass: e.target.value })}
            />
          </div>
          <div className="ng-pad acc-row" style={{ flex: 1 }}>
            <div className="ng-pad-sm" style={{ flex: 1 }} />
            <Button variant="contained" disabled={invalid} onClick={save}>
              Valider
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** GoogleAuthModalComponent : « Connexion requise ». */
export function GoogleAuthDialog({
  data,
  dialog,
}: {
  data: { errorMessage?: string | null };
  dialog: DialogRef<boolean>;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const signin = () => {
    setLoading(true);
    setTimeout(() => {
      dialog.close(true);
      void navigate('/main');
    }, 900);
  };
  return (
    <div className="google-auth-host">
      <div className="google-auth-modal">
        <div className="brand">
          <img src="/logo.png" className="brand-logo" alt="SC Storage" />
        </div>
        <div className="intro">
          <h2 className="intro-title">Connexion requise</h2>
          <p className="intro-text">Connectez-vous avec votre compte Google pour accéder au référentiel unique.</p>
        </div>
        {data.errorMessage && (
          <div className="auth-error">
            <MaterialIcon name="error_outline" />
            <span>{data.errorMessage}</span>
          </div>
        )}
        <div className="actions">
          <Button
            variant="contained"
            className="kit-raised primary"
            startIcon={<MaterialIcon name="login" />}
            onClick={signin}
            disabled={loading}
          >
            Se connecter avec Google
          </Button>
        </div>
        {loading && (
          <div className="mat-overlay-spinner">
            <CircularProgress size={48} />
            <div className="mat-body-2 progress-label">Redirection vers Google ...</div>
          </div>
        )}
      </div>
    </div>
  );
}
