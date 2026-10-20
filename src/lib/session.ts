// Données statiques reprises de ui-kit Angular (data/static/session.data.ts, ex-app-shell, ex-chat.service).
export const CURRENT_USER = { fullname: 'Jean Kouassi', mail: 'jean.kouassi@example.com' } as const;
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
