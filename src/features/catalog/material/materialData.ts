// Données de démonstration reprises de material-gallery.component.ts (Angular).

export interface TreeNode {
  name: string;
  icon?: string;
  meta?: string;
  children?: TreeNode[];
}
export interface KanbanItem {
  id: string;
  title: string;
  tag: string;
}

export const FAQ = [
  {
    q: 'Comment ajouter un nouveau véhicule à un contrat ?',
    a: 'Depuis la fiche client, onglet « Contrats », cliquez sur « Ajouter un véhicule ». La balise est rattachée automatiquement lors de l’installation.',
  },
  {
    q: 'Quand le rôle de facturation est-il généré ?',
    a: 'Le rôle est généré le 25 de chaque mois à 22:00. Vous pouvez le régénérer manuellement depuis Finance › Rôles tant qu’il n’est pas validé.',
  },
  {
    q: 'Que signifie le statut « Balise hors ligne » ?',
    a: 'La balise n’a pas émis de position depuis plus de 24 h. Vérifiez l’alimentation du véhicule ou planifiez une intervention.',
  },
  {
    q: 'Puis-je exporter la liste des interventions ?',
    a: 'Oui, depuis la liste des interventions, menu « ⋮ » › « Exporter ». Les filtres actifs sont appliqués à l’export.',
  },
];

export const FILTER_GROUPS = [
  { key: 'statut', icon: 'flag', label: 'Statut', options: ['Actif', 'Suspendu', 'Résilié', 'En attente'] },
  {
    key: 'ville',
    icon: 'location_on',
    label: 'Ville',
    options: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'],
  },
  { key: 'offre', icon: 'sell', label: 'Offre', options: ['Essentiel', 'Premium', 'Flotte+'] },
];

export const FILE_TREE: TreeNode[] = [
  {
    name: 'Clients',
    icon: 'folder',
    children: [
      {
        name: 'Transports Yao SARL',
        icon: 'folder',
        children: [
          { name: 'Contrat-2026.pdf', icon: 'picture_as_pdf', meta: '412 Ko' },
          { name: 'PV-installation.pdf', icon: 'picture_as_pdf', meta: '1,2 Mo' },
        ],
      },
      {
        name: 'SOTRA Logistique',
        icon: 'folder',
        children: [{ name: 'Proforma-0412.pdf', icon: 'picture_as_pdf', meta: '98 Ko' }],
      },
    ],
  },
  {
    name: 'Finance',
    icon: 'folder',
    children: [
      {
        name: 'Rôles',
        icon: 'folder',
        children: [
          { name: 'role-2026-09.xlsx', icon: 'table_view', meta: '64 Ko' },
          { name: 'role-2026-10.xlsx', icon: 'table_view', meta: '71 Ko' },
        ],
      },
    ],
  },
  { name: 'Lisez-moi.txt', icon: 'description', meta: '2 Ko' },
];

export const PERM_TREE: TreeNode[] = [
  {
    name: 'Clients',
    children: [{ name: 'Consulter' }, { name: 'Créer' }, { name: 'Modifier' }, { name: 'Supprimer' }],
  },
  {
    name: 'Finance',
    children: [
      { name: 'Factures', children: [{ name: 'Consulter' }, { name: 'Valider' }] },
      { name: 'Rôles', children: [{ name: 'Générer' }, { name: 'Exporter' }] },
    ],
  },
  { name: 'Interventions', children: [{ name: 'Planifier' }, { name: 'Clôturer' }] },
];

export const leaves = (n: TreeNode): TreeNode[] => (n.children?.length ? n.children.flatMap(leaves) : [n]);

export const PRIORITIES = [
  'Relancer Transports Yao (impayé)',
  'Installer 12 balises — SOTRA',
  'Valider le rôle d’octobre',
  'Former l’équipe Bouaké',
  'Mettre à jour les tarifs Premium',
];

export const KANBAN: Record<'col-todo' | 'col-doing' | 'col-done', KanbanItem[]> = {
  'col-todo': [
    { id: 'T-101', title: 'Balise hors ligne — CI-4521-AB', tag: 'Support' },
    { id: 'T-102', title: 'Proforma SOTRA', tag: 'Finance' },
    { id: 'T-103', title: 'Contrôle technique flotte', tag: 'Terrain' },
  ],
  'col-doing': [{ id: 'T-098', title: 'Migration des contrats 2025', tag: 'Admin' }],
  'col-done': [{ id: 'T-090', title: 'Audit des accès', tag: 'Admin' }],
};

export const TILES = [
  { label: 'Carte de la flotte', icon: 'map', cols: 2, rows: 2, tone: 'primary' },
  { label: 'Alertes', icon: 'notifications', cols: 1, rows: 1, tone: 'error' },
  { label: 'Véhicules actifs', icon: 'local_shipping', cols: 1, rows: 1, tone: 'success' },
  { label: 'Interventions', icon: 'build', cols: 1, rows: 1, tone: 'warning' },
  { label: 'CA du mois', icon: 'payments', cols: 1, rows: 1, tone: 'info' },
  { label: 'Dernières requêtes clients', icon: 'support_agent', cols: 4, rows: 1, tone: 'neutral' },
];

export const SHARE_ACTIONS = [
  { key: 'email', icon: 'mail', label: 'Envoyer par email', hint: 'Joindre le PDF à un message' },
  { key: 'link', icon: 'link', label: 'Copier le lien', hint: 'Lien public valable 7 jours' },
  { key: 'download', icon: 'download', label: 'Télécharger', hint: 'Format PDF (A4)' },
  { key: 'print', icon: 'print', label: 'Imprimer', hint: 'Ouvre la boîte de dialogue système' },
];

export const POSITIONS = Array.from({ length: 10_000 }, (_, i) => ({
  id: i + 1,
  plaque: `CI-${String(1000 + ((i * 37) % 9000)).padStart(4, '0')}-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 7) % 26))}`,
  vitesse: (i * 13) % 110,
  online: i % 9 !== 0,
}));

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
