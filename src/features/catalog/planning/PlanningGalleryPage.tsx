import { FormControlLabel, Switch } from '@mui/material';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { AgendaView } from '../../../components/planning/AgendaView';
import { GanttTimeline } from '../../../components/planning/GanttTimeline';
import { GroupedBoard } from '../../../components/planning/GroupedBoard';
import { KanbanBoard } from '../../../components/planning/KanbanBoard';
import { MonthCalendar } from '../../../components/planning/MonthCalendar';
import { NoteGrid } from '../../../components/planning/NoteGrid';
import type { PlanningFilter, PlanningItem } from '../../../components/planning/planningModels';
import type { KanbanMove } from '../../../components/planning/planningTypes';
import {
  INTERVENTIONS,
  INTERVENTION_COLUMNS,
  INTERVENTION_FILTERS,
  MOTIF_FILTER,
  PHASES,
  RDV_KIND_FILTER,
  RENDEZ_VOUS,
  RESERVATIONS,
  TECHNICIENS,
  VEHICULES,
} from '../../../data/static/planning.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './planningCode';
import './planning-gallery.scss';

const TOC: TocItem[] = [
  { id: 'model', label: 'Modèle & options' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'timeline', label: 'Timeline / Gantt' },
  { id: 'notes', label: 'Grille de notes' },
  { id: 'grouped', label: 'Vue groupée' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'agenda', label: 'Agenda' },
];

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  // Libellé au gabarit mat-slide-toggle (.mdc-label : 14px, interlettrage 0,25px, retrait 4px).
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
      label={children}
      sx={{ ml: 0, mr: 0 }}
      slotProps={{ typography: { sx: { fontSize: 14, letterSpacing: '0.256px', pl: '4px' } } }}
    />
  );
}

export function PlanningGalleryPage() {
  const snack = useSnackbar();
  const [optSearch, setOptSearch] = useState(true);
  const [optFilters, setOptFilters] = useState(true);
  const [optLate, setOptLate] = useState(true);
  const [readonlyKanban, setReadonlyKanban] = useState(false);
  const when = (f: PlanningFilter[]) => (optFilters ? f : []);
  const interventionFilters = when([INTERVENTION_FILTERS.type, INTERVENTION_FILTERS.zone]);
  const kanbanFilters = when([INTERVENTION_FILTERS.type, INTERVENTION_FILTERS.technicien]);
  const reservationFilters = when([MOTIF_FILTER]);
  const rdvFilters = when([RDV_KIND_FILTER]);
  const clicked = (i: PlanningItem) =>
    snack(`${i.ref ? i.ref + ' · ' : ''}${i.title}`, { action: 'Fermer', duration: 2000 });
  const moved = (e: KanbanMove) => {
    const col = INTERVENTION_COLUMNS.find((c) => c.key === e.to)?.label ?? '';
    snack(`« ${e.item.title} » → ${col} (local)`, { action: 'Fermer', duration: 2000 });
  };
  const opts = { searchable: optSearch, lateToggle: optLate, onItemClick: clicked };

  return (
    <div className="gallery-planning">
      <DocPage
        title="Planning"
        icon="view_timeline"
        toc={TOC}
        subtitle="Vues de planification génériques (shared/components/planning) : kanban, Gantt, notes, vue groupée, calendrier et agenda. Toutes reposent sur le même modèle PlanningItem, indépendant du métier, et partagent une barre d'outils dont chaque bloc est optionnel."
      >
        <DocSection
          id="model"
          title="Modèle & options"
          source="planning.models.ts · app-planning-toolbar"
          cols={2}
          description="Projetez n'importe quel objet (intervention, réservation, rendez-vous, ticket…) sur PlanningItem. Recherche, filtres et bascule « En retard » ne s'affichent que si vous les activez."
        >
          <Demo label="PlanningItem & PlanningFilter" code={CODE.model}>
            <ul className="model-list">
              <li>
                <code>status</code>
                <span>colonne du kanban</span>
              </li>
              <li>
                <code>group</code>
                <span>ligne du Gantt / groupe de la vue groupée</span>
              </li>
              <li>
                <code>start · end · due</code>
                <span>
                  placement temporel, retard si <code>due</code> dépassée
                </span>
              </li>
              <li>
                <code>tone · color</code>
                <span>couleur sémantique, suit le thème clair / sombre</span>
              </li>
              <li>
                <code>fields</code>
                <span>valeurs lues par les filtres déclarés</span>
              </li>
              <li>
                <code>data</code>
                <span>objet métier d'origine, renvoyé dans les événements</span>
              </li>
            </ul>
          </Demo>
          <Demo
            label="Options de la barre d'outils"
            hint="appliquées à toutes les démos de la page"
            code={CODE.toolbar}
          >
            <div className="opt-panel">
              <Toggle checked={optSearch} onChange={setOptSearch}>
                Recherche <code>[searchable]</code>
              </Toggle>
              <Toggle checked={optFilters} onChange={setOptFilters}>
                Filtres <code>[filters]</code>
              </Toggle>
              <Toggle checked={optLate} onChange={setOptLate}>
                En retard <code>[lateToggle]</code>
              </Toggle>
              <p className="muted">Tout désactivé : la barre disparaît et la vue s'affiche seule.</p>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="kanban"
          title="Kanban"
          source="app-kanban-board"
          description="Colonnes déclarées, éléments rangés par status, glisser-déposer entre colonnes (état local, événement itemMoved). Badge et progression colorés selon le tone de l'élément."
        >
          <Demo label="Interventions terrain" hint="glissez les cartes" code={CODE.kanban}>
            <div className="col-gap">
              <Toggle checked={readonlyKanban} onChange={setReadonlyKanban}>
                Lecture seule <code>[readonly]</code>
              </Toggle>
              <KanbanBoard
                columns={INTERVENTION_COLUMNS}
                items={INTERVENTIONS}
                readonly={readonlyKanban}
                wipLimit={4}
                filters={kanbanFilters}
                onItemMoved={moved}
                {...opts}
              />
            </div>
          </Demo>
          <Demo label="Carte personnalisée" hint="[cardTemplate]">
            <KanbanBoard
              columns={INTERVENTION_COLUMNS}
              items={INTERVENTIONS.slice(0, 6)}
              onItemClick={clicked}
              cardTemplate={(item) => (
                <div className="custom-card">
                  <span
                    className="cc-dot"
                    style={
                      {
                        background: `var(--${item.tone === 'neutral' ? 'text-muted' : `${item.tone ?? ''}-color`})`,
                      } as CSSProperties
                    }
                  />
                  <strong>{item.title}</strong>
                </div>
              )}
            />
          </Demo>
        </DocSection>

        <DocSection
          id="timeline"
          title="Timeline / Gantt"
          source="app-gantt-timeline"
          description="Barres de start à end, regroupées par lignes (groups ou item.group, sinon une ligne par élément). Marqueur d'échéance, hachures si elle est dépassée, zoom jour / semaine / mois."
        >
          <Demo label="Réservations de véhicules" hint="groupes déclarés" code={CODE.timeline} flush>
            <div className="demo-pad">
              <GanttTimeline
                items={RESERVATIONS}
                groups={VEHICULES}
                rowLabel="Véhicule"
                filters={reservationFilters}
                {...opts}
              />
            </div>
          </Demo>
          <Demo label="Phases d'un projet" hint="sans groupes · zoom masqué" flush>
            <div className="demo-pad">
              <GanttTimeline items={PHASES} rowLabel="Phase" zoom="week" showZoom={false} onItemClick={clicked} />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="notes"
          title="Grille de notes"
          source="app-note-grid"
          description="Notes teintées par tone (fond mélangé à la surface, lisible en clair comme en sombre), badge, échéance, progression et assigné."
        >
          <Demo label="Interventions" code={CODE.notes}>
            <NoteGrid items={INTERVENTIONS} filters={interventionFilters} {...opts} />
          </Demo>
        </DocSection>

        <DocSection
          id="grouped"
          title="Vue groupée"
          source="app-grouped-board"
          cols={2}
          description="Regroupement par n'importe quelle clé (technicien, véhicule, client…), avec progression moyenne, terminés et retards. Groupes repliables."
        >
          <Demo label="Par technicien (notes)" code={CODE.grouped}>
            <GroupedBoard items={INTERVENTIONS} groups={TECHNICIENS} filters={interventionFilters} {...opts} />
          </Demo>
          <Demo label="Par véhicule (liste)" hint='layout="list"'>
            <GroupedBoard
              items={RESERVATIONS}
              groups={VEHICULES}
              layout="list"
              showProgress={false}
              onItemClick={clicked}
            />
          </Demo>
        </DocSection>

        <DocSection
          id="calendar"
          title="Calendrier"
          source="app-month-calendar"
          description="Mois complet, éléments placés à leur date de début (sinon échéance), « +n autres » au-delà de maxPerDay, panneau du jour optionnel."
        >
          <Demo label="Échéances des interventions" hint="[showDayPanel]" code={CODE.calendar}>
            <MonthCalendar items={INTERVENTIONS} showDayPanel filters={interventionFilters} {...opts} />
          </Demo>
        </DocSection>

        <DocSection
          id="agenda"
          title="Agenda"
          source="app-agenda-view"
          description="Vues jour / semaine / mois. Grille horaire élargie automatiquement, chevauchements répartis côte à côte, ligne « maintenant », éléments « toute la journée »."
        >
          <Demo label="Rendez-vous de la semaine" code={CODE.agenda}>
            <AgendaView items={RENDEZ_VOUS} searchable={optSearch} filters={rdvFilters} onItemClick={clicked} />
          </Demo>
          <Demo label="Semaine de travail, vue unique" hint="[workWeek] · [views]">
            <AgendaView
              items={RENDEZ_VOUS}
              views={['week']}
              workWeek
              startHour={8}
              endHour={18}
              onItemClick={clicked}
            />
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}
