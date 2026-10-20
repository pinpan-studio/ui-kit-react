import { toneInk } from '../../theme/toneInk';
import { useState, type CSSProperties } from 'react';
import { Tooltip } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  applyPlanningFilters,
  fmtDayMonthShort,
  initials,
  isLate,
  itemColor,
  toneVar,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningItem,
} from './planningModels';
import './note-grid.scss';

/** app-note-grid : grille de notes flat teintées par `color` / `tone` (densité, lignes de description, barre d'outils). */
export function NoteGrid({
  items = [],
  dense = false,
  minWidth = 220,
  descriptionLines = 3,
  emptyLabel = 'Aucun élément',
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
}: {
  items?: PlanningItem[];
  dense?: boolean;
  minWidth?: number;
  descriptionLines?: number;
  emptyLabel?: string;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
}) {
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);
  const visible = applyPlanningFilters(items, filters, filterState);
  const lateCount = items.filter((i) => isLate(i)).length;
  return (
    <div className="app-note-grid">
      <div className="pl-stack">
        {(searchable || filters.length > 0 || lateToggle) && (
          <PlanningToolbar
            searchable={searchable}
            filters={filters}
            lateToggle={lateToggle}
            lateCount={lateCount}
            state={filterState}
            onStateChange={setFilterState}
          />
        )}
        <div className={`ng-grid${dense ? ' dense' : ''}`} style={{ '--min': `${minWidth}px` } as CSSProperties}>
          {visible.map((it) => (
            <div
              key={it.id}
              className={`ng-note${it.done ? ' done' : ''}`}
              style={{ '--tone': itemColor(it) } as CSSProperties}
              onClick={() => onItemClick?.(it)}
            >
              <div className="ng-head">
                {it.ref && <span className="ng-ref">{it.ref}</span>}
                <span className="pl-spacer" />
                {it.badge && (
                  <span
                    className="pl-pill"
                    style={
                      {
                        '--tone': toneVar(it.badge.tone),
                        '--tone-ink': toneInk(toneVar(it.badge.tone)),
                      } as CSSProperties
                    }
                  >
                    {it.badge.label}
                  </span>
                )}
              </div>
              <h4 className="ng-title">{it.title}</h4>
              {it.description && descriptionLines > 0 && (
                <p className="ng-desc" style={{ WebkitLineClamp: descriptionLines }}>
                  {it.description}
                </p>
              )}
              <div className="ng-foot">
                {it.due && (
                  <span className={`pl-due${isLate(it) ? ' late' : ''}`}>
                    <MaterialIcon name="event" />
                    {fmtDayMonthShort(it.due)}
                  </span>
                )}
                <span className="pl-spacer" />
                {it.done ? (
                  <MaterialIcon name="check_circle" className="ng-done" />
                ) : (
                  it.progress != null && <span className="ng-pct">{it.progress} %</span>
                )}
                {it.assignee && (
                  <Tooltip title={it.assignee}>
                    <span className="pl-avatar">{initials(it.assignee)}</span>
                  </Tooltip>
                )}
              </div>
              {it.progress != null && !it.done && (
                <div className="pl-progress">
                  <div style={{ width: `${it.progress}%` }} />
                </div>
              )}
            </div>
          ))}
          {!visible.length && <div className="pl-empty ng-empty">{emptyLabel}</div>}
        </div>
      </div>
    </div>
  );
}
