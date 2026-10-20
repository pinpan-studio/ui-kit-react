import { toneInk } from '../../theme/toneInk';
import { useState, type CSSProperties } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { NoteGrid } from './NoteGrid';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  applyPlanningFilters,
  fmtDayMonth,
  initials,
  isLate,
  itemColor,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningGroup,
  type PlanningItem,
} from './planningModels';
import './grouped-board.scss';

const tone = (v: string) => ({ '--tone': v, '--tone-ink': toneInk(v) }) as CSSProperties;

/** app-grouped-board : regroupement par clé (technicien, véhicule…) avec progression, terminés, retards ; notes ou liste. */
export function GroupedBoard({
  items = [],
  groups = null,
  layout = 'notes',
  showProgress = true,
  collapsible = true,
  ungroupedLabel = 'Non assigné',
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
}: {
  items?: PlanningItem[];
  groups?: PlanningGroup[] | null;
  layout?: 'notes' | 'list';
  showProgress?: boolean;
  collapsible?: boolean;
  ungroupedLabel?: string;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
}) {
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lateCount = items.filter((i) => isLate(i)).length;
  const filtered = applyPlanningFilters(items, filters, filterState);
  const keys: PlanningGroup[] = groups?.length
    ? groups
    : [...new Set(filtered.map((i) => i.group ?? ''))].map((k) => ({ key: k, label: k || ungroupedLabel }));
  const view = keys
    .map((g) => {
      const own = filtered.filter((i) => (i.group ?? '') === g.key);
      const progress = own.length
        ? Math.round(own.reduce((s, i) => s + (i.done ? 100 : (i.progress ?? 0)), 0) / own.length)
        : 0;
      return {
        ...g,
        items: own,
        done: own.filter((i) => i.done).length,
        late: own.filter((i) => isLate(i)).length,
        progress,
      };
    })
    .filter((g) => g.items.length);
  const toggle = (key: string) => {
    if (!collapsible) return;
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };
  return (
    <div className="app-grouped-board">
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
        {view.map((g) => (
          <section key={g.key} className="gb-group">
            <header className="gb-head" onClick={() => toggle(g.key)}>
              <span className="gb-avatar" style={tone(g.color || 'var(--primary-color)')}>
                {g.icon ? <MaterialIcon name={g.icon} /> : ` ${initials(g.label)} `}
              </span>
              <div className="gb-title">
                <strong>{g.label}</strong>
                <span>{g.subtitle ?? `${g.items.length} élément(s)`}</span>
              </div>
              <div className="gb-stats">
                <span className="pl-pill" style={tone('var(--success-color)')}>
                  {g.done} terminé(s)
                </span>
                {!!g.late && (
                  <span className="pl-pill" style={tone('var(--error-color)')}>
                    {g.late} en retard
                  </span>
                )}
                {showProgress && (
                  <div className="gb-progress">
                    <div className="pl-progress">
                      <div style={{ width: `${g.progress}%` }} />
                    </div>
                    <b>{g.progress} %</b>
                  </div>
                )}
              </div>
              {collapsible && (
                <MaterialIcon name={collapsed.has(g.key) ? 'expand_more' : 'expand_less'} className="gb-chevron" />
              )}
            </header>
            {!collapsed.has(g.key) &&
              (layout === 'notes' ? (
                <NoteGrid items={g.items} dense minWidth={200} descriptionLines={2} onItemClick={onItemClick} />
              ) : (
                <ul className="gb-list">
                  {g.items.map((it) => (
                    <li key={it.id} onClick={() => onItemClick?.(it)} style={tone(itemColor(it))}>
                      <span className="gb-dot" />
                      {it.ref && <span className="gb-ref">{it.ref}</span>}
                      <span className={`gb-item-title${it.done ? ' done' : ''}`}>{it.title}</span>
                      {it.due && (
                        <span className={`pl-due${isLate(it) ? ' late' : ''}`}>
                          <MaterialIcon name="event" />
                          {fmtDayMonth(it.due)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
          </section>
        ))}
        {!view.length && <div className="pl-empty">Aucun élément</div>}
      </div>
    </div>
  );
}
