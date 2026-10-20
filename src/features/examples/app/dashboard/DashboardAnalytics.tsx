/* eslint-disable @typescript-eslint/no-explicit-any -- options Chart.js portées telles quelles depuis ui-kit Angular (ex-dashboard-analytics.component.ts) */
import { Tooltip } from '@mui/material';
import type { ChartData } from 'chart.js';
import type { CSSProperties, ReactNode } from 'react';
import { Chart } from 'react-chartjs-2';
import { MapView } from '../../../../components/map/MapView';
import type { MapMarker } from '../../../../components/map/mapModels';
import { alpha, seeded, type ThemePalette } from '../../exUtils';
import { useThemePalette } from '../../useThemePalette';
import './dashboard-analytics.scss';

export type AnalyticsTab = 'sales' | 'customers' | 'operations';

const MONTHS = ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const FONT = { family: 'Inter', size: 11 };
const fr = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

// ─── Options communes ────────────────────────────────────────
function opts(
  c: ThemePalette,
  o: { stacked?: boolean; horizontal?: boolean; unit?: string; legend?: boolean; y2?: string } = {},
): any {
  const axis = (grid: boolean, unit = '') => ({
    stacked: !!o.stacked,
    grid: grid ? { color: c.grid } : { display: false },
    border: { display: false },
    ticks: {
      color: c.muted,
      font: FONT,
      maxTicksLimit: 6,
      callback: unit
        ? (v: number | string) => (typeof v === 'number' ? v.toLocaleString('fr-FR') + unit : v)
        : undefined,
    } as any,
  });
  const valueAxis = axis(true, o.unit),
    catAxis = axis(false);
  // Les catégories doivent garder leur libellé : pas de callback sur l'axe des catégories.
  delete catAxis.ticks.callback;
  catAxis.ticks.autoSkip = !o.horizontal;
  const scales: any = o.horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis };
  if (o.y2)
    scales.y2 = {
      position: 'right',
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: c.muted,
        font: FONT,
        maxTicksLimit: 5,
        callback: (v: number) => v.toLocaleString('fr-FR') + o.y2,
      },
    };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: o.horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: o.legend !== false,
        position: 'top',
        align: 'end',
        labels: { color: c.muted, usePointStyle: true, boxWidth: 8, font: FONT },
      },
      datalabels: { display: false },
      tooltip: {
        callbacks: o.unit
          ? {
              label: (ctx: any) =>
                ` ${ctx.dataset.label ?? ''} : ${(ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed).toLocaleString?.('fr-FR') ?? ctx.formattedValue}${o.unit}`,
            }
          : {},
      },
    },
    scales,
  };
}
const radialOpts = (c: ThemePalette, extra: any = {}): any => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { color: c.text, usePointStyle: true, boxWidth: 8, font: FONT, padding: 12 } },
    datalabels: { display: false },
  },
  ...extra,
});
const series = (c: ThemePalette) => [c.primary, c.info, c.warning, c.success, c.purple, c.error, c.tertiary];

// ─── Ventes ──────────────────────────────────────────────────
function salesCharts(c: ThemePalette) {
  /** Barres groupées : chiffre d'affaires par région, N vs N-1. */
  const regionBar = {
    data: {
      labels: ['Abidjan', 'Bouaké', 'San-Pédro', 'Yamoussoukro', 'Korhogo', 'Daloa'],
      datasets: [
        {
          label: '2025',
          data: [412, 128, 96, 74, 41, 38],
          backgroundColor: alpha(c.primary, 0.35),
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.7,
        },
        {
          label: '2026',
          data: [486, 141, 122, 81, 52, 36],
          backgroundColor: c.primary,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.7,
        },
      ],
    } as ChartData<'bar'>,
    options: opts(c, { unit: ' M' }),
  };
  /** Barres empilées : encaissements par moyen de paiement. */
  const r3 = seeded(3);
  const mk3 = (base: number) => MONTHS.map((_, i) => Math.round(base * (0.8 + r3() * 0.5) * (1 + i * 0.03)));
  const payStack = {
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Orange Money', data: mk3(28), backgroundColor: c.warning, stack: 'p' },
        { label: 'MTN MoMo', data: mk3(19), backgroundColor: alpha(c.warning, 0.55), stack: 'p' },
        { label: 'Wave', data: mk3(14), backgroundColor: c.info, stack: 'p' },
        { label: 'Virement', data: mk3(22), backgroundColor: c.primary, stack: 'p' },
        {
          label: 'Carte',
          data: mk3(9),
          backgroundColor: c.purple,
          stack: 'p',
          borderRadius: { topLeft: 4, topRight: 4 },
        },
      ],
    } as ChartData<'bar'>,
    options: opts(c, { stacked: true, unit: ' M' }),
  };
  /** Barres horizontales : meilleures ventes. */
  const topProducts = {
    data: {
      labels: [
        'Balise GPS 4G',
        'Abonnement Premium',
        'Capteur carburant',
        'Caméra embarquée',
        'Installation',
        'Formation',
        'Lecteur RFID',
      ],
      datasets: [
        {
          label: 'Unités',
          data: [1240, 980, 610, 455, 390, 210, 140],
          backgroundColor: series(c).map((_, i) => (i === 0 ? c.primary : alpha(c.primary, 0.55 - i * 0.05))),
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    } as ChartData<'bar'>,
    options: opts(c, { horizontal: true, legend: false }),
  };
  /** Mixte : commandes (barres) + panier moyen (courbe, axe secondaire). */
  const mixed = {
    data: {
      labels: MONTHS,
      datasets: [
        {
          type: 'bar',
          label: 'Commandes',
          data: [312, 340, 288, 301, 356, 372, 398, 384, 361, 377, 420, 451],
          backgroundColor: alpha(c.info, 0.55),
          borderRadius: 4,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Panier moyen',
          data: [182, 188, 176, 179, 185, 191, 196, 194, 190, 198, 205, 212],
          borderColor: c.warning,
          backgroundColor: c.warning,
          tension: 0.35,
          pointRadius: 3,
          borderWidth: 2,
          yAxisID: 'y2',
          order: 1,
        },
      ],
    } as unknown as ChartData<'bar'>,
    options: opts(c, { y2: ' k' }),
  };
  /** Cascade (waterfall) : du CA au résultat net — barres flottantes [début, fin]. */
  const steps: [string, number][] = [
    ['CA', 1140],
    ['Achats', -412],
    ['Salaires', -286],
    ['Loyers', -64],
    ['Marketing', -58],
    ['Autres', -41],
    ['Impôts', -71],
  ];
  let acc = 0;
  const bars = steps.map(([, v], i) => {
    const from = i === 0 ? 0 : acc;
    acc = i === 0 ? v : acc + v;
    return [from, acc] as [number, number];
  });
  const wfLabels = [...steps.map((s) => s[0]), 'Résultat'];
  bars.push([0, acc]);
  const waterfall = {
    data: {
      labels: wfLabels,
      datasets: [
        {
          label: 'Montant',
          data: bars as any,
          backgroundColor: bars.map((b, i) =>
            i === 0 || i === bars.length - 1 ? c.primary : b[1] < b[0] ? alpha(c.error, 0.75) : c.success,
          ),
          borderRadius: 3,
          barPercentage: 0.7,
        },
      ],
    } as ChartData<'bar'>,
    options: {
      ...opts(c, { legend: false, unit: ' M' }),
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const [a, b] = ctx.raw as number[];
              return ` ${((b ?? 0) - (a ?? 0)).toLocaleString('fr-FR')} M`;
            },
          },
        },
      },
    },
  };
  /** Aires empilées : visites par canal. */
  const r9 = seeded(9);
  const mk9 = (b: number) =>
    DAYS.concat(DAYS).map((_, i) => Math.round(b * (0.7 + r9() * 0.6) * (i % 7 > 4 ? 0.6 : 1)));
  const channels = {
    data: {
      labels: DAYS.concat(DAYS).map((d, i) => `${d} ${i < 7 ? 'S1' : 'S2'}`),
      datasets: [
        {
          label: 'Direct',
          data: mk9(420),
          borderColor: c.primary,
          backgroundColor: alpha(c.primary, 0.55),
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: 'Recherche',
          data: mk9(310),
          borderColor: c.info,
          backgroundColor: alpha(c.info, 0.45),
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: 'Réseaux sociaux',
          data: mk9(180),
          borderColor: c.purple,
          backgroundColor: alpha(c.purple, 0.4),
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: 'E-mail',
          data: mk9(90),
          borderColor: c.warning,
          backgroundColor: alpha(c.warning, 0.4),
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    } as ChartData<'line'>,
    options: opts(c, { stacked: true }),
  };
  /** Courbe en escalier : niveau de stock et seuil de réapprovisionnement. */
  const lv = [420, 420, 380, 380, 310, 260, 260, 190, 140, 620, 620, 560, 500, 500, 430];
  const stock = {
    data: {
      labels: lv.map((_, i) => `${i + 1} oct.`),
      datasets: [
        {
          label: 'Stock balises',
          data: lv,
          borderColor: c.primary,
          backgroundColor: alpha(c.primary, 0.08),
          fill: true,
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Seuil',
          data: lv.map(() => 200),
          borderColor: c.error,
          borderDash: [4, 4],
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    } as ChartData<'line'>,
    options: opts(c, {}),
  };
  return { regionBar, payStack, topProducts, mixed, waterfall, channels, stock };
}

// ─── Clients ─────────────────────────────────────────────────
const SECTORS = [
  { label: 'Transport', v: 31 },
  { label: 'Agro-industrie', v: 22 },
  { label: 'BTP', v: 14 },
  { label: 'Santé', v: 11 },
  { label: 'Finance', v: 9 },
  { label: 'Télécoms', v: 7 },
  { label: 'Autres', v: 6 },
];
function customerCharts(c: ThemePalette) {
  const axisXY = (x: string, y: string) => ({
    x: {
      title: { display: true, text: x, color: c.muted, font: FONT },
      grid: { color: c.grid },
      border: { display: false },
      ticks: { color: c.muted, font: FONT },
    },
    y: {
      title: { display: true, text: y, color: c.muted, font: FONT },
      grid: { color: c.grid },
      border: { display: false },
      ticks: { color: c.muted, font: FONT },
    },
  });
  const pie = {
    data: {
      labels: SECTORS.map((s) => s.label),
      datasets: [{ data: SECTORS.map((s) => s.v), backgroundColor: series(c), borderColor: c.card, borderWidth: 2 }],
    } as ChartData<'pie'>,
    options: radialOpts(c),
  };
  const polar = {
    data: {
      labels: ['Facturation', 'Balises', 'Application', 'Livraison', 'Compte', 'Autre'],
      datasets: [
        {
          data: [48, 36, 29, 22, 14, 9],
          backgroundColor: series(c)
            .slice(0, 6)
            .map((x) => alpha(x, 0.65)),
          borderColor: c.card,
          borderWidth: 2,
        },
      ],
    } as ChartData<'polarArea'>,
    options: radialOpts(c, {
      scales: {
        r: {
          grid: { color: c.grid },
          angleLines: { color: c.grid },
          ticks: { display: false, backdropColor: 'transparent' },
        },
      },
    }),
  };
  const radar = {
    data: {
      labels: ['Rapidité', 'Facilité', 'Fiabilité', 'Support', 'Prix', 'Application mobile'],
      datasets: [
        {
          label: 'T3',
          data: [3.6, 4.1, 4.0, 3.4, 3.2, 3.5],
          borderColor: c.muted,
          backgroundColor: alpha(c.muted, 0.15),
          pointRadius: 2,
          borderWidth: 1.5,
        },
        {
          label: 'T4',
          data: [4.2, 4.3, 4.4, 4.0, 3.4, 4.1],
          borderColor: c.primary,
          backgroundColor: alpha(c.primary, 0.2),
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    } as ChartData<'radar'>,
    options: {
      ...radialOpts(c),
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: c.muted, usePointStyle: true, boxWidth: 8, font: FONT },
        },
        datalabels: { display: false },
      },
      scales: {
        r: {
          min: 0,
          max: 5,
          grid: { color: c.grid },
          angleLines: { color: c.grid },
          pointLabels: { color: c.text, font: FONT },
          ticks: { display: false, stepSize: 1 },
        },
      },
    },
  };
  /** Nuage de points : délai de paiement vs montant facturé. */
  const r21 = seeded(21);
  const pts = (n: number, late: boolean) =>
    Array.from({ length: n }, () => {
      const x = Math.round(r21() * 12) / 2 + 0.5;
      return { x, y: Math.round((late ? 35 : 12) + r21() * (late ? 40 : 22) + x * 2) };
    });
  const scatter = {
    data: {
      datasets: [
        { label: 'Payées à temps', data: pts(38, false), backgroundColor: alpha(c.success, 0.7), pointRadius: 4 },
        {
          label: 'En retard',
          data: pts(14, true),
          backgroundColor: alpha(c.error, 0.75),
          pointRadius: 4,
          pointStyle: 'triangle',
        },
      ],
    } as ChartData<'scatter'>,
    options: {
      ...opts(c, {}),
      interaction: { mode: 'nearest', intersect: true },
      scales: axisXY('Montant (M FCFA)', 'Délai (jours)'),
    },
  };
  /** Bulles : chiffre d'affaires × marge, taille = nombre de sites. */
  const bubblePts = [
    ['Cacao Plus', 121, 34, 14],
    ['Orca Télécom', 111, 22, 9],
    ['Energie Nord', 101, 28, 11],
    ['Ivoire Agro', 87, 31, 8],
    ['Clinique Riviera', 77, 18, 4],
    ['Hôtel Assinie', 67, 25, 3],
    ['Banque Lagune', 44, 38, 6],
    ['Batim CI', 34, 15, 5],
  ] as const;
  const s = series(c);
  const bubble = {
    data: {
      datasets: bubblePts.map(([n, x, y, sz], i) => ({
        label: n,
        data: [{ x, y, r: 4 + sz * 1.4 }],
        backgroundColor: alpha(s[i % 7] ?? c.primary, 0.55),
        borderColor: s[i % 7],
        borderWidth: 1,
      })),
    } as ChartData<'bubble'>,
    options: {
      ...opts(c, { legend: false }),
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          callbacks: { label: (ctx: any) => ` ${ctx.dataset.label} : ${ctx.raw.x} M · marge ${ctx.raw.y} %` },
        },
      },
      scales: axisXY('CA (M FCFA)', 'Marge (%)'),
    },
  };
  return { pie, polar, radar, scatter, bubble };
}

/** Treemap (disposition « slice and dice » en CSS) : CA par catégorie > sous-catégorie. */
const TREEMAP = [
  {
    label: 'Abonnements',
    v: 46,
    tone: 'primary',
    kids: [
      { label: 'Premium', v: 28 },
      { label: 'Standard', v: 13 },
      { label: 'Essentiel', v: 5 },
    ],
  },
  {
    label: 'Matériel',
    v: 31,
    tone: 'info',
    kids: [
      { label: 'Balises', v: 18 },
      { label: 'Capteurs', v: 8 },
      { label: 'Caméras', v: 5 },
    ],
  },
  {
    label: 'Services',
    v: 23,
    tone: 'purple',
    kids: [
      { label: 'Installation', v: 11 },
      { label: 'Formation', v: 7 },
      { label: 'Support', v: 5 },
    ],
  },
];
const CITY_MARKERS: MapMarker[] = (
  [
    ['Abidjan', 5.345, -4.024, 486],
    ['Bouaké', 7.69, -5.03, 141],
    ['San-Pédro', 4.75, -6.64, 122],
    ['Yamoussoukro', 6.82, -5.28, 81],
    ['Korhogo', 9.46, -5.63, 52],
    ['Daloa', 6.88, -6.45, 36],
    ['Man', 7.41, -7.55, 24],
  ] as const
).map(([n, lat, lng, v]) => ({
  id: n,
  lat,
  lng,
  title: n,
  lines: [`${v} M FCFA`],
  icon: 'storefront',
  tone: v > 120 ? 'primary' : v > 50 ? 'info' : 'neutral',
}));

// ─── Opérations ──────────────────────────────────────────────
const FUNNEL = [
  { label: 'Visiteurs', v: 48200 },
  { label: 'Demandes de démo', v: 3120 },
  { label: 'Démos réalisées', v: 1480 },
  { label: 'Devis envoyés', v: 920 },
  { label: 'Contrats signés', v: 412 },
];
const RINGS = [
  { label: 'Livraisons à l’heure', v: 94, tone: 'success' },
  { label: 'Tickets résolus < 24 h', v: 81, tone: 'info' },
  { label: 'Taux d’occupation', v: 67, tone: 'warning' },
  { label: 'Objectif mensuel', v: 72, tone: 'primary' },
];
/** Heatmap commandes par heure (7 h – 20 h) × jour. */
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const HEAT = (() => {
  const r = seeded(7);
  return DAYS.map((_, d) =>
    HOURS.map((h) => {
      const peak = Math.exp(-((h - 10) ** 2) / 6) + Math.exp(-((h - 15) ** 2) / 5) * 0.8;
      return Math.round((peak * (d > 4 ? 0.35 : 1) + r() * 0.25) * 100);
    }),
  );
})();
const HEAT_MAX = Math.max(...HEAT.flat());
/** Calendrier d'activité (52 semaines × 7 jours), façon contributions. */
const CALENDAR = (() => {
  const r = seeded(11);
  const start = new Date(2025, 9, 20);
  return Array.from({ length: 52 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const base = d > 4 ? 0.15 : 0.6 + (w / 52) * 0.3;
      const v = r() < 0.1 ? 0 : Math.round(base * r() * 40);
      return { date, v, lvl: v === 0 ? 0 : v < 8 ? 1 : v < 16 ? 2 : v < 24 ? 3 : 4 };
    }),
  );
})();
const MONTHS_AXIS = Array.from({ length: 12 }, (_, i) => ({ label: MONTHS[i] ?? '', col: Math.round((i * 52) / 12) }));
const RANKING = [
  { name: 'Aya Koné', team: 'Opérations', v: 148, goal: 160 },
  { name: 'Marc Yao', team: 'Technique', v: 131, goal: 120 },
  { name: 'Sarah Bamba', team: 'Formation', v: 117, goal: 130 },
  { name: 'Jean Kouassi', team: 'Direction', v: 96, goal: 100 },
  { name: 'Aïcha Diallo', team: 'Données', v: 88, goal: 110 },
];

/** Anneau SVG : longueur de trait pour une valeur 0–100 (r = 40). */
const dash = (v: number) => {
  const l = 2 * Math.PI * 40;
  return `${(l * v) / 100} ${l}`;
};
const heatColor = (v: number) =>
  `color-mix(in srgb, var(--primary-color) ${Math.round((v / HEAT_MAX) * 100)}%, var(--hover-bg))`;
const pct = (a: number, b: number) => (a / b) * 100;
/** Largeur d'une étape d'entonnoir : échelle racine carrée pour garder les dernières étapes lisibles. */
const funnelWidth = (v: number) => Math.max(6, Math.sqrt(v / (FUNNEL[0]?.v ?? 1)) * 100);

function Card({
  title,
  tag,
  className,
  children,
}: {
  title: string;
  tag: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card${className ? ' ' + className : ''}`}>
      <div className="card-head">
        <h2>{title}</h2>
        <span className="tag">{tag}</span>
      </div>
      {children}
    </section>
  );
}
const ChartBody = ({ type, g }: { type: any; g: { data: any; options: any } | null }) => (
  <div className="card-body">
    <div className="chart">{g && <Chart type={type} data={g.data} options={g.options} />}</div>
  </div>
);

/**
 * Catalogue de visualisations du tableau de bord, par onglet :
 * - Ventes : barres groupées, empilées, horizontales, mixte barres + courbe (double axe), cascade, aires empilées, escalier ;
 * - Clients : camembert, aire polaire, radar, nuage de points, bulles, treemap, carte ;
 * - Opérations : entonnoir, anneaux de progression, heatmap heures × jours, calendrier d'activité, classement à barres.
 * Couleurs lues sur les jetons du thème (clair / sombre / palette) et recalculées à chaque changement.
 */
export function DashboardAnalytics({ tab = 'sales' }: { tab?: AnalyticsTab }) {
  const c = useThemePalette();

  if (tab === 'sales') {
    const g = c ? salesCharts(c) : null;
    return (
      <div className="ex-analytics">
        <div className="grid">
          <Card title="Chiffre d’affaires par région" tag="Barres groupées" className="span-2">
            <ChartBody type="bar" g={g?.regionBar ?? null} />
          </Card>
          <Card title="Meilleures ventes" tag="Barres horizontales">
            <ChartBody type="bar" g={g?.topProducts ?? null} />
          </Card>
          <Card title="Encaissements par moyen de paiement" tag="Barres empilées" className="span-2">
            <ChartBody type="bar" g={g?.payStack ?? null} />
          </Card>
          <Card title="Du CA au résultat" tag="Cascade">
            <ChartBody type="bar" g={g?.waterfall ?? null} />
          </Card>
          <Card title="Commandes et panier moyen" tag="Mixte · double axe" className="span-2">
            <ChartBody type="bar" g={g?.mixed ?? null} />
          </Card>
          <Card title="Stock de balises" tag="Escalier">
            <ChartBody type="line" g={g?.stock ?? null} />
          </Card>
          <Card title="Visites par canal" tag="Aires empilées" className="span-3">
            <ChartBody type="line" g={g?.channels ?? null} />
          </Card>
        </div>
      </div>
    );
  }

  if (tab === 'customers') {
    const g = c ? customerCharts(c) : null;
    return (
      <div className="ex-analytics">
        <div className="grid">
          <Card title="CA par secteur" tag="Camembert">
            <ChartBody type="pie" g={g?.pie ?? null} />
          </Card>
          <Card title="Tickets par catégorie" tag="Aire polaire">
            <ChartBody type="polarArea" g={g?.polar ?? null} />
          </Card>
          <Card title="Satisfaction" tag="Radar">
            <ChartBody type="radar" g={g?.radar ?? null} />
          </Card>
          <Card title="Délai de paiement selon le montant" tag="Nuage de points" className="span-2">
            <ChartBody type="scatter" g={g?.scatter ?? null} />
          </Card>
          <Card title="Portefeuille grands comptes" tag="Bulles">
            <ChartBody type="bubble" g={g?.bubble ?? null} />
          </Card>
          <Card title="Répartition du chiffre d’affaires" tag="Treemap" className="span-2">
            <div className="card-body">
              <div className="treemap">
                {TREEMAP.map((t) => (
                  <div
                    key={t.label}
                    className="tm-group"
                    style={{ flexGrow: t.v, '--tone': `var(--${t.tone}-color)` } as CSSProperties}
                  >
                    <span className="tm-title">
                      {t.label} · {t.v} %
                    </span>
                    <div className="tm-kids">
                      {t.kids.map((k, i) => (
                        <div
                          key={k.label}
                          className="tm-cell"
                          style={{ flexGrow: k.v, opacity: 1 - i * 0.22 }}
                          title={`${k.label} : ${k.v} %`}
                        >
                          <strong>{k.label}</strong>
                          <span>{k.v} %</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="Ventes par ville" tag="Carte" className="map">
            <div className="map-box">
              <MapView center={[7.2, -5.6]} zoom={6} height="260px" markers={CITY_MARKERS} fitBounds />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ex-analytics">
      <div className="grid">
        <Card title="Tunnel de conversion" tag="Entonnoir" className="span-2">
          <div className="card-body funnel">
            {FUNNEL.map((f, i) => (
              <div key={f.label} className="f-row">
                <span className="f-lbl">{f.label}</span>
                <div className="f-track">
                  <div className="f-bar" style={{ width: funnelWidth(f.v) + '%', opacity: 1 - i * 0.14 }} />
                </div>
                <span className="f-val tabular">{fr(f.v)}</span>
                <span className="f-rate tabular">{i ? `${fr(pct(f.v, FUNNEL[i - 1]?.v ?? f.v))} %` : '—'}</span>
              </div>
            ))}
            <p className="f-foot">
              Largeurs en échelle racine carrée · conversion globale :{' '}
              <strong>{fr(pct(FUNNEL[4]?.v ?? 0, FUNNEL[0]?.v ?? 1), 2)} %</strong> des visiteurs
            </p>
          </div>
        </Card>
        <Card title="Qualité de service" tag="Anneaux">
          <div className="card-body rings">
            {RINGS.map((r) => (
              <div key={r.label} className="ring" style={{ '--tone': `var(--${r.tone}-color)` } as CSSProperties}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="40" className="r-track" />
                  <circle cx="50" cy="50" r="40" className="r-val" strokeDasharray={dash(r.v)} />
                </svg>
                <strong className="tabular">{r.v} %</strong>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Commandes par heure" tag="Heatmap" className="span-2">
          <div className="card-body">
            <div className="heat" role="table" aria-label="Commandes par jour et par heure">
              <span />
              {HOURS.map((h) => (
                <span key={h} className="hx">
                  {h} h
                </span>
              ))}
              {HEAT.map((row, d) => [
                <span key={'d' + d} className="hy">
                  {DAYS[d]}
                </span>,
                ...row.map((v, h) => (
                  <Tooltip key={d + '-' + h} title={`${DAYS[d]} ${HOURS[h]} h : ${v} commandes`}>
                    <i style={{ background: heatColor(v) }} />
                  </Tooltip>
                )),
              ])}
            </div>
            <div className="legend-scale">
              <span>Moins</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((s) => (
                <i key={s} style={{ background: heatColor(s * HEAT_MAX) }} />
              ))}
              <span>Plus</span>
            </div>
          </div>
        </Card>
        <Card title="Objectifs de l’équipe" tag="Classement">
          <div className="card-body ranking">
            {RANKING.map((p, i) => (
              <div key={p.name} className="rk">
                <span className="rk-pos">{i + 1}</span>
                <div className="rk-main">
                  <div className="rk-top">
                    <strong>{p.name}</strong>
                    <span className="tabular">
                      {p.v} / {p.goal}
                    </span>
                  </div>
                  <div className="rk-bar">
                    <i
                      style={{ width: Math.min(100, pct(p.v, p.goal)) + '%' }}
                      className={p.v >= p.goal ? 'over' : ''}
                    />
                  </div>
                  <small>{p.team}</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Interventions sur 12 mois" tag="Calendrier d’activité" className="span-3">
          <div className="card-body cal-wrap">
            <div className="cal">
              <div className="cal-months">
                {MONTHS_AXIS.map((m) => (
                  <span key={m.label} style={{ gridColumn: m.col + 2 }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="cal-grid">
                <div className="cal-days">
                  {DAYS.map((d, i) => (
                    <span key={d}>{i % 2 === 0 ? d : ''}</span>
                  ))}
                </div>
                {CALENDAR.map((w, wi) => (
                  <div key={wi} className="cal-week">
                    {w.map((cell, di) => (
                      <Tooltip
                        key={di}
                        title={`${cell.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${cell.v} intervention(s)`}
                      >
                        <i className={'lv' + cell.lvl} />
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-scale">
              <span>Moins</span>
              {[0, 1, 2, 3, 4].map((l) => (
                <i key={l} className={'lv' + l} />
              ))}
              <span>Plus</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
