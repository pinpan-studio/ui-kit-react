/** defaultEntityLabel (entity-autocomplete.component.ts). */
export function defaultEntityLabel(item: unknown): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item !== 'object') return String(item);
  const i = item as Record<string, unknown>;
  const s = (k: string) => (typeof i[k] === 'string' || typeof i[k] === 'number' ? String(i[k]) : '');
  return (
    s('libelle') ||
    s('label') ||
    s('designation') ||
    s('nom_commercial') ||
    s('raison_sociale') ||
    (s('nom') && s('prenom') ? `${s('prenom')} ${s('nom')}` : s('nom')) ||
    s('name') ||
    s('code') ||
    s('numero') ||
    s('reference') ||
    s('title') ||
    s('titre') ||
    s('_id') ||
    ''
  );
}
