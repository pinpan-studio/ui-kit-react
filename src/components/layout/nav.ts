// Navigation reprise de ui-kit Angular (showcase/kit-nav.ts, layouts/kit-layout, harnais.pages.ts, ex-app-shell).
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
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
  { label: 'Typographie', path: '/components/typography', icon: 'text_fields' },
  { label: 'Formulaires', path: '/components/forms', icon: 'edit_note' },
  { label: 'Champs avancés', path: '/components/fields', icon: 'dynamic_form' },
  { label: 'Boutons', path: '/components/buttons', icon: 'smart_button' },
  { label: 'Navigation', path: '/components/navigation', icon: 'explore' },
  { label: 'Data display', path: '/components/data', icon: 'table_chart' },
  { label: 'Feedback', path: '/components/feedback', icon: 'notifications_active' },
  { label: 'Planning', path: '/components/planning', icon: 'view_timeline' },
  { label: 'Cartes', path: '/components/maps', icon: 'map' },
  { label: 'Médias', path: '/components/media', icon: 'perm_media' },
  { label: 'Interactions', path: '/components/interactions', icon: 'touch_app' },
  { label: 'Material & CDK', path: '/components/material', icon: 'extension' },
  { label: 'Layout', path: '/components/layout', icon: 'dashboard_customize' },
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
