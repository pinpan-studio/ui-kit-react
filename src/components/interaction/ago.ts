/** Horodatage relatif en français (NotificationCenterComponent.ago). */
export function ago(at: string | Date, now = Date.now()): string {
  const s = (now - +new Date(at)) / 1000;
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'hier';
  return new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
