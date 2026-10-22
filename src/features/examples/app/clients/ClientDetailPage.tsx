import {
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useExampleShell } from '../../../../components/layout/exampleShellContext';
import { CommentThread } from '../../../../components/content/CommentThread';
import { StatusBadge } from '../../../../components/content/StatusBadge';
import { AuditLog } from '../../../../components/data/AuditLog';
import { DataTable } from '../../../../components/data/DataTable';
import { DescriptionList } from '../../../../components/data/DescriptionList';
import { Trend } from '../../../../components/data/Trend';
import type { AuditEntry } from '../../../../components/data/auditTypes';
import type { DataColumn } from '../../../../components/data/dataTableTypes';
import type { DescriptionItem } from '../../../../components/data/descriptionTypes';
import { CopyField } from '../../../../components/fields/CopyField';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { FEED_COMMENTS, ME, PEOPLE } from '../../../../data/static/content.data';
import {
  CLIENT_STATUS,
  EX_CLIENTS,
  EX_INVOICES,
  type ExClient,
  type ExInvoice,
} from '../../../../data/static/examples.data';
import { hue, initials } from '../../exUtils';
import '../../ex-page.scss';
import './client-detail.scss';

const NOTES = FEED_COMMENTS[0] ?? [];
const TAGS = ['Grand compte', 'Contrat cadre', 'Multi-sites'];
const GOALS = [
  { label: 'Objectif annuel de chiffre d’affaires', value: 72 },
  { label: 'Taux d’encaissement', value: 88 },
  { label: 'Déploiement des sites', value: 45 },
];
const INVOICE_COLS: DataColumn<ExInvoice>[] = [
  { key: 'ref', label: 'Référence', width: 170, type: 'mono', required: true },
  { key: 'date', label: 'Date', width: 130, type: 'date' },
  {
    key: 'status',
    label: 'Statut',
    width: 130,
    type: 'badge',
    format: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1),
    tone: (r) => (r.status === 'payée' ? 'success' : r.status === 'en retard' ? 'error' : 'warning'),
  },
  { key: 'amount', label: 'Montant', width: 160, type: 'currency', total: true },
];
const CONTRACT: DescriptionItem[] = [
  { label: 'Offre', value: 'Premium Flotte' },
  { label: 'Échéance', value: '28 février 2027', hint: 'Tacite reconduction' },
  { label: 'Conditions', value: '30 jours fin de mois' },
  { label: 'Sites couverts', value: 6 },
  { label: 'Remise', value: '8 %' },
  { label: 'Devise', value: 'FCFA (XOF)' },
];

/** /examples/app/clients/:id — fiche détail : en-tête d'entité, indicateurs, onglets (aperçu, factures, historique, notes), colonne latérale. */
export function ClientDetailPage() {
  const { id } = useParams();
  const c = EX_CLIENTS.find((x) => x.id === id) ?? (EX_CLIENTS[3] as ExClient);
  const [tab, setTab] = useState(0);
  const [more, setMore] = useState<HTMLElement | null>(null);
  useExampleShell({ title: c.name });

  const kpis = [
    {
      label: 'Chiffre d’affaires',
      value: (c.revenue / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
      unit: 'M FCFA',
      trend: 9.2,
      trendUnit: ' %',
      inverse: false,
      hint: 'sur 12 mois',
    },
    {
      label: 'Factures émises',
      value: String(c.invoices),
      unit: '',
      trend: 3,
      trendUnit: '',
      inverse: false,
      hint: 'ce trimestre',
    },
    {
      label: 'Délai de paiement',
      value: '27',
      unit: 'jours',
      trend: 4,
      trendUnit: ' j',
      inverse: true,
      hint: 'vs moyenne',
    },
    { label: 'Satisfaction', value: '4,6', unit: '/ 5', trend: 0.2, trendUnit: '', inverse: false, hint: 'NPS 48' },
  ];
  const info: DescriptionItem[] = [
    { label: 'Identifiant', value: c.id.toUpperCase(), type: 'mono', copy: true },
    { label: 'Responsable', value: c.owner },
    { label: 'Secteur', value: c.sector },
    { label: 'N° contribuable', value: 'CI-2019-B-04512', type: 'mono' },
    { label: 'Statut', value: CLIENT_STATUS[c.status].label, type: 'badge', tone: CLIENT_STATUS[c.status].color },
  ];
  const d = (days: number, h: number) => new Date(2026, 9, 17 - days, h, 12);
  const u = (name: string) => ({ name, initials: initials(name), color: hue(name) });
  const history: AuditEntry[] = [
    {
      id: 'h1',
      at: d(0, 10),
      user: u('Jean Kouassi'),
      action: 'update',
      target: c.name,
      changes: [{ field: 'conditions', label: 'Conditions', before: '45 jours', after: '30 jours fin de mois' }],
    },
    {
      id: 'h2',
      at: d(0, 9),
      user: u('Fatou Diabaté'),
      action: 'comment',
      target: c.name,
      comment: 'Relance téléphonique faite, règlement annoncé pour vendredi.',
    },
    { id: 'h3', at: d(2, 15), user: u('Marc Yao'), action: 'create', target: 'Facture FAC-2026-0981' },
    {
      id: 'h4',
      at: d(6, 11),
      user: u('Jean Kouassi'),
      action: 'status',
      target: c.name,
      changes: [{ field: 'status', label: 'Statut', before: 'Prospect', after: 'Actif' }],
    },
    {
      id: 'h5',
      at: d(9, 8),
      user: u('Aïcha Diallo'),
      action: 'export',
      target: 'Relevé de compte (PDF)',
      meta: 'Chrome · Abidjan',
    },
  ];
  const since = new Date(c.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="ex-page ex-client-detail">
      <Link to="/examples/app/clients" className="back">
        <MaterialIcon name="arrow_back" />
        Clients
      </Link>

      <header className="entity">
        <span className="ava lg" style={{ background: hue(c.name) }}>
          {initials(c.name)}
        </span>
        <div className="e-text">
          <div className="e-title">
            <h1>{c.name}</h1>
            <StatusBadge label={CLIENT_STATUS[c.status].label} color={CLIENT_STATUS[c.status].color} />
          </div>
          <p>
            <span>{c.sector}</span>
            <span>{c.city}, Côte d’Ivoire</span>
            <span>Client depuis {since}</span>
          </p>
        </div>
        <div className="e-actions">
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="edit" />}>
            Modifier
          </Button>
          <Button variant="contained" disableElevation startIcon={<MaterialIcon name="receipt_long" />}>
            Facturer
          </Button>
          <IconButton aria-label="Plus d’actions" onClick={(e) => setMore(e.currentTarget)}>
            <MaterialIcon name="more_vert" />
          </IconButton>
          <Menu
            anchorEl={more}
            open={!!more}
            onClose={() => setMore(null)}
            slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
          >
            <MenuItem onClick={() => setMore(null)}>
              <ListItemIcon>
                <MaterialIcon name="mail" />
              </ListItemIcon>
              Envoyer un relevé
            </MenuItem>
            <MenuItem onClick={() => setMore(null)}>
              <ListItemIcon>
                <MaterialIcon name="archive" />
              </ListItemIcon>
              Archiver
            </MenuItem>
            <Divider />
            <MenuItem className="danger" onClick={() => setMore(null)}>
              <ListItemIcon>
                <MaterialIcon name="block" />
              </ListItemIcon>
              Suspendre le compte
            </MenuItem>
          </Menu>
        </div>
      </header>

      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <span className="k-label">{k.label}</span>
            <span className="k-val">
              {k.value}
              {k.unit && <small>{k.unit}</small>}
            </span>
            <span className="k-foot">
              <Trend value={k.trend} unit={k.trendUnit} inverse={k.inverse} />
              {k.hint}
            </span>
          </div>
        ))}
      </div>

      <div className="cols">
        <section className="card main-col">
          <Tabs
            value={tab}
            onChange={(_, v: number) => setTab(v)}
            className="mat-tab-group"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Aperçu" />
            <Tab
              label={
                <span>
                  Factures<span className="tab-n">{EX_INVOICES.length}</span>
                </span>
              }
            />
            <Tab label="Historique" />
            <Tab
              label={
                <span>
                  Notes<span className="tab-n">{NOTES.length}</span>
                </span>
              }
            />
          </Tabs>
          {tab === 0 && (
            <div className="pane">
              <p className="lead">
                Compte stratégique du secteur {c.sector.toLowerCase()}, suivi par {c.owner}. Le contrat cadre couvre
                l’ensemble des sites de {c.city} et arrive à échéance en mars 2027.
              </p>
              <h3>Contrat</h3>
              <DescriptionList items={CONTRACT} columns={3} />
              <h3>Objectifs 2026</h3>
              <div className="goals">
                {GOALS.map((g) => (
                  <div key={g.label} className="goal">
                    <div className="g-top">
                      <span>{g.label}</span>
                      <strong className="tabular">{g.value} %</strong>
                    </div>
                    <LinearProgress variant="determinate" value={g.value} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 1 && (
            <div className="pane flush">
              <DataTable
                rows={EX_INVOICES}
                columns={INVOICE_COLS}
                rowKey="ref"
                searchable={false}
                pageSize={8}
                maxHeight="none"
              />
            </div>
          )}
          {tab === 2 && (
            <div className="pane">
              <AuditLog entries={history} />
            </div>
          )}
          {tab === 3 && (
            <div className="pane">
              <CommentThread title="Notes internes" comments={NOTES} me={ME} mentionables={PEOPLE} compact />
            </div>
          )}
        </section>

        <aside className="side-col">
          <section className="card">
            <div className="card-head">
              <h2>Contact principal</h2>
            </div>
            <div className="card-body contact">
              <div className="person">
                <span className="ava" style={{ background: hue(c.contact) }}>
                  {initials(c.contact)}
                </span>
                <span>
                  <strong>{c.contact}</strong>
                  <small>Responsable achats</small>
                </span>
              </div>
              <CopyField value={c.email} icon="mail" label="l’e-mail" />
              <CopyField value={c.phone} icon="call" label="le téléphone" />
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Informations</h2>
            </div>
            <div className="card-body">
              <DescriptionList items={info} columns={1} layout="horizontal" />
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Étiquettes</h2>
            </div>
            <div className="card-body">
              <div className="chip-set" aria-label="Étiquettes">
                {TAGS.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
