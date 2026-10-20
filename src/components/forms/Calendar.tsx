import { Tooltip } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { WEEKDAYS, addMonths, dayLong, monthShort, monthYear, sameDay, startOfDay } from './dateUtils';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}
type View = 'month' | 'year' | 'multi-year';
const YEARS_PER_PAGE = 24;

interface CellDef {
  key: string;
  label: string;
  aria: string;
  enabled: boolean;
  selected: boolean;
  today: boolean;
  active: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  inRange?: boolean;
  onPick: () => void;
}

/** Corps de tableau (mat-calendar-body) : libellé en tête de 1re ligne si assez de cellules libres, sinon ligne dédiée. */
function Body({ rows, label, numCols, offset }: { rows: CellDef[][]; label: string; numCols: number; offset: number }) {
  const pct = `${(50 / numCols).toFixed(4)}%`;
  const cellPad = { width: `${(100 / numCols).toFixed(4)}%`, paddingTop: pct, paddingBottom: pct };
  const labelMin = 3;
  return (
    <tbody className="mat-calendar-body">
      {offset < labelMin && (
        <tr aria-hidden="true">
          <td colSpan={numCols} className="mat-calendar-body-label" style={{ paddingTop: pct, paddingBottom: pct }}>
            {label}
          </td>
        </tr>
      )}
      {rows.map((row, ri) => (
        <tr key={ri} role="row">
          {ri === 0 && offset > 0 && (
            <td
              colSpan={offset}
              aria-hidden="true"
              className="mat-calendar-body-label"
              style={{ paddingTop: pct, paddingBottom: pct }}
            >
              {offset >= labelMin ? label : ''}
            </td>
          )}
          {row.map((c) => (
            <td key={c.key} role="gridcell" className="mat-calendar-body-cell-container" style={cellPad}>
              <button
                type="button"
                className={`mat-calendar-body-cell${c.active ? ' mat-calendar-body-active' : ''}${c.enabled ? '' : ' mat-calendar-body-disabled'}${c.rangeStart ? ' mat-calendar-body-range-start' : ''}${c.rangeEnd ? ' mat-calendar-body-range-end' : ''}${c.inRange ? ' mat-calendar-body-in-range' : ''}`}
                tabIndex={c.active ? 0 : -1}
                aria-label={c.aria}
                aria-pressed={c.selected}
                aria-disabled={!c.enabled || undefined}
                onClick={() => c.enabled && c.onPick()}
              >
                <span
                  className={`mat-calendar-body-cell-content mat-focus-indicator${c.selected ? ' mat-calendar-body-selected' : ''}${c.today ? ' mat-calendar-body-today' : ''}`}
                >
                  {c.label}
                </span>
                <span className="mat-calendar-body-cell-preview" aria-hidden="true" />
              </button>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

const chunk = <T,>(a: T[], n: number) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

/** Réplique de mat-calendar (vues mois / année / multi-années), sélection simple ou plage. */
export function Calendar({
  selected,
  onSelect,
  range,
  onRangeChange,
  min,
  max,
  startAt,
  dateFilter,
}: {
  selected?: Date | null;
  onSelect?: (d: Date) => void;
  range?: DateRange;
  onRangeChange?: (r: DateRange) => void;
  min?: Date | null;
  max?: Date | null;
  startAt?: Date | null;
  /** Jours sélectionnables (mat-calendar [dateFilter]) ; les autres sont grisés. */
  dateFilter?: (d: Date) => boolean;
}) {
  const today = startOfDay(new Date());
  const [active, setActive] = useState<Date>(startOfDay(startAt ?? selected ?? range?.start ?? today));
  const [view, setView] = useState<View>('month');
  const inBounds = (d: Date) => (!min || d >= startOfDay(min)) && (!max || d <= startOfDay(max));
  const y = active.getFullYear();
  const m = active.getMonth();

  let header = '';
  let body: ReactNode = null;
  let prevOk = true;
  let nextOk = true;
  if (view === 'month') {
    header = monthYear(active);
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const cells: CellDef[] = Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m, i + 1);
      const rs = range?.start ? sameDay(d, range.start) : false;
      const re = range?.end ? sameDay(d, range.end) : false;
      return {
        key: String(i),
        label: String(i + 1),
        aria: dayLong(d),
        enabled: inBounds(d) && (!dateFilter || dateFilter(d)),
        today: sameDay(d, today),
        active: sameDay(d, active),
        selected: range ? rs || re : sameDay(d, selected),
        rangeStart: rs,
        rangeEnd: re,
        inRange: !!range?.start && !!range.end && d >= range.start && d <= range.end,
        onPick: () => {
          setActive(d);
          if (range) {
            if (!range.start || range.end || d < range.start) onRangeChange?.({ start: d, end: null });
            else onRangeChange?.({ start: range.start, end: d });
          } else onSelect?.(d);
        },
      };
    });
    const rows: CellDef[][] = [cells.slice(0, 7 - offset), ...chunk(cells.slice(7 - offset), 7)];
    body = (
      <table className="mat-calendar-table" role="grid">
        <thead className="mat-calendar-table-header">
          <tr>
            {WEEKDAYS.map((w) => (
              <th key={w.long} scope="col">
                <span className="cdk-visually-hidden">{w.long}</span>
                <span aria-hidden="true">{w.narrow}</span>
              </th>
            ))}
          </tr>
          <tr aria-hidden="true">
            <th className="mat-calendar-table-header-divider" colSpan={7} />
          </tr>
        </thead>
        <Body rows={rows} label={monthShort(m)} numCols={7} offset={offset} />
      </table>
    );
    prevOk = !min || new Date(y, m, 1) > startOfDay(min);
    nextOk = !max || new Date(y, m + 1, 1) <= startOfDay(max);
  } else if (view === 'year') {
    header = String(y);
    const cells: CellDef[] = Array.from({ length: 12 }, (_, i) => ({
      key: String(i),
      label: monthShort(i),
      aria: monthYear(new Date(y, i, 1)),
      enabled: (!min || new Date(y, i + 1, 0) >= startOfDay(min)) && (!max || new Date(y, i, 1) <= startOfDay(max)),
      selected: !!selected && selected.getFullYear() === y && selected.getMonth() === i,
      today: today.getFullYear() === y && today.getMonth() === i,
      active: i === m,
      onPick: () => {
        setActive(addMonths(active, i - m));
        setView('month');
      },
    }));
    body = (
      <table className="mat-calendar-table" role="grid">
        <thead aria-hidden="true" className="mat-calendar-table-header">
          <tr>
            <th className="mat-calendar-table-header-divider" colSpan={4} />
          </tr>
        </thead>
        <Body rows={chunk(cells, 4)} label={String(y)} numCols={4} offset={0} />
      </table>
    );
    prevOk = !min || y > min.getFullYear();
    nextOk = !max || y < max.getFullYear();
  } else {
    const startY = y - (((y % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
    header = `${startY} – ${startY + YEARS_PER_PAGE - 1}`;
    const cells: CellDef[] = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
      const yy = startY + i;
      return {
        key: String(yy),
        label: String(yy),
        aria: String(yy),
        enabled: (!min || yy >= min.getFullYear()) && (!max || yy <= max.getFullYear()),
        selected: selected?.getFullYear() === yy,
        today: today.getFullYear() === yy,
        active: yy === y,
        onPick: () => {
          setActive(new Date(yy, m, Math.min(active.getDate(), new Date(yy, m + 1, 0).getDate())));
          setView('year');
        },
      };
    });
    body = (
      <table className="mat-calendar-table" role="grid">
        <thead aria-hidden="true" className="mat-calendar-table-header">
          <tr>
            <th className="mat-calendar-table-header-divider" colSpan={4} />
          </tr>
        </thead>
        <Body rows={chunk(cells, 4)} label="" numCols={4} offset={0} />
      </table>
    );
    prevOk = !min || startY > min.getFullYear();
    nextOk = !max || startY + YEARS_PER_PAGE - 1 < max.getFullYear();
  }
  const step = (dir: 1 | -1) =>
    setActive(
      view === 'month'
        ? addMonths(active, dir)
        : view === 'year'
          ? addMonths(active, 12 * dir)
          : addMonths(active, 12 * YEARS_PER_PAGE * dir),
    );
  const label = view === 'month' ? 'Mois' : view === 'year' ? 'Année' : '24 années';

  return (
    <div className="mat-calendar">
      <div className="mat-calendar-header">
        <div className="mat-calendar-controls">
          <button
            type="button"
            className="mat-calendar-period-button kit-mat-text-button"
            aria-label="Choisir une date"
            onClick={() => setView(view === 'month' ? 'multi-year' : 'month')}
          >
            <span className="mdc-button__label">
              <span aria-hidden="true">{header}</span>
              <svg
                viewBox="0 0 10 5"
                focusable="false"
                aria-hidden="true"
                className={`mat-calendar-arrow${view !== 'month' ? ' mat-calendar-invert' : ''}`}
              >
                <polygon points="0,0 5,5 10,0" />
              </svg>
            </span>
          </button>
          <div className="mat-calendar-spacer" />
          <Tooltip title={`${label} précédent${view === 'year' ? 'e' : view === 'multi-year' ? 's' : ''}`}>
            <span>
              <button
                type="button"
                className="mat-calendar-previous-button kit-mat-icon-button"
                disabled={!prevOk}
                aria-label="Précédent"
                onClick={() => step(-1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  focusable="false"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
            </span>
          </Tooltip>
          <Tooltip title={`${label} suivant${view === 'year' ? 'e' : view === 'multi-year' ? 's' : ''}`}>
            <span>
              <button
                type="button"
                className="mat-calendar-next-button kit-mat-icon-button"
                disabled={!nextOk}
                aria-label="Suivant"
                onClick={() => step(1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  focusable="false"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </span>
          </Tooltip>
        </div>
      </div>
      <div className="mat-calendar-content">{body}</div>
    </div>
  );
}
