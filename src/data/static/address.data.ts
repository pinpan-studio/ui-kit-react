// Porté depuis data/static/address.data.ts.
import type { PlaceOption } from '../../components/fields/addressTypes';

/** Répertoire d'adresses statique (Côte d'Ivoire) pour app-address-field — aucun géocodage distant. */
export const DEMO_PLACES: PlaceOption[] = [
  {
    id: 'a1',
    label: 'Boulevard de la République',
    detail: 'Plateau, Abidjan',
    city: 'Abidjan',
    lat: 5.3237,
    lng: -4.0193,
    kind: 'road',
  },
  {
    id: 'a2',
    label: 'Riviera 2, rue des Jardins',
    detail: 'Cocody, Abidjan',
    city: 'Abidjan',
    lat: 5.36,
    lng: -3.99,
    kind: 'road',
  },
  {
    id: 'a3',
    label: 'Carrefour Selmer',
    detail: 'Yopougon, Abidjan',
    city: 'Abidjan',
    lat: 5.345,
    lng: -4.08,
    kind: 'poi',
  },
  {
    id: 'a4',
    label: 'Zone 4, rue du Docteur Blanchard',
    detail: 'Marcory, Abidjan',
    city: 'Abidjan',
    lat: 5.303,
    lng: -3.985,
    kind: 'road',
  },
  {
    id: 'a5',
    label: 'Port autonome d’Abidjan',
    detail: 'Treichville, Abidjan',
    city: 'Abidjan',
    lat: 5.293,
    lng: -4.005,
    kind: 'poi',
  },
  {
    id: 'a6',
    label: 'Gare routière d’Abobo',
    detail: 'Abobo, Abidjan',
    city: 'Abidjan',
    lat: 5.418,
    lng: -4.02,
    kind: 'poi',
  },
  {
    id: 'a7',
    label: 'Aéroport Félix-Houphouët-Boigny',
    detail: 'Port-Bouët, Abidjan',
    city: 'Abidjan',
    lat: 5.255,
    lng: -3.93,
    kind: 'poi',
  },
  {
    id: 'a8',
    label: 'Boulevard Valéry Giscard d’Estaing',
    detail: 'Koumassi, Abidjan',
    city: 'Abidjan',
    lat: 5.297,
    lng: -3.948,
    kind: 'road',
  },
  {
    id: 'a9',
    label: 'Angré 8e tranche',
    detail: 'Cocody, Abidjan',
    city: 'Abidjan',
    lat: 5.398,
    lng: -3.987,
    kind: 'area',
  },
  {
    id: 'a10',
    label: 'Avenue Houphouët-Boigny',
    detail: 'Bouaké',
    city: 'Bouaké',
    lat: 7.6906,
    lng: -5.0306,
    kind: 'road',
  },
  {
    id: 'a11',
    label: 'Basilique Notre-Dame de la Paix',
    detail: 'Yamoussoukro',
    city: 'Yamoussoukro',
    lat: 6.8115,
    lng: -5.297,
    kind: 'poi',
  },
  {
    id: 'a12',
    label: 'Port de San-Pédro',
    detail: 'San-Pédro',
    city: 'San-Pédro',
    lat: 4.7485,
    lng: -6.6363,
    kind: 'poi',
  },
  { id: 'a13', label: 'Quartier Commerce', detail: 'Korhogo', city: 'Korhogo', lat: 9.458, lng: -5.6296, kind: 'area' },
  { id: 'a14', label: 'Marché central', detail: 'Daloa', city: 'Daloa', lat: 6.8774, lng: -6.4502, kind: 'poi' },
  {
    id: 'a15',
    label: 'Plage d’Assinie Mafia',
    detail: 'Assinie',
    city: 'Assinie',
    lat: 5.133,
    lng: -3.283,
    kind: 'area',
  },
  {
    id: 'a16',
    label: 'Quartier France',
    detail: 'Grand-Bassam',
    city: 'Grand-Bassam',
    lat: 5.198,
    lng: -3.738,
    kind: 'area',
  },
];

/** Recherche locale insensible aux accents (simule un géocodeur, avec un léger délai). */
export function searchPlaces(q: string): Promise<PlaceOption[]> {
  const n = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const t = n(q.trim());
  const res = DEMO_PLACES.filter((p) => n(`${p.label} ${p.detail}`).includes(t)).slice(0, 6);
  return new Promise((r) => setTimeout(() => r(res), 250));
}
