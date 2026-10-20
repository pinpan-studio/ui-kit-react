import { Button } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { StatusBadge } from '../../../../components/content/StatusBadge';
import { DataTable } from '../../../../components/data/DataTable';
import type { BulkAction, DataColumn } from '../../../../components/data/dataTableTypes';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { FilterDropdown, type FilterOption } from '../../../../components/forms/FilterDropdown';
import { ViewModeToggle, type ViewMode } from '../../../../components/interaction/ViewModeToggle';
import { Paginator } from '../../../../components/navigation/Paginator';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { CLIENT_STATUS, EX_CLIENTS, type ClientStatus, type ExClient } from '../../../../data/static/examples.data';
import { hue, initials } from '../../exUtils';
import '../../ex-page.scss';
import './clients.scss';

const STATUSES = Object.keys(CLIENT_STATUS) as ClientStatus[];
const optionsFor = (key: 'city' | 'owner'): FilterOption<string | null>[] => {
  const values = [...new Set(EX_CLIENTS.map((c) => c[key]))].sort();
  return values.map((v) => ({ value: v, label: v, count: EX_CLIENTS.filter((c) => c[key] === v).length }));
};
const CITY_OPTIONS = optionsFor('city');
const OWNER_OPTIONS = optionsFor('owner');
const COLUMNS: DataColumn<ExClient>[] = [
  { key: 'name', label: 'Client', width: 220, sticky: 'start', required: true },
  { key: 'sector', label: 'Secteur', width: 140 },
  { key: 'contact', label: 'Contact', width: 170 },
  { key: 'email', label: 'E-mail', width: 230, hidden: true },
  { key: 'city', label: 'Ville', width: 120 },
  {
    key: 'status',
    label: 'Statut',
    width: 110,
    type: 'badge',
    format: (r) => CLIENT_STATUS[r.status].label,
    tone: (r) => CLIENT_STATUS[r.status].color,
  },
  { key: 'invoices', label: 'Factures', width: 90, type: 'number' },
  { key: 'revenue', label: 'Chiffre d’affaires', width: 150, type: 'currency', total: true },
  { key: 'since', label: 'Client depuis', width: 130, type: 'date', hidden: true },
];
const BULK: BulkAction[] = [
  { id: 'mail', label: 'E-mail', icon: 'mail' },
  { id: 'tag', label: 'Étiqueter', icon: 'label' },
  { id: 'delete', label: 'Supprimer', icon: 'delete', tone: 'error' },
];
const TOTAL_REVENUE = EX_CLIENTS.reduce((s, c) => s + c.revenue, 0);
const countBy = (s: ClientStatus) => EX_CLIENTS.filter((c) => c.status === s).length;
const VERB: Record<string, string> = {
  mail: 'E-mail préparé pour',
  tag: 'Étiquette ajoutée à',
  delete: 'Suppression simulée de',
};

/**
 * /examples/app/clients — liste de données : onglets de statut, filtres déroulants, table avancée
 * (tri, colonnes, densité, sélection et actions groupées, export, ligne dépliable) ou cartes paginées.
 */
export function ClientsPage() {
  const navigate = useNavigate();
  const snack = useSnackbar();
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
  const [city, setCity] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(() => (window.innerWidth < 768 ? 'card' : 'list'));
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(6);

  const rows = useMemo(
    () =>
      EX_CLIENTS.filter(
        (c) =>
          (!statusFilter || c.status === statusFilter) && (!city || c.city === city) && (!owner || c.owner === owner),
      ),
    [statusFilter, city, owner],
  );
  useEffect(() => setPage(1), [rows]);
  const pageRows = rows.slice((page - 1) * size, page * size);

  const open = (c: ExClient) => void navigate(`/examples/app/clients/${c.id}`);
  const onBulk = (e: { action: string; rows: ExClient[] }) =>
    snack(`${VERB[e.action]} ${e.rows.length} client(s)`, { action: 'OK', duration: 2500 });

  return (
    <div className="ex-page ex-clients">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">CRM</span>
          <h1>Clients</h1>
          <p>
            {EX_CLIENTS.length} comptes · {Math.round(TOTAL_REVENUE / 1e6).toLocaleString('fr-FR')} M FCFA de chiffre
            d’affaires cumulé
          </p>
        </div>
        <div className="actions">
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="upload" />}>
            Importer
          </Button>
          <Button variant="contained" disableElevation startIcon={<MaterialIcon name="add" />}>
            Nouveau client
          </Button>
        </div>
      </div>

      <nav className="status-tabs" aria-label="Filtrer par statut">
        <button className={!statusFilter ? 'on' : ''} onClick={() => setStatusFilter('')}>
          Tous<span>{EX_CLIENTS.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={statusFilter === s ? 'on' : ''} onClick={() => setStatusFilter(s)}>
            {CLIENT_STATUS[s].label}
            <span>{countBy(s)}</span>
          </button>
        ))}
      </nav>

      <div className="filters">
        <FilterDropdown labelPrefix="Ville" options={CITY_OPTIONS} value={city} onChange={setCity} />
        <FilterDropdown labelPrefix="Responsable" options={OWNER_OPTIONS} value={owner} onChange={setOwner} />
        {(city || owner) && (
          <Button
            onClick={() => {
              setCity(null);
              setOwner(null);
            }}
          >
            Effacer les filtres
          </Button>
        )}
        <span className="spacer" />
        <ViewModeToggle mode={view} onChange={setView} />
      </div>

      {!rows.length ? (
        <div className="card">
          <EmptyState icon="search_off" title="Aucun client" subtitle="Aucun compte ne correspond à ces critères." />
        </div>
      ) : view === 'list' ? (
        <DataTable
          rows={rows}
          columns={COLUMNS}
          selectable
          bulkActions={BULK}
          pageSize={10}
          maxHeight="none"
          clickable
          onRowClick={open}
          onBulkAction={onBulk}
          expanded={(row) => (
            <div className="preview">
              <span>
                <small>Contact</small>
                {row.contact}
              </span>
              <span>
                <small>Téléphone</small>
                {row.phone}
              </span>
              <span>
                <small>Factures</small>
                {row.invoices}
              </span>
              <span>
                <small>Responsable</small>
                {row.owner}
              </span>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => open(row)}
                endIcon={<MaterialIcon name="arrow_forward" />}
              >
                Ouvrir la fiche
              </Button>
            </div>
          )}
        />
      ) : (
        <>
          <div className="cards">
            {pageRows.map((c) => (
              <button key={c.id} type="button" className="card ccard" onClick={() => open(c)}>
                <div className="cc-top">
                  <span className="ava" style={{ background: hue(c.name) }}>
                    {initials(c.name)}
                  </span>
                  <span className="grow">
                    <strong>{c.name}</strong>
                    <small>
                      {c.sector} · {c.city}
                    </small>
                  </span>
                  <StatusBadge label={CLIENT_STATUS[c.status].label} color={CLIENT_STATUS[c.status].color} />
                </div>
                <dl className="cc-meta">
                  <div>
                    <dt>Contact</dt>
                    <dd>{c.contact}</dd>
                  </div>
                  <div>
                    <dt>Factures</dt>
                    <dd>{c.invoices}</dd>
                  </div>
                  <div>
                    <dt>Chiffre d’affaires</dt>
                    <dd className="num">
                      {(c.revenue / 1e6).toLocaleString('fr-FR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      M FCFA
                    </dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
          <Paginator
            total={rows.length}
            page={page}
            itemPerPage={size}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setSize(s);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
