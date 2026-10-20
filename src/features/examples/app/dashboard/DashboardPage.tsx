/* eslint-disable @typescript-eslint/no-explicit-any -- options Chart.js portées telles quelles depuis ui-kit Angular */
import { Button, LinearProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { DataTable } from '../../../../components/data/DataTable';
import { StatCounter } from '../../../../components/data/StatCounter';
import { Trend } from '../../../../components/data/Trend';
import type { DataColumn } from '../../../../components/data/dataTableTypes';
import { Banner } from '../../../../components/feedback/Banner';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { CLIENT_STATUS, EX_ACTIVITY, EX_CLIENTS, type ExClient } from '../../../../data/static/examples.data';
import { alpha } from '../../exUtils';
import { useThemePalette } from '../../useThemePalette';
import { DashboardAnalytics, type AnalyticsTab } from './DashboardAnalytics';
import '../../ex-page.scss';
import './dashboard.scss';

type Period = '7j' | '30j' | '12m';

const ACTIVITY = EX_ACTIVITY.slice(0, 5);
const pct = (n: number) => Math.round((n / EX_CLIENTS.length) * 100);
const TOP = [...EX_CLIENTS].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
const LATE = EX_CLIENTS.filter((c) => c.status !== 'actif');
const PERIODS: { id: Period; label: string; compare: string }[] = [
  { id: '7j', label: '7 jours', compare: 'vs semaine précédente' },
  { id: '30j', label: '30 jours', compare: 'vs mois précédent' },
  { id: '12m', label: '12 mois', compare: 'vs année précédente' },
];
const TABS: { id: 'overview' | AnalyticsTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: 'space_dashboard' },
  { id: 'sales', label: 'Ventes', icon: 'bar_chart' },
  { id: 'customers', label: 'Clients', icon: 'pie_chart' },
  { id: 'operations', label: 'Opérations', icon: 'insights' },
];
const TAB_PARAM: Record<string, AnalyticsTab> = { ventes: 'sales', clients: 'customers', operations: 'operations' };
const GOALS = [
  { label: 'Chiffre d’affaires', value: 72, detail: '128,4 M sur 178 M FCFA' },
  { label: 'Taux d’encaissement', value: 88, detail: 'Cible 90 %' },
  { label: 'Nouveaux comptes', value: 45, detail: '38 sur 85' },
];
const LATE_COLS: DataColumn<ExClient>[] = [
  { key: 'name', label: 'Client', width: 220, required: true },
  { key: 'owner', label: 'Responsable', width: 160 },
  { key: 'city', label: 'Ville', width: 130 },
  {
    key: 'status',
    label: 'Statut',
    width: 120,
    type: 'badge',
    format: (r) => CLIENT_STATUS[r.status].label,
    tone: (r) => CLIENT_STATUS[r.status].color,
  },
  { key: 'invoices', label: 'Factures', width: 100, type: 'number' },
  {
    key: 'revenue',
    label: 'Encours',
    width: 150,
    type: 'currency',
    format: (r) => (r.revenue / 10).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F',
    align: 'right',
  },
];
const DATA: Record<Period, { kpi: number[]; trend: number[]; labels: string[]; a: number[]; b: number[] }> = {
  '7j': {
    kpi: [27.9e6, 22.1e6, 9, 7.3e6],
    trend: [6.2, 4.8, 12.5, -3.1],
    labels: ['Sam', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
    a: [2.1, 0.8, 4.6, 5.2, 3.9, 6.1, 5.4],
    b: [1.8, 0.6, 3.1, 4.4, 3.2, 4.9, 4.1],
  },
  '30j': {
    kpi: [119e6, 96.1e6, 38, 7.3e6],
    trend: [9.4, 8.1, 4.6, -2.3],
    labels: ['S1', 'S2', 'S3', 'S4'],
    a: [24, 31, 28, 36],
    b: [19, 26, 24, 27],
  },
  '12m': {
    kpi: [1.14e9, 0.99e9, 412, 7.3e6],
    trend: [12.4, 10.2, 18.0, -8.5],
    labels: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'],
    a: [82, 95, 71, 78, 90, 99, 104, 97, 88, 93, 115, 128],
    b: [70, 81, 66, 70, 79, 84, 92, 85, 80, 82, 98, 96],
  },
};
const SPARK_OPTIONS: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  events: [],
  plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } } as any,
  scales: { x: { display: false }, y: { display: false } },
  layout: { padding: 2 },
};
const DONUT_OPTIONS: ChartConfiguration<'doughnut'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '76%',
  plugins: { legend: { display: false }, datalabels: { display: false } } as any,
};
const FALLBACK = {
  primary: '#006a6a',
  muted: '#9ca3af',
  grid: '#e5e7eb',
  card: '#fff',
  success: '#22c55e',
  info: '#3b82f6',
  warning: '#eab308',
  error: '#ef4444',
};

/** /examples/app/dashboard — sidebar complète, alerte, indicateurs animés, graphiques, classements, table de suivi. */
export function DashboardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [period, setPeriod] = useState<Period>('12m');
  /** Lien direct vers un onglet : ?tab=ventes | clients | operations. */
  const [tab, setTab] = useState<'overview' | AnalyticsTab>(() => TAB_PARAM[params.get('tab') ?? ''] ?? 'overview');
  const pal = useThemePalette();
  // Couleurs lues sur les jetons CSS du thème courant (recalculées à chaque changement de thème).
  const c = pal ? { ...pal, neutral: pal.grid } : { ...FALLBACK, neutral: '#9ca3af' };
  const d = DATA[period];
  const compareLabel = PERIODS.find((p) => p.id === period)?.compare ?? '';

  const kpis = [
    {
      label: 'Chiffre d’affaires',
      icon: 'payments',
      value: d.kpi[0] ?? 0,
      format: 'compact' as const,
      decimals: 1,
      unit: 'FCFA',
      trend: d.trend[0] ?? 0,
      series: d.a,
    },
    {
      label: 'Encaissé',
      icon: 'account_balance_wallet',
      value: d.kpi[1] ?? 0,
      format: 'compact' as const,
      decimals: 1,
      unit: 'FCFA',
      trend: d.trend[1] ?? 0,
      series: d.b,
    },
    {
      label: 'Nouveaux clients',
      icon: 'person_add',
      value: d.kpi[2] ?? 0,
      format: 'number' as const,
      decimals: 0,
      unit: '',
      trend: d.trend[2] ?? 0,
      series: d.a.map((v, i) => Math.round(v / 3 + (i % 3) * 2)),
    },
    {
      label: 'Impayés',
      icon: 'schedule',
      value: d.kpi[3] ?? 0,
      format: 'compact' as const,
      decimals: 1,
      unit: 'FCFA',
      trend: d.trend[3] ?? 0,
      inverse: true,
      series: d.a.map((_, i) => Math.round(18 - i * 0.6 + (i % 2) * 2)),
    },
  ];

  const lineData: ChartData<'line'> = {
    labels: d.labels,
    datasets: [
      {
        label: 'Facturé',
        data: d.a,
        borderColor: c.primary,
        backgroundColor: alpha(c.primary, 0.08),
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Encaissé',
        data: d.b,
        borderColor: c.muted,
        borderDash: [4, 4],
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      },
    ],
  };
  const font = { family: getComputedStyle(document.body).getPropertyValue('--font-body').trim() || 'Inter', size: 12 };
  const lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: c.muted, usePointStyle: true, pointStyle: 'line', boxWidth: 16, font },
      },
      datalabels: { display: false },
    } as any,
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: c.muted, font } },
      y: { grid: { color: c.grid }, border: { display: false }, ticks: { color: c.muted, font, maxTicksLimit: 5 } },
    },
  };

  const palette: Record<string, string> = {
    actif: c.success,
    prospect: c.info,
    suspendu: c.warning,
    inactif: c.neutral,
  };
  const statusCounts = (Object.keys(CLIENT_STATUS) as (keyof typeof CLIENT_STATUS)[]).map((k) => ({
    key: k,
    label: CLIENT_STATUS[k].label,
    color: palette[k] ?? c.neutral,
    n: EX_CLIENTS.filter((x) => x.status === k).length,
  }));
  const donutData: ChartData<'doughnut'> = {
    labels: statusCounts.map((s) => s.label),
    datasets: [
      {
        data: statusCounts.map((s) => s.n),
        backgroundColor: statusCounts.map((s) => s.color),
        borderColor: c.card,
        borderWidth: 2,
      },
    ],
  };

  /** Mini-courbe d'un indicateur (couleur selon que la tendance est favorable). */
  const spark = (series: number[], inverse = false): ChartData<'line'> => {
    const up = (series[series.length - 1] ?? 0) >= (series[0] ?? 0);
    const color = up !== inverse ? c.success : c.error;
    return {
      labels: series.map((_, i) => i),
      datasets: [
        {
          data: series,
          borderColor: color,
          backgroundColor: alpha(color, 0.12),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
        },
      ],
    };
  };

  return (
    <div className="ex-page ex-dashboard">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Vendredi 17 octobre 2026</span>
          <h1>Tableau de bord</h1>
          <p>Activité commerciale et encaissements de SC Storage.</p>
        </div>
        <div className="actions">
          <ToggleButtonGroup
            className="period ex-seg"
            exclusive
            value={period}
            onChange={(_, v: Period | null) => v && setPeriod(v)}
            aria-label="Période"
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p.id} value={p.id}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="download" />}>
            Exporter
          </Button>
          <Button variant="contained" disableElevation startIcon={<MaterialIcon name="add" />}>
            Nouvelle facture
          </Button>
        </div>
      </div>

      <nav className="dash-tabs" aria-label="Sections du tableau de bord">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <MaterialIcon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <>
          <div className="alert">
            <Banner tone="warning" title="3 factures en retard" actionLabel="Voir les relances" compact>
              7,3 M FCFA d’encours dépassent l’échéance de plus de 30 jours.
            </Banner>
          </div>

          <div className="kpis">
            {kpis.map((k) => (
              <div key={k.label} className="card kpi">
                <span className="k-label">
                  <MaterialIcon name={k.icon} />
                  {k.label}
                </span>
                <span className="k-val">
                  <StatCounter value={k.value} format={k.format} decimals={k.decimals} />
                  {k.unit && <small>{k.unit}</small>}
                </span>
                <span className="k-foot">
                  <Trend value={k.trend} inverse={!!k.inverse} />
                  {compareLabel}
                </span>
                <div className="spark">
                  <Chart type="line" data={spark(k.series, k.inverse)} options={SPARK_OPTIONS} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid">
            <section className="card chart-card">
              <div className="card-head">
                <h2>Chiffre d’affaires</h2>
                <span className="sub">en millions de FCFA</span>
              </div>
              <div className="card-body">
                <div className="chart">
                  <Chart type="line" data={lineData} options={lineOptions} />
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Portefeuille clients</h2>
              </div>
              <div className="card-body">
                <div className="donut">
                  <Chart type="doughnut" data={donutData} options={DONUT_OPTIONS} />
                  <div className="center">
                    <strong>{EX_CLIENTS.length}</strong>
                    <span>comptes</span>
                  </div>
                </div>
                <ul className="legend">
                  {statusCounts.map((s) => (
                    <li key={s.key}>
                      <i style={{ background: s.color }} />
                      <span>{s.label}</span>
                      <b>{s.n}</b>
                      <em>{pct(s.n)} %</em>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Meilleurs clients</h2>
                <Link to="/examples/app/clients">Tout voir</Link>
              </div>
              <div className="rows list">
                {TOP.map((cl, i) => (
                  <Link key={cl.id} className="row" to={`/examples/app/clients/${cl.id}`}>
                    <span className="rank">{i + 1}</span>
                    <span className="grow">
                      <strong>{cl.name}</strong>
                      <small>
                        {cl.city} · {cl.sector}
                      </small>
                    </span>
                    <span className="num">
                      {(cl.revenue / 1e6).toLocaleString('fr-FR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      M
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Activité récente</h2>
                <span className="live">
                  <i />
                  En direct
                </span>
              </div>
              <ol className="feed">
                {ACTIVITY.map((a) => (
                  <li key={a.text}>
                    <span className={'dot tone-' + a.tone} />
                    <div>
                      <p>{a.text}</p>
                      <small>
                        {a.who} · {a.at}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Objectifs du trimestre</h2>
                <span className="sub">T4 2026</span>
              </div>
              <div className="card-body goals">
                {GOALS.map((g) => (
                  <div key={g.label} className="goal">
                    <div className="g-top">
                      <span>{g.label}</span>
                      <strong className="tabular">{g.value} %</strong>
                    </div>
                    <LinearProgress variant="determinate" value={g.value} />
                    <small>{g.detail}</small>
                  </div>
                ))}
              </div>
            </section>

            <div className="wide">
              <DataTable
                title="Comptes à surveiller"
                rows={LATE}
                columns={LATE_COLS}
                pageSize={5}
                maxHeight="none"
                searchable={false}
                clickable
                onRowClick={(r) => void navigate(`/examples/app/clients/${r.id}`)}
              />
            </div>
          </div>
        </>
      ) : (
        <DashboardAnalytics tab={tab} />
      )}
    </div>
  );
}
