import type { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { FilterDropdown, type FilterOption } from '../forms/FilterDropdown';
import { MaterialIcon } from '../ui/MaterialIcon';
import { EMPTY_FILTER_STATE, type PlanningFilter, type PlanningFilterState } from './planningModels';
import './planning-toolbar.scss';

/**
 * app-planning-toolbar : barre d'outils commune aux vues de planification. Chaque bloc est optionnel :
 * recherche (`searchable`), filtres déclaratifs (`filters`), bascule « en retard » (`lateToggle`).
 * Les contrôles propres à une vue (zoom, navigation…) passent par `end` (équivalent de [toolbarEnd]).
 */
export function PlanningToolbar({
  searchable = false,
  searchPlaceholder = 'Rechercher…',
  filters = [],
  lateToggle = false,
  lateCount = 0,
  state,
  onStateChange,
  end,
}: {
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  lateCount?: number;
  state: PlanningFilterState;
  onStateChange: (s: PlanningFilterState) => void;
  end?: ReactNode;
}) {
  const patch = (p: Partial<PlanningFilterState>) => onStateChange({ ...state, ...p });
  const activeCount =
    (state.search ? 1 : 0) +
    (state.lateOnly ? 1 : 0) +
    Object.values(state.values).filter((v) => v && v !== 'all').length;
  const optionsFor = (f: PlanningFilter): FilterOption<string>[] => [
    { value: 'all', label: f.allLabel ?? 'Tous' },
    ...f.options,
  ];
  return (
    <div className="app-planning-toolbar">
      <div className="pl-toolbar">
        {searchable && (
          <label className="pl-search">
            <MaterialIcon name="search" />
            <input
              placeholder={searchPlaceholder}
              value={state.search}
              onChange={(e) => patch({ search: e.target.value })}
            />
            {state.search && (
              <button type="button" className="pl-clear" onClick={() => patch({ search: '' })} aria-label="Effacer">
                <MaterialIcon name="close" />
              </button>
            )}
          </label>
        )}
        {filters.map((f) => (
          <FilterDropdown
            key={f.key}
            options={optionsFor(f)}
            value={state.values[f.key] ?? 'all'}
            onChange={(v: string) => patch({ values: { ...state.values, [f.key]: v } })}
            labelPrefix={f.label}
          />
        ))}
        {lateToggle && (
          <button
            type="button"
            className={`pl-chip${state.lateOnly ? ' active' : ''}`}
            onClick={() => patch({ lateOnly: !state.lateOnly })}
          >
            <MaterialIcon name="schedule" /> En retard {!!lateCount && <em>{lateCount}</em>}
          </button>
        )}
        {!!activeCount && (
          <Tooltip title="Réinitialiser les filtres">
            <button
              type="button"
              className="pl-reset"
              onClick={() => onStateChange(EMPTY_FILTER_STATE)}
              aria-label="Réinitialiser les filtres"
            >
              <MaterialIcon name="filter_alt_off" />
            </button>
          </Tooltip>
        )}
        <span className="pl-spacer" />
        {end}
      </div>
    </div>
  );
}
