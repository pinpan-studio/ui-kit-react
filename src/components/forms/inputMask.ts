/** Port de InputMaskDirective : 0 chiffre, A lettre, * alphanumérique, autres caractères insérés automatiquement. */
const isToken = (t: string | undefined) => t === '0' || t === 'A' || t === '*';
const accepts = (t: string, c: string) =>
  t === '0' ? /\d/.test(c) : t === 'A' ? /[A-Za-z]/.test(c) : /[A-Za-z0-9]/.test(c);

export function formatMask(mask: string, value: string): string {
  const chars = value.split('');
  let out = '';
  for (let i = 0; i < mask.length && chars.length; i++) {
    const token = mask[i] as string;
    if (!isToken(token)) {
      out += token;
      if ((chars[0] as string).toUpperCase() === token.toUpperCase()) chars.shift();
      continue;
    }
    while (chars.length && !accepts(token, chars[0] as string)) chars.shift();
    if (!chars.length) break;
    const c = chars.shift() as string;
    out += token === '0' ? c : c.toUpperCase();
  }
  return out;
}

export const maskPlaceholder = (mask: string) => mask.replace(/0/g, '_').replace(/[A*]/g, '_');
