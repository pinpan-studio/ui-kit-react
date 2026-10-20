// Données statiques reprises de ui-kit Angular (data/static/session.data.ts, ex-app-shell, ex-chat.service).
export const CURRENT_USER = {
  fullname: 'Jean Kouassi',
  nom: 'Kouassi',
  prenoms: 'Jean',
  mail: 'jean.kouassi@example.com',
} as const;
export const initials = (fullname: string): string =>
  fullname
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2);

/** Non-lus des conversations non muettes (Aya : 2, Équipe opérations : 5). */
export const CHAT_UNREAD = 7;
/** Notifications d'exemple non lues (n1, n2, n3 ; n4 est lue). */
export const NOTIFICATIONS_UNREAD = 3;

export interface StaticNotification {
  _id: string;
  type: string;
  objet: string;
  contenu: string;
  lu: boolean;
  envoyeLe: string;
}

/** Notifications du drawer droit de /main (session.data.ts Angular). */
export const NOTIFICATIONS: StaticNotification[] = [
  {
    _id: 'n-1',
    type: 'Requête',
    objet: 'Nouvelle requête client',
    contenu: 'Transports Yao SARL a ouvert une requête « Balise hors ligne » (REQ-2024-0412).',
    lu: false,
    envoyeLe: '2026-10-13T08:42:00',
  },
  {
    _id: 'n-2',
    type: 'Mission',
    objet: 'Mission terminée',
    contenu: 'La mission MIS-0098 (installation 4 véhicules) a été clôturée par Koffi N’Guessan.',
    lu: false,
    envoyeLe: '2026-10-13T07:15:00',
  },
  {
    _id: 'n-3',
    type: 'Facturation',
    objet: 'Rôle de facturation généré',
    contenu: 'Le rôle d’octobre 2026 a été généré : 312 factures pour 48 750 000 FCFA.',
    lu: false,
    envoyeLe: '2026-10-12T18:05:00',
  },
  {
    _id: 'n-4',
    type: 'Tâche',
    objet: 'Tâche en retard',
    contenu: '« Relancer Bolloré Logistics pour le renouvellement » est en retard de 2 jours.',
    lu: true,
    envoyeLe: '2026-10-11T09:30:00',
  },
  {
    _id: 'n-5',
    type: 'Synchronisation',
    objet: 'Synchronisation terminée',
    contenu: 'La synchronisation Wialon a importé 1 284 équipements (3 anomalies).',
    lu: true,
    envoyeLe: '2026-10-10T22:10:00',
  },
];
