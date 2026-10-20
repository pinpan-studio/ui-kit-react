export type CounterFormat = 'number' | 'currency' | 'percent' | 'compact';

export function formatStat(v: number, format: CounterFormat, decimals = 0, currency = 'FCFA'): string {
  const nf = (n: number, d = decimals) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u202f/g, ' ');
  switch (format) {
    case 'currency':
      return `${nf(v)} ${currency}`;
    case 'percent':
      return `${nf(v, decimals || 1)} %`;
    case 'compact': {
      const a = Math.abs(v);
      return a >= 1e9
        ? `${nf(v / 1e9, 1)} Md`
        : a >= 1e6
          ? `${nf(v / 1e6, 1)} M`
          : a >= 1e3
            ? `${nf(v / 1e3, 1)} k`
            : nf(v);
    }
    default:
      return nf(v);
  }
}
