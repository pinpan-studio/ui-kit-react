import { Button, Fab } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { ContextMenu, type ContextMenuItem } from '../../../components/interaction/ContextMenu';
import { Kbd } from '../../../components/interaction/Kbd';
import { NotificationCenter, type AppNotification } from '../../../components/interaction/NotificationCenter';
import { Popover } from '../../../components/interaction/Popover';
import type { TourStep } from '../../../components/interaction/types';
import { useInteractions, usePaletteCommands, useShortcuts } from '../../../components/interaction/useInteractions';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEMO_CLIENTS, STATUT_COLOR, type DemoClient } from '../../../data/static/showcase.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { INTERACTION_SNIPPETS as code } from './interactionsCode';
import './interactions-gallery.scss';

const TOC: TocItem[] = [
  { id: 'palette', label: 'Palette ⌘K' },
  { id: 'shortcuts', label: 'Raccourcis clavier' },
  { id: 'popover', label: 'Popover' },
  { id: 'tour', label: 'Visite guidée' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'context-menu', label: 'Menu contextuel' },
];

const ago = (min: number) => new Date(Date.now() - min * 60_000);
const INITIAL_NOTIFS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Sortie de zone — CI-9902-NP',
    message: 'Le véhicule a quitté la géofence « Port-Bouët » à 11:42.',
    at: ago(3),
    icon: 'wrong_location',
    tone: 'error',
    category: 'Alertes',
    actions: [
      { id: 'locate', label: 'Localiser', primary: true },
      { id: 'ack', label: 'Acquitter' },
    ],
  },
  {
    id: 'n2',
    title: 'Aminata Diallo vous a mentionné',
    message: '« @vous peux-tu valider le PV d’installation de Transports Yao ? »',
    at: ago(25),
    avatar: 'AD',
    category: 'Mentions',
  },
  {
    id: 'n3',
    title: 'Facture FAC-2026-0981 payée',
    message: '1 250 000 FCFA reçus de Transports Yao & Fils via mobile money.',
    at: ago(90),
    icon: 'payments',
    tone: 'success',
    category: 'Facturation',
  },
  {
    id: 'n4',
    title: 'Batterie faible — CI-0418-GH',
    message: 'Tension de 11,2 V détectée sur la balise.',
    at: ago(60 * 5),
    icon: 'battery_alert',
    tone: 'warning',
    category: 'Alertes',
    read: true,
  },
  {
    id: 'n5',
    title: 'Rapport mensuel disponible',
    message: 'Le rapport de septembre est prêt à être téléchargé.',
    at: ago(60 * 26),
    icon: 'description',
    tone: 'info',
    category: 'Système',
    read: true,
  },
  {
    id: 'n6',
    title: 'Maintenance planifiée',
    message: 'La plateforme sera indisponible dimanche de 2 h à 4 h.',
    at: ago(60 * 50),
    icon: 'engineering',
    tone: 'purple',
    category: 'Système',
    read: true,
  },
];
const SAMPLES: Partial<AppNotification>[] = [
  {
    title: 'Excès de vitesse — CI-4521-AB',
    message: '94 km/h sur l’autoroute du Nord (limite 70).',
    icon: 'speed',
    tone: 'error',
    category: 'Alertes',
  },
  {
    title: 'Nouveau ticket #4530',
    message: 'Bolloré Logistics CI signale une balise hors ligne.',
    icon: 'support_agent',
    tone: 'info',
    category: 'Système',
  },
  {
    title: 'Koffi N’Guessan a terminé une intervention',
    message: 'Installation de 3 balises chez SOTRA Abidjan.',
    avatar: 'KN',
    category: 'Mentions',
  },
];
const FILES = [
  { name: 'Contrat-2026.pdf', icon: 'picture_as_pdf', meta: '412 Ko · modifié hier' },
  { name: 'Photos installation', icon: 'folder', meta: '24 éléments' },
  { name: 'Export-balises.xlsx', icon: 'table_chart', meta: '86 Ko · 12 oct.' },
  { name: 'PV-installation.pdf', icon: 'picture_as_pdf', meta: '1,2 Mo · 10 oct.' },
];
const CLIENTS = DEMO_CLIENTS.slice(0, 5);
const EMPTY: AppNotification[] = [];

/** Galerie /components/interactions — palette ⌘K, raccourcis, popover, visite guidée, notifications, menu contextuel. */
export function InteractionsGalleryPage() {
  const snack = useSnackbar();
  const { commands, openPalette, openHelp, startTour: start } = useInteractions();
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [tourDone, setTourDone] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const n = useRef(7);

  const push = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString('fr-FR')} — ${s}`, ...l].slice(0, 5));
  const done = (s: string) => snack(s + ' — démo statique', { duration: 2000 });
  const ran = (s: string) => {
    setLastCommand(s);
    snack(`Commande : ${s}`, { duration: 2000 });
  };

  const startTour = useCallback(() => {
    const steps: TourStep[] = [
      {
        title: 'Bienvenue dans le tableau de bord',
        content:
          'Cette courte visite présente les éléments essentiels. Utilisez ← / → ou les boutons ; Échap pour quitter.',
        icon: 'waving_hand',
      },
      {
        target: '#tour-search',
        title: 'Recherche globale',
        content: 'Retrouvez un client, un véhicule ou une page. Raccourci : ⌘K / Ctrl+K partout dans l’application.',
        icon: 'search',
        placement: 'bottom',
      },
      {
        target: '#tour-kpis',
        title: 'Indicateurs clés',
        content: 'Vos chiffres du jour. Cliquez sur une carte pour accéder au détail.',
        icon: 'insights',
      },
      {
        target: '#tour-alerts',
        title: 'Alertes en direct',
        content:
          'Les alertes critiques apparaissent ici en temps réel : sorties de zone, excès de vitesse, batteries faibles.',
        icon: 'notifications_active',
        placement: 'left',
      },
      {
        target: '#tour-create',
        title: 'Créer rapidement',
        content: 'Ajoutez un client, un véhicule ou une intervention en un clic. Raccourci : touche C.',
        icon: 'add_circle',
        placement: 'top',
      },
    ];
    start(steps, { onFinish: (ok) => setTourDone(ok ? 'Visite terminée ✔' : 'Visite interrompue') });
  }, [start]);

  usePaletteCommands(() => [
    {
      id: 'demo-new-client',
      label: 'Créer un client',
      group: 'Actions (démo)',
      icon: 'person_add',
      shortcut: 'c',
      keywords: ['nouveau', 'ajouter'],
      action: () => ran('Créer un client'),
    },
    {
      id: 'demo-new-ticket',
      label: 'Ouvrir un ticket de support',
      group: 'Actions (démo)',
      icon: 'support_agent',
      keywords: ['incident', 'panne'],
      action: () => ran('Ouvrir un ticket'),
    },
    {
      id: 'demo-export',
      label: 'Exporter les trajets du mois',
      group: 'Actions (démo)',
      icon: 'download',
      hint: 'XLSX · septembre 2026',
      action: () => ran('Exporter les trajets'),
    },
    {
      id: 'demo-cut',
      label: 'Couper le moteur à distance…',
      group: 'Actions (démo)',
      icon: 'power_settings_new',
      hint: 'Action sensible — confirmation requise',
      action: () => ran('Couper le moteur'),
    },
    { id: 'demo-tour', label: 'Lancer la visite guidée', group: 'Aide', icon: 'tour', action: () => startTour() },
    {
      id: 'demo-help',
      label: 'Afficher les raccourcis clavier',
      group: 'Aide',
      icon: 'keyboard',
      shortcut: 'shift+?',
      action: () => openHelp(),
    },
  ]);
  useShortcuts(() => [
    {
      keys: 'c',
      description: 'Créer un client (démo)',
      group: 'Galerie Interactions',
      action: () => push('C → Créer un client'),
    },
    {
      keys: 'g c',
      description: 'Aller aux clients (séquence)',
      group: 'Galerie Interactions',
      action: () => push('G puis C → Aller aux clients'),
    },
    {
      keys: 'g n',
      description: 'Ouvrir les notifications (séquence)',
      group: 'Galerie Interactions',
      action: () => push('G puis N → Notifications'),
    },
    {
      keys: 'mod+shift+e',
      description: 'Exporter (démo)',
      group: 'Galerie Interactions',
      action: () => push('⌘/Ctrl+Maj+E → Exporter'),
    },
    { keys: 't', description: 'Lancer la visite guidée', group: 'Galerie Interactions', action: () => startTour() },
  ]);

  const simulate = () => {
    const s = SAMPLES[n.current % SAMPLES.length];
    const id = 'n' + n.current++;
    setNotifs((l) => [{ id, at: new Date(), title: '', ...s }, ...l]);
  };

  const fileMenu = (name: string): ContextMenuItem[] => [
    { header: name },
    { label: 'Ouvrir', icon: 'open_in_new', shortcut: 'enter', action: () => done(`Ouvrir « ${name} »`) },
    { label: 'Renommer', icon: 'edit', shortcut: 'f2', action: () => done(`Renommer « ${name} »`) },
    { label: 'Dupliquer', icon: 'content_copy', shortcut: 'mod+d', action: () => done(`Dupliquer « ${name} »`) },
    { label: 'Partager…', icon: 'share', action: () => done(`Partager « ${name} »`) },
    { divider: true },
    { label: 'Télécharger', icon: 'download', action: () => done(`Télécharger « ${name} »`) },
    {
      label: 'Déplacer vers la corbeille',
      icon: 'delete',
      danger: true,
      shortcut: 'backspace',
      action: () => done(`Supprimer « ${name} »`),
    },
  ];
  const rowMenu = (c: DemoClient): ContextMenuItem[] => [
    { header: c.code },
    { label: 'Voir la fiche', icon: 'visibility', action: () => done(`Fiche ${c.raison_sociale}`) },
    { label: 'Appeler ' + c.contact.split(' ')[0], icon: 'call', action: () => done(`Appel ${c.telephone}`) },
    { label: 'Envoyer un email', icon: 'mail', action: () => done(`Email ${c.email}`) },
    { divider: true },
    { label: 'Suspendre le contrat', icon: 'pause_circle', disabled: c.statut !== 'ACTIF' },
    { label: 'Résilier', icon: 'block', danger: true, action: () => done(`Résilier ${c.code}`) },
  ];

  return (
    <DocPage
      title="Interactions"
      icon="touch_app"
      className="gallery-interactions"
      subtitle="Ce qui rend une application « finie » : palette de commandes ⌘K, raccourcis clavier avec aide intégrée, popovers riches, visite guidée d'onboarding, centre de notifications et menus contextuels — tout au clavier comme à la souris."
      toc={TOC}
    >
      <DocSection
        id="palette"
        title="Palette de commandes (⌘K)"
        source="CommandPaletteService (shared/components/interaction)"
        description="Recherche approchée insensible aux accents (« clt nv » trouve « Créer un client »), groupes, récents mémorisés, navigation clavier. Les commandes sont enregistrées par chaque écran (register) et retirées à sa destruction ; le layout du kit enregistre déjà toutes les pages et le changement de thème."
        cols={2}
      >
        <Demo label="Ouvrir la palette" code={code.palette}>
          <div className="palette-cta">
            <button type="button" className="fake-search" onClick={openPalette}>
              <MaterialIcon name="search" />
              <span>Rechercher une page, une action…</span>
              <Kbd keys="mod+k" className="kbd-keys" />
            </button>
            <span className="muted">Essayez : « media », « sombre », « clt », « export », « visite ».</span>
            {lastCommand && (
              <span className="last">
                <MaterialIcon name="bolt" />
                Dernière commande : <strong>{lastCommand}</strong>
              </span>
            )}
          </div>
        </Demo>
        <Demo label="Commandes enregistrées">
          <ul className="cmd-list">
            {commands.slice(0, 9).map((c) => (
              <li key={c.id}>
                <MaterialIcon name={c.icon || 'chevron_right'} />
                <span>{c.label}</span>
                <em>{c.group}</em>
              </li>
            ))}
            <li className="more">… {commands.length} commandes au total</li>
          </ul>
        </Demo>
      </DocSection>

      <DocSection
        id="shortcuts"
        title="Raccourcis clavier"
        source="ShortcutService · app-kbd (shared/components/interaction)"
        description="Registre global : combinaisons (mod = ⌘ sur macOS, Ctrl ailleurs) et séquences (G puis C), ignorés pendant la saisie dans un champ. La touche « ? » affiche l'aide listant tous les raccourcis actifs, groupés."
        cols={2}
      >
        <Demo label="Essayez au clavier" code={code.shortcuts}>
          <ul className="sc-list">
            {[
              ['c', 'Créer un client'],
              ['g c', 'Aller aux clients (séquence)'],
              ['g n', 'Notifications (séquence)'],
              ['mod+shift+e', 'Exporter'],
              ['t', 'Visite guidée'],
              ['shift+?', 'Aide des raccourcis'],
            ].map(([k, l]) => (
              <li key={k}>
                <Kbd keys={k ?? ''} className="kbd-keys" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
          <div className="row demo-actions">
            <Button variant="outlined" color="inherit" onClick={openHelp} startIcon={<MaterialIcon name="keyboard" />}>
              Afficher l'aide
            </Button>
          </div>
        </Demo>
        <Demo label="Journal">
          {log.length ? (
            <ul className="event-log">
              {log.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : (
            <span className="muted">Appuyez sur une des touches à gauche (hors d'un champ de saisie).</span>
          )}
          <div className="kbd-samples">
            <span>
              Styles <code>app-kbd</code> :
            </span>
            {['mod+s', 'ctrl+alt+delete', 'shift+enter', 'esc', 'up'].map((k) => (
              <Kbd key={k} keys={k} className="kbd-keys" />
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="popover"
        title="Popover riche"
        source="[appPopover] (shared/components/interaction)"
        description="Carte au survol (aperçu d'un client sans quitter la liste) ou au clic (mini-formulaire, filtres). Contenu libre via template, délai d'ouverture, reste ouvert au survol de la carte, repositionnement automatique, Échap / clic extérieur."
        cols={2}
      >
        <Demo label="Carte au survol" hint="survolez un nom" code={code.popover}>
          <ul className="hover-list">
            {CLIENTS.map((c) => (
              <li key={c._id}>
                <span className="code">{c.code}</span>
                <Popover
                  position="bottom-start"
                  content={() => (
                    <div className="kit-popover client-card">
                      <div className="cc-head">
                        <span className="cc-av">{c.raison_sociale[0]}</span>
                        <div>
                          <strong>{c.raison_sociale}</strong>
                          <span>
                            {c.code} · {c.secteur}
                          </span>
                        </div>
                      </div>
                      <div className="cc-grid">
                        <span>Contact</span>
                        <b>{c.contact}</b>
                        <span>Téléphone</span>
                        <b>{c.telephone}</b>
                        <span>Véhicules</span>
                        <b>{c.vehicules}</b>
                        <span>Statut</span>
                        <b style={{ color: STATUT_COLOR[c.statut] }}>{c.statut}</b>
                      </div>
                      <div className="cc-actions">
                        <Button variant="outlined" startIcon={<MaterialIcon name="call" />}>
                          Appeler
                        </Button>
                        <Button variant="contained">Ouvrir la fiche</Button>
                      </div>
                    </div>
                  )}
                >
                  <a className="name" tabIndex={0}>
                    {c.raison_sociale}
                  </a>
                </Popover>
                <span className="muted">{c.ville}</span>
              </li>
            ))}
          </ul>
        </Demo>
        <Demo label="Au clic + positions" hint='popoverTrigger="click"'>
          <div className="row lg">
            <Popover
              trigger="click"
              content={(close) => (
                <div className="kit-popover note-pop">
                  <strong>Ajouter une note</strong>
                  <textarea rows={3} placeholder="Rappeler le client lundi…" />
                  <div className="cc-actions">
                    <Button variant="text" onClick={close}>
                      Annuler
                    </Button>
                    <Button variant="contained" onClick={close}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              )}
            >
              <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="sticky_note_2" />}>
                Note rapide
              </Button>
            </Popover>
            {(['top', 'right', 'bottom', 'left'] as const).map((p) => (
              <Popover
                key={p}
                position={p}
                content={() => (
                  <div className="kit-popover small">
                    Popover positionné en <b>{p}</b> (bascule automatiquement s'il manque de place).
                  </div>
                )}
              >
                <Button variant="text">{p}</Button>
              </Popover>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="tour"
        title="Visite guidée / onboarding"
        source="TourService (shared/components/interaction)"
        description="Projecteur sur l'élément ciblé (sélecteur CSS), carte d'explication positionnée automatiquement, progression, Précédent / Suivant / Passer, ←/→ et Échap, suivi du défilement et du redimensionnement. Callback onFinish(terminée ou non) pour ne l'afficher qu'une fois."
      >
        <Demo label="Tableau de bord fictif" code={code.tour}>
          <div className="mini-dash">
            <div className="md-top">
              <div className="md-search" id="tour-search">
                <MaterialIcon name="search" />
                Rechercher…
                <Kbd keys="mod+k" className="kbd-keys" />
              </div>
              <span className="spacer" />
              <Button variant="contained" onClick={startTour} startIcon={<MaterialIcon name="tour" />}>
                Lancer la visite
              </Button>
            </div>
            <div className="md-body">
              <div className="md-kpis" id="tour-kpis">
                {[
                  ['1 248', 'Véhicules'],
                  ['97,4 %', 'Disponibilité'],
                  ['55,8 M', 'CA (FCFA)'],
                ].map(([v, l]) => (
                  <div key={l} className="md-kpi">
                    <strong>{v}</strong>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="md-alerts" id="tour-alerts">
                <strong>Alertes</strong>
                <span>
                  <i className="err" />
                  Sortie de zone — CI-9902-NP
                </span>
                <span>
                  <i className="warn" />
                  Batterie faible — CI-0418-GH
                </span>
              </div>
            </div>
            <Fab variant="extended" className="md-fab" id="tour-create">
              <MaterialIcon name="add" />
              Créer
            </Fab>
          </div>
          {tourDone && <span className="caption">{tourDone}</span>}
        </Demo>
      </DocSection>

      <DocSection
        id="notifications"
        title="Centre de notifications"
        source="app-notification-center (shared/components/interaction)"
        description="Cloche avec compteur (pastille animée à l'arrivée), panneau avec onglets Toutes / Non lues / catégories, groupement par jour, marquer lu (une ou toutes), suppression, actions rapides, état vide."
        cols={2}
      >
        <Demo label="Barre d'application" code={code.notifications}>
          <div className="app-bar">
            <MaterialIcon name="hub" className="logo" />
            <strong>Lookas</strong>
            <span className="spacer" />
            <NotificationCenter
              notifications={notifs}
              onAction={(e) =>
                snack(
                  `${e.action === 'locate' ? 'Localisation de' : 'Alerte acquittée :'} ${e.notification.title.split('—')[1]?.trim() ?? ''}`,
                  {
                    duration: 2500,
                  },
                )
              }
            />
            <span className="me">AD</span>
          </div>
          <div className="row demo-actions">
            <Button variant="outlined" color="inherit" onClick={simulate} startIcon={<MaterialIcon name="add_alert" />}>
              Simuler une notification
            </Button>
            <span className="muted">Ouvrez la cloche, filtrez, marquez comme lu…</span>
          </div>
        </Demo>
        <Demo label="Sans notification">
          <div className="app-bar">
            <strong>État vide</strong>
            <span className="spacer" />
            <NotificationCenter notifications={EMPTY} footer="" settings={false} />
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="context-menu"
        title="Menu contextuel"
        source="[appContextMenu] (shared/components/interaction)"
        description="Clic droit (ou appui long au doigt, touche Menu / Maj+F10 au clavier) : menu au curseur avec titre, icônes, raccourcis affichés, séparateurs, éléments désactivés et actions dangereuses ; navigation ↑/↓, Entrée, Échap."
        cols={2}
      >
        <Demo label="Fichiers" hint="clic droit sur un fichier" code={code.contextMenu}>
          <div className="files">
            {FILES.map((f) => (
              <ContextMenu key={f.name} items={fileMenu(f.name)} onOpen={() => setSelectedFile(f.name)}>
                <div
                  className={`file${selectedFile === f.name ? ' sel' : ''}`}
                  tabIndex={0}
                  onClick={() => setSelectedFile(f.name)}
                >
                  <MaterialIcon
                    name={f.icon}
                    className={f.icon === 'picture_as_pdf' ? 'pdf' : f.icon === 'folder' ? 'folder' : undefined}
                  />
                  <span className="fname">{f.name}</span>
                  <span className="muted">{f.meta}</span>
                </div>
              </ContextMenu>
            ))}
          </div>
        </Demo>
        <Demo label="Lignes de tableau" hint="clic droit sur une ligne">
          <table className="ctx-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Client</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <ContextMenu key={c._id} items={rowMenu(c)}>
                  <tr tabIndex={0}>
                    <td>
                      <code>{c.code}</code>
                    </td>
                    <td>{c.raison_sociale}</td>
                    <td style={{ color: STATUT_COLOR[c.statut] }}>{c.statut}</td>
                  </tr>
                </ContextMenu>
              ))}
            </tbody>
          </table>
        </Demo>
      </DocSection>
    </DocPage>
  );
}
