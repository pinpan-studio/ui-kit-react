import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { ConfirmDialog, type ConfirmDialogData } from '../../../components/feedback/dialogs/ConfirmDialog';
import { CrudDialog, type CrudDialogConfig } from '../../../components/feedback/dialogs/CrudDialog';
import {
  GoogleAuthDialog,
  ProfilDialog,
  ResetPasswordDialog,
} from '../../../components/feedback/dialogs/AccountDialogs';
import { OverlaySpinner } from '../../../components/feedback/dialogs/LegacyDialogs';
import { useDialog } from '../../../components/feedback/dialogs/useDialog';
import { useModal } from '../../../components/feedback/dialogs/useModal';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { NgxSkeleton, Skeleton } from '../../../components/feedback/Skeleton';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { BoxSelect } from '../../../components/fields/BoxSelect';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { FeedbackAdvanced } from './FeedbackAdvanced';
import { CODE } from './feedbackCode';
import './feedback-gallery.scss';
import './feedback-advanced.scss';

const TOC: TocItem[] = [
  { id: 'alert', label: 'Alert' },
  { id: 'toast', label: 'Toast / Snackbar' },
  { id: 'modal', label: 'Modal' },
  { id: 'dialog', label: 'Dialog' },
  { id: 'confirm', label: 'Confirmation' },
  { id: 'drawer', label: 'Drawer' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'loading', label: 'Loading' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'error', label: 'Error state' },
  { id: 'upload-queue', label: 'Upload multiple' },
  { id: 'banner', label: 'Bannière / hors ligne' },
  { id: 'result', label: 'Page de résultat' },
  { id: 'undo', label: 'Annuler (undo)' },
];

const CONFIRMS: Record<'danger' | 'warning' | 'info', ConfirmDialogData> = {
  danger: {
    title: 'Supprimer le produit',
    message: 'Êtes-vous sûr de vouloir supprimer le produit « PROD-001 » ? Cette action est irréversible.',
    type: 'danger',
    confirmLabel: 'Supprimer',
  },
  warning: {
    title: 'Suspendre le contrat',
    message: 'Le client ne sera plus facturé à partir du mois prochain.',
    type: 'warning',
    confirmLabel: 'Suspendre',
  },
  info: {
    title: 'Générer le rôle',
    message: 'Le rôle de facturation d’octobre 2026 va être généré (312 factures).',
    type: 'info',
  },
};
const CRUD: CrudDialogConfig = {
  title: 'Nouvelle note',
  subtitle: 'Ajouter une note de suivi',
  mode: 'create',
  fields: [
    { key: 'objet', label: 'Objet', type: 'text', placeholder: 'Ex : Relance paiement' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'APPEL', label: 'Appel' },
        { value: 'VISITE', label: 'Visite' },
        { value: 'MAIL', label: 'Email' },
      ],
    },
    { key: 'contenu', label: 'Contenu', type: 'textarea', placeholder: 'Détail…' },
  ],
};
const TOASTS = {
  success: ['Client enregistré avec succès', 'snackbar-success'],
  error: ['Erreur : la référence existe déjà', 'snackbar-error'],
  info: ['Synchronisation planifiée à 22:00', 'snackbar-info'],
  plain: ['Produit mis à jour', ''],
  action: ['3 lignes supprimées', ''],
} as const;

type AlertKind = 'info' | 'success' | 'warning' | 'error';

function Alert({
  kind,
  icon,
  title,
  text,
  action,
  onClose,
}: {
  kind: AlertKind;
  icon: string;
  title: string;
  text: string;
  action?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={`kit-alert ${kind}`}>
      <MaterialIcon name={icon} />
      <div className="a-body">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      {action}
      <IconButton onClick={onClose} aria-label="Fermer">
        <MaterialIcon name="close" />
      </IconButton>
    </div>
  );
}

/** Galerie /components/feedback — alertes, toasts, modales, drawers, confirmations, chargement, erreurs. */
export function FeedbackGalleryPage() {
  const snack = useSnackbar();
  const open = useDialog();
  const modal = useModal();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'over' | 'side'>('over');
  const [overlay, setOverlay] = useState({ loading: false, label: '' });
  const [progress, setProgress] = useState(35);
  const [lastResult, setLastResult] = useState('—');
  const [city, setCity] = useState('Abidjan');
  const [actifs, setActifs] = useState(true);
  const [impayes, setImpayes] = useState(false);

  const dismiss = (id: string) => setDismissed((s) => new Set(s).add(id));
  const toast = (kind: keyof typeof TOASTS) => {
    const [msg, cls] = TOASTS[kind];
    snack(msg, {
      action: kind === 'action' ? 'Annuler' : 'Fermer',
      duration: 3500,
      panelClass: cls || undefined,
      onAction:
        kind === 'action'
          ? () => setTimeout(() => snack('Suppression annulée', { action: 'Fermer', duration: 2000 }))
          : undefined,
    });
  };
  const toastPosition = (v: 'top' | 'bottom', h: 'start' | 'center' | 'end') =>
    snack(`Position ${v} / ${h}`, { action: 'Fermer', duration: 2500, vertical: v, horizontal: h });
  const confirmDialog = async (t: keyof typeof CONFIRMS) => {
    const r = await open<boolean>((d) => <ConfirmDialog data={CONFIRMS[t]} dialog={d} />);
    setLastResult(r ? 'Confirmé' : 'Annulé');
  };
  const yesNo = (r: boolean | undefined) => setLastResult(r ? 'Confirmé' : 'Annulé');
  const showOverlay = () => {
    setOverlay({ loading: true, label: 'Connexion en cours ...' });
    setTimeout(() => setOverlay({ loading: false, label: '' }), 2000);
  };
  const v = (id: string) => !dismissed.has(id);

  return (
    <DocPage
      title="Feedback"
      icon="notifications_active"
      className="gallery-feedback"
      subtitle="Retours visuels : bannières d'alerte, snackbars (snackbar-success/error/info), dialogs génériques du ModalService, ConfirmDialog, CrudDialog, dialogs de compte, drawers, indicateurs de chargement, skeletons et états d'erreur."
      toc={TOC}
    >
      <DocSection
        id="alert"
        title="Alert"
        source="bannières de modules (.success-banner, .readonly-banner, .run-banner…) · .alert-client"
        description="Bannières inline normalisées à partir des bannières des modules (fond « -color-light », icône, texte, action optionnelle). Cliquez sur la croix pour fermer."
      >
        <Demo label="Variantes">
          <div className="col">
            {v('info') && (
              <Alert
                kind="info"
                icon="info"
                title="Synchronisation planifiée"
                text="La prochaine synchronisation Wialon aura lieu ce soir à 22:00."
                onClose={() => dismiss('info')}
              />
            )}
            {v('success') && (
              <Alert
                kind="success"
                icon="check_circle"
                title="Proforma acceptée"
                text="Le dossier client a été initialisé automatiquement."
                onClose={() => dismiss('success')}
              />
            )}
            {v('warning') && (
              <Alert
                kind="warning"
                icon="warning"
                title="Lecture seule"
                text="Cet exercice comptable est clôturé : les écritures ne sont plus modifiables."
                action={
                  <Button variant="outlined" color="inherit" className="a-action">
                    Rouvrir
                  </Button>
                }
                onClose={() => dismiss('warning')}
              />
            )}
            {v('error') && (
              <Alert
                kind="error"
                icon="error"
                title="3 balises hors ligne depuis plus de 48 h"
                text="Vérifiez l'alimentation ou planifiez une intervention."
                action={
                  <Button variant="contained" color="error" className="a-action">
                    Planifier
                  </Button>
                }
                onClose={() => dismiss('error')}
              />
            )}
            {dismissed.size > 0 && (
              <Button startIcon={<MaterialIcon name="restart_alt" />} onClick={() => setDismissed(new Set())}>
                Réafficher les alertes
              </Button>
            )}
          </div>
        </Demo>
        <div className="grid-2">
          <Demo label="Compactes">
            <div className="col">
              <div className="kit-alert info compact">
                <MaterialIcon name="info" />
                <span>12 clients sans gestionnaire attitré.</span>
              </div>
              <div className="kit-alert warning compact">
                <MaterialIcon name="schedule" />
                <span>Échéance dans 3 jours.</span>
              </div>
            </div>
          </Demo>
          <Demo label="Alerte bloquante (.alert-client)">
            <div className="alert-client">
              Ce client est suspendu pour impayés — aucune nouvelle installation possible.
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection
        id="toast"
        title="Toast / Snackbar"
        source="MatSnackBar · .snackbar-success / -error / -info (styles.scss)"
        cols={2}
      >
        <Demo label="Types" code={CODE.snackbar}>
          <div className="row">
            <Button variant="outlined" color="inherit" onClick={() => toast('plain')}>
              Neutre
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="check_circle" />}
              onClick={() => toast('success')}
            >
              Succès
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="error" />}
              onClick={() => toast('error')}
            >
              Erreur
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="info" />}
              onClick={() => toast('info')}
            >
              Info
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="undo" />}
              onClick={() => toast('action')}
            >
              Avec action
            </Button>
          </div>
        </Demo>
        <Demo label="Positions">
          <div className="row">
            <Button onClick={() => toastPosition('top', 'end')}>Haut droite</Button>
            <Button onClick={() => toastPosition('top', 'center')}>Haut centre</Button>
            <Button onClick={() => toastPosition('bottom', 'start')}>Bas gauche</Button>
            <Button onClick={() => toastPosition('bottom', 'center')}>Bas centre (défaut)</Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="modal" title="Modal" source="ModalService · CrudDialogComponent · dialogs de compte" cols={3}>
        <Demo label="ModalService (génériques)" hint={`résultat : ${lastResult}`} code={CODE.modal}>
          <div className="row">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                void modal.alert({
                  title: 'Compte réinitialisé',
                  message: 'Votre compte a été réinitialisé. Veuillez changer votre mot de passe.',
                })
              }
            >
              alert()
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                void modal.confirm({ title: 'Valeur', message: 'Voulez-vous supprimer la valeur ?' }).then(yesNo)
              }
            >
              confirm()
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                void modal
                  .prompt({
                    title: 'Motif de rejet',
                    message: 'Indiquez la raison pour laquelle cette proforma a été refusée par le client :',
                  })
                  .then((r) => setLastResult(r ? `Saisi : « ${r} »` : 'Annulé'))
              }
            >
              prompt()
            </Button>
          </div>
        </Demo>
        <Demo label="Messages poussés">
          <div className="row">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="notifications" />}
              onClick={() =>
                void modal.showPushMessage({
                  title: 'Nouvelle requête client',
                  message: 'Transports Yao SARL a ouvert la requête REQ-2026-0412 « Balise hors ligne ».',
                  actionBtn: { label: 'Voir la requête', link: '/harnais' },
                })
              }
            >
              Push message
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="campaign" />}
              onClick={() =>
                void modal.showPriorityMessage({
                  subTitle: 'Information importante',
                  title: 'Maintenance planifiée',
                  message: [
                    'La plateforme sera indisponible le 18/10 de 22:00 à 23:30.',
                    'Les synchronisations seront rattrapées automatiquement.',
                  ],
                })
              }
            >
              Message prioritaire
            </Button>
          </div>
        </Demo>
        <Demo label="Formulaire (CrudDialog)">
          <Button
            variant="contained"
            startIcon={<MaterialIcon name="add" />}
            onClick={() =>
              void open((d) => <CrudDialog config={CRUD} dialog={d} />, {
                width: '640px',
                panelClass: 'assac-dialog-panel',
              })
            }
          >
            Nouvelle note
          </Button>
        </Demo>
        <Demo label="Compte">
          <div className="row">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="badge" />}
              onClick={() =>
                void open<undefined>((d) => <ProfilDialog dialog={d} />, {
                  width: '400px',
                  backdropClass: 'startBackDrop',
                })
              }
            >
              Profil
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="lock_reset" />}
              onClick={() =>
                void open<undefined>((d) => <ResetPasswordDialog dialog={d} />, {
                  width: '400px',
                  backdropClass: 'startBackDrop',
                })
              }
            >
              Mot de passe
            </Button>
          </div>
        </Demo>
        <Demo label="Connexion">
          <div className="row">
            {[false, true].map((err) => (
              <Button
                key={String(err)}
                variant="outlined"
                color="inherit"
                startIcon={err ? undefined : <MaterialIcon name="login" />}
                onClick={() =>
                  void open<boolean>(
                    (d) => (
                      <GoogleAuthDialog
                        dialog={d}
                        data={{
                          errorMessage: err ? 'Impossible de finaliser la connexion Google. Veuillez réessayer.' : null,
                        }}
                      />
                    ),
                    { backdropClass: 'startBackDrop', panelClass: 'google-auth-dialog-panel', width: '440px' },
                  )
                }
              >
                {err ? '… avec erreur' : 'Connexion requise'}
              </Button>
            ))}
          </div>
        </Demo>
        <Demo label="Overlay plein écran">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<MaterialIcon name="hourglass_top" />}
            onClick={showOverlay}
          >
            Afficher 2 s
          </Button>
          <OverlaySpinner progress={overlay} />
        </Demo>
      </DocSection>

      <DocSection
        id="dialog"
        title="Dialog"
        source="ConfirmDialogComponent (shared/components/confirm-dialog)"
        cols={2}
      >
        <Demo label="Types" hint={`résultat : ${lastResult}`} code={CODE.confirm}>
          <div className="row">
            <Button
              variant="contained"
              color="error"
              startIcon={<MaterialIcon name="delete" />}
              onClick={() => void confirmDialog('danger')}
            >
              Danger
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="help_outline" />}
              onClick={() => void confirmDialog('warning')}
            >
              Warning
            </Button>
            <Button
              variant="outlined"
              startIcon={<MaterialIcon name="info" />}
              onClick={() => void confirmDialog('info')}
            >
              Info
            </Button>
          </div>
        </Demo>
        <Demo label="Aperçu statique (contenu de dialog)">
          <div className="dialog-preview">
            <h2>
              <MaterialIcon name="warning" className="icon-danger" /> Supprimer le produit
            </h2>
            <p>Êtes-vous sûr de vouloir supprimer le produit « PROD-001 » ? Cette action est irréversible.</p>
            <div className="dp-actions">
              <Button>Annuler</Button>
              <Button className="kit-raised">Supprimer</Button>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="confirm"
        title="Confirmation dialog"
        source="ConfirmComponent (core) · ConfirmBottomSheetComponent"
        cols={2}
      >
        <Demo label="Carte de confirmation (statique)">
          <div className="confirm-card-preview">
            <div className="icon-badge">
              <MaterialIcon name="help_outline" />
            </div>
            <h2 className="confirm-title">Valeur</h2>
            <p className="confirm-message">Voulez-vous supprimer la valeur ?</p>
            <div className="confirm-actions">
              <Button>Annuler</Button>
              <Button variant="contained">Confirmer</Button>
            </div>
          </div>
        </Demo>
        <Demo label="Bottom sheet" hint={`résultat : ${lastResult}`}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<MaterialIcon name="logout" />}
            onClick={() =>
              void modal.bottomConfirm({ title: 'Confirmation', message: 'Voulez-vous vous déconnecter ?' }).then(yesNo)
            }
          >
            Se déconnecter…
          </Button>
        </Demo>
      </DocSection>

      <DocSection
        id="drawer"
        title="Drawer"
        source='mat-sidenav position="end" (drawer droit du shell, filtres)'
        description="Drawer latéral dans un conteneur de démonstration. La version réelle du shell (compte / notifications / tâches du jour) s'ouvre depuis la barre d'outils de l'application."
      >
        <Demo label="Drawer droit" flush code={CODE.drawer}>
          <div className={`drawer-demo kit-sidenav-container mode-${drawerMode}${drawerOpen ? ' is-open' : ''}`}>
            {drawerMode === 'over' && <div className="kit-sidenav-backdrop" onClick={() => setDrawerOpen(false)} />}
            <aside className="demo-drawer kit-sidenav" aria-hidden={!drawerOpen}>
              <div className="dd-inner">
                <div className="dd-head">
                  <div className="dd-icon">
                    <MaterialIcon name="tune" />
                  </div>
                  <div>
                    <strong>Filtres avancés</strong>
                    <span>Clients</span>
                  </div>
                  <span className="spacer" />
                  <IconButton onClick={() => setDrawerOpen(false)} aria-label="Fermer">
                    <MaterialIcon name="close" />
                  </IconButton>
                </div>
                <div className="dd-body">
                  <div className="form-field">
                    <label className="field-label">Ville</label>
                    <div className="field-box select-box">
                      <MaterialIcon name="location_on" />
                      <BoxSelect
                        ariaLabel="Ville"
                        value={city}
                        onChange={setCity}
                        options={[
                          { value: 'Abidjan', label: 'Abidjan' },
                          { value: 'Bouaké', label: 'Bouaké' },
                        ]}
                      />
                    </div>
                  </div>
                  <FormControlLabel
                    control={<Checkbox checked={actifs} onChange={(e) => setActifs(e.target.checked)} />}
                    label="Clients actifs uniquement"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={impayes} onChange={(e) => setImpayes(e.target.checked)} />}
                    label="Avec impayés"
                  />
                </div>
                <div className="dd-foot">
                  <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
                  <Button variant="contained" onClick={() => setDrawerOpen(false)}>
                    Appliquer
                  </Button>
                </div>
              </div>
            </aside>
            <div className="dd-content kit-sidenav-content">
              <div className="row">
                <Button
                  variant="contained"
                  startIcon={<MaterialIcon name="view_sidebar" />}
                  onClick={() => setDrawerOpen((o) => !o)}
                >
                  {drawerOpen ? 'Fermer' : 'Ouvrir'} le drawer
                </Button>
                <ToggleButtonGroup
                  exclusive
                  value={drawerMode}
                  onChange={(_, m: 'over' | 'side' | null) => m && setDrawerMode(m)}
                  className="m3-segmented"
                >
                  {(['over', 'side'] as const).map((m) => (
                    <ToggleButton key={m} value={m}>
                      {drawerMode === m && <MaterialIcon name="check" className="seg-check" />}
                      {m}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>
              <p className="muted">Contenu principal de la page…</p>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="tooltip" title="Tooltip" source="matTooltip">
        <Demo label="Positions">
          <div className="row">
            {(
              [
                ['Infobulle au-dessus', 'top', 'Above'],
                ['Infobulle en dessous', 'bottom', 'Below'],
                ['Infobulle à gauche', 'left', 'Left'],
                ['Infobulle à droite (rail)', 'right', 'Right'],
              ] as const
            ).map(([t, p, l]) => (
              <Tooltip key={l} title={t} placement={p}>
                <Button variant="outlined" color="inherit">
                  {l}
                </Button>
              </Tooltip>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection id="loading" title="Loading" source="mat-spinner · mat-progress-bar · .loading-center" cols={3}>
        <Demo label="Spinners">
          <div className="row lg">
            <CircularProgress size={20} />
            <CircularProgress size={40} />
            <CircularProgress size={60} />
          </div>
        </Demo>
        <Demo label="Barre indéterminée (drawer, en-tête)">
          <div className="col">
            <LinearProgress />
            <LinearProgress variant="query" />
            <LinearProgress variant="buffer" value={40} valueBuffer={70} />
          </div>
        </Demo>
        <Demo label="Barre déterminée" hint="cliquez">
          <div className="col">
            <LinearProgress variant="determinate" value={progress} />
            <Button variant="outlined" color="inherit" onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 15))}>
              Progression : {progress} %
            </Button>
          </div>
        </Demo>
        <Demo label="Zone centrée (.loading-center)">
          <div className="loading-center small">
            <CircularProgress size={40} />
          </div>
        </Demo>
        <Demo label="Chargement avec libellé">
          <div className="loading-label">
            <CircularProgress size={28} />
            <span>Chargement des factures…</span>
          </div>
        </Demo>
        <Demo label="Bouton en cours">
          <Button variant="contained" disabled>
            <CircularProgress size={18} className="btn-spin" /> Enregistrement…
          </Button>
        </Demo>
      </DocSection>

      <DocSection
        id="skeleton"
        title="Skeleton"
        source="app-skeleton (shared) · ngx-skeleton-loader (tâches, fichiers)"
        cols={2}
      >
        <Demo label='variant="line"' code={CODE.skeleton}>
          <Skeleton variant="line" count={4} />
        </Demo>
        <Demo label='variant="avatar"'>
          <Skeleton variant="avatar" count={3} />
        </Demo>
        <Demo label='variant="table-row"'>
          <Skeleton variant="table-row" count={3} />
        </Demo>
        <Demo label='variant="card"'>
          <Skeleton variant="card" count={2} />
        </Demo>
        <Demo label="ngx-skeleton-loader">
          <NgxSkeleton count={3} />
          <div className="row">
            <NgxSkeleton appearance="circle" theme={{ width: '48px', height: '48px' }} />
            <div className="w-100">
              <NgxSkeleton theme={{ width: '60%' }} />
              <NgxSkeleton theme={{ width: '35%' }} />
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="error" title="Error state" description="États d'erreur pleine zone, inline et de champ." cols={3}>
        <Demo label="Erreur de chargement">
          <div className="error-block">
            <div className="err-icon">
              <MaterialIcon name="cloud_off" />
            </div>
            <h3>Impossible de charger les données</h3>
            <p>Le service est momentanément indisponible.</p>
            <Button variant="contained" startIcon={<MaterialIcon name="refresh" />}>
              Réessayer
            </Button>
          </div>
        </Demo>
        <Demo label="Ressource introuvable">
          <EmptyState
            icon="search_off"
            title="Client introuvable"
            subtitle="Ce client a peut-être été supprimé ou fusionné."
            actionLabel="Retour à la liste"
          />
        </Demo>
        <Demo label="Accès refusé">
          <div className="error-block">
            <div className="err-icon warn">
              <MaterialIcon name="lock" />
            </div>
            <h3>Accès refusé</h3>
            <p>Votre groupe n'a pas la permission « Finance ».</p>
            <Button variant="outlined" color="inherit">
              Contacter l'administrateur
            </Button>
          </div>
        </Demo>
      </DocSection>

      <FeedbackAdvanced />
    </DocPage>
  );
}
