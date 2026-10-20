import { Button, LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useState } from 'react';
import { GanttTimeline } from '../../../../components/planning/GanttTimeline';
import { GroupedBoard } from '../../../../components/planning/GroupedBoard';
import { KanbanBoard } from '../../../../components/planning/KanbanBoard';
import { MonthCalendar } from '../../../../components/planning/MonthCalendar';
import type { PlanningColumn, PlanningFilter, PlanningItem } from '../../../../components/planning/planningModels';
import type { KanbanMove } from '../../../../components/planning/planningTypes';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { hue, initials } from '../../exUtils';
import '../../ex-page.scss';
import './board.scss';

const day = (d: number, h = 9) => new Date(2026, 9, 17 + d, h).toISOString();
type View = 'kanban' | 'gantt' | 'calendar' | 'list';

const TEAM = ['Jean Kouassi', 'Aïcha Diallo', 'Marc Yao', 'Sarah Bamba'];
const MONTH = new Date(2026, 9, 1);
const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Tableau', icon: 'view_kanban' },
  { id: 'gantt', label: 'Chronologie', icon: 'view_timeline' },
  { id: 'calendar', label: 'Calendrier', icon: 'calendar_month' },
  { id: 'list', label: 'Par responsable', icon: 'view_agenda' },
];
const COLUMNS: PlanningColumn[] = [
  { key: 'todo', label: 'À faire', color: 'var(--text-muted)' },
  { key: 'doing', label: 'En cours', color: 'var(--info-color)' },
  { key: 'review', label: 'En revue', color: 'var(--warning-color)' },
  { key: 'done', label: 'Terminé', color: 'var(--success-color)' },
];
const FILTERS: PlanningFilter[] = [
  {
    key: 'assignee',
    label: 'Responsable',
    options: TEAM.map((v) => ({ value: v, label: v })),
    value: (i) => i.assignee,
  },
];
const ITEMS: PlanningItem[] = [
  {
    id: 't1',
    ref: 'SOT-101',
    title: 'Audit des entrepôts de Vridi',
    status: 'todo',
    assignee: 'Marc Yao',
    start: day(1),
    end: day(3, 17),
    due: day(3),
    badge: { label: 'Terrain', tone: 'info' },
  },
  {
    id: 't2',
    ref: 'SOT-102',
    title: 'Import des 1 200 références articles',
    status: 'todo',
    assignee: 'Aïcha Diallo',
    start: day(3),
    end: day(5, 17),
    due: day(5),
    tags: ['data'],
  },
  {
    id: 't3',
    ref: 'SOT-103',
    title: 'Paramétrage des tarifs transport',
    status: 'todo',
    assignee: 'Jean Kouassi',
    start: day(-3),
    end: day(-1, 17),
    due: day(-1),
    badge: { label: 'Urgent', tone: 'error' },
  },
  {
    id: 't4',
    ref: 'SOT-097',
    title: 'Formation des chefs de quai',
    status: 'doing',
    assignee: 'Sarah Bamba',
    progress: 60,
    start: day(-2),
    end: day(2, 17),
    due: day(2),
  },
  {
    id: 't5',
    ref: 'SOT-098',
    title: 'Connexion API balises GPS',
    status: 'doing',
    assignee: 'Marc Yao',
    progress: 35,
    start: day(-1),
    end: day(4, 17),
    due: day(4),
    badge: { label: 'Technique', tone: 'purple' },
  },
  {
    id: 't6',
    ref: 'SOT-099',
    title: 'Modèles de bons de livraison',
    status: 'doing',
    assignee: 'Aïcha Diallo',
    progress: 80,
    start: day(-2),
    end: day(1, 17),
    due: day(1),
  },
  {
    id: 't7',
    ref: 'SOT-094',
    title: 'Recette du module facturation',
    status: 'review',
    assignee: 'Jean Kouassi',
    progress: 90,
    start: day(-4),
    end: day(0, 17),
    due: day(0),
  },
  {
    id: 't8',
    ref: 'SOT-095',
    title: 'Droits d’accès par site',
    status: 'review',
    assignee: 'Sarah Bamba',
    start: day(0),
    end: day(2, 17),
    due: day(2),
  },
  {
    id: 't9',
    ref: 'SOT-090',
    title: 'Atelier de cadrage',
    status: 'done',
    assignee: 'Jean Kouassi',
    done: true,
    progress: 100,
    start: day(-4),
    end: day(-4, 17),
  },
  {
    id: 't10',
    ref: 'SOT-091',
    title: 'Création des comptes utilisateurs',
    status: 'done',
    assignee: 'Aïcha Diallo',
    done: true,
    progress: 100,
    start: day(-3),
    end: day(-3, 17),
  },
].map((i) => ({ ...i, group: i.assignee }) as PlanningItem);

/** /examples/app/board — rail d'icônes compact, projet en quatre vues : kanban, chronologie, calendrier, liste par responsable. */
export function BoardPage() {
  const [view, setView] = useState<View>('kanban');
  const [items, setItems] = useState<PlanningItem[]>(ITEMS);
  const doneCount = items.filter((i) => i.status === 'done').length;
  const pct = Math.round((doneCount / items.length) * 100);

  /** Changement de colonne : on répercute le statut sur la source (l'ordre interne reste géré par le kanban). */
  const move = (m: KanbanMove) => {
    if (m.from === m.to) return;
    const done = m.to === 'done';
    setItems((l) =>
      l.map((i) => (i.id === m.item.id ? { ...i, status: m.to, done, progress: done ? 100 : i.progress } : i)),
    );
  };

  return (
    <div className="ex-page ex-board">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Sprint 14 · 13 – 24 octobre</span>
          <h1>Déploiement Sotra Logistique</h1>
          <p>
            {doneCount} tâches terminées sur {items.length} · livraison prévue le 24 octobre
          </p>
        </div>
        <div className="actions">
          <span className="ava-stack" aria-label="Équipe">
            {TEAM.map((p) => (
              <Tooltip key={p} title={p}>
                <span className="ava sm" style={{ background: hue(p) }}>
                  {initials(p)}
                </span>
              </Tooltip>
            ))}
          </span>
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="person_add" />}>
            Partager
          </Button>
          <Button variant="contained" disableElevation startIcon={<MaterialIcon name="add" />}>
            Nouvelle tâche
          </Button>
        </div>
      </div>

      <div className="progress" aria-label="Avancement du sprint">
        <LinearProgress variant="determinate" value={pct} />
        <strong className="tabular">{pct} %</strong>
      </div>

      <ToggleButtonGroup
        className="views ex-seg"
        exclusive
        value={view}
        onChange={(_, v: View | null) => v && setView(v)}
        aria-label="Vue"
      >
        {VIEWS.map((v) => (
          <ToggleButton key={v.id} value={v.id}>
            <MaterialIcon name={v.icon} />
            <span>{v.label}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {view === 'kanban' && (
        <KanbanBoard
          columns={COLUMNS}
          items={items}
          wipLimit={4}
          searchable
          filters={FILTERS}
          lateToggle
          onItemMoved={move}
        />
      )}
      {view === 'gantt' && (
        <div className="card pad">
          <GanttTimeline items={items} rowLabel="Responsable" zoom="day" searchable filters={FILTERS} />
        </div>
      )}
      {view === 'calendar' && (
        <div className="card pad">
          <MonthCalendar items={items} month={MONTH} showDayPanel />
        </div>
      )}
      {view === 'list' && <GroupedBoard items={items} layout="list" searchable lateToggle />}
    </div>
  );
}
