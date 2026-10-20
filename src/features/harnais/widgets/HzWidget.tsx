import { Accordion, AccordionDetails, AccordionSummary, Button, Tab, Tabs } from '@mui/material';
import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { useDialog } from '../../../components/feedback/dialogs/useDialog';
import { MapView } from '../../../components/map/MapView';
import { AgendaView } from '../../../components/planning/AgendaView';
import { GanttTimeline } from '../../../components/planning/GanttTimeline';
import { KanbanBoard } from '../../../components/planning/KanbanBoard';
import { MonthCalendar } from '../../../components/planning/MonthCalendar';
import type { PlanningItem } from '../../../components/planning/planningModels';
import type { KanbanMove } from '../../../components/planning/planningTypes';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { HARNAIS_ATTACHABLE, type HarnaisWidget, type HzOption } from '../../../data/static/harnais.data';
import { HzCarousel } from './HzCarousel';
import { HzChart } from './HzChart';
import { HzContent } from './HzContent';
import { HzForm } from './HzForm';
import { HzMedia } from './HzMedia';
import { HzModalDialog } from './HzModalDialog';
import { HzRich } from './HzRich';
import { HzTable } from './HzTable';
import { HzTree } from './HzTree';
import { jsonToNodes } from './hzTree';
import './widget.scss';

const UNFRAMED = ['stats', 'choices', 'callout', 'approval', 'paragraph', 'result', 'banner'];
const DEFAULT_ICONS: Record<string, string> = {
  chart: 'insights',
  table: 'table_rows',
  map: 'map',
  form: 'edit_note',
  records: 'list_alt',
  timeline: 'history',
  calendar: 'calendar_month',
  kanban: 'view_kanban',
  gantt: 'timeline',
  agenda: 'today',
  tree: 'account_tree',
  json: 'data_object',
  carousel: 'view_carousel',
  modal: 'open_in_full',
  tabs: 'tab',
  accordion: 'view_agenda',
  steps: 'linear_scale',
  keyvalue: 'badge',
  checklist: 'checklist',
  progress: 'track_changes',
  diff: 'difference',
  sources: 'travel_explore',
  tags: 'sell',
  heatmap: 'grid_on',
  files: 'folder',
  cards: 'grid_view',
  compare: 'compare',
  upload: 'upload_file',
  typography: 'text_fields',
  article: 'article',
  comments: 'forum',
  video: 'smart_display',
  videos: 'video_library',
  audio: 'graphic_eq',
  pdf: 'picture_as_pdf',
  gallery: 'photo_library',
  image: 'image',
  qrcode: 'qr_code_2',
  textdiff: 'difference',
  audit: 'manage_history',
};

const formatSize = (n: number) =>
  n < 1024 ? `${n} o` : n < 1048576 ? `${Math.round(n / 1024)} Ko` : `${(n / 1048576).toFixed(1).replace('.', ',')} Mo`;
/** Chemin SVG d'une mini-courbe (0–100 × 0–28), avec option aire remplie. */
function sparkPath(values: number[], area = false): string {
  const min = Math.min(...values),
    max = Math.max(...values),
    span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / span) * 22}`);
  return 'M' + pts.join(' L') + (area ? ' L100,28 L0,28 Z' : '');
}
const riskLabel = (r?: string) =>
  ({ error: 'élevé', warning: 'modéré', success: 'faible', info: 'faible' })[r ?? 'warning'] ?? 'modéré';
const trendIcon = (t?: string) => (t === 'down' ? 'south_east' : t === 'flat' ? 'east' : 'north_east');
const toneVar = (tone?: string) =>
  !tone || tone === 'neutral'
    ? 'var(--text-muted)'
    : tone === 'primary'
      ? 'var(--primary-color)'
      : `var(--${tone}-color)`;
const toneClass = (tone?: string) => (!tone || tone === 'primary' ? 'info' : tone);
const tone = (t?: string) => ({ '--tone': toneVar(t) }) as CSSProperties;

/** Composant du kit rendu dans un widget : hors de portée des styles du widget (comme l'encapsulation Angular). */
const Kit = ({ children }: { children: ReactNode }) => (
  <div className="hz-kit" style={{ display: 'contents' }}>
    {children}
  </div>
);

/**
 * Rendu d'un widget de réponse. Les widgets « encadrés » (graphique, tableau, carte, formulaire…)
 * partagent une carte avec en-tête ; indicateurs, choix et encadrés s'affichent à nu.
 */
export function HzWidget({
  block: b,
  busy = false,
  onFormSubmit,
  onChoose,
}: {
  block: HarnaisWidget;
  /** Interactions bloquées pendant la génération. */
  busy?: boolean;
  onFormSubmit?: (values: Record<string, unknown>) => void;
  onChoose?: (option: HzOption) => void;
}) {
  const open = useDialog();
  /** Kanban : copie locale pour que le glisser-déposer persiste. */
  const [moved, setMoved] = useState<PlanningItem[] | null>(null);
  const [tab, setTab] = useState(0);
  const [accOpen, setAccOpen] = useState<Set<number>>(
    () => new Set(b.type === 'accordion' ? b.items.flatMap((it, i) => (it.open ? [i] : [])) : []),
  );

  const choose = (o: HzOption) => onChoose?.(o);
  const pickFile = (file: File | undefined) => {
    if (file && !busy) choose({ value: 'upload', label: `${file.name} (${formatSize(file.size)})` });
  };

  const nested = (blocks: HarnaisWidget[]) => (
    <div className="nested">
      {blocks.map((n, i) => (
        <HzWidget key={i} block={n} busy={busy} />
      ))}
    </div>
  );

  if (UNFRAMED.includes(b.type)) {
    return <div className="hz-widget">{renderBare()}</div>;
  }

  const head = b as { title?: string; subtitle?: string; icon?: string };
  return (
    <div className="hz-widget">
      <section className={`frame${b.type === 'map' || b.type === 'table' ? ' flush' : ''}`}>
        {head.title && (
          <header className="frame-head">
            <span className="frame-icon">
              <MaterialIcon name={head.icon ?? DEFAULT_ICONS[b.type] ?? 'widgets'} />
            </span>
            <div className="frame-text">
              <span className="frame-title">{head.title}</span>
              {head.subtitle && <span className="frame-sub">{head.subtitle}</span>}
            </div>
          </header>
        )}
        <div className="frame-body">{renderFramed()}</div>
      </section>
    </div>
  );

  function renderFramed(): ReactNode {
    switch (b.type) {
      case 'chart':
        return <HzChart block={b} />;
      case 'table':
        return <HzTable block={b} />;
      case 'form':
        return <HzForm block={b} disabled={busy} onSubmit={(v) => onFormSubmit?.(v)} />;
      case 'map':
        return (
          <MapView
            markers={b.markers}
            routes={b.routes ?? []}
            zones={b.zones ?? []}
            height={(b.height ?? 320) + 'px'}
            scale
            overlay={
              b.legend?.length ? (
                <div className="legend">
                  {b.legend.map((l) => (
                    <span key={l.label}>
                      <i style={{ background: toneVar(l.tone) }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              ) : undefined
            }
          />
        );
      case 'records':
        return (
          <ul className="records">
            {b.items.map((r) => (
              <li key={r.id}>
                <span className="rec-ava" style={tone(r.tone)}>
                  {r.icon ? <MaterialIcon name={r.icon} /> : r.initials}
                </span>
                <span className="rec-main">
                  <span className="rec-title">{r.title}</span>
                  {r.subtitle && <span className="rec-sub">{r.subtitle}</span>}
                  {!!r.tags?.length && (
                    <span className="rec-tags">
                      {r.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="rec-side">
                  {r.badge && <span className={`m3-badge ${toneClass(r.badge.tone)}`}>{r.badge.label}</span>}
                  {r.meta && <span className="rec-meta">{r.meta}</span>}
                </span>
              </li>
            ))}
          </ul>
        );
      case 'timeline':
        return (
          <ol className="timeline">
            {b.items.map((t, i) => (
              <li key={i} style={tone(t.tone)}>
                <span className="tl-time">{t.time}</span>
                <span className="tl-dot">
                  <MaterialIcon name={t.icon ?? 'circle'} />
                </span>
                <span className="tl-main">
                  <span className="tl-title">{t.title}</span>
                  {t.text && <span className="tl-text">{t.text}</span>}
                </span>
              </li>
            ))}
          </ol>
        );
      case 'calendar':
        return (
          <div className="planning">
            <Kit>
              <MonthCalendar items={b.items} maxPerDay={2} />
            </Kit>
          </div>
        );
      case 'kanban':
        return (
          <div className="planning">
            <Kit>
              <KanbanBoard
                columns={b.columns}
                items={moved ?? b.items}
                onItemMoved={(m: KanbanMove) =>
                  setMoved((moved ?? b.items).map((i) =>
                    i.id === m.item.id ? { ...i, status: m.to, done: m.to === 'done' } : i,
                  ))
                }
              />
            </Kit>
          </div>
        );
      case 'gantt':
        return (
          <div className="planning">
            <Kit>
              <GanttTimeline items={b.items} groups={b.groups ?? null} rowLabel="Équipe" />
            </Kit>
          </div>
        );
      case 'agenda':
        return (
          <div className="planning agenda">
            <Kit>
              <AgendaView items={b.items} views={['day', 'week']} startHour={8} endHour={18} />
            </Kit>
          </div>
        );

      // Navigation dans l'information
      case 'tree':
        return (
          <HzTree
            nodes={b.nodes}
            selectable={!!b.selectable}
            submitLabel={b.submitLabel ?? 'Valider la sélection'}
            answered={b.selected}
            onSubmit={(labels) => choose({ value: 'tree', label: 'Sélection : ' + labels.join(', ') })}
          />
        );
      case 'json':
        return <HzTree nodes={jsonToNodes(b.data, 'réponse')} mono />;
      case 'carousel':
        return <HzCarousel slides={b.slides} />;
      case 'modal':
        return (
          <div className="modal-card">
            <p>{b.summary}</p>
            <Button
              variant="contained"
              disableElevation
              onClick={() =>
                void open<undefined>(
                  (d) => (
                    <HzModalDialog
                      data={{ title: b.dialogTitle, subtitle: b.dialogSubtitle, icon: b.icon, blocks: b.blocks }}
                      dialog={d}
                    />
                  ),
                  { width: '760px', autoFocus: false, panelClass: 'hz-modal-panel' },
                )
              }
            >
              <MaterialIcon name="open_in_full" />
              {b.button ?? 'Voir le détail'}
            </Button>
          </div>
        );
      case 'tabs':
        return (
          <div className="hz-tabs">
            <Tabs
              value={tab}
              onChange={(_, v: number) => setTab(v)}
              className="mat-tab-group mat-mdc-tab-header"
              variant="scrollable"
              scrollButtons={false}
            >
              {b.tabs.map((t) => (
                <Tab
                  key={t.label}
                  label={
                    <span className="tab-label">
                      {t.icon && <MaterialIcon name={t.icon} className="tab-ic" />}
                      {t.label}
                      {t.badge && <span className="tab-badge">{t.badge}</span>}
                    </span>
                  }
                />
              ))}
            </Tabs>
            <div className="mat-mdc-tab-body-content">{nested(b.tabs[tab]?.blocks ?? [])}</div>
          </div>
        );
      case 'accordion':
        return (
          <div className="hz-accordion">
            {b.items.map((it, i) => (
              <Accordion
                key={it.title}
                disableGutters
                elevation={0}
                className={`mat-expansion-panel${accOpen.has(i) ? ' mat-expanded' : ''}`}
                expanded={accOpen.has(i)}
                onChange={() =>
                  setAccOpen((s) => {
                    const n = new Set(s);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
                slotProps={{ heading: { component: 'div' } }}
              >
                <AccordionSummary
                  expandIcon={<MaterialIcon name="expand_more" />}
                  className="mat-expansion-panel-header"
                >
                  <span className="mat-expansion-panel-header-title">
                    {it.icon && <MaterialIcon name={it.icon} className="acc-ic" />}
                    {it.title}
                  </span>
                  {it.subtitle && <span className="mat-expansion-panel-header-description">{it.subtitle}</span>}
                </AccordionSummary>
                <AccordionDetails className="mat-expansion-panel-body">{nested(it.blocks)}</AccordionDetails>
              </Accordion>
            ))}
          </div>
        );

      // Interaction
      case 'upload':
        return b.selected ? (
          <div className="upload-done">
            <MaterialIcon name="task" />
            <span>{b.selected}</span>
            <span className="ok">Envoyé</span>
          </div>
        ) : (
          <>
            <label
              className={`dropzone${busy ? ' disabled' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept={b.accept}
                disabled={busy}
                onChange={(e) => pickFile(e.target.files?.[0])}
                hidden
              />
              <MaterialIcon name="cloud_upload" />
              <strong>Déposez un fichier ou cliquez pour parcourir</strong>
              <span>{b.hint ?? 'Le fichier reste sur votre poste : il est lu localement.'}</span>
            </label>
            <div className="samples">
              <span>Ou un exemple :</span>
              {HARNAIS_ATTACHABLE.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  disabled={busy}
                  onClick={() => choose({ value: 'upload', label: f.name + ' (' + f.size + ')' })}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </>
        );

      // Médias
      case 'video':
      case 'videos':
      case 'audio':
      case 'pdf':
      case 'gallery':
      case 'image':
        return <HzMedia block={b} />;

      // Contenu, typographie et précision (suite)
      case 'typography':
      case 'article':
      case 'comments':
      case 'qrcode':
      case 'textdiff':
      case 'audit':
        return <HzContent block={b} />;

      // Précision : fiche, étapes, checklist, objectifs, diff, sources, tags, heatmap, fichiers, cartes, comparatif
      default:
        return <HzRich block={b} />;
    }
  }

  function renderBare(): ReactNode {
    switch (b.type) {
      case 'stats':
        return (
          <div className="stats">
            {b.items.map((s) => (
              <div key={s.label} className="stat" style={tone(s.tone)}>
                <div className="stat-head">
                  {s.icon && (
                    <span className="stat-icon">
                      <MaterialIcon name={s.icon} />
                    </span>
                  )}
                  <span className="stat-label">{s.label}</span>
                </div>
                <div className="stat-value">{s.value}</div>
                {!!s.spark?.length && (
                  <svg className="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
                    <path className="area" d={sparkPath(s.spark, true)} />
                    <path className="line" d={sparkPath(s.spark)} />
                  </svg>
                )}
                <div className="stat-foot">
                  {s.delta && (
                    <span className={`delta ${s.trend ?? 'up'}`}>
                      <MaterialIcon name={trendIcon(s.trend)} />
                      {s.delta}
                    </span>
                  )}
                  {s.hint && <span className="stat-hint">{s.hint}</span>}
                </div>
              </div>
            ))}
          </div>
        );
      case 'callout':
        return (
          <div className="callout" style={tone(b.tone)} role="note">
            <MaterialIcon name={b.icon ?? 'info'} />
            <div>
              <strong>{b.title}</strong>
              <p>{b.text}</p>
            </div>
          </div>
        );
      case 'paragraph':
        return <p className="paragraph">{b.text}</p>;
      case 'result':
      case 'banner':
        return <HzContent block={b} />;
      case 'approval':
        return (
          <div className={`approval${b.selected ? ' answered' : ''}`} style={tone(b.risk ?? 'warning')}>
            <div className="ap-head">
              <span className="ap-icon">
                <MaterialIcon name="shield" />
              </span>
              <div className="ap-text">
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
              <span className={`m3-badge ${b.risk ?? 'warning'}`}>Risque {riskLabel(b.risk)}</span>
            </div>
            {b.command && (
              <pre className="ap-cmd">
                <code>{b.command}</code>
              </pre>
            )}
            <div className="ap-actions">
              {b.selected ? (
                <span className={`ap-result${b.selected === 'approve' ? ' ok' : ''}`}>
                  <MaterialIcon name={b.selected === 'approve' ? 'check_circle' : 'block'} />
                  {b.selected === 'approve' ? 'Autorisé' : 'Refusé'}
                </span>
              ) : (
                <>
                  <Button disabled={busy} onClick={() => choose({ value: 'reject', label: 'Refuser' })}>
                    Refuser
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled={busy}
                    onClick={() => choose({ value: 'approve', label: 'Autoriser pour cette session' })}
                  >
                    Toujours autoriser
                  </Button>
                  <Button
                    variant="contained"
                    disableElevation
                    disabled={busy}
                    onClick={() => choose({ value: 'approve', label: 'Autoriser' })}
                  >
                    <MaterialIcon name="check" />
                    Autoriser
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      case 'choices':
        return (
          <div className="choices">
            {b.question && <span className="choices-q">{b.question}</span>}
            <div className="choices-list">
              {b.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`choice${b.selected === o.value ? ' on' : ''}`}
                  disabled={!!b.selected || busy}
                  onClick={() => choose(o)}
                >
                  {o.icon && <MaterialIcon name={o.icon} />}
                  <span>{o.label}</span>
                  {b.selected === o.value && <MaterialIcon name="check" className="check" />}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  }
}
