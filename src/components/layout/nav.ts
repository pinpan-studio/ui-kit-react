// Navigation reprise de ui-kit Angular (showcase/kit-nav.ts, layouts/kit-layout, harnais.pages.ts, ex-app-shell).
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
  description?: string;
  fragment?: string;
}
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  /** Section repliable (bouton avec chevron). */
  collapsible?: boolean;
  /** Ouverte au chargement (Angular : pagesOpen = true). */
  defaultOpen?: boolean;
  /** Sous-groupes repliables (section « Pages » du catalogue). */
  subgroups?: { id: string; label: string; icon: string; pages: NavItem[] }[];
}
export interface NavConfig {
  brand: { title: string; subtitle: string; logo: string };
  toolbarTitle: string;
  top: NavItem[];
  groups: NavGroup[];
}

export const COMPONENT_CATEGORIES: NavItem[] = [
  {
    label: 'Typographie',
    path: '/components/typography',
    icon: 'text_fields',
    description:
      'Familles, échelle, hiérarchie, graisses, interlignage, interlettrage, mesure, contraste, chiffres, troncature, typographie française, tailles fluides, testeur.',
  },
  {
    label: 'Formulaires',
    path: '/components/forms',
    icon: 'edit_note',
    description:
      'Input, textarea, select, autocomplete, dates, checkbox, radio, toggle, upload, recherche, validation.',
  },
  {
    label: 'Champs avancés',
    path: '/components/fields',
    icon: 'dynamic_form',
    description:
      'OTP, nombre +/−, montant FCFA, intervalle, notation, couleur, texte riche, Markdown, signature, tree-select, transfert, tags, adresse, mot de passe, copie.',
  },
  {
    label: 'Boutons',
    path: '/components/buttons',
    icon: 'smart_button',
    description: 'Primary, secondary, outline, ghost, danger, success, icône, loading, disabled.',
  },
  {
    label: 'Navigation',
    path: '/components/navigation',
    icon: 'explore',
    description: 'Header, sidebar, navbar, onglets, breadcrumb, pagination, stepper, menus.',
  },
  {
    label: 'Data display',
    path: '/components/data',
    icon: 'table_chart',
    description:
      'Tables (dont table avancée), cartes, listes, liste descriptive, timeline, badges, avatars, compteurs, graphiques, diff, audit log, QR code.',
  },
  {
    label: 'Feedback',
    path: '/components/feedback',
    icon: 'notifications_active',
    description:
      'Alertes, toasts, modales, drawers, confirmation, loaders, skeletons, erreurs, upload multiple, bannière hors ligne, page de résultat, annulation.',
  },
  {
    label: 'Planning',
    path: '/components/planning',
    icon: 'view_timeline',
    description: 'Kanban, Gantt, notes, vue groupée, calendrier, agenda — modèle générique et filtres optionnels.',
  },
  {
    label: 'Cartes',
    path: '/components/maps',
    icon: 'map',
    description:
      'Leaflet flat : fonds gratuits, marqueurs, clustering, trajets, zones, dessin (Leaflet Draw, Geoman), mode sombre.',
  },
  {
    label: 'Médias',
    path: '/components/media',
    icon: 'perm_media',
    description: 'Lecteur vidéo, YouTube, lecteur audio, PDF, visionneuse de fichiers, carrousel, recadrage d’image.',
  },
  {
    label: 'Interactions',
    path: '/components/interactions',
    icon: 'touch_app',
    description:
      'Palette de commandes ⌘K, raccourcis clavier, popover riche, visite guidée, centre de notifications, menu contextuel.',
  },
  {
    label: 'Material & CDK',
    path: '/components/material',
    icon: 'extension',
    description: 'Accordion, tree, drag & drop, chips input, card, grid list, bottom sheet, virtual scroll, ripple.',
  },
  {
    label: 'Layout',
    path: '/components/layout',
    icon: 'dashboard_customize',
    description: 'Page layout, dashboard, colonnes, sidebar, pleine largeur, sections, conteneurs responsive.',
  },
];

export const KIT_NAV: NavConfig = {
  brand: { title: 'UI Kit', subtitle: 'Référentiel statique', logo: '/logo.png' },
  toolbarTitle: 'Catalogue UI',
  top: [
    { label: 'UI Showcase', path: '/ui-showcase', icon: 'auto_awesome_mosaic' },
    { label: 'Studio de thème', path: '/theme-studio', icon: 'tune' },
    { label: 'Showcases', path: '/showcases', icon: 'devices' },
  ],
  groups: [
    { id: 'components', label: 'Components', icon: 'widgets', items: COMPONENT_CATEGORIES },
    {
      id: 'layouts',
      label: 'Layouts',
      icon: 'dashboard_customize',
      items: [{ label: 'Galerie des layouts', path: '/layouts', icon: 'view_compact' }],
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: 'view_quilt',
      collapsible: true,
      defaultOpen: true,
      items: [{ label: 'Toutes les pages', path: '/pages', icon: 'grid_view' }],
      subgroups: [
        {
          id: 'harnais',
          label: 'Harnais',
          icon: 'auto_awesome',
          pages: [
            { label: 'Accueil', path: '/harnais', icon: 'auto_awesome' },
            { label: 'Conversation', path: '/harnais/c-sidecar', icon: 'forum' },
          ],
        },
      ],
    },
  ],
};

export const EXAMPLE_APP_NAV: NavConfig = {
  brand: { title: 'SC Storage', subtitle: 'Espace de travail', logo: '/logo.png' },
  toolbarTitle: 'SC Storage',
  top: [
    { label: 'Tableau de bord', icon: 'space_dashboard', path: '/examples/app/dashboard' },
    { label: 'Supervision', icon: 'monitor_heart', path: '/examples/app/monitoring' },
    { label: 'Modules', icon: 'apps', path: '/examples/app/modules' },
  ],
  groups: [
    {
      id: 'pilotage',
      label: 'Pilotage',
      icon: 'insights',
      items: [
        { label: 'Clients', icon: 'group', path: '/examples/app/clients' },
        { label: 'Catalogue', icon: 'inventory_2', path: '/examples/app/catalog' },
        { label: 'Planning', icon: 'view_kanban', path: '/examples/app/board' },
      ],
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: 'forum',
      items: [
        { label: 'Messagerie', icon: 'inbox', path: '/examples/app/inbox', badge: 2 },
        { label: 'Messagerie instantanée', icon: 'chat', path: '/examples/app/chat' },
        { label: 'Fil d’équipe', icon: 'dynamic_feed', path: '/examples/app/feed' },
      ],
    },
    {
      id: 'ressources',
      label: 'Ressources',
      icon: 'local_library',
      items: [
        { label: 'Blog', icon: 'newspaper', path: '/examples/app/blog' },
        { label: 'Documentation', icon: 'menu_book', path: '/examples/app/docs' },
        { label: 'Fichiers', icon: 'folder', path: '/examples/app/files' },
      ],
    },
    {
      id: 'formulaires',
      label: 'Formulaires',
      icon: 'dynamic_form',
      collapsible: true,
      items: [
        { label: 'Contact', icon: 'contact_mail', path: '/examples/forms/contact' },
        { label: 'Commande', icon: 'shopping_cart_checkout', path: '/examples/forms/checkout' },
        { label: 'Réservation', icon: 'event_available', path: '/examples/forms/booking' },
        { label: 'Candidature', icon: 'assignment_ind', path: '/examples/forms/application' },
        { label: 'Assistant d’accueil', icon: 'rocket_launch', path: '/examples/forms/onboarding' },
        { label: 'Questionnaire', icon: 'quiz', path: '/examples/forms/survey' },
      ],
    },
    {
      id: 'compte',
      label: 'Compte',
      icon: 'manage_accounts',
      items: [{ label: 'Paramètres', icon: 'settings', path: '/examples/app/settings' }],
    },
  ],
};

/** En-tête des écrans d'exemple : `title` et `crumb` passés à <ex-app-shell> par chaque page Angular. */
export interface ExampleShellHeader {
  title: string;
  crumb?: string;
  /** Bouton « Messages » masqué (page de messagerie instantanée). */
  hideChatButton?: boolean;
  /** Contenu sans marges (tableaux pleine hauteur, maître / détail). */
  flush?: boolean;
}
export const EXAMPLE_SHELL_HEADERS: Record<string, ExampleShellHeader> = {
  '/examples/app/dashboard': { title: 'Tableau de bord', crumb: 'Accueil' },
  '/examples/app/clients': { title: 'Clients', crumb: 'CRM' },
  '/examples/app/clients/:id': { title: 'Fiche client', crumb: 'Clients' },
  '/examples/app/settings': { title: 'Paramètres', crumb: 'Compte' },
  '/examples/app/inbox': { title: 'Messagerie' },
  '/examples/app/board': { title: 'Déploiement Sotra', crumb: 'Projets' },
  '/examples/app/docs': { title: 'Documentation', crumb: 'Ressources' },
  '/examples/app/files': { title: 'Fichiers', crumb: 'Ressources' },
  '/examples/app/files/columns': { title: 'Fichiers', crumb: 'Ressources' },
  '/examples/app/feed': { title: 'Fil d’équipe', crumb: 'Communication' },
  '/examples/app/chat': { title: 'Messagerie instantanée', crumb: 'Communication', hideChatButton: true },
  '/examples/app/monitoring': { title: 'Supervision', crumb: 'Pilotage' },
};

/** Sommaire du UI Showcase (ancres + liens vers les galeries détaillées). */
export const SHOWCASE_SECTIONS: NavItem[] = [
  { label: 'Studio de thème', path: '/theme-studio', icon: 'tune' },
  { label: 'Colors', path: '/ui-showcase', fragment: 'colors', icon: 'palette' },
  { label: 'Typography', path: '/components/typography', icon: 'text_fields' },
  { label: 'Icons', path: '/ui-showcase', fragment: 'icons', icon: 'emoji_symbols' },
  { label: 'Buttons', path: '/components/buttons', icon: 'smart_button' },
  { label: 'Inputs', path: '/components/forms', fragment: 'input', icon: 'input' },
  { label: 'Selects', path: '/components/forms', fragment: 'select', icon: 'arrow_drop_down_circle' },
  { label: 'Forms', path: '/components/forms', fragment: 'validation', icon: 'fact_check' },
  { label: 'Tables', path: '/components/data', fragment: 'table', icon: 'table_rows' },
  { label: 'Cards', path: '/components/data', fragment: 'cards', icon: 'view_agenda' },
  { label: 'Modals', path: '/components/feedback', fragment: 'modal', icon: 'open_in_new' },
  { label: 'Drawers', path: '/components/feedback', fragment: 'drawer', icon: 'view_sidebar' },
  { label: 'Alerts', path: '/components/feedback', fragment: 'alert', icon: 'report' },
  { label: 'Toasts', path: '/components/feedback', fragment: 'toast', icon: 'chat_bubble' },
  { label: 'Navigation', path: '/components/navigation', icon: 'explore' },
  { label: 'Pagination', path: '/components/navigation', fragment: 'pagination', icon: 'last_page' },
  { label: 'Accordion', path: '/components/material', fragment: 'accordion', icon: 'expand_circle_down' },
  { label: 'Tree', path: '/components/material', fragment: 'tree', icon: 'account_tree' },
  { label: 'Drag & drop', path: '/components/material', fragment: 'drag-drop', icon: 'drag_indicator' },
  { label: 'Loading', path: '/components/feedback', fragment: 'loading', icon: 'hourglass_top' },
  { label: 'Empty states', path: '/components/data', fragment: 'empty', icon: 'inbox' },
  { label: 'Error states', path: '/components/feedback', fragment: 'error', icon: 'error' },
  { label: 'Kanban', path: '/components/planning', fragment: 'kanban', icon: 'view_kanban' },
  { label: 'Timeline', path: '/components/planning', fragment: 'timeline', icon: 'view_timeline' },
  { label: 'Agenda', path: '/components/planning', fragment: 'agenda', icon: 'calendar_month' },
  { label: 'Maps', path: '/components/maps', icon: 'map' },
  { label: 'Layouts', path: '/layouts', icon: 'dashboard_customize' },
  { label: 'Pages', path: '/pages', icon: 'view_quilt' },
];
