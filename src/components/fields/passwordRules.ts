export interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { label: '8 caractères minimum', test: (v) => v.length >= 8 },
  { label: 'Une majuscule et une minuscule', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'Un chiffre', test: (v) => /\d/.test(v) },
  { label: 'Un caractère spécial', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Score 0–4 : longueur, variété des caractères, pénalités (répétitions, suites, mots courants). */
export function passwordScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(v)).length;
  s += Math.min(2, Math.floor(v.length / 6));
  s += classes >= 3 ? 2 : classes === 2 ? 1 : 0;
  if (/(.)\1{2,}/.test(v)) s--;
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|azerty|qwerty)/i.test(v)) s--;
  if (/(password|motdepasse|admin|lookas|abidjan|123456)/i.test(v)) s -= 2;
  if (v.length < 6) s = Math.min(s, 1);
  return Math.max(0, Math.min(4, s));
}
