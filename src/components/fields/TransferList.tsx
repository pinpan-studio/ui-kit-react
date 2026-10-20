import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Tip } from './Tip';
import type { TransferItem } from './treeTypes';
import './transfer-list.scss';

type Side = 'source' | 'target';
const SIDES: Side[] = ['source', 'target'];

function ItemBody({ it, on }: { it: TransferItem; on: boolean }) {
  return (
    <>
      <span className={`tl-check${on ? ' on' : ''}`} />
      {it.icon && <MaterialIcon name={it.icon} className="ic" />}
      <span className="txt">
        <span>{it.label}</span>
        {it.description && <small>{it.description}</small>}
      </span>
      <MaterialIcon name="drag_indicator" className="grip" />
    </>
  );
}

function Row({
  it,
  side,
  on,
  locked,
  onClick,
  onDouble,
}: {
  it: TransferItem;
  side: Side;
  on: boolean;
  locked: boolean;
  onClick: (e: MouseEvent) => void;
  onDouble: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: it.value,
    data: { side },
    disabled: !!it.disabled || locked,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="option"
      aria-selected={on}
      className={`tl-item${on ? ' on' : ''}${it.disabled ? ' disabled' : ''}${isDragging ? ' cdk-drag-placeholder' : ''}`}
      onClick={onClick}
      onDoubleClick={onDouble}
    >
      <ItemBody it={it} on={on} />
    </div>
  );
}

function DropList({ side, children, dragging }: { side: Side; children: ReactNode; dragging: boolean }) {
  const { setNodeRef } = useDroppable({ id: `tl-${side}`, data: { side } });
  return (
    <div
      ref={setNodeRef}
      className={`tl-list${dragging ? ' cdk-drop-list-dragging' : ''}`}
      role="listbox"
      aria-multiselectable
    >
      {children}
    </div>
  );
}

/**
 * app-transfer-list : deux colonnes, recherche par colonne, sélection multiple (Maj+clic = plage),
 * boutons de transfert, glisser-déposer (dnd-kit) entre colonnes et réordonnancement à droite, double-clic.
 * Valeur : `string[]` des éléments de droite.
 */
export function TransferList({
  items,
  value,
  onChange,
  sourceTitle = 'Disponibles',
  targetTitle = 'Sélectionnés',
  disabled = false,
}: {
  items: TransferItem[];
  value: string[];
  onChange: (v: string[]) => void;
  sourceTitle?: string;
  targetTitle?: string;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState<Record<Side, string>>({ source: '', target: '' });
  const [active, setActive] = useState<TransferItem | null>(null);
  const anchor = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const targetSet = new Set(value);
  const lists: Record<Side, TransferItem[]> = {
    source: items.filter((i) => !targetSet.has(i.value)),
    target: value.map((v) => items.find((i) => i.value === v)).filter((i): i is TransferItem => !!i),
  };
  const filtered = (s: Side) => {
    const t = q[s].trim().toLowerCase();
    return t ? lists[s].filter((i) => `${i.label} ${i.description ?? ''}`.toLowerCase().includes(t)) : lists[s];
  };
  const checkedIn = (s: Side) => lists[s].filter((i) => checked.has(i.value)).map((i) => i.value);
  const selectable = (s: Side) => filtered(s).filter((i) => !i.disabled);
  const allChecked = (s: Side) => {
    const l = selectable(s);
    return !!l.length && l.every((i) => checked.has(i.value));
  };
  const someChecked = (s: Side) => !allChecked(s) && selectable(s).some((i) => checked.has(i.value));

  const checkAll = (s: Side) => {
    const all = allChecked(s);
    const next = new Set(checked);
    selectable(s).forEach((i) => (all ? next.delete(i.value) : next.add(i.value)));
    setChecked(next);
  };
  const check = (s: Side, it: TransferItem, e: MouseEvent) => {
    if (it.disabled || disabled) return;
    const next = new Set(checked);
    const list = selectable(s);
    if (e.shiftKey && anchor.current) {
      const a = list.findIndex((i) => i.value === anchor.current),
        b = list.findIndex((i) => i.value === it.value);
      if (a >= 0 && b >= 0) list.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((i) => next.add(i.value));
    } else {
      if (next.has(it.value)) next.delete(it.value);
      else next.add(it.value);
      anchor.current = it.value;
    }
    setChecked(next);
  };
  const move = (values: string[], to: Side, index?: number) => {
    const cur = value.filter((v) => !values.includes(v));
    if (to === 'target') cur.splice(index ?? cur.length, 0, ...values);
    const next = new Set(checked);
    values.forEach((v) => next.delete(v));
    setChecked(next);
    onChange(cur);
  };
  const other = (s: Side): Side => (s === 'source' ? 'target' : 'source');
  const moveChecked = (from: Side) => move(checkedIn(from), other(from));
  const moveAll = (to: Side) =>
    move(
      filtered(other(to))
        .filter((i) => !i.disabled)
        .map((i) => i.value),
      to,
    );

  const onDragStart = (e: DragStartEvent) => setActive(items.find((i) => i.value === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const v = String(e.active.id);
    const from = e.active.data.current?.side as Side;
    const to = (e.over.data.current?.side as Side | undefined) ?? from;
    const overIdx = value.indexOf(String(e.over.id));
    if (from === to) {
      if (to !== 'target' || q.target || overIdx < 0) return;
      const arr = value.filter((x) => x !== v);
      arr.splice(overIdx, 0, v);
      onChange(arr);
      return;
    }
    // Déplace aussi les autres éléments cochés de la colonne d'origine.
    const values = checked.has(v) ? checkedIn(from) : [v];
    move(values, to, to === 'target' && overIdx >= 0 ? overIdx : undefined);
  };

  return (
    <div className="app-transfer-list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className={`tl${disabled ? ' disabled' : ''}`}>
          {SIDES.map((side) => (
            <div key={side} style={{ display: 'contents' }}>
              <div className="tl-col">
                <div className="tl-head">
                  <span
                    className={`tl-check${allChecked(side) ? ' on' : ''}${someChecked(side) ? ' some' : ''}`}
                    onClick={() => checkAll(side)}
                    role="checkbox"
                    aria-checked={allChecked(side)}
                  />
                  <strong>{side === 'source' ? sourceTitle : targetTitle}</strong>
                  <span className="tl-count">
                    {checkedIn(side).length ? `${checkedIn(side).length} / ` : ''}
                    {lists[side].length}
                  </span>
                </div>
                <div className="tl-search">
                  <MaterialIcon name="search" />
                  <input
                    placeholder="Filtrer…"
                    value={q[side]}
                    onChange={(e) => setQ((s) => ({ ...s, [side]: e.target.value }))}
                  />
                </div>
                <SortableContext
                  id={side}
                  items={filtered(side).map((i) => i.value)}
                  strategy={verticalListSortingStrategy}
                >
                  <DropList side={side} dragging={!!active}>
                    {filtered(side).map((it) => (
                      <Row
                        key={it.value}
                        it={it}
                        side={side}
                        on={checked.has(it.value)}
                        locked={disabled}
                        onClick={(e) => check(side, it, e)}
                        onDouble={() => {
                          if (!it.disabled && !disabled) move([it.value], other(side));
                        }}
                      />
                    ))}
                    {!filtered(side).length && (
                      <div className="tl-empty">
                        <MaterialIcon name={q[side] ? 'search_off' : 'inbox'} />
                        {q[side]
                          ? 'Aucun résultat'
                          : side === 'source'
                            ? 'Tout est affecté'
                            : 'Glissez des éléments ici'}
                      </div>
                    )}
                  </DropList>
                </SortableContext>
              </div>
              {side === 'source' && (
                <div className="tl-actions">
                  <Tip title="Tout ajouter">
                    <button type="button" onClick={() => moveAll('target')} disabled={!lists.source.length || disabled}>
                      <MaterialIcon name="keyboard_double_arrow_right" />
                    </button>
                  </Tip>
                  <Tip title="Ajouter la sélection">
                    <button
                      type="button"
                      className="pri"
                      onClick={() => moveChecked('source')}
                      disabled={!checkedIn('source').length || disabled}
                    >
                      <MaterialIcon name="chevron_right" />
                    </button>
                  </Tip>
                  <Tip title="Retirer la sélection">
                    <button
                      type="button"
                      className="pri"
                      onClick={() => moveChecked('target')}
                      disabled={!checkedIn('target').length || disabled}
                    >
                      <MaterialIcon name="chevron_left" />
                    </button>
                  </Tip>
                  <Tip title="Tout retirer">
                    <button type="button" onClick={() => moveAll('source')} disabled={!lists.target.length || disabled}>
                      <MaterialIcon name="keyboard_double_arrow_left" />
                    </button>
                  </Tip>
                </div>
              )}
            </div>
          ))}
        </div>
        <DragOverlay>
          {active && (
            <div className="app-transfer-list">
              <div className="tl-item cdk-drag-preview">
                <ItemBody it={active} on={checked.has(active.value)} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
