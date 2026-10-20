import { toneInk } from '../../theme/toneInk';
import { useState, type CSSProperties } from 'react';
import { Tooltip } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  MONTHS,
  WEEKDAYS_SHORT,
  addDays,
  anchorDate,
  applyPlanningFilters,
  fmtLongDay,
  isLate,
  itemColor,
  sameDay,
  startOfDay,
  startOfWeek,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningItem,
} from './planningModels';
import './month-calendar.scss';

const tone = (v: string) => ({ '--tone': v, '--tone-ink': toneInk(v) }) as CSSProperties;

/** app-month-calendar : éléments placés à leur date de début (sinon échéance), « +n autre(s) », panneau du jour optionnel. */
export function MonthCalendar({
  items = [],
  month: monthProp,
  onMonthChange,
  maxPerDay = 3,
  showNavigation = true,
  showDayPanel = false,
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
  onDayClick,
}: {
  items?: PlanningItem[];
  month?: Date;
  onMonthChange?: (d: Date) => void;
  maxPerDay?: number;
  showNavigation?: boolean;
  showDayPanel?: boolean;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
  onDayClick?: (d: Date) => void;
}) {
  const [today] = useState(() => new Date());
  const [ownMonth, setOwnMonth] = useState(() => new Date());
  const month = monthProp ?? ownMonth;
  const setMonth = (d: Date) => {
    setOwnMonth(d);
    onMonthChange?.(d);
  };
  const [selected, setSelected] = useState<Date | null>(null);
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);

  const visible = applyPlanningFilters(items, filters, filterState);
  const lateCount = items.filter((i) => isLate(i)).length;
  const title = `${MONTHS[month.getMonth()] ?? ''} ${month.getFullYear()}`;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = startOfWeek(first);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7);
  const on = (d: Date) => (it: PlanningItem) => {
    const a = anchorDate(it);
    return !!a && sameDay(a, d);
  };
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      inMonth: date.getMonth() === month.getMonth(),
      today: sameDay(date, today),
      items: visible.filter(on(date)),
    };
  });
  const dayItems = visible.filter(on(selected ?? today));
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const pick = (d: Date) => {
    setSelected(d);
    onDayClick?.(d);
  };

  return (
    <div className="app-month-calendar">
      <div className="pl-stack">
        {(showNavigation || searchable || filters.length > 0 || lateToggle) && (
          <PlanningToolbar
            searchable={searchable}
            filters={filters}
            lateToggle={lateToggle}
            lateCount={lateCount}
            state={filterState}
            onStateChange={setFilterState}
            end={
              showNavigation && (
                <div className="mc-nav">
                  <button type="button" className="pl-icon-btn" onClick={() => shift(-1)} aria-label="Mois précédent">
                    <MaterialIcon name="chevron_left" />
                  </button>
                  <strong className="mc-title">{title}</strong>
                  <button type="button" className="pl-icon-btn" onClick={() => shift(1)} aria-label="Mois suivant">
                    <MaterialIcon name="chevron_right" />
                  </button>
                  <button
                    type="button"
                    className="pl-text-btn"
                    onClick={() => {
                      setMonth(new Date());
                      setSelected(startOfDay(new Date()));
                    }}
                  >
                    <MaterialIcon name="today" /> Aujourd'hui
                  </button>
                </div>
              )
            }
          />
        )}
        <div className={`mc-layout${showDayPanel ? ' with-panel' : ''}`}>
          <div className="mc-grid">
            {WEEKDAYS_SHORT.map((w) => (
              <div key={w} className="mc-wd">
                {w}
              </div>
            ))}
            {cells.map((c) => (
              <div
                key={c.date.getTime()}
                onClick={() => pick(c.date)}
                className={`mc-cell${c.inMonth ? '' : ' out'}${c.today ? ' today' : ''}${selected && sameDay(c.date, selected) ? ' selected' : ''}`}
              >
                <span className="mc-num">{c.date.getDate()}</span>
                {c.items.slice(0, maxPerDay).map((it) => (
                  <Tooltip key={it.id} title={it.title}>
                    <button
                      type="button"
                      className={`mc-chip${it.done ? ' done' : ''}`}
                      style={tone(itemColor(it))}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick?.(it);
                      }}
                    >
                      <span className="mc-dot" />
                      {it.title}
                    </button>
                  </Tooltip>
                ))}
                {c.items.length > maxPerDay && <span className="mc-more">+{c.items.length - maxPerDay} autre(s)</span>}
              </div>
            ))}
          </div>
          {showDayPanel && (
            <aside className="mc-panel">
              <strong>{fmtLongDay(selected ?? today)}</strong>
              {dayItems.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="mc-row"
                  style={tone(itemColor(it))}
                  onClick={() => onItemClick?.(it)}
                >
                  <span className="mc-dot" />
                  <span className="mc-row-text">
                    <b>{it.title}</b>
                    <small>
                      {it.ref} {it.assignee && <> · {it.assignee} </>}
                    </small>
                  </span>
                </button>
              ))}
              {!dayItems.length && <span className="mc-none">Rien de prévu</span>}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
