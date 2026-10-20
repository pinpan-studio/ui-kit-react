import { Button, IconButton } from '@mui/material';
import { Fragment, useRef, useState } from 'react';
import { Banner, OfflineBanner } from '../../../components/feedback/Banner';
import { useNetworkStatus } from '../../../components/feedback/networkStatus';
import { Result, type ResultStatus } from '../../../components/feedback/Result';
import { UploadQueue, type UploadQueueHandle } from '../../../components/feedback/UploadQueue';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { useUndo } from '../../../components/feedback/useUndo';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { buildSamplePdf, buildSampleWav } from '../../../lib/media/sampleMedia';
import { Demo, DocSection } from '../doc/Doc';
import { CODE } from './feedbackCode';

const INITIAL = [
  { id: 1, nom: 'Zone « Dépôt Yopougon »', icon: 'pentagon', meta: 'Géofence · 2,4 km²' },
  { id: 2, nom: 'Alerte « Excès de vitesse »', icon: 'speed', meta: 'Règle · 12 véhicules' },
  { id: 3, nom: 'Rapport hebdomadaire', icon: 'description', meta: 'Planifié · lundi 8 h' },
  { id: 4, nom: 'Utilisateur Serge Kouamé', icon: 'person', meta: 'Superviseur' },
  { id: 5, nom: 'Véhicule CI-0418-GH', icon: 'two_wheeler', meta: 'Yamaha Crux' },
];
type Item = (typeof INITIAL)[number];
const STATUSES: ResultStatus[] = ['success', 'error', 'pending', 'warning', '403', '404', '500'];

function resultActions(s: ResultStatus) {
  const flat = (label: string, icon?: string) => (
    <Button variant="contained" startIcon={icon ? <MaterialIcon name={icon} /> : undefined}>
      {label}
    </Button>
  );
  switch (s) {
    case 'error':
      return flat('Réessayer', 'refresh');
    case '403':
      return flat("Demander l'accès");
    case '404':
      return flat("Retour à l'accueil");
    case '500':
      return (
        <>
          {flat('Recharger', 'refresh')}
          <Button variant="outlined" color="inherit">
            Contacter le support
          </Button>
        </>
      );
    case 'pending':
      return (
        <Button variant="outlined" color="inherit">
          Continuer en arrière-plan
        </Button>
      );
    default:
      return flat('Continuer');
  }
}

/** Sections ajoutées à la galerie Feedback : upload multiple, bannières, page de résultat, annulation. */
export function FeedbackAdvanced() {
  const snack = useSnackbar();
  const undo = useUndo();
  const net = useNetworkStatus();
  const q = useRef<UploadQueueHandle>(null);
  const [bannerKey, setBannerKey] = useState(0);
  const [result, setResult] = useState<ResultStatus>('success');
  const [items, setItems] = useState<Item[]>(INITIAL);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [commits, setCommits] = useState<string[]>([]);

  const addSamples = () => {
    const f = (b: Blob, name: string) => new File([b], name, { type: b.type });
    q.current?.add([
      f(buildSamplePdf('Contrat cadre 2026', 6), 'contrat-cadre-2026.pdf'),
      f(buildSampleWav(20), 'appel-client.wav'),
      f(new Blob([new Uint8Array(2_400_000)], { type: 'image/jpeg' }), 'photo-installation.jpg'),
      f(new Blob([new Uint8Array(900_000)], { type: 'image/png' }), 'erreur-scan-carte-grise.png'),
      f(new Blob([new Uint8Array(30_000_000)], { type: 'video/mp4' }), 'video-trop-lourde.mp4'),
      f(new Blob(['x'], { type: 'application/x-msdownload' }), 'installeur.exe'),
    ]);
  };
  const remove = (it: Item) => {
    const before = itemsRef.current;
    setItems(before.filter((x) => x.id !== it.id));
    undo.run({
      message: `${it.nom} supprimé`,
      // Réinsère l'élément à sa place sans annuler les autres suppressions intervenues depuis.
      undo: () => {
        const keep = new Set([...itemsRef.current.map((x) => x.id), it.id]);
        setItems(before.filter((x) => keep.has(x.id)));
      },
      commit: () =>
        setCommits((c) =>
          [`${new Date().toLocaleTimeString('fr-FR')} — suppression validée : ${it.nom}`, ...c].slice(0, 4),
        ),
    });
  };

  return (
    <div className="gallery-feedback-advanced">
      <DocSection
        id="upload-queue"
        title="Envoi multiple avec progression"
        source="app-upload-queue (shared/components/feedback)"
        cols={2}
        description="Zone de dépôt (glisser, cliquer, coller), validation type / taille / nombre, progression par fichier et globale, envois parallèles limités, annuler, réessayer, retirer, vider. L'envoi est délégué à une fonction fournie par l'hôte (simulé ici ; un nom contenant « erreur » échoue)."
      >
        <Demo label="Pièces jointes d'un dossier" code={CODE.upload}>
          <UploadQueue
            ref={q}
            accept="image/*,application/pdf,audio/*,video/*,.xlsx"
            maxSize={25 * 1024 * 1024}
            onCompleted={(files) =>
              snack(`${files.length} fichier(s) envoyé(s) — démo statique`, { action: 'Fermer', duration: 2500 })
            }
          />
          <div className="row demo-actions">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="auto_awesome" />}
              onClick={addSamples}
            >
              Ajouter des fichiers d'exemple
            </Button>
            <span className="muted">6 fichiers dont 1 en erreur, 2 refusés</span>
          </div>
        </Demo>
        <Demo label="Photos uniquement, 3 max">
          <UploadQueue
            accept="image/*"
            maxFiles={3}
            maxSize={5 * 1024 * 1024}
            hint="JPG ou PNG · 5 Mo max · 3 photos"
          />
        </Demo>
      </DocSection>

      <DocSection
        id="banner"
        title="Bannière globale & hors ligne"
        source="app-banner · app-offline-banner · NetworkStatusService"
        description="Message pleine largeur en haut de l'application : maintenance planifiée, incident, information, nouveauté. Fermeture mémorisée (dismissKey). L'indicateur hors ligne s'appuie sur les événements online / offline du navigateur et affiche « Connexion rétablie » au retour."
      >
        <Demo label="Tons" code={CODE.banner}>
          <div className="col banners">
            <Fragment key={bannerKey}>
              <Banner tone="maintenance" title="Maintenance planifiée" actionLabel="Détails" icon="engineering">
                La plateforme sera indisponible dimanche 19 octobre de 2 h à 4 h.
              </Banner>
              <Banner tone="error" title="Incident en cours" icon="sync" spin actionLabel="Suivre l'incident">
                La remontée GPS des balises Teltonika est retardée (≈ 10 min).
              </Banner>
              <Banner tone="warning" title="Abonnement bientôt expiré" actionLabel="Renouveler">
                Votre offre Premium expire dans 5 jours.
              </Banner>
              <Banner tone="info">Nouvelle version disponible : actualisez la page pour en profiter.</Banner>
              <Banner tone="success" compact>
                Synchronisation terminée — 1 248 véhicules à jour.
              </Banner>
              <Banner tone="promo" title="Nouveau : rapports carburant" actionLabel="Découvrir">
                Suivez la consommation de chaque véhicule.
              </Banner>
            </Fragment>
          </div>
          <div className="row demo-actions">
            <Button startIcon={<MaterialIcon name="restart_alt" />} onClick={() => setBannerKey((k) => k + 1)}>
              Réafficher les bannières
            </Button>
          </div>
        </Demo>
        <Demo label="Indicateur hors ligne" hint="simulé — ou coupez réellement votre connexion">
          <div className="offline-demo">
            <OfflineBanner />
            <div className="fake-page">
              <i />
              <i />
              <i className="short" />
            </div>
          </div>
          <div className="row demo-actions">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="wifi_off" />}
              onClick={() => net.simulate(false)}
              disabled={!net.online}
            >
              Passer hors ligne
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<MaterialIcon name="wifi" />}
              onClick={() => net.simulate(true)}
              disabled={net.online}
            >
              Rétablir
            </Button>
            <span className="muted">État : {net.online ? 'en ligne' : 'hors ligne'}</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="result"
        title="Page de résultat"
        source="app-result (shared/components/feedback)"
        cols={2}
        description="Écran de fin d'action (paiement, validation, envoi) ou d'erreur (403, 404, 500) : pictogramme, titre, sous-titre, récapitulatif libre et actions."
      >
        <Demo label="Paiement confirmé" code={CODE.result}>
          <Result
            status="success"
            title="Paiement confirmé"
            subtitle="Un reçu a été envoyé à jean.kouassi@transports-yao.ci."
            actions={
              <>
                <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="download" />}>
                  Reçu PDF
                </Button>
                <Button variant="contained">Retour au tableau de bord</Button>
              </>
            }
          >
            <div className="receipt">
              <div>
                <span>Référence</span>
                <b>PAY-2026-10-0412</b>
              </div>
              <div>
                <span>Facture</span>
                <b>FAC-2026-0981</b>
              </div>
              <div>
                <span>Moyen</span>
                <b>Orange Money</b>
              </div>
              <div className="total">
                <span>Montant</span>
                <b>1 250 000 FCFA</b>
              </div>
            </div>
          </Result>
        </Demo>
        <Demo label="Tous les statuts">
          <div className="status-pick">
            {STATUSES.map((s) => (
              <button key={s} type="button" className={result === s ? 'on' : ''} onClick={() => setResult(s)}>
                {s}
              </button>
            ))}
          </div>
          <Result status={result} compact actions={resultActions(result)} />
        </Demo>
      </DocSection>

      <DocSection
        id="undo"
        title="Snackbar « Annuler »"
        source="UndoService (shared/components/feedback)"
        cols={2}
        description="Alternative à la boîte de confirmation : l'élément disparaît immédiatement, un snackbar propose « Annuler » avec compte à rebours ; la suppression n'est réellement exécutée (commit) qu'à l'expiration. Une nouvelle action valide la précédente."
      >
        <Demo label="Supprimer avec annulation" code={CODE.undo}>
          <ul className="undo-list">
            {items.length ? (
              items.map((it) => (
                <li key={it.id}>
                  <MaterialIcon name={it.icon} />
                  <div>
                    <strong>{it.nom}</strong>
                    <span>{it.meta}</span>
                  </div>
                  <IconButton onClick={() => remove(it)} aria-label="Supprimer">
                    <MaterialIcon name="delete_outline" />
                  </IconButton>
                </li>
              ))
            ) : (
              <li className="empty">
                Tout a été supprimé. <Button onClick={() => setItems(INITIAL)}>Restaurer la démo</Button>
              </li>
            )}
          </ul>
        </Demo>
        <Demo label="Actions réellement exécutées (commit)">
          {commits.length ? (
            <ul className="event-log">
              {commits.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <span className="muted">
              Supprimez un élément puis laissez le compte à rebours s'écouler : la suppression est validée ici. Cliquez
              « Annuler » pour la rétablir.
            </span>
          )}
        </Demo>
      </DocSection>
    </div>
  );
}
