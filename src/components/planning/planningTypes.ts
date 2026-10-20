import type { PlanningItem } from './planningModels';

export interface KanbanMove {
  item: PlanningItem;
  from: string;
  to: string;
  index: number;
}
export type GanttZoom = 'day' | 'week' | 'month';
export type AgendaView = 'day' | 'week' | 'month';
