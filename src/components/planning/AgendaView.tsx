import { toneInk } from '../../theme/toneInk';
/* eslint-disable @typescript-eslint/no-non-null-assertion -- algorithme de répartition porté tel quel depuis agenda-view.component.ts (indices bornés) */
import { Tooltip } from '@mui/material';
import { useState, type CSSProperties } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { MonthCalendar } from './MonthCalendar';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  MONTHS,
  WEEKDAYS_SHORT,
  addDays,
  applyPlanningFilters,
  fmtTime,
  isLate,
  itemColor,
  sameDay,
  startOfDay,
  startOfWeek,
  toDate,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningItem,
} from './planningModels';
import type { AgendaView as View } from './planningTypes';
import './agenda-view.scss';

const HOUR_H = 48;
const LABELS: Record<View, string> = { day: 'Jour', week: 'Semaine', month: 'Mois' };
const tone = (v: string) => ({ '--tone': v, '--tone-ink': toneInk(v) }) as CSSProperties;
interface Placed {
  item: PlanningItem;
  top: number;
  height: number;
  left: number;
  width: number;
}

/** app-agenda-view : jour / semaine / mois, grille horaire élargie, chevauchements côte à côte, ligne « maintenant ». */
export function AgendaView({
  items = [],
  view: viewInit = 'week',
  views = ['day', 'week', 'month'],
  startHour = 7,
  endHour = 20,
  defaultDuration = 60,
  workWeek = false,
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
}: {
  items?: PlanningItem[];
  view?: View;
  views?: View[];
  startHour?: number;
  endHour?: number;
  defaultDuration?: number;
  workWeek?: boolean;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
}) {
  const [today] = useState(() => new Date());
  const [view, setView] = useState<View>(viewInit);
  const [cursor, setCursor] = useState(() => new Date());
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);
  const visible = applyPlanningFilters(items, filters, filterState);
  const lateCount = items.filter((i) => isLate(i)).length;

  let title: string;
  if (view === 'month') title = `${MONTHS[cursor.getMonth()] ?? ''} ${cursor.getFullYear()}`;
  else if (view === 'day')
    title = cursor.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  else {
    const s = startOfWeek(cursor);
    const e = addDays(s, workWeek ? 4 : 6);
    title = `${s.getDate()} – ${e.getDate()} ${(MONTHS[e.getMonth()] ?? '').toLowerCase()} ${e.getFullYear()}`;
  }
  const isAllDay = (it: PlanningItem) => {
    const s = toDate(it.start) ?? toDate(it.due);
    return !!s && !it.end && s.getHours() === 0 && s.getMinutes() === 0;
  };

  let hStart = startHour,
    hEnd = endHour;
  for (const it of visible) {
    const s = toDate(it.start);
    if (!s || isAllDay(it)) continue;
    const e = toDate(it.end) ?? new Date(s.getTime() + defaultDuration * 60_000);
    hStart = Math.min(hStart, s.getHours());
    hEnd = Math.max(hEnd, Math.min(24, e.getHours() + (e.getMinutes() ? 1 : 0)));
  }
  const hours = Array.from({ length: hEnd - hStart }, (_, i) => hStart + i);

  const layout = (list: PlanningItem[], firstHour: number): Placed[] => {
    const evs = list
      .map((item) => {
        const s = toDate(item.start)!;
        const e = toDate(item.end) ?? new Date(s.getTime() + defaultDuration * 60_000);
        const startMin = s.getHours() * 60 + s.getMinutes();
        return {
          item,
          startMin,
          endMin: Math.max(startMin + 30, e.getHours() * 60 + e.getMinutes() || 24 * 60),
          lane: 0,
          lanes: 1,
        };
      })
      .sort((a, b) => a.startMin - b.startMin);
    // Regroupe les éléments qui se chevauchent puis répartit chaque groupe sur des couloirs.
    for (let i = 0; i < evs.length;) {
      let j = i,
        end = evs[i]!.endMin;
      while (j + 1 < evs.length && evs[j + 1]!.startMin < end) {
        j++;
        end = Math.max(end, evs[j]!.endMin);
      }
      const lanes: number[] = [];
      for (let k = i; k <= j; k++) {
        const l = lanes.findIndex((le) => le <= evs[k]!.startMin);
        evs[k]!.lane = l < 0 ? lanes.length : l;
        lanes[evs[k]!.lane] = evs[k]!.endMin;
      }
      for (let k = i; k <= j; k++) evs[k]!.lanes = lanes.length;
      i = j + 1;
    }
    return evs.map((e) => ({
      item: e.item,
      top: ((e.startMin - firstHour * 60) / 60) * HOUR_H + 1,
      height: Math.max(((e.endMin - e.startMin) / 60) * HOUR_H - 2, 22),
      left: (e.lane / e.lanes) * 100,
      width: 100 / e.lanes,
    }));
  };
  const dayList =
    view === 'day'
      ? [startOfDay(cursor)]
      : Array.from({ length: workWeek ? 5 : 7 }, (_, i) => addDays(startOfWeek(cursor), i));
  const columns = dayList.map((date) => {
    const own = visible.filter((it) => {
      const s = toDate(it.start) ?? toDate(it.due);
      return !!s && sameDay(s, date);
    });
    return {
      date,
      today: sameDay(date, today),
      allDay: own.filter(isAllDay),
      placed: layout(
        own.filter((i) => !isAllDay(i) && toDate(i.start)),
        hours[0]!,
      ),
    };
  });
  const hasAllDay = columns.some((c) => c.allDay.length);
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes() - hours[0]! * 60;
  const nowTop = mins < 0 || mins > hours.length * 60 ? null : (mins / 60) * HOUR_H;
  const shift = (n: number) => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
    else setCursor(addDays(cursor, n * (view === 'day' ? 1 : 7)));
  };
  const cols = { '--cols': columns.length } as CSSProperties;

  return (
    <div className="app-agenda-view">
      <div className="pl-stack">
        <PlanningToolbar
          searchable={searchable}
          filters={filters}
          lateToggle={lateToggle}
          lateCount={lateCount}
          state={filterState}
          onStateChange={setFilterState}
          end={
            <div className="ag-nav">
              <button type="button" className="pl-icon-btn" onClick={() => shift(-1)} aria-label="Précédent">
                <MaterialIcon name="chevron_left" />
              </button>
              <strong className="ag-title">{title}</strong>
              <button type="button" className="pl-icon-btn" onClick={() => shift(1)} aria-label="Suivant">
                <MaterialIcon name="chevron_right" />
              </button>
              <button type="button" className="pl-text-btn" onClick={() => setCursor(today)}>
                <MaterialIcon name="today" /> Aujourd'hui
              </button>
              {views.length > 1 && (
                <div className="pl-segmented">
                  {views.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={view === v ? 'active' : undefined}
                      onClick={() => setView(v)}
                    >
                      {LABELS[v]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />
        {view === 'month' ? (
          <MonthCalendar
            items={visible}
            month={cursor}
            onMonthChange={setCursor}
            showNavigation={false}
            showDayPanel
            onItemClick={onItemClick}
          />
        ) : (
          <div className="ag-frame">
            <div className="ag-head" style={cols}>
              <div className="ag-gutter" />
              {columns.map((c) => (
                <div key={c.date.getTime()} className={`ag-colhead${c.today ? ' today' : ''}`}>
                  <span>{WEEKDAYS_SHORT[(c.date.getDay() + 6) % 7]}</span>
                  <b>{c.date.getDate()}</b>
                </div>
              ))}
            </div>
            {hasAllDay && (
              <div className="ag-allday" style={cols}>
                <div className="ag-gutter">Journée</div>
                {columns.map((c) => (
                  <div key={c.date.getTime()} className="ag-allday-cell">
                    {c.allDay.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        className="ag-chip"
                        style={tone(itemColor(it))}
                        onClick={() => onItemClick?.(it)}
                      >
                        {it.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="ag-scroll">
              <div className="ag-grid" style={{ ...cols, height: hours.length * HOUR_H }}>
                <div className="ag-hours">
                  {hours.map((h, i) => (
                    <span key={h} style={{ top: i * HOUR_H }}>
                      {h}:00
                    </span>
                  ))}
                </div>
                {columns.map((c) => (
                  <div key={c.date.getTime()} className={`ag-col${c.today ? ' today' : ''}`}>
                    {hours.map((h, i) => (
                      <div key={h} className="ag-slot" style={{ top: i * HOUR_H }} />
                    ))}
                    {c.placed.map((p) => (
                      <Tooltip key={p.item.id} title={p.item.title}>
                        <button
                          type="button"
                          className={`ag-event${p.item.done ? ' done' : ''}`}
                          onClick={() => onItemClick?.(p.item)}
                          style={{
                            ...tone(itemColor(p.item)),
                            top: p.top,
                            height: p.height,
                            left: `${p.left}%`,
                            width: `${p.width}%`,
                          }}
                        >
                          <b>{p.item.title}</b>
                          <small>
                            {fmtTime(p.item.start!)}
                            {p.item.end && ` – ${fmtTime(p.item.end)}`}
                            {p.item.assignee && ` · ${p.item.assignee}`}
                          </small>
                        </button>
                      </Tooltip>
                    ))}
                    {c.today && nowTop !== null && <div className="ag-now" style={{ top: nowTop }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
