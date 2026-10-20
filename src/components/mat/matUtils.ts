// Utilitaires des répliques Angular Material (hors composants, pour le fast refresh).
/** matBadge : à poser sur une icône ou un bouton (classe hôte + contenu). */
export const matBadgeClass = (
  color: 'primary' | 'accent' | 'warn' | null,
  size: 'small' | 'medium' = 'medium',
  hidden = false,
) =>
  `mat-badge${color ? ` mat-badge-${color}` : ''} mat-badge-overlap mat-badge-above mat-badge-after mat-badge-${size}${hidden ? ' mat-badge-hidden' : ''}`;

export const SORT_ARROW = 'M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z';
