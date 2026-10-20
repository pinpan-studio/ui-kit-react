/* eslint-disable @typescript-eslint/no-non-null-assertion -- calculs portés tels quels depuis gantt-timeline.component.ts (éléments filtrés sur `start`) */
import { Tooltip } from '@mui/material';
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  MONTHS,
  addDays,
  applyPlanningFilters,
  fmtNarrowDay,
  initials,
  isLate,
  itemColor,
  startOfDay,
  startOfWeek,
  toDate,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningGroup,
  type PlanningItem,
} from './planningModels';
import type { GanttZoom } from './planningTypes';
import './gantt-timeline.scss';

const DAY_WIDTH: Record<GanttZoom, number> = { day: 44, week: 20, month: 7 };
const TRACK_H = 34;
const DAY_MS = 86_400_000;
const LABEL_W = 220;
const ZOOMS: { key: GanttZoom; label: string }[] = [
  { key: 'day', label: 'Jour' },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
];
const tone = (v: string) => ({ '--tone': v }) as CSSProperties;

interface Bar {
  item: PlanningItem;
  left: number;
  width: number;
  track: number;
  late: boolean;
  overdueLeft: number;
  overdueWidth: number;
  dueLeft: number | null;
}
interface Row {
  key: string;
  label: string;
  subtitle?: string;
  color?: string;
  icon?: string;
  bars: Bar[];
  tracks: number;
  late: number;
  done: number;
}

/** app-gantt-timeline : barres de `start` à `end`, lignes = `groups` / `item.group` / un élément, échéance, hachures de retard, zoom. */
export function GanttTimeline({
  items = [],
  groups = null,
  rowLabel = 'Ressource',
  zoom: zoomInit = 'day',
  showZoom = true,
  showToday = true,
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
}: {
  items?: PlanningItem[];
  groups?: PlanningGroup[] | null;
  rowLabel?: string;
  zoom?: GanttZoom;
  showZoom?: boolean;
  showToday?: boolean;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
}) {
  const [zoom, setZoom] = useState<GanttZoom>(zoomInit);
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);
  const scroller = useRef<HTMLDivElement>(null);
  const dw = DAY_WIDTH[zoom];
  const visible = applyPlanningFilters(items, filters, filterState).filter((i) => toDate(i.start));
  const lateCount = items.filter((i) => isLate(i)).length;

  const range = useMemo(() => {
    const today = startOfDay(new Date());
    let min = today,
      max = addDays(today, 14);
    for (const i of items) {
      const s = toDate(i.start);
      const e = toDate(i.end) ?? toDate(i.due) ?? s;
      if (s && s < min) min = s;
      if (e && e > max) max = e;
    }
    const start = startOfWeek(addDays(min, -3));
    const end = addDays(startOfDay(max), 8);
    return { start, days: Math.round((end.getTime() - start.getTime()) / DAY_MS) };
  }, [items]);
  const todayMs = startOfDay(new Date()).getTime();
  const days = Array.from({ length: range.days }, (_, i) => {
    const d = addDays(range.start, i);
    return {
      date: d,
      weekend: d.getDay() === 0 || d.getDay() === 6,
      today: d.getTime() === todayMs,
      monday: d.getDay() === 1,
    };
  });
  const months: { label: string; left: number; width: number }[] = [];
  days.forEach((d, i) => {
    const label = `${MONTHS[d.date.getMonth()] ?? ''} ${d.date.getFullYear()}`;
    const last = months[months.length - 1];
    if (last && last.label === label) last.width += dw;
    else months.push({ label, left: i * dw, width: dw });
  });
  const todayLeft = ((todayMs - range.start.getTime()) / DAY_MS + 0.5) * dw;
  const offset = (d: Date) => Math.round((startOfDay(d).getTime() - range.start.getTime()) / DAY_MS);

  const todayIdx = offset(new Date());
  const hasGroups = !!groups?.length || visible.some((i) => i.group);
  const defs: PlanningGroup[] = groups?.length
    ? groups
    : hasGroups
      ? [...new Set(visible.map((i) => i.group ?? '—'))].map((k) => ({ key: k, label: k }))
      : visible.map((i) => ({ key: i.id, label: i.title, subtitle: i.ref }));
  const rows: Row[] = defs.map((g) => {
    const own = visible
      .filter((i) => (hasGroups ? (i.group ?? '—') === g.key : i.id === g.key))
      .sort((a, b) => toDate(a.start)!.getTime() - toDate(b.start)!.getTime());
    const trackEnds: number[] = [];
    const bars = own.map((item) => {
      const s = offset(toDate(item.start)!);
      const e = Math.max(s, offset(toDate(item.end) ?? toDate(item.due) ?? toDate(item.start)!));
      let track = trackEnds.findIndex((end) => end < s);
      if (track < 0) {
        track = trackEnds.length;
        trackEnds.push(e);
      } else trackEnds[track] = e;
      const late = isLate(item);
      const due = toDate(item.due);
      const dueIdx = due ? offset(due) : null;
      const ovStart = Math.max(e + 1, (dueIdx ?? e) + 1);
      return {
        item,
        track,
        late,
        left: s * dw + 1,
        width: Math.max((e - s + 1) * dw - 2, 6),
        dueLeft: dueIdx != null ? (dueIdx + 1) * dw - 2 : null,
        overdueLeft: ovStart * dw,
        overdueWidth: late ? Math.max(0, (todayIdx + 1 - ovStart) * dw) : 0,
      };
    });
    return {
      key: g.key,
      label: g.label,
      subtitle: g.subtitle ?? (hasGroups ? `${own.length} élément(s)` : undefined),
      color: g.color,
      icon: g.icon,
      bars,
      tracks: Math.max(1, trackEnds.length),
      late: bars.filter((b) => b.late).length,
      done: own.filter((i) => i.done).length,
    };
  });

  const scrollToToday = (behavior: ScrollBehavior = 'smooth') => {
    const el = scroller.current;
    if (el) el.scrollTo?.({ left: Math.max(0, todayLeft - el.clientWidth / 3), behavior });
  };
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    scrollToToday('instant');
  });

  return (
    <div className="app-gantt-timeline">
      <div className="pl-stack">
        <PlanningToolbar
          searchable={searchable}
          filters={filters}
          lateToggle={lateToggle}
          lateCount={lateCount}
          state={filterState}
          onStateChange={setFilterState}
          end={
            <div className="gt-end">
              {showZoom && (
                <div className="pl-segmented">
                  {ZOOMS.map((z) => (
                    <button
                      key={z.key}
                      type="button"
                      className={zoom === z.key ? 'active' : undefined}
                      onClick={() => setZoom(z.key)}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              )}
              {showToday && (
                <button type="button" className="pl-text-btn" onClick={() => scrollToToday()}>
                  <MaterialIcon name="today" /> Aujourd'hui
                </button>
              )}
            </div>
          }
        />
        <div className="gt-scroller" ref={scroller} style={{ '--dw': `${dw}px` } as CSSProperties}>
          <div className="gt-table" style={{ width: days.length * dw + LABEL_W }}>
            <div className="gt-head">
              <div className="gt-corner">{rowLabel}</div>
              <div className="gt-axis">
                <div className="gt-months">
                  {months.map((m) => (
                    <div key={m.left} className="gt-month" style={{ left: m.left, width: m.width }}>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
                <div className="gt-days">
                  {days.map((d, i) => (
                    <div
                      key={i}
                      className={`gt-day${d.weekend ? ' weekend' : ''}${d.today ? ' today' : ''}`}
                      style={{ left: i * dw }}
                    >
                      {zoom === 'day' ? (
                        <>
                          <span className="dn">{fmtNarrowDay(d.date)}</span>
                          <span className="dd">{d.date.getDate()}</span>
                        </>
                      ) : (
                        (zoom === 'week' || d.monday) && <span className="dd">{d.date.getDate()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="gt-body">
              {rows.map((row) => (
                <div key={row.key} className="gt-row" style={{ height: row.tracks * TRACK_H + 12 }}>
                  <div className="gt-label">
                    <span className="gt-badge" style={tone(row.color || 'var(--primary-color)')}>
                      {row.icon ? <MaterialIcon name={row.icon} /> : initials(row.label)}
                    </span>
                    <div className="gt-label-text">
                      <strong>{row.label}</strong>
                      <span>
                        {row.subtitle && ` ${row.subtitle} `}
                        {!!row.late && <em className="late">{row.late} en retard</em>}
                      </span>
                    </div>
                  </div>
                  <div className="gt-lane">
                    {days.map(
                      (d, i) =>
                        (d.weekend || d.today) && (
                          <div key={i} className={`gt-shade${d.today ? ' today' : ''}`} style={{ left: i * dw }} />
                        ),
                    )}
                    {row.bars.map((b) => (
                      <FragmentBar key={b.item.id} b={b} onClick={() => onItemClick?.(b.item)} />
                    ))}
                  </div>
                </div>
              ))}
              {!rows.length && <div className="gt-empty">Aucun élément à afficher</div>}
              {showToday && <div className="gt-today" style={{ left: todayLeft + LABEL_W }} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentBar({ b, onClick }: { b: Bar; onClick: () => void }) {
  return (
    <>
      {!!b.overdueWidth && (
        <Tooltip title="Échéance dépassée">
          <div
            className="gt-overdue"
            role="img"
            style={{ left: b.overdueLeft, width: b.overdueWidth, top: 6 + b.track * TRACK_H }}
            onClick={onClick}
          />
        </Tooltip>
      )}
      <Tooltip title={b.item.title + (b.item.assignee ? ` · ${b.item.assignee}` : '')}>
        <div
          className={`gt-bar${b.item.done ? ' done' : ''}`}
          style={{ ...tone(itemColor(b.item)), left: b.left, width: b.width, top: 6 + b.track * TRACK_H }}
          onClick={onClick}
        >
          {!!b.item.progress && <div className="gt-fill" style={{ width: `${b.item.progress}%` }} />}
          <span className="gt-bar-text">
            {b.item.ref && <b>{b.item.ref}</b>} {b.item.title}
          </span>
        </div>
      </Tooltip>
      {b.dueLeft !== null && (
        <div className={`gt-due${b.late ? ' late' : ''}`} style={{ left: b.dueLeft, top: 3 + b.track * TRACK_H }} />
      )}
    </>
  );
}
