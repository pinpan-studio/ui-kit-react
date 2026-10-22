import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import { PlanningToolbar } from './PlanningToolbar';
import {
  EMPTY_FILTER_STATE,
  applyPlanningFilters,
  fmtDayMonth,
  initials,
  isLate,
  itemColor,
  toneVar,
  type PlanningColumn,
  type PlanningFilter,
  type PlanningFilterState,
  type PlanningItem,
} from './planningModels';
import type { KanbanMove } from './planningTypes';
import './kanban-board.scss';

const tone = (v: string) => ({ '--tone': v }) as CSSProperties;

function CardBody({ it, tpl }: { it: PlanningItem; tpl?: (it: PlanningItem) => ReactNode }) {
  if (tpl) return <>{tpl(it)}</>;
  return (
    <>
      <div className="kb-card-top">
        {it.ref && <span className="kb-ref">{it.ref}</span>}
        {it.assignee && (
          <Tooltip title={it.assignee}>
            <span className="pl-avatar">{initials(it.assignee)}</span>
          </Tooltip>
        )}
      </div>
      <span className="kb-title">{it.title}</span>
      {(it.badge || it.due || !!it.tags?.length) && (
        <div className="kb-meta">
          {it.badge && (
            <span className="pl-pill" style={tone(toneVar(it.badge.tone))}>
              {it.badge.label}
            </span>
          )}
          {(it.tags ?? []).map((t) => (
            <span key={t} className="pl-pill" style={tone('var(--text-muted)')}>
              {t}
            </span>
          ))}
          {it.due && (
            <span className={`pl-due${isLate(it) ? ' late' : ''}`}>
              <MaterialIcon name="event" />
              {fmtDayMonth(it.due)}
            </span>
          )}
        </div>
      )}
      {!!it.progress && (
        <div className="pl-progress">
          <div style={{ width: `${it.progress}%` }} />
        </div>
      )}
    </>
  );
}

function Card({
  it,
  readonly,
  tpl,
  onClick,
}: {
  it: PlanningItem;
  readonly: boolean;
  tpl?: (it: PlanningItem) => ReactNode;
  onClick: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: it.id,
    data: { status: it.status },
    disabled: readonly,
  });
  if (isDragging)
    return (
      <div
        ref={setNodeRef}
        className="kb-placeholder"
        style={{ transform: CSS.Translate.toString(transform), transition }}
      />
    );
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`kb-card${readonly ? ' readonly' : ''}${it.done ? ' done' : ''}`}
      style={{ ...tone(itemColor(it)), transform: CSS.Translate.toString(transform), transition }}
    >
      <CardBody it={it} tpl={tpl} />
    </div>
  );
}

function Column({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `kb-${id}`, data: { status: id } });
  return (
    <div ref={setNodeRef} className="kb-col-body" id={`kb-${id}`}>
      {children}
    </div>
  );
}

/**
 * app-kanban-board : colonnes déclarées (`columns`), éléments rangés par `item.status`, glisser-déposer entre colonnes
 * (état local, `onItemMoved`). Options : lecture seule, barre d'outils, limite par colonne, carte personnalisée (`cardTemplate`).
 */
export function KanbanBoard({
  columns,
  items = [],
  readonly = false,
  wipLimit = null,
  emptyLabel = 'Déposez une carte ici',
  cardTemplate,
  searchable = false,
  filters = [],
  lateToggle = false,
  onItemClick,
  onItemMoved,
}: {
  columns: PlanningColumn[];
  items?: PlanningItem[];
  readonly?: boolean;
  wipLimit?: number | null;
  emptyLabel?: string;
  cardTemplate?: (it: PlanningItem) => ReactNode;
  searchable?: boolean;
  filters?: PlanningFilter[];
  lateToggle?: boolean;
  onItemClick?: (it: PlanningItem) => void;
  onItemMoved?: (m: KanbanMove) => void;
}) {
  const [filterState, setFilterState] = useState<PlanningFilterState>(EMPTY_FILTER_STATE);
  const [local, setLocal] = useState(() => items.map((i) => ({ ...i })));
  const [src, setSrc] = useState(items);
  if (src !== items) {
    setSrc(items);
    setLocal(items.map((i) => ({ ...i })));
  }
  const [active, setActive] = useState<PlanningItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const lateCount = local.filter((i) => isLate(i)).length;
  const board = useMemo(() => {
    const visible = new Set(applyPlanningFilters(local, filters, filterState).map((i) => i.id));
    return columns.map((column) => {
      const all = local.filter((i) => i.status === column.key);
      return { column, total: all.length, items: all.filter((i) => visible.has(i.id)) };
    });
  }, [local, filters, filterState, columns]);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const item = local.find((i) => i.id === e.active.id);
    if (!item) return;
    const from = item.status ?? '';
    const to = String(e.over.data.current?.status ?? from);
    const col = board.find((c) => c.column.key === to)?.items.filter((i) => i.id !== item.id) ?? [];
    const overIdx = col.findIndex((i) => i.id === e.over?.id);
    const index = overIdx < 0 ? col.length : overIdx;
    const prevIdx = board.find((c) => c.column.key === from)?.items.findIndex((i) => i.id === item.id) ?? -1;
    if (from === to && prevIdx === index) return;
    const list = local.filter((i) => i.id !== item.id);
    const moved = { ...item, status: to };
    // Position d'insertion : avant l'élément visible situé à `index` dans la colonne cible.
    const target = col[index];
    const at = target ? list.findIndex((i) => i.id === target.id) : list.length;
    list.splice(at, 0, moved);
    setLocal(list);
    onItemMoved?.({ item: moved, from, to, index });
  };

  return (
    <div className="app-kanban-board">
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e: DragStartEvent) => setActive(local.find((i) => i.id === e.active.id) ?? null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="kb-board">
            {board.map((col) => (
              <div key={col.column.key} className="kb-col">
                <div className="kb-col-head">
                  <span className="kb-dot" style={{ background: col.column.color || 'var(--text-muted)' }} />
                  <span className="kb-col-name">{col.column.label}</span>
                  <em className={`pl-count${wipLimit && col.total > wipLimit ? ' over' : ''}`}>
                    {col.total}
                    {wipLimit ? `/${wipLimit}` : ''}
                  </em>
                </div>
                <Column id={col.column.key}>
                  <SortableContext items={col.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {col.items.map((it) => (
                      <Card
                        key={it.id}
                        it={it}
                        readonly={readonly}
                        tpl={cardTemplate}
                        onClick={() => onItemClick?.(it)}
                      />
                    ))}
                  </SortableContext>
                  {!col.items.length && <div className="pl-empty">{emptyLabel}</div>}
                </Column>
              </div>
            ))}
          </div>
          <DragOverlay>
            {active && (
              <div className="kb-card cdk-drag-preview" style={tone(itemColor(active))}>
                <CardBody it={active} tpl={cardTemplate} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
