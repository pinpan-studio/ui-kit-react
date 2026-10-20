/** Utilitaires de dates (équivalents NativeDateAdapter fr-FR). */
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addMonths = (d: Date, n: number) => {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  r.setDate(Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return r;
};
export const formatDate = (d: Date | null | undefined) => (d ? d.toLocaleDateString('fr-FR') : '');
export const formatTime = (d: Date | null | undefined) =>
  d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
export function parseDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}
export function parseTime(s: string, base: Date | null): Date | null {
  const m = /^(\d{1,2})[:h](\d{2})$/.exec(s.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  const b = base ?? new Date();
  return new Date(b.getFullYear(), b.getMonth(), b.getDate(), Number(m[1]), Number(m[2]));
}
const up = (s: string) => s.toLocaleUpperCase('fr-FR');
export const monthShort = (m: number) => up(new Date(2017, m, 1).toLocaleDateString('fr-FR', { month: 'short' }));
export const monthYear = (d: Date) => up(d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
export const dayLong = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/** Lundi en premier (fr-FR). */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0].map((i) => {
  const d = new Date(2017, 0, 1 + i);
  return {
    long: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
    narrow: up(d.toLocaleDateString('fr-FR', { weekday: 'narrow' })),
  };
});
