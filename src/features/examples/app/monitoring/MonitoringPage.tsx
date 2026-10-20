/* eslint-disable @typescript-eslint/no-explicit-any -- options Chart.js portées telles quelles depuis ui-kit Angular */
import { Button, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { useEffect, useRef, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { DataTable } from '../../../../components/data/DataTable';
import { Trend } from '../../../../components/data/Trend';
import type { DataColumn } from '../../../../components/data/dataTableTypes';
import { Banner } from '../../../../components/feedback/Banner';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { MapView } from '../../../../components/map/MapView';
import type { MapMarker } from '../../../../components/map/mapModels';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { alpha, seeded, type ThemePalette } from '../../exUtils';
import { useThemePalette } from '../../useThemePalette';
import '../../ex-page.scss';
import './monitoring.scss';

type Health = 'up' | 'degraded' | 'down' | 'maintenance';
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface Service {
  id: string;
  name: string;
  group: string;
  icon: string;
  status: Health;
  uptime: number;
  latency: number;
  days: Health[];
}
interface Host {
  id: string;
  name: string;
  role: string;
  region: string;
  cpu: number;
  ram: number;
  disk: number;
  net: number;
  status: string;
  uptime: string;
}
interface LogLine {
  id: number;
  at: Date;
  level: LogLevel;
  source: string;
  msg: string;
}
interface Incident {
  id: string;
  title: string;
  severity: 'critique' | 'majeur' | 'mineur';
  status: 'en cours' | 'surveillance' | 'résolu';
  started: string;
  service: string;
  owner: string;
}
interface Sensor {
  id: string;
  label: string;
  site: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warn: number;
  icon: string;
  /** Seuil bas (alerte quand la valeur passe SOUS `warn`). */
  low?: boolean;
}
interface Job {
  name: string;
  schedule: string;
  last: string;
  duration: string;
  status: 'ok' | 'running' | 'failed';
}
interface Sim {
  labels: string[];
  rpm: number[];
  p95: number[];
  p50: number[];
  errors: number[];
  cpu: number[];
  mem: number[];
  services: Service[];
  hosts: Host[];
  sensors: Sensor[];
  fleet: MapMarker[];
  logs: LogLine[];
  lastUpdate: Date;
}

const POINTS = 40;
const HEALTH: Record<Health, { label: string; tone: string }> = {
  up: { label: 'Opérationnel', tone: 'success' },
  degraded: { label: 'Dégradé', tone: 'warning' },
  down: { label: 'Panne', tone: 'error' },
  maintenance: { label: 'Maintenance', tone: 'info' },
};
const HOST_COLS: DataColumn<Host>[] = [
  { key: 'name', label: 'Hôte', width: 150, type: 'mono', required: true, sticky: 'start' },
  { key: 'role', label: 'Rôle', width: 118 },
  { key: 'region', label: 'Zone', width: 100 },
  { key: 'cpu', label: 'CPU', width: 118, type: 'progress' },
  { key: 'ram', label: 'Mémoire', width: 118, type: 'progress' },
  { key: 'disk', label: 'Disque', width: 118, type: 'progress' },
  { key: 'net', label: 'Réseau', width: 110, type: 'number', format: (r) => `${r.net} Mb/s`, align: 'right' },
  { key: 'status', label: 'État', width: 130, type: 'badge', tone: (r) => (r.status === 'OK' ? 'success' : 'warning') },
  { key: 'uptime', label: 'Uptime', width: 80, hidden: true, align: 'right' },
];
const STORES = [
  {
    name: 'PostgreSQL',
    icon: 'database',
    value: 312,
    unit: 'req/s',
    meta: '42 connexions · réplication 0,4 s',
    tone: 'success',
  },
  { name: 'Redis', icon: 'memory', value: 96.4, unit: '% hits', meta: '1,2 Go · 18 k clés/s', tone: 'success' },
  {
    name: 'RabbitMQ',
    icon: 'low_priority',
    value: 1284,
    unit: 'en file',
    meta: 'paiements.callbacks · 38 msg/s',
    tone: 'warning',
  },
  {
    name: 'Stockage objets',
    icon: 'cloud',
    value: 6.6,
    unit: 'To',
    meta: '44 % du quota · 1,8 M objets',
    tone: 'success',
  },
];
const JOBS: Job[] = [
  {
    name: 'Relances automatiques',
    schedule: 'Chaque jour · 09:00',
    last: 'aujourd’hui 09:00',
    duration: '42 s',
    status: 'ok',
  },
  {
    name: 'Synchronisation comptable',
    schedule: 'Toutes les heures',
    last: 'il y a 12 min',
    duration: '3 min 08',
    status: 'running',
  },
  { name: 'Export Sage', schedule: 'Chaque nuit · 02:00', last: 'aujourd’hui 02:00', duration: '—', status: 'failed' },
  {
    name: 'Sauvegarde complète',
    schedule: 'Chaque nuit · 03:30',
    last: 'aujourd’hui 03:30',
    duration: '18 min',
    status: 'ok',
  },
  { name: 'Purge des journaux', schedule: 'Dimanche · 04:00', last: 'il y a 5 j', duration: '1 min 12', status: 'ok' },
];
const INCIDENTS: Incident[] = [
  {
    id: 'INC-214',
    title: 'Latence élevée sur les callbacks Mobile Money',
    severity: 'majeur',
    status: 'en cours',
    started: 'il y a 38 min',
    service: 'Paiements',
    owner: 'Marc Yao',
  },
  {
    id: 'INC-213',
    title: 'Échec de l’export Sage nocturne',
    severity: 'mineur',
    status: 'surveillance',
    started: 'il y a 7 h',
    service: 'Tâches planifiées',
    owner: 'Fatou Diabaté',
  },
  {
    id: 'INC-211',
    title: 'Perte de signal de 2 balises sur l’axe nord',
    severity: 'mineur',
    status: 'résolu',
    started: 'hier',
    service: 'Passerelle GPS',
    owner: 'Aya Koné',
  },
  {
    id: 'INC-207',
    title: 'Indisponibilité partielle des SMS (opérateur)',
    severity: 'critique',
    status: 'résolu',
    started: 'il y a 3 j',
    service: 'Envoi SMS',
    owner: 'Ibrahim Sanogo',
  },
];
const LOG_POOL: [LogLevel, string, string][] = [
  ['info', 'api', 'GET /v1/clients 200 · 84 ms'],
  ['info', 'api', 'POST /v1/factures 201 · 132 ms'],
  ['info', 'gps-ingest', 'Lot de 248 positions reçu (CI-4521-AB…)'],
  ['warn', 'payments', 'Callback Orange Money lent : 612 ms'],
  ['info', 'auth', 'Connexion réussie · jean.kouassi'],
  ['debug', 'cache', 'Éviction LRU · 1 204 clés'],
  ['error', 'payments', 'Délai dépassé : callback MTN MoMo (txn 88412)'],
  ['info', 'scheduler', 'Synchronisation comptable · lot 14/20'],
  ['warn', 'sms', 'Opérateur : file d’attente 1,2 s'],
  ['info', 'web', 'Déploiement v2.4.1 : 3/3 pods prêts'],
  ['error', 'scheduler', 'Export Sage : connexion refusée (port 1433)'],
];
const LOG_LEVELS: (LogLevel | 'all')[] = ['all', 'info', 'warn', 'error', 'debug'];
const time = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const alarm = (s: Sensor) => (s.low ? s.value < s.warn : s.value > s.warn);
const gauge = (s: Sensor) => Math.max(0, Math.min(1, (s.value - s.min) / (s.max - s.min)));
/** Arc SVG (demi-cercle) pour une jauge 0–1. */
const arc = (p: number) => {
  const a = Math.PI * (1 - p),
    r = 40,
    cx = 50,
    cy = 50;
  return `M 10 50 A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
};
const SEV_TONE: Record<Incident['severity'], string> = { critique: 'error', majeur: 'warning', mineur: 'info' };
const JOB_TONE: Record<Job['status'], string> = { ok: 'success', running: 'info', failed: 'error' };
const last = (a: number[]) => a[a.length - 1] ?? 0;
const prev = (a: number[]) => a[a.length - 6] ?? a[0] ?? 0;
const pctChange = (a: number[]) => ((last(a) - prev(a)) / (prev(a) || 1)) * 100;
const fr1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** État initial de la simulation (générateur pseudo-aléatoire déterministe partagé avec les pas suivants). */
function initSim(rnd: () => number): Sim {
  const walk = (base: number, amp: number, n: number) => {
    const out: number[] = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      v = v + (rnd() - 0.5) * amp + (base - v) * 0.15;
      out.push(Math.round(v * 100) / 100);
    }
    return out;
  };
  const svc = (
    id: string,
    name: string,
    group: string,
    icon: string,
    status: Health,
    uptime: number,
    latency: number,
    bad: number[] = [],
  ): Service => {
    const days = Array.from({ length: 90 }, (_, i): Health => (bad.includes(i) ? (i % 3 ? 'degraded' : 'down') : 'up'));
    if (status !== 'up') days[89] = status;
    return { id, name, group, icon, status, uptime, latency, days };
  };
  const now = Date.now();
  const spots: [string, number, number][] = [
    ['CI-4521-AB', 5.36, -4.01],
    ['CI-9902-NP', 5.3, -4.02],
    ['CI-0418-GH', 5.34, -3.98],
    ['CI-6630-QR', 5.39, -4.06],
    ['CI-1287-KT', 5.29, -3.95],
    ['CI-7755-BD', 5.42, -3.99],
    ['CI-3310-MV', 5.33, -4.09],
    ['CI-5521-ZA', 5.37, -3.93],
    ['CI-8044-LP', 5.27, -4.04],
    ['CI-2190-FX', 5.4, -4.03],
  ];
  return {
    labels: Array.from({ length: POINTS }, (_, i) => time(new Date(now - (POINTS - 1 - i) * 2000))),
    rpm: walk(1850, 220, POINTS),
    p95: walk(180, 40, POINTS),
    p50: walk(72, 12, POINTS),
    errors: walk(0.6, 0.35, POINTS).map((v) => Math.max(0.05, v)),
    cpu: walk(46, 9, POINTS),
    mem: walk(63, 4, POINTS),
    services: [
      svc('api', 'API publique', 'Plateforme', 'api', 'up', 99.98, 84),
      svc('pay', 'Paiements Mobile Money', 'Plateforme', 'payments', 'degraded', 99.71, 412, [3, 17, 58]),
      svc('web', 'Application web', 'Plateforme', 'language', 'up', 99.99, 120),
      svc('mobile', 'API mobile', 'Plateforme', 'smartphone', 'up', 99.95, 96, [22]),
      svc('gps', 'Passerelle GPS (balises)', 'Terrain', 'satellite_alt', 'up', 99.9, 38, [40, 41]),
      svc('sms', 'Envoi SMS', 'Tiers', 'sms', 'up', 99.6, 640, [8, 63, 64]),
      svc('mail', 'E-mails transactionnels', 'Tiers', 'mail', 'maintenance', 99.92, 230),
      svc('backup', 'Sauvegardes', 'Infrastructure', 'backup', 'up', 100, 0),
    ],
    hosts: [
      {
        id: 'h1',
        name: 'api-prod-01',
        role: 'API',
        region: 'Abidjan-1',
        cpu: 48,
        ram: 62,
        disk: 41,
        net: 182,
        status: 'OK',
        uptime: '42 j',
      },
      {
        id: 'h2',
        name: 'api-prod-02',
        role: 'API',
        region: 'Abidjan-1',
        cpu: 55,
        ram: 66,
        disk: 41,
        net: 176,
        status: 'OK',
        uptime: '42 j',
      },
      {
        id: 'h3',
        name: 'pay-worker-01',
        role: 'Paiements',
        region: 'Abidjan-1',
        cpu: 87,
        ram: 78,
        disk: 52,
        net: 96,
        status: 'Charge élevée',
        uptime: '12 j',
      },
      {
        id: 'h4',
        name: 'gps-ingest-01',
        role: 'Ingestion GPS',
        region: 'Abidjan-2',
        cpu: 39,
        ram: 51,
        disk: 68,
        net: 420,
        status: 'OK',
        uptime: '88 j',
      },
      {
        id: 'h5',
        name: 'db-primary',
        role: 'PostgreSQL',
        region: 'Abidjan-1',
        cpu: 34,
        ram: 81,
        disk: 74,
        net: 210,
        status: 'OK',
        uptime: '120 j',
      },
      {
        id: 'h6',
        name: 'db-replica',
        role: 'PostgreSQL',
        region: 'Abidjan-2',
        cpu: 21,
        ram: 77,
        disk: 74,
        net: 160,
        status: 'OK',
        uptime: '120 j',
      },
      {
        id: 'h7',
        name: 'cache-01',
        role: 'Redis',
        region: 'Abidjan-1',
        cpu: 12,
        ram: 58,
        disk: 9,
        net: 300,
        status: 'OK',
        uptime: '64 j',
      },
      {
        id: 'h8',
        name: 'queue-01',
        role: 'RabbitMQ',
        region: 'Abidjan-1',
        cpu: 27,
        ram: 44,
        disk: 31,
        net: 140,
        status: 'OK',
        uptime: '64 j',
      },
    ],
    sensors: [
      {
        id: 's1',
        label: 'Chambre froide',
        site: 'Vridi',
        value: 3.8,
        unit: '°C',
        min: -2,
        max: 12,
        warn: 6,
        icon: 'ac_unit',
      },
      {
        id: 's2',
        label: 'Humidité',
        site: 'Vridi',
        value: 61,
        unit: '%',
        min: 0,
        max: 100,
        warn: 75,
        icon: 'water_drop',
      },
      {
        id: 's3',
        label: 'Température',
        site: 'Yopougon',
        value: 29.4,
        unit: '°C',
        min: 10,
        max: 45,
        warn: 35,
        icon: 'thermostat',
      },
      {
        id: 's4',
        label: 'Groupe électrogène',
        site: 'San-Pédro',
        value: 72,
        unit: '% carburant',
        min: 0,
        max: 100,
        warn: 20,
        icon: 'bolt',
        low: true,
      },
    ],
    fleet: spots.map(([plate, lat, lng], i) => ({
      id: plate,
      lat,
      lng,
      title: plate,
      icon: 'local_shipping',
      tone: i === 2 ? 'error' : i === 7 ? 'neutral' : i % 4 === 1 ? 'warning' : 'success',
      lines: [i === 2 ? 'Sortie de zone' : i === 7 ? 'Hors ligne depuis 2 h' : `${30 + i * 4} km/h`],
      pulse: i === 2,
    })),
    logs: [],
    lastUpdate: new Date(),
  };
}

let logSeq = 0;
function withLog(s: Sim, rnd: () => number, at: Date): Sim {
  const [level, source, msg] = LOG_POOL[Math.floor(rnd() * LOG_POOL.length)] ?? (['info', 'api', ''] as const);
  return { ...s, logs: [...s.logs.slice(-199), { id: ++logSeq, at, level, source, msg }] };
}

/** Un pas de simulation (toutes les 2 s). */
function step(s: Sim, r: () => number): Sim {
  const push = (a: number[], base: number, amp: number, min = 0, max = Infinity) => {
    const l = last(a);
    return [...a.slice(1), Math.min(max, Math.max(min, l + (r() - 0.5) * amp + (base - l) * 0.15))];
  };
  const next: Sim = {
    ...s,
    rpm: push(s.rpm, 1850, 260, 900),
    p95: push(s.p95, 190, 50, 90),
    p50: push(s.p50, 72, 10, 40),
    errors: push(s.errors, 0.6, 0.5, 0.05, 4),
    cpu: push(s.cpu, 48, 10, 5, 99),
    mem: push(s.mem, 63, 3, 20, 99),
    labels: [...s.labels.slice(1), time(new Date())],
    hosts: s.hosts.map((h) => ({
      ...h,
      cpu: Math.round(Math.min(99, Math.max(5, h.cpu + (r() - 0.5) * 8))),
      net: Math.max(20, Math.round(h.net + (r() - 0.5) * 30)),
    })),
    sensors: s.sensors.map((x) => ({
      ...x,
      value: Math.round((x.value + (r() - 0.5) * (x.max - x.min) * 0.02) * 10) / 10,
    })),
    fleet: s.fleet.map((m) =>
      m.tone === 'neutral' ? m : { ...m, lat: m.lat + (r() - 0.5) * 0.004, lng: m.lng + (r() - 0.5) * 0.004 },
    ),
    services: s.services.map((x) => ({
      ...x,
      latency: x.latency ? Math.max(20, Math.round(x.latency + (r() - 0.5) * x.latency * 0.1)) : 0,
    })),
    lastUpdate: new Date(),
  };
  return withLog(next, r, new Date());
}

function baseOpts(c: ThemePalette, unit = ''): any {
  const font = { family: 'Inter', size: 11 };
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: c.muted, usePointStyle: true, pointStyle: 'line', boxWidth: 14, font },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: c.muted, font, maxTicksLimit: 6, autoSkip: true },
      },
      y: {
        grid: { color: c.grid },
        border: { display: false },
        ticks: { color: c.muted, font, maxTicksLimit: 5, callback: (v: number | string) => v + unit },
      },
    },
  };
}

/**
 * /examples/app/monitoring — supervision « de tout » : santé globale, indicateurs en direct, services et
 * disponibilité 90 jours, trafic / latence / erreurs en temps réel, serveurs, bases et files, flotte GPS,
 * capteurs IoT des entrepôts, tâches planifiées, incidents et journaux en flux. Données simulées localement.
 */
export function MonitoringPage() {
  const snack = useSnackbar();
  const c = useThemePalette();
  const rnd = useRef(seeded(42));
  const logBox = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(true);
  const [range, setRange] = useState<'1h' | '24h' | '7j'>('1h');
  const [sim, setSim] = useState<Sim>(() => {
    let s = initSim(rnd.current);
    for (let i = 0; i < 18; i++) s = withLog(s, rnd.current, new Date(Date.now() - (18 - i) * 4000));
    return s;
  });
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS);
  const [logLevel, setLogLevel] = useState<LogLevel | 'all'>('all');
  const [logQuery, setLogQuery] = useState('');

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setSim((s) => step(s, rnd.current)), 2000);
    return () => clearInterval(timer);
  }, [live]);
  // Suit la fin du journal tant que l'utilisateur est en bas.
  useEffect(() => {
    const el = logBox.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
  }, [sim.logs]);

  const { services, hosts, sensors, fleet } = sim;
  const statuses = services.map((x) => x.status);
  const globalStatus: Health = statuses.includes('down') ? 'down' : statuses.includes('degraded') ? 'degraded' : 'up';
  const counts = (['up', 'degraded', 'down', 'maintenance'] as Health[]).map((h) => ({
    h,
    n: services.filter((s) => s.status === h).length,
  }));
  const fleetOnline = fleet.filter((m) => m.tone !== 'neutral').length;
  const alerts = [
    ...hosts
      .filter((h) => h.cpu > 80)
      .map((h) => ({ icon: 'memory', tone: 'warning', text: `CPU ${h.cpu} % sur ${h.name}`, at: 'en cours' })),
    ...sensors.filter(alarm).map((s) => ({
      icon: s.icon,
      tone: 'error',
      text: `${s.label} ${s.site} : ${s.value.toLocaleString('fr-FR')} ${s.unit}`,
      at: 'en cours',
    })),
    { icon: 'payments', tone: 'warning', text: 'p95 callbacks paiements > 400 ms', at: 'depuis 38 min' },
    { icon: 'schedule', tone: 'error', text: 'Tâche « Export Sage » en échec', at: 'depuis 7 h' },
  ];
  const kpis = [
    {
      label: 'Disponibilité (30 j)',
      value: '99,94',
      unit: '%',
      icon: 'verified',
      trend: 0.02,
      inverse: false,
      hint: 'SLO 99,9 %',
    },
    {
      label: 'Requêtes / min',
      value: Math.round(last(sim.rpm)).toLocaleString('fr-FR'),
      unit: '',
      icon: 'swap_vert',
      trend: pctChange(sim.rpm),
      inverse: false,
      hint: '5 dernières min',
    },
    {
      label: 'Latence p95',
      value: Math.round(last(sim.p95)).toLocaleString('fr-FR'),
      unit: 'ms',
      icon: 'speed',
      trend: pctChange(sim.p95),
      inverse: true,
      hint: 'objectif < 250 ms',
    },
    {
      label: 'Taux d’erreur',
      value: last(sim.errors).toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
      unit: '%',
      icon: 'error_outline',
      trend: pctChange(sim.errors),
      inverse: true,
      hint: '5xx / total',
    },
    {
      label: 'Alertes actives',
      value: String(alerts.length),
      unit: '',
      icon: 'notifications_active',
      trend: 0,
      inverse: true,
      hint: '1 critique',
    },
    {
      label: 'Balises en ligne',
      value: `${fleetOnline}`,
      unit: `/ ${fleet.length}`,
      icon: 'local_shipping',
      trend: 0,
      inverse: false,
      hint: 'flotte GPS',
    },
  ];
  const q = logQuery.trim().toLowerCase();
  const visibleLogs = sim.logs.filter(
    (l) => (logLevel === 'all' || l.level === logLevel) && (!q || (l.source + l.msg).toLowerCase().includes(q)),
  );

  // ─── Graphiques ──────────────────────────────────────────────
  const empty = { labels: [], datasets: [] };
  const trafficData: ChartData<'line'> = c
    ? {
        labels: sim.labels,
        datasets: [
          {
            label: 'Requêtes / min',
            data: sim.rpm,
            borderColor: c.primary,
            backgroundColor: alpha(c.primary, 0.1),
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      }
    : empty;
  const latencyData: ChartData<'line'> = c
    ? {
        labels: sim.labels,
        datasets: [
          { label: 'p95', data: sim.p95, borderColor: c.warning, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          { label: 'p50', data: sim.p50, borderColor: c.info, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          {
            label: 'Seuil',
            data: sim.labels.map(() => 250),
            borderColor: c.error,
            borderDash: [4, 4],
            pointRadius: 0,
            borderWidth: 1,
          },
        ],
      }
    : empty;
  const errorData: ChartData<'bar'> = c
    ? {
        labels: sim.labels,
        datasets: [
          {
            label: '% erreurs',
            data: sim.errors,
            backgroundColor: sim.errors.map((v) => (v > 1 ? c.error : alpha(c.error, 0.45))),
            borderRadius: 2,
            barPercentage: 0.8,
          },
        ],
      }
    : empty;
  const resourceData: ChartData<'line'> = c
    ? {
        labels: sim.labels,
        datasets: [
          {
            label: 'CPU',
            data: sim.cpu,
            borderColor: c.purple,
            backgroundColor: alpha(c.purple, 0.08),
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
          { label: 'Mémoire', data: sim.mem, borderColor: c.success, tension: 0.35, pointRadius: 0, borderWidth: 2 },
        ],
      }
    : empty;
  const trafficOpts = (c ? baseOpts(c) : {}) as ChartConfiguration<'line'>['options'];
  const latencyOpts = (c ? baseOpts(c, ' ms') : {}) as ChartConfiguration<'line'>['options'];
  const errorOpts = (
    c ? { ...baseOpts(c, ' %'), plugins: { legend: { display: false }, datalabels: { display: false } } } : {}
  ) as ChartConfiguration<'bar'>['options'];
  const resourceOpts = (() => {
    const o = c ? baseOpts(c, ' %') : {};
    if (o.scales) o.scales.y.max = 100;
    return o as ChartConfiguration<'line'>['options'];
  })();

  const ack = (i: Incident) => {
    setIncidents((l) => l.map((x) => (x.id === i.id ? { ...x, status: 'surveillance' } : x)));
    snack(`${i.id} pris en charge`, { action: 'OK', duration: 2000 });
  };

  return (
    <div className="ex-page ex-monitoring">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Pilotage</span>
          <h1>Supervision</h1>
          <p className="live-line">
            <span className={`live${live ? '' : ' paused'}`}>
              <i />
              {live ? 'En direct' : 'En pause'}
            </span>
            Mis à jour à {sim.lastUpdate.toLocaleTimeString('fr-FR')} · services, infrastructure, flotte et capteurs
          </p>
        </div>
        <div className="actions">
          <ToggleButtonGroup
            className="seg ex-seg"
            exclusive
            value={range}
            onChange={(_, v: typeof range | null) => v && setRange(v)}
            aria-label="Période"
          >
            <ToggleButton value="1h">1 h</ToggleButton>
            <ToggleButton value="24h">24 h</ToggleButton>
            <ToggleButton value="7j">7 j</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setLive((v) => !v)}
            startIcon={<MaterialIcon name={live ? 'pause' : 'play_arrow'} />}
          >
            {live ? 'Pause' : 'Reprendre'}
          </Button>
          <Button variant="contained" disableElevation startIcon={<MaterialIcon name="add_alert" />}>
            Nouvelle alerte
          </Button>
        </div>
      </div>

      <div className="alert">
        <Banner
          tone="warning"
          title="Incident en cours · INC-214"
          actionLabel="Voir l’incident"
          dismissible={false}
          compact
        >
          Latence élevée sur les callbacks Mobile Money depuis 38 min. Les paiements aboutissent avec un délai.
        </Banner>
      </div>

      {/* Santé globale */}
      <section className={'card overall tone-bg-' + HEALTH[globalStatus].tone}>
        <span className="o-ic">
          <MaterialIcon
            name={globalStatus === 'up' ? 'check_circle' : globalStatus === 'degraded' ? 'error' : 'cancel'}
          />
        </span>
        <div className="o-txt">
          <strong>{globalStatus === 'up' ? 'Tous les systèmes sont opérationnels' : 'Perturbation partielle'}</strong>
          <span>{services.length} services surveillés · dernier incident résolu il y a 18 h</span>
        </div>
        <div className="o-counts">
          {counts.map((x) => (
            <span key={x.h}>
              <i className={'dot bg-' + HEALTH[x.h].tone} />
              {HEALTH[x.h].label} <b>{x.n}</b>
            </span>
          ))}
        </div>
      </section>

      <div className="kpis six">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <span className="k-label">
              <MaterialIcon name={k.icon} />
              {k.label}
            </span>
            <span className="k-val">
              {k.value}
              {k.unit && <small>{k.unit}</small>}
            </span>
            <span className="k-foot">
              {k.trend !== 0 && <Trend value={k.trend} inverse={k.inverse} />}
              {k.hint}
            </span>
          </div>
        ))}
      </div>

      {/* Temps réel */}
      <div className="grid two">
        <section className="card">
          <div className="card-head">
            <h2>Trafic</h2>
            <span className="sub">requêtes par minute</span>
          </div>
          <div className="card-body">
            <div className="chart">
              <Chart type="line" data={trafficData} options={trafficOpts} />
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Latence</h2>
            <span className="sub">p50 / p95 · seuil 250 ms</span>
          </div>
          <div className="card-body">
            <div className="chart">
              <Chart type="line" data={latencyData} options={latencyOpts} />
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Erreurs</h2>
            <span className="sub">% de réponses 5xx</span>
          </div>
          <div className="card-body">
            <div className="chart sm">
              <Chart type="bar" data={errorData} options={errorOpts} />
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Ressources du cluster</h2>
            <span className="sub">moyenne des nœuds</span>
          </div>
          <div className="card-body">
            <div className="chart sm">
              <Chart type="line" data={resourceData} options={resourceOpts} />
            </div>
          </div>
        </section>
      </div>

      {/* Services */}
      <section className="card services">
        <div className="card-head">
          <h2>Services</h2>
          <span className="sub">disponibilité sur 90 jours</span>
        </div>
        <div className="svc-list">
          {services.map((s) => (
            <div key={s.id} className="svc">
              <span className="ic-tile">
                <MaterialIcon name={s.icon} />
              </span>
              <div className="svc-name">
                <strong>{s.name}</strong>
                <small>
                  {s.group}
                  {s.latency > 0 && ` · ${s.latency} ms`}
                </small>
              </div>
              <div className="uptime" aria-label={`Disponibilité ${s.uptime} %`}>
                {s.days.map((d, i) => (
                  <Tooltip key={i} title={`J-${89 - i} · ${HEALTH[d].label}`}>
                    <i className={'bg-' + HEALTH[d].tone} />
                  </Tooltip>
                ))}
              </div>
              <span className="pct tabular">
                {s.uptime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
              </span>
              <span className={'state tone-' + HEALTH[s.status].tone}>{HEALTH[s.status].label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure */}
      <div className="grid infra">
        <div className="hosts">
          <DataTable
            title="Serveurs"
            rows={hosts}
            columns={HOST_COLS}
            pageSize={8}
            maxHeight="none"
            searchable={false}
          />
        </div>
        <section className="card">
          <div className="card-head">
            <h2>Données & files</h2>
          </div>
          <div className="rows list">
            {STORES.map((d) => (
              <div key={d.name} className="row">
                <span className={'ic-tile tone-' + d.tone}>
                  <MaterialIcon name={d.icon} />
                </span>
                <span className="grow">
                  <strong>{d.name}</strong>
                  <small>{d.meta}</small>
                </span>
                <span className="num">
                  {fr1(d.value)} <small className="muted">{d.unit}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Flotte + alertes */}
      <div className="grid fleet">
        <section className="card map-card">
          <div className="card-head">
            <h2>Flotte GPS</h2>
            <span className="sub">
              {fleetOnline} balises en ligne sur {fleet.length}
            </span>
          </div>
          <MapView center={[5.35, -4.01]} zoom={11} height="340px" markers={fleet} fitBounds={false} />
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Alertes actives</h2>
            <span className="count">{alerts.length}</span>
          </div>
          <div className="rows list">
            {alerts.map((a) => (
              <div key={a.text} className="row">
                <span className={'ic-tile tone-' + a.tone}>
                  <MaterialIcon name={a.icon} />
                </span>
                <span className="grow">
                  <strong className="wrap">{a.text}</strong>
                  <small>{a.at}</small>
                </span>
                <Tooltip title="Acquitter">
                  <IconButton aria-label="Acquitter">
                    <MaterialIcon name="done" />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Capteurs + tâches */}
      <div className="grid two">
        <section className="card">
          <div className="card-head">
            <h2>Capteurs des entrepôts</h2>
            <span className="sub">IoT · rafraîchi toutes les 2 s</span>
          </div>
          <div className="card-body gauges">
            {sensors.map((s) => (
              <div key={s.id} className={`gauge${alarm(s) ? ' warn' : ''}`}>
                <svg viewBox="0 0 100 58" aria-hidden="true">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" className="g-track" />
                  <path d={arc(gauge(s))} className="g-val" />
                </svg>
                <span className="g-val-txt">
                  {fr1(s.value)}
                  <small>{s.unit.split(' ')[0]}</small>
                </span>
                <span className="g-lbl">
                  <MaterialIcon name={s.icon} />
                  {s.label}
                </span>
                <small className="g-site">{s.site}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Tâches planifiées</h2>
          </div>
          <div className="rows list">
            {JOBS.map((j) => (
              <div key={j.name} className="row">
                <span className={`dot-lg bg-${JOB_TONE[j.status]}${j.status === 'running' ? ' pulse' : ''}`} />
                <span className="grow">
                  <strong>{j.name}</strong>
                  <small>
                    {j.schedule} · dernier : {j.last}
                  </small>
                </span>
                <span className="num muted">{j.duration}</span>
                <span className={'state tone-' + JOB_TONE[j.status]}>
                  {j.status === 'ok' ? 'Réussie' : j.status === 'running' ? 'En cours' : 'Échec'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Incidents + journaux */}
      <div className="grid logs-grid">
        <section className="card">
          <div className="card-head">
            <h2>Incidents</h2>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Historique
            </a>
          </div>
          <div className="incidents">
            {incidents.map((i) => (
              <div key={i.id} className={`inc${i.status === 'résolu' ? ' done' : ''}`}>
                <span className={'sev tone-' + SEV_TONE[i.severity]}>{i.severity}</span>
                <div className="inc-body">
                  <strong>{i.title}</strong>
                  <small>
                    <span className="mono">{i.id}</span> · {i.service} · {i.started} · {i.owner}
                  </small>
                </div>
                {i.status === 'en cours' ? (
                  <Button variant="outlined" color="inherit" onClick={() => ack(i)}>
                    Prendre en charge
                  </Button>
                ) : (
                  <span className={'state tone-' + (i.status === 'résolu' ? 'success' : 'info')}>{i.status}</span>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="card console-card">
          <div className="card-head">
            <h2>Journaux</h2>
            <div className="lvls">
              {LOG_LEVELS.map((l) => (
                <button key={l} type="button" className={logLevel === l ? 'on' : ''} onClick={() => setLogLevel(l)}>
                  {l === 'all' ? 'Tous' : l}
                </button>
              ))}
            </div>
          </div>
          <label className="searchbox log-search">
            <MaterialIcon name="search" />
            <input
              type="search"
              placeholder="Filtrer les journaux"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
            />
          </label>
          <div className="console" ref={logBox} role="log" aria-live="polite">
            {visibleLogs.map((l) => (
              <div key={l.id} className="ln">
                <time>{l.at.toLocaleTimeString('fr-FR')}</time>
                <span className={'lv lv-' + l.level}>{l.level}</span>
                <span className="src">{l.source}</span>
                <span className="msg">{l.msg}</span>
              </div>
            ))}
            {visibleLogs.length === 0 && <div className="ln empty">Aucune ligne ne correspond.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
