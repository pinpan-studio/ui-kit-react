// Porté depuis ui-kit Angular (harnais/components/widgets/chart-widget) : ng2-charts → react-chartjs-2.
import { Chart as ChartJS, registerables, type ChartData, type ChartOptions, type ChartType } from 'chart.js';
import { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import type { HarnaisWidget } from '../../../data/static/harnais.data';
import { useThemeMode } from '../../../hooks/useThemeMode';

ChartJS.register(...registerables);

type ChartBlock = Extract<HarnaisWidget, { type: 'chart' }>;

/** Palette lisible en clair comme en sombre (teal du kit, puis teintes sémantiques). */
const PALETTE = ['#0f9a9a', '#d97706', '#6366f1', '#a855f7', '#22c55e', '#ef4444', '#06b6d4', '#64748b'];
const alpha = (hex: string, a: number) =>
  hex +
  Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

const chartType = (c: ChartBlock['chart']): ChartType =>
  c === 'area' ? 'line' : c === 'hbar' || c === 'stacked' ? 'bar' : c === 'polar' ? 'polarArea' : (c as ChartType);

/** Graphique Chart.js piloté par un bloc déclaratif (type, libellés, séries). Options dérivées du thème. */
export function HzChart({ block: b }: { block: ChartBlock }) {
  const { mode } = useThemeMode();
  const radial = ['doughnut', 'pie', 'polar', 'radar'].includes(b.chart);

  const { data, options } = useMemo(() => {
    const dark = mode === 'dark';
    const t = {
      text: dark ? '#cbd5e1' : '#4b5563',
      muted: dark ? '#94a3b8' : '#9ca3af',
      grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      surface: dark ? '#1f2937' : '#ffffff',
    };
    const perPoint = ['doughnut', 'pie', 'polar'].includes(b.chart);
    const data = {
      labels: b.labels,
      datasets: b.series.map((s, i) => {
        const color = s.color ?? PALETTE[i % PALETTE.length] ?? '#0f9a9a';
        if (perPoint) {
          const colors = b.labels.map((_, j) => PALETTE[j % PALETTE.length] ?? '#0f9a9a');
          return {
            label: s.label,
            data: s.data,
            backgroundColor: b.chart === 'polar' ? colors.map((c) => alpha(c, 0.7)) : colors,
            borderColor: t.surface,
            borderWidth: 2,
            hoverOffset: 4,
          };
        }
        if (b.chart === 'line' || b.chart === 'area' || b.chart === 'radar') {
          return {
            label: s.label,
            data: s.data,
            borderColor: color,
            pointBackgroundColor: color,
            backgroundColor: b.chart === 'line' ? 'transparent' : alpha(color, i === 0 ? 0.16 : 0.06),
            fill: b.chart !== 'line',
            tension: 0.35,
            borderWidth: 2,
            pointRadius: b.chart === 'radar' ? 2 : 0,
            pointHoverRadius: 4,
            borderDash: i > 0 && b.chart === 'area' ? [5, 4] : undefined,
          };
        }
        return {
          label: s.label,
          data: s.data,
          backgroundColor: alpha(color, 0.85),
          hoverBackgroundColor: color,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 28,
        };
      }),
    } as ChartData;

    const unit = b.unit ?? '';
    const fmt = (v: number) => v.toLocaleString('fr-FR') + unit;
    const axis = (extra: object = {}) => ({
      border: { display: false },
      grid: { color: t.grid, drawTicks: false },
      ticks: { color: t.muted, padding: 6, font: { size: 10.5 } },
      ...extra,
    });
    const multi = b.series.length > 1 || radial;
    const base: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      color: t.text,
      interaction: { mode: radial ? 'nearest' : 'index', intersect: false },
      plugins: {
        legend: multi
          ? {
              position: radial && b.chart !== 'radar' ? 'right' : 'top',
              align: 'end',
              labels: {
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                color: t.text,
                font: { size: 11 },
                padding: 14,
              },
            }
          : { display: false },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#f9fafb',
          bodyColor: '#e5e7eb',
          cornerRadius: 8,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: { label: (ctx) => ` ${ctx.dataset.label ?? ctx.label}: ${fmt(Number(ctx.raw))}` },
        },
      },
    };
    let options: ChartOptions;
    if (b.chart === 'doughnut') options = { ...base, cutout: '68%' } as ChartOptions;
    else if (b.chart === 'pie') options = base;
    else if (b.chart === 'radar' || b.chart === 'polar') {
      options = {
        ...base,
        scales: {
          r: {
            angleLines: { color: t.grid },
            grid: { color: t.grid },
            pointLabels: { color: t.text, font: { size: 11 } },
            ticks: { display: false },
          },
        },
      } as ChartOptions;
    } else {
      const horizontal = b.chart === 'hbar';
      const stacked = b.chart === 'stacked';
      const value = axis({
        beginAtZero: true,
        stacked,
        ticks: {
          color: t.muted,
          padding: 6,
          font: { size: 10.5 },
          callback: (v: string | number) => Number(v).toLocaleString('fr-FR'),
        },
      });
      const category = axis({ grid: { display: false }, stacked });
      options = {
        ...base,
        indexAxis: horizontal ? 'y' : 'x',
        scales: horizontal ? { x: value, y: category } : { x: category, y: value },
      } as ChartOptions;
    }
    return { data, options };
  }, [b, mode, radial]);

  return (
    <div className="hz-chart" style={{ display: 'block' }}>
      <div className="box" style={{ position: 'relative', width: '100%', height: b.height ?? (radial ? 240 : 260) }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- configurations Chart.js hétérogènes (portées d'Angular) */}
        <Chart type={chartType(b.chart)} data={data as any} options={options as any} />
      </div>
    </div>
  );
}
