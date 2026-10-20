import { Button, Divider, FormControlLabel, IconButton, ListItemIcon, Menu, MenuItem, Switch } from '@mui/material';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useMemo, useState, type ReactNode } from 'react';
import { Chart } from 'react-chartjs-2';
import { StatusBadge } from '../../../components/content/StatusBadge';
import { Tip } from '../../../components/fields/Tip';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { FilterDropdown } from '../../../components/forms/FilterDropdown';
import { ViewModeToggle } from '../../../components/interaction/ViewModeToggle';
import {
  MatBadgeContent,
  MatChip,
  MatChipSet,
  MatList,
  MatListItem,
  MatProgressBar,
  MatSelectionList,
  MatSpinner,
  MdcCheckbox,
} from '../../../components/mat/MatData';
import { SORT_ARROW, matBadgeClass } from '../../../components/mat/matUtils';
import { Paginator } from '../../../components/navigation/Paginator';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEMO_CLIENTS, STATUT_COLOR, TIMELINE_EVENTS, type DemoClient } from '../../../data/static/showcase.data';
import { useThemeMode } from '../../../hooks/useThemeMode';
import { Demo, DocSection } from '../doc/Doc';
import { DataCharts } from './dataCharts';
import { CODE } from './dataCode';

ChartJS.register(...registerables);

type TableState = 'normal' | 'loading' | 'empty' | 'error';
type ViewMode = 'card' | 'list';
const STATES: TableState[] = ['normal', 'loading', 'empty', 'error'];
const STATE_LABEL: Record<TableState, string> = {
  normal: 'Normal',
  loading: 'Loading',
  empty: 'Empty',
  error: 'Error',
};
const STATUT_OPTIONS = [
  { value: '', label: 'Tous', icon: 'list' },
  { value: 'ACTIF', label: 'Actifs', icon: 'check_circle' },
  { value: 'SUSPENDU', label: 'Suspendus', icon: 'pause_circle' },
  { value: 'INACTIF', label: 'Inactifs', icon: 'remove_circle_outline' },
  { value: 'RESILIE', label: 'Résiliés', icon: 'cancel' },
];
const fr = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ');
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
const people = DEMO_CLIENTS.slice(0, 5);
const color = (s: DemoClient['statut']) => STATUT_COLOR[s];
const fmtDate = (d: string | Date) => {
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(x.getDate())}/${p(x.getMonth() + 1)}/${x.getFullYear()} ${p(x.getHours())}:${p(x.getMinutes())}`;
};
const Ic = (n: string) => <MaterialIcon name={n} />;

function RowMenu({ onDelete }: { onDelete: () => void }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tip title="Options">
        <IconButton className="action-icon-btn" aria-label="Options" onClick={(e) => setEl(e.currentTarget)}>
          {Ic('more_vert')}
        </IconButton>
      </Tip>
      <Menu
        anchorEl={el}
        open={!!el}
        onClose={() => setEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => setEl(null)}>
          <ListItemIcon>{Ic('visibility')}</ListItemIcon>Voir la fiche
        </MenuItem>
        <MenuItem onClick={() => setEl(null)}>
          <ListItemIcon>{Ic('edit')}</ListItemIcon>Modifier
        </MenuItem>
        <Divider />
        <MenuItem
          className="menu-danger"
          onClick={() => {
            setEl(null);
            onDelete();
          }}
        >
          <ListItemIcon>{Ic('delete')}</ListItemIcon>Supprimer
        </MenuItem>
      </Menu>
    </>
  );
}

/** mat-table + matSort (en-têtes triables, ordre asc → desc → aucun). */
function MatSortTable() {
  const [sort, setSort] = useState<{ k: keyof DemoClient; d: 'asc' | 'desc' } | null>(null);
  const data = useMemo(() => {
    const rows = DEMO_CLIENTS.slice(0, 10);
    if (!sort) return rows;
    const m = sort.d === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (a[sort.k] > b[sort.k] ? m : a[sort.k] < b[sort.k] ? -m : 0));
  }, [sort]);
  const click = (k: keyof DemoClient) =>
    setSort(!sort || sort.k !== k ? { k, d: 'asc' } : sort.d === 'asc' ? { k, d: 'desc' } : null);
  const th = (k: keyof DemoClient, label: string, before = false) => {
    const on = sort?.k === k;
    return (
      <th
        key={k}
        onClick={() => click(k)}
        aria-sort={on ? (sort.d === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`mat-sort-header mat-mdc-header-cell mdc-data-table__header-cell cdk-header-cell${before ? ' text-right' : ''} cdk-column-${k} mat-column-${k}`}
      >
        <div
          className={`mat-sort-header-container mat-focus-indicator${on ? ' mat-sort-header-sorted' : ''}${on && sort.d === 'desc' ? ' mat-sort-header-descending' : ''}${before ? ' mat-sort-header-position-before' : ''}`}
        >
          <div className="mat-sort-header-content">{label}</div>
          <div className="mat-sort-header-arrow">
            <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
              <path d={SORT_ARROW} />
            </svg>
          </div>
        </div>
      </th>
    );
  };
  const td = (k: string, c: ReactNode, right = false) => (
    <td
      className={`mat-mdc-cell mdc-data-table__cell cdk-cell${right ? ' text-right' : ''} cdk-column-${k} mat-column-${k}`}
    >
      {c}
    </td>
  );
  return (
    <div className="mat-table-wrapper">
      <table className="mat-mdc-table mdc-data-table__table cdk-table demo-mat-table">
        <thead>
          <tr className="mat-mdc-header-row mdc-data-table__header-row cdk-header-row">
            {th('code', 'Code')}
            {th('raison_sociale', 'Raison sociale')}
            {th('ville', 'Ville')}
            {th('vehicules', 'Véhicules', true)}
            {th('ca_mensuel', 'CA mensuel', true)}
            <th className="mat-mdc-header-cell mdc-data-table__header-cell cdk-header-cell cdk-column-statut mat-column-statut">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="mdc-data-table__content">
          {data.map((r) => (
            <tr key={r._id} className="mat-mdc-row mdc-data-table__row cdk-row">
              {td('code', <span className="code-tag">{r.code}</span>)}
              {td('raison_sociale', r.raison_sociale)}
              {td('ville', r.ville)}
              {td('vehicules', r.vehicules, true)}
              {td('ca_mensuel', `${fr(r.ca_mensuel)} F`, true)}
              {td('statut', <StatusBadge label={r.statut} color={color(r.statut)} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartBox({
  type,
  data,
  options,
  className,
  label,
  children,
}: {
  label: string;
  type: string;
  data: unknown;
  options: unknown;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`chart-box${className ? ` ${className}` : ''}`}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- configurations Chart.js hétérogènes (portées d'Angular) */}
      <Chart type={type as any} data={data as any} options={options as any} aria-label={label} />
      {children}
    </div>
  );
}

export function DataBaseSections() {
  const snack = useSnackbar();
  const { mode } = useThemeMode();
  const ch = useMemo(() => new DataCharts(mode === 'dark'), [mode]);

  const [state, setState] = useState<TableState>('normal');
  const [withSelection, setWithSelection] = useState(true);
  const [withActions, setWithActions] = useState(true);
  const [withPagination, setWithPagination] = useState(true);
  const [withFilters, setWithFilters] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [sortKey, setSortKey] = useState<keyof DemoClient>('raison_sociale');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [rows, setRows] = useState<DemoClient[]>(() => DEMO_CLIENTS.map((c) => ({ ...c })));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedPeople, setSelectedPeople] = useState<string[]>(['cli-002']);

  const resetRows = () => setRows(DEMO_CLIENTS.map((c) => ({ ...c })));
  const filtered = useMemo(() => {
    if (state === 'empty') return [];
    const q = search.toLowerCase().trim();
    return rows
      .filter(
        (r) =>
          (!q ||
            r.raison_sociale.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.contact.toLowerCase().includes(q)) &&
          (!statut || r.statut === statut),
      )
      .sort((a, b) => (a[sortKey] > b[sortKey] ? sortDir : a[sortKey] < b[sortKey] ? -sortDir : 0));
  }, [rows, search, statut, sortKey, sortDir, state]);
  const visible = withPagination ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;
  const allVisible = visible.length > 0 && visible.every((r) => selected.has(r._id));
  const someVisible = !allVisible && visible.some((r) => selected.has(r._id));

  const sortBy = (k: keyof DemoClient) => {
    if (sortKey === k) setSortDir(sortDir === 1 ? -1 : 1);
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };
  const sortIcon = (k: keyof DemoClient) =>
    sortKey !== k ? 'unfold_more' : sortDir === 1 ? 'arrow_upward' : 'arrow_downward';
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      visible.forEach((r) => (allVisible ? n.delete(r._id) : n.add(r._id)));
      return n;
    });
  const deleteSelected = () => {
    setRows(rows.filter((r) => !selected.has(r._id)));
    snack(`${selected.size} ligne(s) supprimée(s) localement`, {
      action: 'Annuler',
      duration: 3000,
      onAction: resetRows,
    });
    setSelected(new Set());
  };
  const deleteRow = (row: DemoClient) => {
    setRows((rs) => rs.filter((r) => r._id !== row._id));
    snack(`« ${row.raison_sociale} » supprimé localement`, { action: 'Annuler', duration: 3000, onAction: resetRows });
  };
  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  // Libellé au gabarit mat-slide-toggle (.mdc-label : 14px, interlettrage 0,25px, retrait 4px).
  const toggle = (label: string, v: boolean, set: (b: boolean) => void) => (
    <FormControlLabel
      control={<Switch checked={v} onChange={(e) => set(e.target.checked)} />}
      label={label}
      sx={{ ml: 0, mr: 0 }}
      slotProps={{ typography: { sx: { fontSize: 14, letterSpacing: '0.256px', pl: '4px' } } }}
    />
  );
  const sortTh = (k: keyof DemoClient, label: string, right = false) => (
    <button type="button" className={`sort-th${right ? ' right' : ''}`} onClick={() => sortBy(k)}>
      {label} <MaterialIcon name={sortIcon(k)} />
    </button>
  );

  const tableBody = () => {
    if (state === 'loading')
      return (
        <div className="loading-center">
          <MatSpinner diameter={40} />
        </div>
      );
    if (state === 'error')
      return (
        <div className="error-block">
          <div className="err-icon">{Ic('cloud_off')}</div>
          <h3>Impossible de charger les clients</h3>
          <p>Le service est momentanément indisponible. Vérifiez votre connexion puis réessayez.</p>
          <Button variant="contained" startIcon={Ic('refresh')} onClick={() => setState('normal')}>
            Réessayer
          </Button>
        </div>
      );
    return (
      <>
        {filtered.length === 0 ? (
          <EmptyState
            icon="people"
            title="Aucun client trouvé"
            subtitle="Ajustez vos critères de recherche ou ajoutez un nouveau client."
            actionLabel={state === 'empty' ? 'Nouveau client' : ''}
          />
        ) : viewMode === 'list' ? (
          <div className="m3-table-container">
            <div
              className={`m3-table demo-table${withSelection ? '' : ' no-select'}${withActions ? '' : ' no-actions'}`}
            >
              <div className="m3-table-header">
                {withSelection && (
                  <span className="col-select">
                    <MdcCheckbox
                      checked={allVisible}
                      indeterminate={someVisible}
                      onChange={toggleAll}
                      label="Tout sélectionner"
                    />
                  </span>
                )}
                {sortTh('code', 'Code')}
                {sortTh('raison_sociale', 'Client / Contact')}
                {sortTh('ville', 'Ville')}
                {sortTh('vehicules', 'Véhicules', true)}
                {sortTh('ca_mensuel', 'CA mensuel', true)}
                <span className="text-center">Statut</span>
                {withActions && <span className="text-right">Actions</span>}
              </div>
              {visible.map((row) => (
                <div key={row._id} className={`m3-table-row${selected.has(row._id) ? ' selected' : ''}`}>
                  {withSelection && (
                    <span className="col-select" onClick={(e) => e.stopPropagation()}>
                      <MdcCheckbox
                        checked={selected.has(row._id)}
                        onChange={() => toggleRow(row._id)}
                        label={row.code}
                      />
                    </span>
                  )}
                  <span>
                    <span className="code-tag">{row.code}</span>
                  </span>
                  <div className="col-main-info">
                    <span className="primary-text">{row.raison_sociale}</span>
                    <span className="sub-text">
                      {row.contact} · {row.telephone}
                    </span>
                  </div>
                  <span className="date-cell">{row.ville}</span>
                  <span className="text-right num-cell">{row.vehicules}</span>
                  <span className="text-right num-cell">{fr(row.ca_mensuel)} F</span>
                  <div className="text-center">
                    <StatusBadge label={row.statut} color={color(row.statut)} />
                  </div>
                  {withActions && (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <RowMenu onDelete={() => deleteRow(row)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="cards-grid">
            {visible.map((row) => (
              <div key={row._id} className="m3-card entity-card">
                <div className="card-header">
                  <div className="card-icon-box icon-blue">{Ic('business')}</div>
                  <StatusBadge label={row.statut} color={color(row.statut)} />
                </div>
                <div className="card-body">
                  <div className="card-title-area">
                    <span className="code-tag">{row.code}</span>
                    <h3 className="card-title">{row.raison_sociale}</h3>
                    <p className="card-desc">
                      {row.secteur} · {row.ville}
                    </p>
                  </div>
                  <div className="card-info-list">
                    <div className="info-item">
                      {Ic('person')}
                      <span className="info-label">Contact :</span>
                      <span className="info-val">{row.contact}</span>
                    </div>
                    <div className="info-item">
                      {Ic('directions_car')}
                      <span className="info-label">Véhicules :</span>
                      <span className="info-val font-bold">{row.vehicules}</span>
                    </div>
                    <div className="info-item">
                      {Ic('payments')}
                      <span className="info-label">CA mensuel :</span>
                      <span className="info-val font-bold">{fr(row.ca_mensuel)} F CFA</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Tip title="Options">
                    <IconButton className="action-icon-btn" aria-label="Options">
                      {Ic('more_vert')}
                    </IconButton>
                  </Tip>
                  <Button color="primary" className="detail-btn" endIcon={Ic('arrow_forward')}>
                    Fiche client
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {withPagination && filtered.length > 0 && (
          <Paginator
            total={filtered.length}
            page={page}
            itemPerPage={pageSize}
            pageSizeOptions={[8, 16, 40]}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
      </>
    );
  };

  return (
    <>
      <DocSection
        id="table"
        title="Table"
        source=".m3-table-container · .m3-table · .m3-table-row (styles/entity-list)"
        description="Table « registre » en CSS grid : recherche, filtre, tri, sélection multiple, actions de ligne et pagination — tout est local. Activez/désactivez les options et changez l'état pour voir chaque variante."
      >
        <Demo label="Table complète" hint={`${filtered.length} ligne(s)`} code={CODE.tableBase}>
          <div className="table-controls">
            <div className="m3-filter-toggle state-toggle">
              {STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={state === s ? 'active' : undefined}
                  onClick={() => setState(s)}
                >
                  {STATE_LABEL[s]}
                </button>
              ))}
            </div>
            {toggle('Filtres', withFilters, setWithFilters)}
            {toggle('Sélection', withSelection, setWithSelection)}
            {toggle('Actions', withActions, setWithActions)}
            {toggle('Pagination', withPagination, setWithPagination)}
            <span className="spacer" />
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>
          {withFilters && (
            <div className="toolbar-search-filters">
              <div className="m3-search-bar-unified">
                <div className="search-input-wrapper">
                  <MaterialIcon name="search" className="search-icon" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Rechercher par code, client, contact…"
                  />
                  {search && (
                    <button type="button" className="clear-btn" aria-label="Effacer" onClick={() => onSearch('')}>
                      {Ic('close')}
                    </button>
                  )}
                </div>
                <div className="divider" />
                <FilterDropdown
                  options={STATUT_OPTIONS}
                  value={statut}
                  onChange={(v: string) => {
                    setStatut(v);
                    setPage(1);
                  }}
                  labelPrefix="Statut"
                />
              </div>
            </div>
          )}
          {withSelection && selected.size > 0 && (
            <div className="selection-bar">
              {Ic('check_box')}
              <strong>{selected.size}</strong> sélectionné(s)
              <span className="spacer" />
              <Button onClick={() => setSelected(new Set())}>Désélectionner</Button>
              <Button variant="outlined" color="error" startIcon={Ic('delete')} onClick={deleteSelected}>
                Supprimer ({selected.size})
              </Button>
            </div>
          )}
          {tableBody()}
          <div className="demo-footer">
            <Button
              startIcon={Ic('restart_alt')}
              onClick={() => {
                resetRows();
                setSelected(new Set());
              }}
            >
              Réinitialiser les données
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="table-states"
        title="États de table"
        description="Chaque état tel qu'il apparaît dans les pages liste (spinner centré, skeleton de lignes, empty-state, erreur)."
        cols={2}
      >
        <Demo label="Loading — spinner (.loading-center)">
          <div className="loading-center small">
            <MatSpinner diameter={40} />
          </div>
        </Demo>
        <Demo label="Loading — skeleton (app-skeleton table-row)">
          <Skeleton variant="table-row" count={4} />
        </Demo>
        <Demo label="Empty">
          <EmptyState
            icon="search_off"
            title="Aucun résultat"
            subtitle="Aucun client ne correspond à « Korhogo Transit »."
          />
        </Demo>
        <Demo label="Error">
          <div className="error-block compact">
            <div className="err-icon">{Ic('error_outline')}</div>
            <h3>Erreur de chargement</h3>
            <p>Une erreur inattendue est survenue.</p>
            <Button variant="outlined" startIcon={Ic('refresh')}>
              Réessayer
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="data-table"
        title="Data table (Material)"
        source="mat-table + matSort"
        description="Table Material triable (cliquez les en-têtes), pour les besoins tabulaires classiques."
      >
        <Demo label="mat-table triable" flush>
          <MatSortTable />
        </Demo>
      </DocSection>

      <DocSection id="cards" title="Cards" source=".entity-card · .m3-card · .panel-card · .metric-card" cols={3}>
        <Demo label="Entity card (registre)" code={CODE.card}>
          <div className="m3-card entity-card">
            <div className="card-header">
              <div className="card-icon-box icon-purple">{Ic('inventory_2')}</div>
              <StatusBadge label="ACTIF" color="success" />
            </div>
            <div className="card-body">
              <div className="card-title-area">
                <span className="code-tag">PROD-001</span>
                <h3 className="card-title">Abonnement Standard</h3>
                <p className="card-desc">Suivi GPS temps réel, alertes, historique 90 jours.</p>
              </div>
              <div className="card-info-list">
                <div className="info-item">
                  {Ic('build')}
                  <span className="info-label">Installation :</span>
                  <span className="info-val font-bold">45 000 F CFA</span>
                </div>
                <div className="info-item">
                  {Ic('repeat')}
                  <span className="info-label">Abonnement :</span>
                  <span className="info-val font-bold">15 000 F CFA</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <IconButton className="action-icon-btn" aria-label="Options">
                {Ic('more_vert')}
              </IconButton>
              <Button color="primary" className="detail-btn" endIcon={Ic('arrow_forward')}>
                Fiche produit
              </Button>
            </div>
          </div>
        </Demo>
        <Demo label="m3-card simple">
          <div className="m3-card">
            <h3 className="card-h">Contrat cadre 2026</h3>
            <p className="card-p">Couverture de 42 véhicules, renouvellement tacite au 31/12/2026.</p>
            <div className="row">
              <span className="m3-badge info">Annuel</span>
              <span className="m3-badge success">Signé</span>
            </div>
          </div>
        </Demo>
        <Demo label="Panel card (fiche détail)">
          <div className="panel-card">
            <div className="section-header-flex">
              <div className="section-title-box">
                {Ic('business')}
                <h3>Informations</h3>
              </div>
              <IconButton className="action-icon-btn" aria-label="Modifier">
                {Ic('edit')}
              </IconButton>
            </div>
            <div className="info-grid">
              <div className="info-field">
                <span className="lbl">Raison sociale</span>
                <span className="val">Bolloré Logistics CI</span>
              </div>
              <div className="info-field">
                <span className="lbl">RCCM</span>
                <span className="val">CI-ABJ-2009-B-1234</span>
              </div>
              <div className="info-field">
                <span className="lbl">Ville</span>
                <span className="val">Abidjan</span>
              </div>
              <div className="info-field">
                <span className="lbl">Gestionnaire</span>
                <span className="val">Aminata Diallo</span>
              </div>
            </div>
          </div>
        </Demo>
        <Demo label="Metric card (.metric-card)">
          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-lbl">Chiffre d'affaires</span>
              <MaterialIcon name="trending_up" className="metric-ico" />
            </div>
            <div className="metric-val">
              55,8 M <small>FCFA</small>
            </div>
            <div className="metric-trend up">{Ic('arrow_upward')} +9,2 % vs septembre</div>
          </div>
        </Demo>
        <Demo label="Carte avec graphique (sparkline)">
          <div className="m3-card spark-card">
            <div className="metric-top">
              <span className="metric-lbl">Encaissements 2026</span>
              <span className="m3-badge success">+18 %</span>
            </div>
            <div className="metric-val">
              476,6 M <small>FCFA</small>
            </div>
            <div className="spark">
              <Chart
                type="line"
                data={ch.sparkData}
                options={ch.sparkOptions}
                aria-label="Encaissements 2026 (tendance)"
              />
            </div>
          </div>
        </Demo>
        <Demo label="Carte sélectionnable">
          <div className="m3-card select-card" tabIndex={0}>
            <MaterialIcon name="radio_button_checked" className="sel-ico" />
            <div>
              <strong>Profil Premium</strong>
              <p className="card-p">Facturation mensuelle, remise 10 %.</p>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="list"
        title="List"
        source=".mini-list / .mini-row (styles/detail-page) · mat-list · mat-selection-list"
        cols={3}
      >
        <Demo label="Mini-list (fiche détail)">
          <div className="mini-list">
            {people.map((c) => (
              <div key={c._id} className="mini-row">
                <div className="item-left">
                  <div className="row-icon-box">{Ic('directions_car')}</div>
                  <div className="item-meta">
                    <span className="item-title">
                      {c.code} · {c.ville}
                    </span>
                    <span className="item-sub">{c.vehicules} véhicules</span>
                  </div>
                </div>
                <div className="item-right">
                  <StatusBadge label={c.statut} color={color(c.statut)} />
                </div>
              </div>
            ))}
          </div>
        </Demo>
        <Demo label="mat-list (avatars)">
          <MatList>
            {people.map((c) => (
              <MatListItem key={c._id} avatar={initials(c.contact)} title={c.contact} line={c.raison_sociale} />
            ))}
          </MatList>
        </Demo>
        <Demo label="mat-selection-list">
          <MatSelectionList
            options={people.map((c) => ({ value: c._id, label: c.raison_sociale }))}
            value={selectedPeople}
            onChange={setSelectedPeople}
          />
          <span className="caption">{selectedPeople.length} sélectionné(s)</span>
        </Demo>
      </DocSection>

      <DocSection
        id="timeline"
        title="Timeline"
        source=".timeline / .timeline-item / .timeline-dot (dashboard)"
        cols={2}
      >
        <Demo label="Alertes (tableau de bord)">
          <div className="timeline">
            {TIMELINE_EVENTS.map((e) => (
              <div key={String(e.date)} className="timeline-item">
                <span className={`timeline-dot ${e.color === 'primary' ? 'cyan' : e.color}`}>{Ic(e.icon)}</span>
                <div className="timeline-content">
                  <span className="timeline-title">{e.titre}</span>
                  <span className="timeline-date">{e.texte}</span>
                </div>
              </div>
            ))}
          </div>
        </Demo>
        <Demo label="Historique vertical">
          <ol className="history">
            {TIMELINE_EVENTS.map((e, i) => (
              <li key={String(e.date)} className={i === TIMELINE_EVENTS.length - 1 ? 'last' : undefined}>
                <span className={`h-dot ${e.color}`}>{Ic(e.icon)}</span>
                <div className="h-body">
                  <div className="h-top">
                    <strong>{e.titre}</strong>
                    <span>{fmtDate(e.date)}</span>
                  </div>
                  <p>{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </Demo>
      </DocSection>

      <DocSection id="badge" title="Badge" source="app-status-badge · .m3-badge · matBadge" cols={2}>
        <Demo label="app-status-badge — couleurs" code={CODE.badge}>
          <div className="row">
            <StatusBadge label="Actif" color="success" />
            <StatusBadge label="En attente" color="warning" />
            <StatusBadge label="Résilié" color="error" />
            <StatusBadge label="Installé" color="info" />
            <StatusBadge label="Premium" color="purple" />
            <StatusBadge label="Synchronisé" color="cyan" />
            <StatusBadge label="Brouillon" color="neutral" />
          </div>
        </Demo>
        <Demo label="Avec icône">
          <div className="row">
            <StatusBadge label="Payée" color="success" icon="check_circle" />
            <StatusBadge label="Échue" color="error" icon="schedule" />
            <StatusBadge label="Planifiée" color="warning" icon="event" />
            <StatusBadge label="En ligne" color="cyan" icon="wifi" />
          </div>
        </Demo>
        <Demo label="Badge de notification (matBadge)">
          <div className="row lg">
            <span className={`material-icons mat-icon ${matBadgeClass('warn')}`}>
              notifications<MatBadgeContent>3</MatBadgeContent>
            </span>
            <span className={`material-icons mat-icon ${matBadgeClass('primary')}`}>
              checklist<MatBadgeContent>7</MatBadgeContent>
            </span>
            <span className={`material-icons mat-icon ${matBadgeClass('accent')}`}>
              mail<MatBadgeContent>99+</MatBadgeContent>
            </span>
            <span className={`material-icons mat-icon ${matBadgeClass('warn', 'small', true)}`}>chat</span>
            <Button variant="outlined" className={matBadgeClass(null)} sx={{ overflow: 'visible' }}>
              Requêtes<MatBadgeContent>12</MatBadgeContent>
            </Button>
          </div>
        </Demo>
        <Demo label="Pastilles (.stick-*)">
          <div className="row">
            {['green', 'orange', 'red', 'blue', 'grey'].map((c) => (
              <span key={c} style={{ display: 'contents' }}>
                <span className={`stick stick-${c}`} />
                <span className="muted">{c}</span>
              </span>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection id="chip" title="Chip" source="mat-chip · .code-tag · .label-badge" cols={2}>
        <Demo label="mat-chip">
          <MatChipSet>
            <MatChip>Abidjan</MatChip>
            <MatChip highlighted>Prioritaire</MatChip>
            <MatChip avatar="person">Koffi N’Guessan</MatChip>
            <MatChip onRemove={() => undefined}>Transport</MatChip>
            <MatChip disabled>Archivé</MatChip>
          </MatChipSet>
        </Demo>
        <Demo label="Tags de code / référence">
          <div className="row">
            <span className="code-tag">CLI-1043</span>
            <span className="code-tag">FAC-2026-0912</span>
            <span className="code-tag">IMEI 3548 2109 8812 004</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="avatar"
        title="Avatar"
        source=".avatar · .card-avatar · .member-avatar · .assignee-avatar"
        cols={3}
      >
        <Demo label="Tailles">
          <div className="row lg">
            <span className="av xs">JK</span>
            <span className="av sm">MY</span>
            <span className="av md">AD</span>
            <span className="av lg">KN</span>
          </div>
        </Demo>
        <Demo label="Couleurs de rôle">
          <div className="row">
            <Tip title="Administrateur">
              <span className="av md role-admin">JK</span>
            </Tip>
            <Tip title="Responsable">
              <span className="av md role-manager">AD</span>
            </Tip>
            <Tip title="Technicien">
              <span className="av md role-tech">KN</span>
            </Tip>
            <Tip title="Agent">
              <span className="av md role-agent">FB</span>
            </Tip>
            <span className="av md photo">{Ic('person')}</span>
          </div>
        </Demo>
        <Demo label="Groupe (assignés)">
          <div className="av-stack">
            {people.map((c) => (
              <Tip key={c._id} title={c.contact}>
                <span className="av sm">{initials(c.contact)}</span>
              </Tip>
            ))}
            <span className="av sm more">+4</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="stats" title="Statistics cards" source=".kpi-grid / .kpi-card (styles/detail-page)">
        <Demo label="Grille KPI" code={CODE.kpi}>
          <div className="kpi-grid">
            {(
              [
                ['indigo', 'people', '434', 'Clients actifs'],
                ['success', 'directions_car', '3 912', 'Véhicules suivis'],
                ['warning', 'pending_actions', '27', 'Requêtes ouvertes'],
              ] as const
            ).map(([c, i, v, l]) => (
              <div key={l} className="kpi-card">
                <div className={`kpi-icon ${c}`}>{Ic(i)}</div>
                <div className="kpi-content">
                  <span className="kpi-value">{v}</span>
                  <span className="kpi-label">{l}</span>
                </div>
              </div>
            ))}
            <div className="kpi-card">
              <div className="kpi-icon danger">{Ic('report')}</div>
              <div className="kpi-content">
                <span className="kpi-value">
                  12,4 <small>M F</small>
                </span>
                <span className="kpi-label">Impayés &gt; 60 j</span>
              </div>
            </div>
            {(
              [
                ['purple', 'engineering', '18', 'Missions en cours'],
                ['cyan', 'cloud_sync', '98,7 %', 'Balises synchronisées'],
              ] as const
            ).map(([c, i, v, l]) => (
              <div key={l} className="kpi-card">
                <div className={`kpi-icon ${c}`}>{Ic(i)}</div>
                <div className="kpi-content">
                  <span className="kpi-value">{v}</span>
                  <span className="kpi-label">{l}</span>
                </div>
              </div>
            ))}
          </div>
        </Demo>
        <Demo label="KPI — chargement">
          <Skeleton variant="card" count={4} />
        </Demo>
      </DocSection>

      <DocSection
        id="charts"
        title="Graphiques"
        source="ng2-charts (BaseChartDirective) + Chart.js 4"
        cols={2}
        description="Tous les types Chart.js disponibles via ng2-charts. Options dérivées du thème (clair / sombre) : axes sans bordure, grille discrète, segments séparés par un liseré 1px couleur de surface, fonds de graduation transparents."
      >
        <Demo label="Courbe (évolution du CA)" code={CODE.chart}>
          <ChartBox label="Courbe (évolution du CA)" type="line" data={ch.lineData} options={ch.lineOptions()} />
        </Demo>
        <Demo label="Aires empilées (contrats par offre)" hint="fill: '-1'">
          <ChartBox
            label="Aires empilées (contrats par offre)"
            type="line"
            data={ch.areaData}
            options={ch.areaOptions()}
          />
        </Demo>
        <Demo label="Barres (activité)">
          <ChartBox label="Barres (activité)" type="bar" data={ch.barData} options={ch.barOptions()} />
        </Demo>
        <Demo label="Barres horizontales (interventions par zone)" hint="indexAxis: 'y'">
          <ChartBox
            label="Barres horizontales (interventions par zone)"
            type="bar"
            data={ch.hbarData}
            options={ch.hbarOptions()}
          />
        </Demo>
        <Demo label="Barres groupées (facturé / encaissé, M FCFA)">
          <ChartBox
            label="Barres groupées (facturé / encaissé, M FCFA)"
            type="bar"
            data={ch.groupedData}
            options={ch.groupedOptions()}
          />
        </Demo>
        <Demo label="Barres empilées (activité par type)" hint="stacked: true">
          <ChartBox
            label="Barres empilées (activité par type)"
            type="bar"
            data={ch.stackedData}
            options={ch.stackedOptions()}
          />
        </Demo>
        <Demo label="Mixte barres + courbe (2 axes)" hint="type par dataset">
          <ChartBox label="Mixte barres + courbe (2 axes)" type="bar" data={ch.mixedData} options={ch.mixedOptions()} />
        </Demo>
        <Demo label="Escalier (balises en ligne sur 24 h)" hint="stepped: true">
          <ChartBox
            label="Escalier (balises en ligne sur 24 h)"
            type="line"
            data={ch.stepData}
            options={ch.stepOptions()}
          />
        </Demo>
        <Demo label="Anneau (statuts clients)">
          <ChartBox
            label="Anneau (statuts clients)"
            type="doughnut"
            data={ch.doughnutData()}
            options={ch.doughnutOptions()}
          />
        </Demo>
        <Demo label="Jauge (demi-anneau)" hint="circumference: 180">
          <ChartBox
            label="Jauge (demi-anneau)"
            type="doughnut"
            data={ch.gaugeData()}
            options={ch.gaugeOptions()}
            className="gauge-box"
          >
            <div className="gauge-label">
              <strong>94 %</strong>
              <span>balises en ligne</span>
            </div>
          </ChartBox>
        </Demo>
        <Demo label="Camembert (marques de balises)">
          <ChartBox label="Camembert (marques de balises)" type="pie" data={ch.pieData()} options={ch.pieOptions()} />
        </Demo>
        <Demo label="Aire polaire (véhicules par ville)">
          <ChartBox
            label="Aire polaire (véhicules par ville)"
            type="polarArea"
            data={ch.polarData()}
            options={ch.polarOptions()}
          />
        </Demo>
        <Demo label="Radar (performance équipes)">
          <ChartBox label="Radar (performance équipes)" type="radar" data={ch.radarData} options={ch.radarOptions()} />
        </Demo>
        <Demo label="Nuage de points (vitesse / consommation)" hint="type: 'scatter'">
          <ChartBox
            label="Nuage de points (vitesse / consommation)"
            type="scatter"
            data={ch.scatterData}
            options={ch.scatterOptions()}
          />
        </Demo>
        <Demo label="Bulles (véhicules × disponibilité × CA)" hint="type: 'bubble'">
          <ChartBox
            label="Bulles (véhicules × disponibilité × CA)"
            type="bubble"
            data={ch.bubbleData}
            options={ch.bubbleOptions()}
          />
        </Demo>
        <Demo label="Barres de progression">
          <div className="progress-list">
            {(
              [
                { l: 'Abidjan', v: 82, c: 'primary' },
                { l: 'Bouaké', v: 64, c: 'accent' },
                { l: 'San-Pédro', v: 41, c: 'warn' },
              ] as const
            ).map((p) => (
              <div key={p.l} className="pg-row">
                <span>{p.l}</span>
                <MatProgressBar value={p.v} color={p.c} />
                <strong>{p.v} %</strong>
              </div>
            ))}
            <div className="pg-row">
              <span>Objectif</span>
              <div className="ring">
                <MatSpinner diameter={56} value={72} />
                <span>72 %</span>
              </div>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="empty"
        title="Empty state"
        source="app-empty-state (87 usages) · .empty-section (styles/detail-page)"
        cols={3}
      >
        <Demo label="Par défaut">
          <EmptyState />
        </Demo>
        <Demo label="Avec action" code={CODE.empty}>
          <EmptyState
            icon="inventory_2"
            title="Aucun produit trouvé"
            subtitle="Ajustez vos critères de recherche ou ajoutez un nouveau produit."
            actionLabel="Nouveau produit"
          />
        </Demo>
        <Demo label="Section vide (fiche détail)">
          <div className="empty-section">
            {Ic('receipt_long')}
            <span>Aucune facture pour ce client</span>
          </div>
        </Demo>
      </DocSection>
    </>
  );
}
