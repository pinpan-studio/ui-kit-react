/**
 * Lot contraste : couleur d'encre (texte / icône) d'un ton posé sur son fond -light.
 * `var(--info-color)` → `var(--tone-info-text, var(--info-color))` ; sans jeton dédié (primary…), le ton reste tel quel.
 * Les --*-color globales ne changent pas (elles restent la couleur des fonds, points et barres).
 */
export function toneInk(colorVar: string): string {
  const m = /^var\(--(success|warning|info|purple|cyan|error)-color\)$/.exec(colorVar.trim());
  return m ? `var(--tone-${m[1]}-text, ${colorVar})` : colorVar;
}

/** Icône de ton sur fond -light : nuance 700 (jetons --tone-*-icon) quand elle existe, sinon l'encre du texte. */
export function toneIcon(colorVar: string): string {
  const m = /^var\(--(success|warning|cyan)-color\)$/.exec(colorVar.trim());
  return m ? `var(--tone-${m[1]}-icon, ${colorVar})` : toneInk(colorVar);
}
