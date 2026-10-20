// Porté depuis ui-kit Angular core/models/page-entry.ts, page-registry.ts et harnais/harnais.pages.ts.
export interface PageEntry {
  label: string;
  path: string;
  icon?: string;
  description?: string;
  kind?:
    | 'dashboard'
    | 'list'
    | 'detail'
    | 'form'
    | 'wizard'
    | 'calendar'
    | 'kanban'
    | 'settings'
    | 'auth'
    | 'public'
    | 'other';
  variants?: { label: string; path: string }[];
}
export interface PageGroup {
  id: string;
  label: string;
  icon: string;
  description?: string;
  pages: PageEntry[];
}
const harnais: PageGroup = {
  id: 'harnais',
  label: 'Harnais',
  icon: 'auto_awesome',
  description:
    'Interface conversationnelle façon assistant IA : historique, fil avec réflexion et outils, saisie riche, panneau d’artefacts.',
  pages: [
    {
      label: 'Accueil',
      path: '/harnais',
      icon: 'auto_awesome',
      kind: 'other',
      description: 'Salutation, saisie centrée et suggestions.',
    },
    {
      label: 'Conversation',
      path: '/harnais/c-sidecar',
      icon: 'forum',
      kind: 'detail',
      description: 'Fil complet : pièce jointe, réflexion, étapes d’outils, code, artefact.',
      variants: [
        { label: 'Document', path: '/harnais/c-palette' },
        { label: 'Code court', path: '/harnais/c-csv' },
      ],
    },
  ],
};
/** Modules affichés dans la galerie /pages. */
export const PAGE_REGISTRY: PageGroup[] = [harnais];
