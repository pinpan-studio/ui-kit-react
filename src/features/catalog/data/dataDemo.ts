// Données de démo portées depuis data-advanced.component.ts (Angular).
import type { AuditEntry } from '../../../components/data/auditTypes';
import type { BulkAction, DataColumn } from '../../../components/data/dataTableTypes';
import type { DescriptionItem } from '../../../components/data/descriptionTypes';
import type { DemoClient } from '../../../data/static/showcase.data';

export type Row = DemoClient & { sante: number };
const tone = (c: DemoClient) =>
  (({ ACTIF: 'success', SUSPENDU: 'warning', INACTIF: 'info', RESILIE: 'error' }) as Record<string, string>)[
    c.statut
  ] ?? 'primary';
const ago = (h: number) => new Date(Date.now() - h * 3600_000);
export const COLUMNS: DataColumn<Row>[] = [
  { key: 'code', label: 'Code', width: 110, sticky: 'start', type: 'mono', required: true },
  { key: 'raison_sociale', label: 'Raison sociale', width: 230, sticky: 'start', editable: 'text', required: true },
  { key: 'contact', label: 'Contact', width: 170 },
  {
    key: 'ville',
    label: 'Ville',
    width: 140,
    editable: 'select',
    options: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Daloa', 'Korhogo', 'Man', 'Gagnoa'].map((v) => ({
      value: v,
      label: v,
    })),
  },
  { key: 'secteur', label: 'Secteur', width: 140 },
  { key: 'vehicules', label: 'Véhicules', width: 110, type: 'number', editable: 'number', total: true },
  { key: 'ca_mensuel', label: 'CA mensuel', width: 150, type: 'currency', total: true },
  { key: 'sante', label: 'Taux de remontée', width: 170, type: 'progress' },
  { key: 'email', label: 'Email', width: 260, hidden: true },
  { key: 'telephone', label: 'Téléphone', width: 170, hidden: true },
  { key: 'created_at', label: 'Client depuis', width: 130, type: 'date' },
  {
    key: 'statut',
    label: 'Statut',
    width: 120,
    sticky: 'end',
    type: 'badge',
    tone: (r) => tone(r),
    editable: 'select',
    options: [
      { value: 'ACTIF', label: 'Actif' },
      { value: 'SUSPENDU', label: 'Suspendu' },
      { value: 'INACTIF', label: 'Inactif' },
      { value: 'RESILIE', label: 'Résilié' },
    ],
  },
];
export const BULK: BulkAction[] = [
  { id: 'export', label: 'Exporter', icon: 'download' },
  { id: 'mail', label: 'Envoyer un email', icon: 'mail' },
  { id: 'suspend', label: 'Suspendre', icon: 'pause_circle' },
  { id: 'delete', label: 'Supprimer', icon: 'delete', tone: 'error' },
];

export const INFOS: DescriptionItem[] = [
  { label: 'Raison sociale', value: 'Transports Yao & Fils', icon: 'business' },
  { label: 'Code client', value: 'CLI-1040', type: 'mono', copy: true },
  { label: 'Statut', value: 'Actif', type: 'badge', tone: 'success' },
  { label: 'Contact', value: 'Jean Kouassi', icon: 'person' },
  { label: 'Email', value: 'jean.kouassi@transports-yao.ci', type: 'email', copy: true },
  { label: 'Téléphone', value: '+225 07 10 20 30 40', type: 'phone' },
  { label: 'RCCM', value: 'CI-ABJ-2019-B-12345', type: 'mono', copy: true, hint: 'Registre du commerce' },
  { label: 'Site web', value: 'transports-yao.ci', type: 'link', href: 'https://example.com' },
  { label: 'Gestionnaire', value: null },
  {
    label: 'Adresse',
    value: 'Zone industrielle de Yopougon\nLot 412, BP 1234 Abidjan 01',
    type: 'multiline',
    span: 'full',
  },
];
export const CONTRAT: DescriptionItem[] = [
  { label: 'Offre', value: 'Premium — Flotte' },
  { label: 'Début', value: '01/03/2026' },
  { label: 'Échéance', value: '28/02/2027' },
  { label: 'Montant mensuel', value: '1 250 000 FCFA' },
  { label: 'Paiement', value: 'Virement, à 30 jours' },
  { label: 'Renouvellement', value: 'Tacite', type: 'badge', tone: 'info' },
];

export const V1 = `Article 4 — Conditions financières
Les prestations sont facturées mensuellement, terme à échoir.
Le règlement intervient à trente (30) jours date de facture.
Tout retard entraîne une pénalité de 1 % par mois.
Les prix sont révisables chaque année au 1er janvier.

Article 5 — Résiliation
Chaque partie peut résilier avec un préavis de trois (3) mois.
La résiliation est notifiée par lettre recommandée.`;
export const V2 = `Article 4 — Conditions financières
Les prestations sont facturées mensuellement, terme à échoir.
Le règlement intervient à quarante-cinq (45) jours date de facture, par virement ou mobile money.
Tout retard entraîne une pénalité de 1,5 % par mois.
Les prix sont révisables chaque année au 1er janvier.

Article 5 — Résiliation
Chaque partie peut résilier avec un préavis de deux (2) mois.
La résiliation est notifiée par lettre recommandée ou par email avec accusé de réception.
Aucune indemnité n'est due en cas de résiliation à l'échéance.`;
export const CFG1 = `{
  "intervalle_gps": 30,
  "vitesse_max": 90,
  "coupe_moteur": false,
  "alertes": ["sortie_zone", "batterie_faible"]
}`;
export const CFG2 = `{
  "intervalle_gps": 15,
  "vitesse_max": 90,
  "coupe_moteur": true,
  "alertes": ["sortie_zone", "batterie_faible", "exces_vitesse"]
}`;

export const AUDIT: AuditEntry[] = [
  {
    id: 'a1',
    at: ago(0.3),
    user: { name: 'Aminata Diallo', color: '#8b5cf6' },
    action: 'update',
    target: 'Client CLI-1040',
    changes: [
      { field: 'telephone', label: 'Téléphone', before: '+225 07 10 20 30 40', after: '+225 05 44 21 18 90' },
      { field: 'vehicules', label: 'Véhicules', before: 12, after: 14 },
    ],
    meta: 'Chrome · macOS · 41.202.x.x',
  },
  {
    id: 'a2',
    at: ago(1.2),
    user: { name: 'Koffi N’Guessan', color: '#0ea5e9' },
    action: 'comment',
    target: 'Ticket #4521',
    comment: 'Balise remplacée, la remontée GPS est de nouveau normale. Client prévenu par téléphone.',
  },
  {
    id: 'a3',
    at: ago(3),
    user: { name: 'Aminata Diallo', color: '#8b5cf6' },
    action: 'status',
    target: 'Contrat CTR-2026-0412',
    changes: [
      { field: 'statut', label: 'Statut', before: 'Brouillon', after: 'Signé' },
      { field: 'signe_le', label: 'Signé le', before: null, after: '15/10/2026' },
    ],
  },
  {
    id: 'a4',
    at: ago(26),
    user: { name: 'Serge Kouamé', color: '#f59e0b' },
    action: 'create',
    target: 'Véhicule CI-8843-UV',
    changes: [
      { field: 'marque', label: 'Marque', after: 'Nissan Navara' },
      { field: 'groupe', label: 'Groupe', after: 'Livraisons Nord' },
    ],
  },
  {
    id: 'a5',
    at: ago(28),
    user: { name: 'Serge Kouamé', color: '#f59e0b' },
    action: 'export',
    target: 'Rapport de trajets (septembre)',
    meta: 'XLSX · 2 480 lignes',
  },
  {
    id: 'a6',
    at: ago(52),
    user: { name: 'Jean Kouassi', color: '#10b981' },
    action: 'delete',
    target: 'Zone « Dépôt provisoire »',
  },
  {
    id: 'a7',
    at: ago(55),
    user: { name: 'Jean Kouassi', color: '#10b981' },
    action: 'login',
    meta: 'Application mobile · Android',
  },
];

export const WIFI = 'WIFI:T:WPA;S:Atelier-Lookas;P:balise2026;;';
export const VCARD =
  'BEGIN:VCARD\nVERSION:3.0\nFN:Jean Kouassi\nORG:Transports Yao & Fils\nTEL:+2250710203040\nEMAIL:jean.kouassi@transports-yao.ci\nEND:VCARD';
