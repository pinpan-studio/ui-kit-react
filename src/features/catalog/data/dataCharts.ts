/* eslint-disable @typescript-eslint/no-explicit-any -- options Chart.js portées telles quelles depuis ui-kit Angular (data-gallery.component.ts) */
// Configuration des graphiques de la galerie Data : copie de la classe Angular ; `computed` devient un simple accesseur
// et le mode clair / sombre est passé au constructeur.
import type { ChartConfiguration, ChartData } from 'chart.js';
import { CA_MENSUEL_2025, CA_MENSUEL_2026, MOIS } from '../../../data/static/showcase.data';

const PALETTE = ['#10b981', '#8b5cf6', '#06b6d4', '#4f46e5', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7'];
const computed = <T>(f: () => T): (() => T) => f;

export class DataCharts {
  constructor(private readonly dark: boolean) {}
  private theme = { mode: () => (this.dark ? 'dark' : 'light') };
  private chartTheme = computed(() => {
    const dark = this.theme.mode() === 'dark';
    return {
      text: dark ? '#cbd5e1' : '#4b5563',
      muted: dark ? '#94a3b8' : '#9ca3af',
      grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      surface: dark ? '#1f2937' : '#ffffff',
      tooltipBg: dark ? '#111827' : '#1f2937',
    };
  });
  private baseOptions(legend: 'top' | 'bottom' | false = 'bottom'): any {
    const t = this.chartTheme();
    return {
      responsive: true,
      maintainAspectRatio: false,
      color: t.text,
      plugins: {
        legend: legend
          ? {
              position: legend,
              labels: {
                boxWidth: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                color: t.text,
                font: { size: 11, family: 'Inter' },
              },
            }
          : { display: false },
        tooltip: {
          backgroundColor: t.tooltipBg,
          titleColor: '#f9fafb',
          bodyColor: '#e5e7eb',
          borderWidth: 0,
          cornerRadius: 8,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
        },
      },
    };
  }
  private cartesian(extra: any = {}): any {
    const t = this.chartTheme();
    const axis = (o: any = {}) => ({
      border: { display: false },
      grid: { color: t.grid, drawTicks: false },
      ticks: { color: t.muted, padding: 6, font: { size: 11 } },
      ...o,
    });
    return { x: axis({ grid: { display: false }, ...extra.x }), y: axis({ beginAtZero: true, ...extra.y }) };
  }
  private radial(): any {
    const t = this.chartTheme();
    return {
      r: {
        angleLines: { color: t.grid },
        grid: { color: t.grid },
        pointLabels: { color: t.text, font: { size: 11 } },
        ticks: { color: t.muted, backdropColor: 'transparent', showLabelBackdrop: false, font: { size: 10 } },
      },
    };
  }

  readonly lineData: ChartData<'line'> = {
    labels: MOIS,
    datasets: [
      {
        label: '2026',
        data: CA_MENSUEL_2026.slice(0, 10),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: '2025',
        data: CA_MENSUEL_2025,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  lineOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    ...this.baseOptions('top'),
    scales: this.cartesian({
      y: { ticks: { color: this.chartTheme().muted, callback: (v: any) => `${Number(v) / 1_000_000} M` } },
    }),
  }));
  readonly barData: ChartData<'bar'> = {
    labels: ['Installations', 'Désinstallations', 'Maintenances', 'Diagnostics', 'Remplacements'],
    datasets: [
      { data: [148, 37, 96, 64, 22], backgroundColor: PALETTE.slice(0, 5), borderRadius: 8, maxBarThickness: 42 },
    ],
  };
  barOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    ...this.baseOptions(false),
    scales: this.cartesian(),
  }));
  readonly groupedData: ChartData<'bar'> = {
    labels: MOIS.slice(4, 10),
    datasets: [
      { label: 'Facturé', data: [47.6, 46.2, 49.9, 52.4, 51.1, 55.8], backgroundColor: '#4f46e5', borderRadius: 6 },
      { label: 'Encaissé', data: [41.2, 43.9, 44.1, 48.7, 47.0, 50.3], backgroundColor: '#10b981', borderRadius: 6 },
    ],
  };
  groupedOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    ...this.baseOptions(),
    scales: this.cartesian(),
  }));

  /** Segments séparés par un liseré de 1px couleur de surface (au lieu d'un trait blanc de 2px). */
  doughnutData = computed<ChartData<'doughnut'>>(() => ({
    labels: ['Actifs', 'Suspendus', 'Inactifs', 'Résiliés'],
    datasets: [
      {
        data: [312, 41, 58, 23],
        backgroundColor: ['#10b981', '#f59e0b', '#94a3b8', '#ef4444'],
        borderColor: this.chartTheme().surface,
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  }));
  doughnutOptions = computed<ChartConfiguration<'doughnut'>['options']>(() => ({
    ...this.baseOptions(),
    cutout: '68%',
  }));
  pieData = computed<ChartData<'pie'>>(() => ({
    labels: ['Teltonika', 'Concox', 'Queclink', 'Ruptela'],
    datasets: [
      {
        data: [54, 21, 15, 10],
        backgroundColor: ['#4f46e5', '#06b6d4', '#8b5cf6', '#f59e0b'],
        borderColor: this.chartTheme().surface,
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  }));
  pieOptions = computed<ChartConfiguration<'pie'>['options']>(() => this.baseOptions());
  readonly radarData: ChartData<'radar'> = {
    labels: ['Délais', 'Qualité', 'Satisfaction', 'Volume', 'Réactivité', 'Documentation'],
    datasets: [
      {
        label: 'Équipe Abidjan Sud',
        data: [82, 91, 88, 74, 79, 65],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderWidth: 2,
        pointRadius: 2,
      },
      {
        label: 'Équipe Bouaké',
        data: [70, 84, 80, 62, 90, 72],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.15)',
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  };
  radarOptions = computed<ChartConfiguration<'radar'>['options']>(() => ({
    ...this.baseOptions(),
    scales: this.radial(),
  }));
  polarData = computed<ChartData<'polarArea'>>(() => ({
    labels: ['Abidjan', 'Bouaké', 'San-Pédro', 'Yamoussoukro', 'Korhogo'],
    datasets: [
      {
        data: [420, 96, 74, 61, 38],
        backgroundColor: [
          'rgba(79,70,229,.75)',
          'rgba(16,185,129,.75)',
          'rgba(6,182,212,.75)',
          'rgba(245,158,11,.75)',
          'rgba(239,68,68,.75)',
        ],
        borderColor: this.chartTheme().surface,
        borderWidth: 1,
      },
    ],
  }));
  polarOptions = computed<ChartConfiguration<'polarArea'>['options']>(() => ({
    ...this.baseOptions(),
    scales: this.radial(),
  }));

  // ── Autres types ng2-charts / Chart.js ──
  readonly hbarData: ChartData<'bar'> = {
    labels: ['Abidjan Sud', 'Abidjan Nord', 'Bouaké', 'San-Pédro', 'Yamoussoukro', 'Korhogo'],
    datasets: [
      {
        label: 'Interventions',
        data: [182, 154, 76, 58, 49, 31],
        backgroundColor: '#06b6d4',
        borderRadius: 6,
        maxBarThickness: 18,
      },
    ],
  };
  hbarOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    ...this.baseOptions(false),
    indexAxis: 'y',
    scales: {
      ...this.cartesian({ x: { grid: { color: this.chartTheme().grid } } }),
      y: { ...this.cartesian().y, grid: { display: false } },
    },
  }));
  readonly stackedData: ChartData<'bar'> = {
    labels: MOIS.slice(4, 10),
    datasets: [
      { label: 'Installations', data: [24, 28, 31, 26, 35, 38], backgroundColor: '#4f46e5' },
      { label: 'Maintenances', data: [14, 16, 12, 18, 17, 21], backgroundColor: '#06b6d4' },
      {
        label: 'Désinstallations',
        data: [6, 4, 7, 5, 8, 6],
        backgroundColor: '#f59e0b',
        borderRadius: { topLeft: 6, topRight: 6 } as any,
      },
    ],
  };
  stackedOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    ...this.baseOptions(),
    scales: this.cartesian({ x: { stacked: true }, y: { stacked: true } }),
  }));
  readonly mixedData: ChartData<'bar' | 'line'> = {
    labels: MOIS.slice(0, 10),
    datasets: [
      {
        type: 'bar',
        label: 'Nouveaux contrats',
        data: [18, 22, 19, 27, 31, 26, 29, 34, 30, 37],
        backgroundColor: 'rgba(79,70,229,0.75)',
        borderRadius: 6,
        maxBarThickness: 26,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Taux de renouvellement (%)',
        data: [86, 88, 85, 89, 91, 90, 92, 93, 91, 94],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.35,
        pointRadius: 2,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };
  mixedOptions = computed<ChartConfiguration<'bar' | 'line'>['options']>(() => {
    const c = this.cartesian();
    return {
      ...this.baseOptions(),
      scales: {
        x: c.x,
        y: c.y,
        y1: { ...c.y, position: 'right', beginAtZero: false, min: 80, max: 100, grid: { display: false } },
      },
    };
  });
  readonly areaData: ChartData<'line'> = {
    labels: MOIS.slice(0, 10),
    datasets: [
      {
        label: 'Essentiel',
        data: [120, 124, 130, 133, 138, 141, 145, 150, 152, 158],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.25)',
        fill: 'origin',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: 'Premium',
        data: [80, 84, 88, 92, 97, 101, 104, 110, 113, 118],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.25)',
        fill: '-1',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: 'Flotte+',
        data: [30, 32, 35, 36, 40, 42, 45, 47, 50, 54],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.25)',
        fill: '-1',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };
  areaOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    ...this.baseOptions(),
    interaction: { mode: 'index', intersect: false },
    scales: this.cartesian({ y: { stacked: true }, x: { stacked: true } }),
  }));
  readonly stepData: ChartData<'line'> = {
    labels: ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h'],
    datasets: [
      {
        label: 'Balises en ligne',
        data: [402, 398, 411, 428, 431, 429, 420, 409],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.1)',
        stepped: true,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  stepOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    ...this.baseOptions(false),
    scales: this.cartesian({ y: { beginAtZero: false } }),
  }));
  readonly scatterData: ChartData<'scatter'> = {
    datasets: [
      {
        label: 'Véhicules légers',
        data: Array.from({ length: 40 }, (_, i) => ({
          x: 20 + ((i * 37) % 90),
          y: 4 + ((i * 13) % 9) + (i % 3) * 0.4,
        })),
        backgroundColor: 'rgba(79,70,229,0.7)',
        pointRadius: 4,
      },
      {
        label: 'Poids lourds',
        data: Array.from({ length: 25 }, (_, i) => ({ x: 40 + ((i * 29) % 70), y: 18 + ((i * 7) % 14) })),
        backgroundColor: 'rgba(245,158,11,0.75)',
        pointRadius: 4,
      },
    ],
  };
  scatterOptions = computed<ChartConfiguration<'scatter'>['options']>(() => {
    const t = this.chartTheme();
    const c = this.cartesian({
      x: {
        grid: { color: t.grid },
        title: { display: true, text: 'Vitesse moyenne (km/h)', color: t.muted, font: { size: 11 } },
      },
      y: { title: { display: true, text: 'Conso. (L/100 km)', color: t.muted, font: { size: 11 } } },
    });
    return { ...this.baseOptions(), scales: c };
  });
  readonly bubbleData: ChartData<'bubble'> = {
    datasets: [
      { label: 'Abidjan', data: [{ x: 420, y: 94, r: 22 }], backgroundColor: 'rgba(79,70,229,0.6)' },
      { label: 'Bouaké', data: [{ x: 96, y: 88, r: 11 }], backgroundColor: 'rgba(16,185,129,0.6)' },
      { label: 'San-Pédro', data: [{ x: 74, y: 91, r: 9 }], backgroundColor: 'rgba(6,182,212,0.6)' },
      { label: 'Yamoussoukro', data: [{ x: 61, y: 82, r: 8 }], backgroundColor: 'rgba(245,158,11,0.6)' },
      { label: 'Korhogo', data: [{ x: 38, y: 76, r: 6 }], backgroundColor: 'rgba(239,68,68,0.6)' },
    ],
  };
  bubbleOptions = computed<ChartConfiguration<'bubble'>['options']>(() => {
    const t = this.chartTheme();
    return {
      ...this.baseOptions(),
      scales: this.cartesian({
        x: {
          grid: { color: t.grid },
          title: { display: true, text: 'Véhicules suivis', color: t.muted, font: { size: 11 } },
        },
        y: {
          beginAtZero: false,
          min: 70,
          max: 100,
          title: { display: true, text: 'Disponibilité (%)', color: t.muted, font: { size: 11 } },
        },
      }),
    };
  });
  gaugeData = computed<ChartData<'doughnut'>>(() => ({
    labels: ['Balises en ligne', 'Hors ligne'],
    datasets: [
      {
        data: [409, 25],
        backgroundColor: ['#10b981', this.theme.mode() === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'],
        borderWidth: 0,
      },
    ],
  }));
  gaugeOptions = computed<ChartConfiguration<'doughnut'>['options']>(() => ({
    ...this.baseOptions(false),
    rotation: -90,
    circumference: 180,
    cutout: '78%',
  }));
  readonly sparkData: ChartData<'line'> = {
    labels: MOIS.slice(0, 10),
    datasets: [
      {
        data: CA_MENSUEL_2026.slice(0, 10),
        borderColor: '#10b981',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(16,185,129,0.12)',
      },
    ],
  };
  readonly sparkOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };
}
