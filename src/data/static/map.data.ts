// Porté tel quel depuis ui-kit Angular (src/app/data/static/map.data.ts).
import type { MapMarker, MapRoute, MapZone } from '../../components/map/mapModels';

/** Données géographiques statiques (Abidjan et environs) pour /components/maps. */
export const ABIDJAN: [number, number] = [5.33, -4.01];

export const FLOTTE: MapMarker[] = [
  {
    id: 'v1',
    lat: 5.3237,
    lng: -4.0193,
    title: 'CI-4521-AB · Toyota Hilux',
    lines: ['En mouvement · 54 km/h', 'Plateau, bd de la République'],
    icon: 'local_shipping',
    tone: 'success',
    pulse: true,
    heading: 120,
    tooltip: 'CI-4521-AB',
  },
  {
    id: 'v2',
    lat: 5.36,
    lng: -3.99,
    title: 'CI-2210-CD · Renault Kangoo',
    lines: ['À l’arrêt depuis 12 min', 'Cocody, Riviera 2'],
    icon: 'airport_shuttle',
    tone: 'warning',
    tooltip: 'CI-2210-CD',
  },
  {
    id: 'v3',
    lat: 5.345,
    lng: -4.08,
    title: 'CI-3307-EF · Suzuki Swift',
    lines: ['En mouvement · 38 km/h', 'Yopougon, Selmer'],
    icon: 'directions_car',
    tone: 'success',
    pulse: true,
    heading: 40,
    tooltip: 'CI-3307-EF',
  },
  {
    id: 'v4',
    lat: 5.303,
    lng: -3.985,
    title: 'CI-0418-GH · Yamaha Crux',
    lines: ['Hors ligne depuis 2 j', 'Marcory, zone 4'],
    icon: 'two_wheeler',
    tone: 'error',
    tooltip: 'CI-0418-GH',
  },
  {
    id: 'v5',
    lat: 5.293,
    lng: -4.005,
    title: 'CI-7781-JK · Mercedes Actros',
    lines: ['Moteur coupé', 'Treichville, port'],
    icon: 'local_shipping',
    tone: 'neutral',
    tooltip: 'CI-7781-JK',
  },
  {
    id: 'v6',
    lat: 5.418,
    lng: -4.02,
    title: 'CI-1150-LM · Toyota Coaster',
    lines: ['En mouvement · 61 km/h', 'Abobo, gare'],
    icon: 'directions_bus',
    tone: 'success',
    pulse: true,
    heading: 200,
    tooltip: 'CI-1150-LM',
  },
  {
    id: 'v7',
    lat: 5.255,
    lng: -3.93,
    title: 'CI-9902-NP · Isuzu D-Max',
    lines: ['Alerte : sortie de zone', 'Port-Bouët, aéroport'],
    icon: 'warning',
    tone: 'error',
    pulse: true,
    tooltip: 'CI-9902-NP',
  },
  {
    id: 'v8',
    lat: 5.297,
    lng: -3.948,
    title: 'CI-6630-QR · Peugeot Partner',
    lines: ['En maintenance', 'Koumassi, atelier'],
    icon: 'build',
    tone: 'info',
    tooltip: 'CI-6630-QR',
  },
];

/** Nuage de positions pour la démo de clustering (pseudo-aléatoire déterministe). */
export const POSITIONS_DENSES: MapMarker[] = (() => {
  const centres: [number, number, number][] = [
    [5.33, -4.02, 0.06],
    [7.69, -5.03, 0.05],
    [4.75, -6.64, 0.04],
    [6.82, -5.28, 0.04],
    [9.45, -5.63, 0.03],
  ];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: MapMarker[] = [];
  centres.forEach(([lat, lng, spread], ci) => {
    const n = ci === 0 ? 220 : 50;
    for (let i = 0; i < n; i++) {
      const r = rnd();
      out.push({
        id: `p${ci}-${i}`,
        lat: lat + (rnd() - 0.5) * spread * 2,
        lng: lng + (rnd() - 0.5) * spread * 2,
        icon: 'sensors',
        tone: r > 0.9 ? 'error' : r > 0.75 ? 'warning' : 'success',
        title: `Balise #${1000 + out.length}`,
        lines: [r > 0.9 ? 'Hors ligne' : 'En ligne'],
      });
    }
  });
  return out;
})();

export const TRAJETS: MapRoute[] = [
  {
    id: 't1',
    label: 'Trajet réalisé · 38 km · 52 min',
    tone: 'primary',
    endpoints: true,
    points: [
      [5.3237, -4.0193],
      [5.31, -4.005],
      [5.295, -3.99],
      [5.285, -3.96],
      [5.26, -3.93],
      [5.245, -3.89],
      [5.23, -3.83],
      [5.215, -3.78],
      [5.2, -3.738],
    ],
  },
  {
    id: 't2',
    label: 'Itinéraire prévu',
    tone: 'warning',
    dashed: true,
    points: [
      [5.2, -3.738],
      [5.24, -3.76],
      [5.29, -3.82],
      [5.33, -3.89],
      [5.36, -3.99],
    ],
  },
];
export const TRAJET_ETAPES: MapMarker[] = [
  {
    id: 'e1',
    lat: 5.26,
    lng: -3.93,
    title: 'Arrêt 8 min',
    lines: ['10:42 – 10:50', 'Port-Bouët'],
    icon: 'pause',
    tone: 'warning',
  },
  {
    id: 'e2',
    lat: 5.23,
    lng: -3.83,
    title: 'Excès de vitesse',
    lines: ['94 km/h (limite 70)', '11:05'],
    icon: 'speed',
    tone: 'error',
  },
];

export const ZONES: MapZone[] = [
  { id: 'z1', label: 'Dépôt central (rayon 600 m)', tone: 'success', circle: { center: [5.303, -3.985], radius: 600 } },
  {
    id: 'z2',
    label: 'Zone portuaire — accès restreint',
    tone: 'error',
    polygon: [
      [5.299, -4.018],
      [5.301, -3.999],
      [5.286, -3.996],
      [5.282, -4.015],
    ],
  },
  {
    id: 'z3',
    label: 'Secteur de livraison Cocody',
    tone: 'info',
    polygon: [
      [5.375, -4.005],
      [5.38, -3.97],
      [5.35, -3.96],
      [5.342, -3.995],
    ],
  },
  { id: 'z4', label: 'Aéroport (rayon 1,5 km)', tone: 'warning', circle: { center: [5.255, -3.93], radius: 1500 } },
];
export const ZONE_MARKERS: MapMarker[] = [
  {
    id: 'zm1',
    lat: 5.303,
    lng: -3.985,
    icon: 'warehouse',
    tone: 'success',
    title: 'Dépôt central',
    lines: ['12 véhicules présents'],
  },
];
