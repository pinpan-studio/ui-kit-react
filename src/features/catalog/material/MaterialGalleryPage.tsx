import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  ButtonBase,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from './dndModifiers';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './materialCode';
import {
  FAQ,
  FILE_TREE,
  FILTER_GROUPS,
  KANBAN,
  PERM_TREE,
  POSITIONS,
  PRIORITIES,
  SHARE_ACTIONS,
  TILES,
  isEmail,
  leaves,
  type KanbanItem,
  type TreeNode,
} from './materialData';
import './material-gallery.scss';

const TOC: TocItem[] = [
  { id: 'accordion', label: 'Accordion' },
  { id: 'tree', label: 'Tree' },
  { id: 'drag-drop', label: 'Drag & drop' },
  { id: 'chips-input', label: 'Chips input' },
  { id: 'card', label: 'Card' },
  { id: 'grid-list', label: 'Grid list' },
  { id: 'bottom-sheet', label: 'Bottom sheet' },
  { id: 'virtual-scroll', label: 'Virtual scroll' },
  { id: 'ripple', label: 'Ripple' },
];

const expandIcon = <MaterialIcon name="expand_more" />;

/** Panneau d'accordéon au rendu mat-expansion-panel (flat). */
function Panel({
  title,
  icon,
  desc,
  expanded,
  onToggle,
  disabled,
  before,
  toggle,
  lazy,
  children,
  actions,
}: {
  title: ReactNode;
  icon?: string;
  desc?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  before?: boolean;
  toggle?: ReactNode;
  lazy?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const isOpen = expanded ?? own;
  return (
    <Accordion
      disableGutters
      square
      elevation={0}
      className={`mat-expansion-panel${isOpen ? ' mat-expanded' : ''}`}
      expanded={isOpen}
      onChange={() => (onToggle ? onToggle() : setOwn((o) => !o))}
      disabled={disabled}
      slotProps={{ transition: { unmountOnExit: lazy }, heading: { component: 'div' } }}
    >
      <AccordionSummary
        expandIcon={toggle ? undefined : expandIcon}
        className={`mat-expansion-panel-header${before ? ' toggle-before' : ''}`}
      >
        <span className="pt-title">
          {icon && <MaterialIcon name={icon} className="pt-icon" />}
          {title}
        </span>
        {desc !== undefined && <span className="pt-desc">{desc}</span>}
        {toggle}
      </AccordionSummary>
      {children !== undefined && <AccordionDetails className="mat-expansion-panel-body">{children}</AccordionDetails>}
      {actions && <AccordionActions className="mat-action-row">{actions}</AccordionActions>}
    </Accordion>
  );
}

const Box = ({ label, icon, children }: { label: string; icon: string; children: ReactNode }) => (
  <div className="form-field">
    <label className="field-label">{label}</label>
    <div className="field-box">
      <MaterialIcon name={icon} />
      {children}
    </div>
  </div>
);

// ─── Tree ────────────────────────────────────────────────────────────────
function TreeView({
  nodes,
  expanded,
  onToggle,
  render,
}: {
  nodes: TreeNode[];
  expanded: Set<TreeNode>;
  onToggle: (n: TreeNode) => void;
  render: (n: TreeNode, open: boolean) => ReactNode;
}) {
  const rows: ReactNode[] = [];
  const walk = (list: TreeNode[], depth: number) => {
    for (const n of list) {
      const has = !!n.children?.length;
      const open = expanded.has(n);
      rows.push(
        <div
          key={`${depth}-${n.name}-${rows.length}`}
          role="treeitem"
          aria-level={depth + 1}
          aria-expanded={has ? open : undefined}
          className="mat-tree-node"
          style={{ paddingLeft: depth * 24 }}
        >
          {has ? (
            <IconButton aria-label={`Basculer ${n.name}`} onClick={() => onToggle(n)}>
              <MaterialIcon name={open ? 'expand_more' : 'chevron_right'} />
            </IconButton>
          ) : (
            <span className="tree-spacer" />
          )}
          {render(n, open)}
        </div>,
      );
      if (has && open) walk(n.children ?? [], depth + 1);
    }
  };
  walk(nodes, 0);
  return (
    <div role="tree" className="kit-tree">
      {rows}
    </div>
  );
}

const allNodes = (l: TreeNode[]): TreeNode[] => l.flatMap((n) => (n.children ? [n, ...allNodes(n.children)] : [n]));

// ─── Drag & drop ─────────────────────────────────────────────────────────
function SortableRow({ id, rank }: { id: string; rank: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      className={`dd-item${isDragging ? ' cdk-drag-preview' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined }}
    >
      <span
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Déplacer ${id}`}
        className="dd-handle-wrap"
      >
        <MaterialIcon name="drag_indicator" className="dd-handle" />
      </span>
      <span className="dd-rank">{rank}</span>
      <span>{id}</span>
    </div>
  );
}

function FreeNote({
  id,
  alt,
  icon,
  label,
  pos,
}: {
  id: string;
  alt?: boolean;
  icon: string;
  label: string;
  pos: { x: number; y: number };
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const x = pos.x + (transform?.x ?? 0);
  const y = pos.y + (transform?.y ?? 0);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`dd-free${alt ? ' alt' : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <MaterialIcon name={icon} /> {label}
    </div>
  );
}

function KanbanCard({ item, col }: { item: KanbanItem; col: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id, data: { col } });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`dd-card${isDragging ? ' cdk-drag-preview' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 5 : undefined, position: 'relative' }}
    >
      <span className="dd-card-id">{item.id}</span>
      <span className="dd-card-title">{item.title}</span>
      <span className="dd-card-tag">{item.tag}</span>
    </div>
  );
}

function KanbanCol({ id, label, items }: { id: string; label: string; items: KanbanItem[] }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="dd-col">
      <div className="dd-col-head">
        {label} <em className="count-pill">{items.length}</em>
      </div>
      <div ref={setNodeRef} id={id} className="dd-col-body">
        {items.length ? (
          items.map((it) => <KanbanCard key={it.id} item={it} col={id} />)
        ) : (
          <div className="dd-empty">Déposez une carte ici</div>
        )}
      </div>
    </div>
  );
}

// ─── Chips input ─────────────────────────────────────────────────────────
function ChipsInput({
  label,
  icon,
  values,
  onChange,
  placeholder,
  validate,
  addOnBlur,
  hint,
}: {
  label: string;
  icon: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  validate?: (v: string) => boolean;
  addOnBlur?: boolean;
  hint?: string;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
  };
  const commitEdit = (old: string) => {
    const v = editVal.trim();
    onChange(v ? values.map((x) => (x === old ? v : x)) : values.filter((x) => x !== old));
    setEditing(null);
  };
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      <div className="field-box chips-box">
        <MaterialIcon name={icon} />
        <div className="mat-chip-grid" role="grid" aria-label={label}>
          {values.map((v) =>
            editing === v ? (
              <input
                key={v}
                className="chip-edit"
                autoFocus
                value={editVal}
                aria-label={`Modifier ${v}`}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={() => commitEdit(v)}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit(v)}
              />
            ) : (
              <Chip
                key={v}
                className={`kit-chip-row${validate && !validate(v) ? ' chip-invalid' : ''}`}
                label={v}
                icon={validate && !validate(v) ? <MaterialIcon name="error" /> : undefined}
                onDoubleClick={() => {
                  setEditing(v);
                  setEditVal(v);
                }}
                onDelete={() => onChange(values.filter((x) => x !== v))}
                deleteIcon={<MaterialIcon name="cancel" aria-label={`Retirer ${v}`} />}
              />
            ),
          )}
          <input
            className="mat-mdc-chip-input"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(',', ''))}
            onKeyDown={onKey}
            onBlur={addOnBlur ? add : undefined}
          />
        </div>
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

// ─── Virtual scroll ──────────────────────────────────────────────────────
const ITEM = 52;
const VIEW = 320;
function VirtualList() {
  const [top, setTop] = useState(0);
  const first = Math.max(0, Math.floor(top / ITEM) - 2);
  const rows = POSITIONS.slice(first, first + Math.ceil(VIEW / ITEM) + 6);
  return (
    <div className="vs-viewport" onScroll={(e) => setTop(e.currentTarget.scrollTop)} style={{ overflowY: 'auto' }}>
      <div style={{ height: POSITIONS.length * ITEM, position: 'relative' }}>
        <div style={{ transform: `translateY(${first * ITEM}px)` }}>
          {rows.map((p) => (
            <div key={p.id} className="vs-row">
              <span className="vs-id">#{p.id}</span>
              <span className="vs-plate">{p.plaque}</span>
              <span className="vs-speed">{p.vitesse} km/h</span>
              <span className={`vs-status${p.online ? ' on' : ''}`}>{p.online ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');

/** Galerie /components/material — composants Material avancés (MaterialGalleryComponent). */
export function MaterialGalleryPage() {
  const snack = useSnackbar();
  const toast = (m: string) => snack(m, { duration: 2000 });

  // Accordion
  const [step, setStep] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [multi, setMulti] = useState<Set<number>>(new Set());
  const toggleMulti = (i: number) =>
    setMulti((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const [custom, setCustom] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [offre, setOffre] = useState('premium');
  const [filters, setFilters] = useState<Record<string, Set<string>>>({
    statut: new Set(['Actif']),
    ville: new Set(),
    offre: new Set(),
  });
  const [fgOpen, setFgOpen] = useState<Set<string>>(new Set(['statut']));
  const filterCount = Object.values(filters).reduce((n, s) => n + s.size, 0);
  const toggleFilter = (g: string, o: string) =>
    setFilters((f) => {
      const s = new Set(f[g]);
      if (s.has(o)) s.delete(o);
      else s.add(o);
      return { ...f, [g]: s };
    });

  // Tree
  const [fileOpen, setFileOpen] = useState<Set<TreeNode>>(new Set());
  const [permOpen, setPermOpen] = useState<Set<TreeNode>>(new Set());
  const [perms, setPerms] = useState<Set<TreeNode>>(new Set());
  const permTotal = useMemo(() => PERM_TREE.flatMap(leaves).length, []);
  const flip = (set: Set<TreeNode>, n: TreeNode) => {
    const s = new Set(set);
    if (s.has(n)) s.delete(n);
    else s.add(n);
    return s;
  };
  const permChecked = (n: TreeNode) => leaves(n).every((x) => perms.has(x));
  const permPartial = (n: TreeNode) => {
    const l = leaves(n);
    const k = l.filter((x) => perms.has(x)).length;
    return k > 0 && k < l.length;
  };
  const togglePerm = (n: TreeNode) => {
    const on = !permChecked(n);
    const s = new Set(perms);
    leaves(n).forEach((x) => (on ? s.add(x) : s.delete(x)));
    setPerms(s);
  };

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [priorities, setPriorities] = useState(PRIORITIES);
  const onSortEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id)
      setPriorities((p) => arrayMove(p, p.indexOf(String(active.id)), p.indexOf(String(over.id))));
  };
  const [notes, setNotes] = useState<Record<string, { x: number; y: number }>>({
    n1: { x: 0, y: 0 },
    n2: { x: 0, y: 0 },
  });
  const onFreeEnd = ({ active, delta }: DragEndEvent) => {
    const id = String(active.id);
    setNotes((n) => {
      const cur = n[id] ?? { x: 0, y: 0 };
      return { ...n, [id]: { x: cur.x + delta.x, y: cur.y + delta.y } };
    });
  };
  const [board, setBoard] = useState(KANBAN);
  const onKanbanEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const from = (active.data.current as { col: keyof typeof KANBAN }).col;
    const to = String(over.id) as keyof typeof KANBAN;
    if (from === to || (from === 'col-todo' && to === 'col-done')) return; // cdkDropListEnterPredicate
    setBoard((b) => {
      const item = b[from].find((i) => i.id === active.id);
      if (!item) return b;
      return { ...b, [from]: b[from].filter((i) => i.id !== active.id), [to]: [...b[to], item] };
    });
  };

  // Chips
  const [emails, setEmails] = useState(['k.yao@transports-yao.ci', 'compta@sotra.ci']);
  const [tags, setTags] = useState(['Premium', 'Abidjan', 'Flotte > 10']);

  // Grid / sheet / ripple
  const [gridCols, setGridCols] = useState(4);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetResult, setSheetResult] = useState('—');
  const closeSheet = (r?: string) => {
    setSheetOpen(false);
    setSheetResult(r ?? 'Fermé sans action');
  };
  const [centered, setCentered] = useState(false);
  const [unbounded, setUnbounded] = useState(false);

  return (
    <DocPage
      title="Material & CDK"
      icon="extension"
      className="gallery-material"
      subtitle="Composants Angular Material / CDK présents dans le barrel MaterialModule mais jusqu'ici non documentés : accordion, tree, drag & drop, chips input, card, grid list, bottom sheet, virtual scroll et ripple — tous interactifs, données locales."
      toc={TOC}
    >
      <DocSection
        id="accordion"
        title="Accordion / Expansion panel"
        source="mat-accordion · mat-expansion-panel (MatExpansionModule)"
        description="Panneaux dépliables : formulaire en étapes, ouverture multiple, variantes (toggle avant, sans icône, désactivé, contenu différé), FAQ stylée par jetons M3 et panneau de filtres."
      >
        <Demo label="Accordion en étapes" hint="un seul panneau ouvert · mat-action-row" code={CODE.accordion}>
          <div className="kit-accordion">
            <Panel
              icon="business"
              title="Informations client"
              desc="Raison sociale, contact"
              expanded={step === 0}
              onToggle={() => setStep(step === 0 ? -1 : 0)}
              actions={
                <Button variant="contained" onClick={() => setStep(1)}>
                  Suivant
                </Button>
              }
            >
              <div className="form-grid">
                <Box label="Raison sociale" icon="business">
                  <input defaultValue="Transports Yao SARL" />
                </Box>
                <Box label="Contact" icon="person">
                  <input defaultValue="Koffi Yao" />
                </Box>
              </div>
            </Panel>
            <Panel
              icon="local_shipping"
              title="Flotte"
              desc="Nombre de véhicules, offre"
              expanded={step === 1}
              onToggle={() => setStep(step === 1 ? -1 : 1)}
              actions={
                <>
                  <Button onClick={() => setStep(0)}>Précédent</Button>
                  <Button variant="contained" onClick={() => setStep(2)}>
                    Suivant
                  </Button>
                </>
              }
            >
              <div className="form-grid">
                <Box label="Véhicules" icon="local_shipping">
                  <input type="number" defaultValue={14} />
                </Box>
                <Box label="Offre" icon="sell">
                  <Select
                    variant="standard"
                    disableUnderline
                    value={offre}
                    onChange={(e) => setOffre(e.target.value)}
                    className="box-select"
                    MenuProps={{ className: 'm3-dropdown-menu' }}
                  >
                    <MenuItem value="essentiel">Essentiel</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="flotte">Flotte+</MenuItem>
                  </Select>
                </Box>
              </div>
            </Panel>
            <Panel
              icon="event"
              title="Installation"
              desc={stepDone ? 'Planifiée' : 'Date et lieu'}
              expanded={step === 2}
              onToggle={() => setStep(step === 2 ? -1 : 2)}
              actions={
                <>
                  <Button onClick={() => setStep(1)}>Précédent</Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setStepDone(true);
                      setStep(-1);
                      toast('Installation planifiée');
                    }}
                  >
                    Terminer
                  </Button>
                </>
              }
            >
              <div className="form-grid">
                <Box label="Lieu" icon="location_on">
                  <input defaultValue="Zone 4, Marcory — Abidjan" />
                </Box>
                <Box label="Créneau" icon="schedule">
                  <input defaultValue="Lundi 20/10, 08:00" />
                </Box>
              </div>
            </Panel>
          </div>
        </Demo>

        <div className="grid-2">
          <Demo label="Multi + tout déplier" hint='multi · displayMode="flat"' code={CODE.multi}>
            <div className="row acc-toolbar">
              <Button startIcon={<MaterialIcon name="unfold_more" />} onClick={() => setMulti(new Set([0, 1, 2]))}>
                Tout déplier
              </Button>
              <Button startIcon={<MaterialIcon name="unfold_less" />} onClick={() => setMulti(new Set())}>
                Tout replier
              </Button>
            </div>
            <div className="kit-accordion">
              <Panel title="Contrat" desc="CTR-2026-0031" expanded={multi.has(0)} onToggle={() => toggleMulti(0)}>
                <dl className="kv">
                  <dt>Début</dt>
                  <dd>01/01/2026</dd>
                  <dt>Échéance</dt>
                  <dd>31/12/2026</dd>
                  <dt>Montant</dt>
                  <dd>84 000 F / mois</dd>
                </dl>
              </Panel>
              <Panel title="Facturation" desc="Mensuelle" expanded={multi.has(1)} onToggle={() => toggleMulti(1)}>
                <dl className="kv">
                  <dt>Mode</dt>
                  <dd>Virement</dd>
                  <dt>Jour</dt>
                  <dd>Le 5 du mois</dd>
                </dl>
              </Panel>
              <Panel title="Historique" desc="3 événements" expanded={multi.has(2)} onToggle={() => toggleMulti(2)}>
                <ul className="mini-timeline">
                  <li>12/10 — Balise remplacée</li>
                  <li>02/09 — Avenant signé</li>
                  <li>05/01 — Contrat créé</li>
                </ul>
              </Panel>
            </div>
          </Demo>

          <Demo label="Variantes" hint="togglePosition · hideToggle · disabled · lazy" code={CODE.variants}>
            <div className="kit-accordion">
              <Panel title="Toggle avant le titre" before>
                <p className="p">
                  L&apos;indicateur est placé à gauche (<code>togglePosition=&quot;before&quot;</code>), utile pour les
                  arborescences.
                </p>
              </Panel>
              <Panel
                title="Icône personnalisée"
                expanded={custom}
                onToggle={() => setCustom((c) => !c)}
                toggle={<MaterialIcon name={custom ? 'remove' : 'add'} className="custom-toggle" />}
              >
                <p className="p">
                  <code>hideToggle</code> + icône pilotée par <code>panel.expanded</code>.
                </p>
              </Panel>
              <Panel title="Panneau désactivé" desc="Permission requise" disabled />
              <Panel title="Contenu différé" desc="rendu à l'ouverture" lazy>
                <p className="p">
                  Ce contenu n&apos;est instancié qu&apos;à la première ouverture (<code>matExpansionPanelContent</code>
                  ) — idéal pour des tableaux lourds.
                </p>
              </Panel>
            </div>
          </Demo>
        </div>

        <div className="grid-2">
          <Demo label="FAQ" hint="jetons --mat-expansion-*" code={CODE.faq} muted>
            <div className="kit-faq">
              {FAQ.map((item, i) => (
                <Panel
                  key={item.q}
                  title={item.q}
                  expanded={faqOpen === i}
                  onToggle={() => setFaqOpen(faqOpen === i ? -1 : i)}
                >
                  <p className="p">{item.a}</p>
                </Panel>
              ))}
            </div>
          </Demo>

          <Demo label="Panneau de filtres" hint={`${filterCount} filtre(s) actif(s)`}>
            <div className="filters-panel">
              <div className="fp-head">
                <strong>
                  <MaterialIcon name="tune" /> Filtres
                </strong>
                <Button
                  disabled={!filterCount}
                  onClick={() => setFilters({ statut: new Set(), ville: new Set(), offre: new Set() })}
                >
                  Réinitialiser
                </Button>
              </div>
              <div className="kit-accordion compact">
                {FILTER_GROUPS.map((g) => {
                  const n = filters[g.key]?.size ?? 0;
                  return (
                    <Panel
                      key={g.key}
                      icon={g.icon}
                      title={g.label}
                      desc={n ? <em className="count-pill">{n}</em> : undefined}
                      expanded={fgOpen.has(g.key)}
                      onToggle={() =>
                        setFgOpen((s) => {
                          const x = new Set(s);
                          if (x.has(g.key)) x.delete(g.key);
                          else x.add(g.key);
                          return x;
                        })
                      }
                    >
                      <div className="fp-options">
                        {g.options.map((o) => (
                          <FormControlLabel
                            key={o}
                            control={
                              <Checkbox
                                checked={filters[g.key]?.has(o) ?? false}
                                onChange={() => toggleFilter(g.key, o)}
                              />
                            }
                            label={o}
                          />
                        ))}
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection
        id="tree"
        title="Tree"
        source="mat-tree · childrenAccessor (MatTreeModule)"
        cols={2}
        description="Arborescences avec l'API moderne childrenAccessor (TreeControl est déprécié) : explorateur de fichiers et arbre de permissions à cases tri-état."
      >
        <Demo label="Explorateur de fichiers" code={CODE.tree}>
          <div className="row acc-toolbar">
            <Button
              startIcon={<MaterialIcon name="unfold_more" />}
              onClick={() => setFileOpen(new Set(allNodes(FILE_TREE).filter((n) => n.children)))}
            >
              Déplier
            </Button>
            <Button startIcon={<MaterialIcon name="unfold_less" />} onClick={() => setFileOpen(new Set())}>
              Replier
            </Button>
          </div>
          <TreeView
            nodes={FILE_TREE}
            expanded={fileOpen}
            onToggle={(n) => setFileOpen(flip(fileOpen, n))}
            render={(n, open) =>
              n.children ? (
                <>
                  <MaterialIcon name={open ? 'folder_open' : 'folder'} className="node-icon folder" />
                  <span className="node-name">{n.name}</span>
                  <span className="node-meta">{n.children.length}</span>
                </>
              ) : (
                <>
                  <MaterialIcon name={n.icon ?? 'description'} className="node-icon file" />
                  <span className="node-name">{n.name}</span>
                  {n.meta && <span className="node-meta">{n.meta}</span>}
                </>
              )
            }
          />
        </Demo>
        <Demo label="Permissions (tri-état)" hint={`${perms.size} / ${permTotal} accordées`}>
          <TreeView
            nodes={PERM_TREE}
            expanded={permOpen}
            onToggle={(n) => setPermOpen(flip(permOpen, n))}
            render={(n) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={permChecked(n)}
                    indeterminate={!!n.children && permPartial(n)}
                    onChange={() => togglePerm(n)}
                  />
                }
                label={n.children ? <strong>{n.name}</strong> : n.name}
              />
            )}
          />
        </Demo>
      </DocSection>

      <DocSection
        id="drag-drop"
        title="Drag & drop"
        source="cdkDropList · cdkDrag (DragDropModule)"
        description="Réordonnancement d'une liste avec poignée et placeholder, transfert entre colonnes avec prédicat d'entrée, et déplacement libre borné."
      >
        <div className="grid-2">
          <Demo label="Liste triable" hint="poignée · placeholder" code={CODE.dragList}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onSortEnd}
            >
              <SortableContext items={priorities} strategy={verticalListSortingStrategy}>
                <div className="dd-list">
                  {priorities.map((p, i) => (
                    <SortableRow key={p} id={p} rank={i + 1} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Demo>
          <Demo label="Déplacement libre" hint="cdkDragBoundary">
            <DndContext sensors={sensors} modifiers={[restrictToParentElement]} onDragEnd={onFreeEnd}>
              <div className="dd-zone">
                <FreeNote id="n1" icon="sticky_note_2" label="Glissez-moi" pos={notes.n1 ?? { x: 0, y: 0 }} />
                <FreeNote id="n2" alt icon="push_pin" label="Et moi aussi" pos={notes.n2 ?? { x: 0, y: 0 }} />
              </div>
            </DndContext>
          </Demo>
        </div>
        <Demo
          label="Colonnes connectées"
          hint="« À faire » → « Terminé » interdit (cdkDropListEnterPredicate)"
          code={CODE.dragKanban}
        >
          <DndContext sensors={sensors} onDragEnd={onKanbanEnd}>
            <div className="dd-board">
              <KanbanCol id="col-todo" label="À faire" items={board['col-todo']} />
              <KanbanCol id="col-doing" label="En cours" items={board['col-doing']} />
              <KanbanCol id="col-done" label="Terminé" items={board['col-done']} />
            </div>
          </DndContext>
        </Demo>
      </DocSection>

      <DocSection
        id="chips-input"
        title="Chips input"
        source="mat-chip-grid · mat-chip-row · matChipInputFor"
        cols={2}
        description="Saisie de valeurs multiples : Entrée ou virgule pour valider, double-clic pour éditer, validation visuelle par chip."
      >
        <Demo label="Destinataires (validation email)" code={CODE.chips}>
          <ChipsInput
            label="Destinataires"
            icon="alternate_email"
            values={emails}
            onChange={setEmails}
            placeholder="Ajouter une adresse…"
            validate={isEmail}
            addOnBlur
            hint="Entrée ou virgule pour ajouter · double-clic pour modifier"
          />
        </Demo>
        <Demo label="Étiquettes">
          <ChipsInput
            label="Étiquettes client"
            icon="sell"
            values={tags}
            onChange={setTags}
            placeholder="Nouvelle étiquette…"
          />
        </Demo>
      </DocSection>

      <DocSection
        id="card"
        title="Card"
        source="mat-card · appearance (MatCardModule)"
        cols={3}
        description="Cartes Material natives : en-tête avec avatar, média, actions alignées, variante outlined / raised."
      >
        <Demo label="Outlined + actions" code={CODE.card}>
          <Card variant="outlined" className="kit-card mat-mdc-card">
            <CardHeader
              avatar={<div className="card-avatar mat-mdc-card-avatar">TY</div>}
              title="Transports Yao SARL"
              subheader="Client depuis 2021 · Abidjan"
            />
            <CardContent>
              <p className="p">14 véhicules suivis, offre Premium. Dernière facture réglée le 05/10.</p>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => toast('Ouverture de la fiche')}>Détails</Button>
              <Button variant="contained" onClick={() => toast('Appel en cours…')}>
                Contacter
              </Button>
            </CardActions>
          </Card>
        </Demo>
        <Demo label="Média + footer">
          <Card variant="outlined" className="kit-card mat-mdc-card">
            <div className="card-media">
              <MaterialIcon name="route" />
            </div>
            <CardHeader title="Trajet CI-4521-AB" subheader="Abidjan → Yamoussoukro" />
            <CardContent>
              <p className="p">238 km · 3 h 12 · 2 arrêts</p>
            </CardContent>
            <Divider />
            <div className="card-footer">
              <MaterialIcon name="schedule" /> Mis à jour il y a 4 min
            </div>
          </Card>
        </Demo>
        <Demo label="Raised (KPI)">
          <Card elevation={1} className="kit-card mat-mdc-card raised">
            <CardContent className="kpi">
              <span className="kpi-label">CA du mois</span>
              <strong className="kpi-value">{fmt(12480000)} F</strong>
              <span className="kpi-trend up">
                <MaterialIcon name="trending_up" /> +8,4 % vs septembre
              </span>
            </CardContent>
          </Card>
        </Demo>
      </DocSection>

      <DocSection
        id="grid-list"
        title="Grid list"
        source="mat-grid-list · mat-grid-tile (MatGridListModule)"
        description="Grille à tuiles avec colspan / rowspan — pratique pour des mosaïques de widgets."
      >
        <Demo label="Mosaïque de dashboard" code={CODE.grid}>
          <div className="row acc-toolbar">
            <span className="muted">Colonnes :</span>
            <ToggleButtonGroup exclusive value={gridCols} onChange={(_, v: number | null) => v && setGridCols(v)}>
              <ToggleButton value={2}>
                {gridCols === 2 && <MaterialIcon name="check" className="seg-check" />}2
              </ToggleButton>
              <ToggleButton value={4}>
                {gridCols === 4 && <MaterialIcon name="check" className="seg-check" />}4
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <div className="kit-grid-list" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {TILES.map((t) => (
              <div
                key={t.label}
                className={`tile tone-${t.tone}`}
                style={{ gridColumn: `span ${Math.min(t.cols, gridCols)}`, gridRow: `span ${t.rows}` }}
              >
                <div className="tile-inner">
                  <MaterialIcon name={t.icon} />
                  <span>{t.label}</span>
                </div>
              </div>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="bottom-sheet"
        title="Bottom sheet"
        source="MatBottomSheet (MatBottomSheetModule)"
        description="Feuille d'actions ancrée en bas de l'écran, idéale sur mobile. Le résultat est renvoyé via afterDismissed()."
      >
        <Demo label="Actions de partage" hint={`Résultat : ${sheetResult}`} code={CODE.sheet}>
          <Button variant="contained" startIcon={<MaterialIcon name="ios_share" />} onClick={() => setSheetOpen(true)}>
            Partager la proforma
          </Button>
          <Drawer
            anchor="bottom"
            open={sheetOpen}
            onClose={() => closeSheet()}
            className="kit-bottom-sheet"
            PaperProps={{ className: 'kit-bottom-sheet-paper' }}
          >
            <div className="sheet-head">
              <strong>Proforma PRO-2026-0412</strong>
              <span>Choisissez une action</span>
            </div>
            <List>
              {SHARE_ACTIONS.map((a) => (
                <ListItemButton key={a.key} onClick={() => closeSheet(a.key)}>
                  <ListItemIcon>
                    <MaterialIcon name={a.icon} />
                  </ListItemIcon>
                  <ListItemText primary={a.label} secondary={a.hint} />
                </ListItemButton>
              ))}
            </List>
          </Drawer>
        </Demo>
      </DocSection>

      <DocSection
        id="virtual-scroll"
        title="Virtual scroll"
        source="cdk-virtual-scroll-viewport (ScrollingModule)"
        description="10 000 lignes rendues sans ralentissement : seules les lignes visibles existent dans le DOM."
      >
        <Demo label="Positions de la flotte" hint={`${fmt(POSITIONS.length)} lignes`} code={CODE.virtual} flush>
          <VirtualList />
        </Demo>
      </DocSection>

      <DocSection
        id="ripple"
        title="Ripple"
        source="matRipple (MatRippleModule)"
        description="Effet d'onde Material applicable à n'importe quelle surface cliquable personnalisée."
      >
        <Demo label="Surface personnalisée" code={CODE.ripple}>
          <div className="row acc-toolbar">
            <FormControlLabel
              control={<Switch checked={centered} onChange={(e) => setCentered(e.target.checked)} />}
              label="Centré"
            />
            <FormControlLabel
              control={<Switch checked={unbounded} onChange={(e) => setUnbounded(e.target.checked)} />}
              label="Non borné"
            />
          </div>
          <div className={`ripple-row${unbounded ? ' unbounded' : ''}`}>
            <ButtonBase component="div" className="ripple-surface" centerRipple={centered}>
              <MaterialIcon name="touch_app" /> Cliquez ici
            </ButtonBase>
            <ButtonBase component="div" className="ripple-surface primary" centerRipple={centered}>
              <MaterialIcon name="palette" /> Couleur primaire
            </ButtonBase>
            <ButtonBase component="div" className="ripple-surface round" centerRipple aria-label="Favori">
              <MaterialIcon name="favorite" />
            </ButtonBase>
          </div>
        </Demo>
      </DocSection>
    </DocPage>
  );
}
