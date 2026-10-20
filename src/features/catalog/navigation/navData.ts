// Menu d'exemple (ancien rail du projet d'origine), repris de demo-menu.data.ts — jeu de données du Sidecar de démo.
export interface DemoMenuItem {
  _id: string;
  libelle: string;
  icon: string;
  children: DemoMenuItem[];
}

const leaf = (_id: string, libelle: string, _type: string, icon: string): DemoMenuItem => ({
  _id,
  libelle,
  icon,
  children: [],
});
const group = (_id: string, libelle: string, _type: string, icon: string, children: DemoMenuItem[]): DemoMenuItem => ({
  _id,
  libelle,
  icon,
  children,
});

export interface SidecarSection {
  title: string;
  icon: string;
  items: { _id: string; libelle: string; icon: string }[];
}

/** Sous-navigations à sections propres à certains modules ; les autres dérivent de `children`. */
export const SIDECAR_SECTIONS: Record<string, SidecarSection[]> = {
  produit: [
    {
      title: 'Tableau de bord',
      icon: 'dashboard',
      items: [{ _id: 'produit-dashboard', libelle: 'Vue générale & tarifs', icon: 'space_dashboard' }],
    },
    {
      title: 'Catalogue',
      icon: 'category',
      items: [
        { _id: 'produit-produits', libelle: 'Tous les produits', icon: 'inventory_2' },
        { _id: 'produit-forfaits', libelle: 'Forfaits', icon: 'sell' },
      ],
    },
    {
      title: 'Paramètres',
      icon: 'settings',
      items: [{ _id: 'produit-params', libelle: 'Tarification', icon: 'tune' }],
    },
  ],
};

export const DEMO_MENU: DemoMenuItem[] = [
  leaf('dashboard', 'Tableau de bord', 'dashboard', 'dashboard'),
  leaf('client', 'Clients', 'client', 'people'),
  leaf('produit', 'Produits', 'produit', 'inventory_2'),
  leaf('equipement', 'Équipement', 'equipement', 'settings_input_antenna'),
  group('service-client-group', 'Service Client', 'service-client', 'support_agent', [
    leaf('service-client-dashboard', 'Tableau de bord', 'service-client/dashboard', 'analytics'),
    leaf('service-client-requetes', 'Requêtes clients', 'service-client/requetes', 'contact_support'),
    leaf('service-client-programmations', 'Programmations', 'service-client/programmations', 'event_available'),
    leaf('service-client-gestionnaires', 'Gestionnaires clients', 'service-client/gestionnaires', 'assignment_ind'),
    leaf('service-client-equipe', 'Équipe', 'service-client/equipe', 'groups'),
  ]),
  group('intervention-group', 'Intervention', 'intervention', 'build', [
    leaf('intervention-dashboard-menu', 'Tableau de bord', 'intervention/dashboard', 'analytics'),
    leaf('intervention-missions-menu', 'Missions', 'intervention/missions', 'assignment'),
    leaf('intervention-programmees-menu', 'Interventions programmées', 'intervention/interventions', 'event_note'),
    leaf('intervention-equipe-technique-menu', 'Équipe Technique', 'intervention/equipe-technique', 'engineering'),
  ]),
  leaf('synchronizations', 'Synchronisations', 'synchronizations', 'cloud_sync'),
  leaf('repertoire', 'Répertoire', 'repertoire', 'menu_book'),
  group('assac-group', 'ASSAC', 'assac', 'hub', [
    leaf('assac-agenda', 'Agenda', 'assac/agenda', 'calendar_month'),
    leaf('assac-appels', 'Appels', 'assac/appels', 'call'),
    leaf('assac-rdv', 'RDV', 'assac/rdv', 'event'),
    leaf('assac-promesses', 'Promesses', 'assac/promesses', 'task_alt'),
    leaf('assac-dashboard', 'Tableau de bord', 'assac/dashboard', 'analytics'),
    leaf('assac-prospects', 'Prospects', 'assac/prospects', 'contact_page'),
    leaf('assac-dossiers', 'Dossiers', 'assac/dossiers', 'folder_shared'),
    leaf('assac-transit', 'Transmission comptable', 'assac/transmission-comptable', 'outbound'),
    leaf('assac-parametres', 'Paramètres ASSAC', 'assac/parametres', 'settings'),
  ]),
  group('cesar-group', 'CESAR', 'cesar', 'savings', [
    leaf('cesar-dashboard', 'Tableau de bord', 'cesar/dashboard', 'analytics'),
    leaf('cesar-customers', 'Gestion Clients', 'cesar/customers', 'contact_page'),
    leaf('cesar-encaissements', 'Encaissements', 'cesar/encaissements', 'payments'),
    leaf('cesar-ecritures', 'Factures', 'cesar/ecritures', 'receipt_long'),
    leaf('cesar-notes', 'Notes', 'cesar/notes', 'sticky_note_2'),
    leaf('cesar-service-manager', 'Pilotage service', 'cesar/service-manager', 'supervisor_account'),
    leaf('cesar-imports', 'Imports & rapprochement', 'cesar/imports', 'upload_file'),
    leaf('cesar-parametres', 'Paramètres CESAR', 'cesar/parametres', 'settings'),
  ]),
  leaf('taches', 'Tâches', 'taches', 'task_alt'),
  group('finance', 'Finance', 'finance', 'account_balance', [
    leaf('facture', 'Factures', 'finance/facture', 'receipt'),
    leaf('finance-exercices', 'Exercices comptables', 'finance/exercices', 'event_note'),
    leaf('finance-facturation-roles', 'Rôles de facturation', 'finance/facturation/roles', 'workspaces'),
    leaf('finance-paiements', 'Paiements', 'finance/paiements', 'payments'),
    leaf('finance-equipe', 'Équipe', 'finance/equipe', 'groups'),
    leaf('finance-affectations', 'Affectations clients', 'finance/affectations', 'assignment_ind'),
    leaf('finance-abonnements', 'Abonnements', 'finance/abonnements', 'subscriptions'),
    leaf('finance-groupes-facturation', 'Groupes de facturation', 'finance/groupes-facturation', 'workspaces'),
    leaf('finance-profils-facturation', 'Profils de facturation', 'finance/profils-facturation', 'receipt_long'),
    leaf(
      'finance-affectation-masse-groupe',
      'Affectation en masse (Groupe)',
      'finance/affectation-masse/groupe',
      'playlist_add_check',
    ),
    leaf(
      'finance-affectation-masse-profil',
      'Affectation en masse (Profil)',
      'finance/affectation-masse/profil',
      'playlist_add_check',
    ),
  ]),
  leaf('file-manager', 'Gestionnaire de Fichiers', 'file-manager', 'folder'),
  group('admin', 'Administration', 'admin', 'admin_panel_settings', [
    leaf('user-list', 'Utilisateurs', 'admin/user-list', 'people'),
    leaf('group-list', 'Groupes', 'admin/group-list', 'group'),
  ]),
];
