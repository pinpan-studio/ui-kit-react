/** Extraits de code des sections avancées de la galerie Data display. */
export const CODE = {
  table: `
columns: DataColumn<Client>[] = [
  { key: 'code', label: 'Code', width: 110, sticky: 'start', type: 'mono', required: true },
  { key: 'raison_sociale', label: 'Raison sociale', width: 230, sticky: 'start', editable: 'text' },
  { key: 'ville', label: 'Ville', editable: 'select', options: villes },
  { key: 'vehicules', label: 'Véhicules', type: 'number', editable: 'number', total: true },
  { key: 'ca_mensuel', label: 'CA', type: 'currency', total: true },
  { key: 'email', label: 'Email', hidden: true },
  { key: 'statut', label: 'Statut', sticky: 'end', type: 'badge', tone: (r) => r.statut === 'ACTIF' ? 'success' : 'error' },
];

<app-data-table [rows]="clients" [columns]="columns" rowKey="_id" title="Clients"
  selectable [bulkActions]="[{ id: 'delete', label: 'Supprimer', icon: 'delete', tone: 'error' }]"
  [pageSize]="10" (bulkAction)="onBulk($event)" (cellEdit)="save($event)">
  <ng-template #expanded let-row>Détail de {{ row.raison_sociale }}</ng-template>
</app-data-table>`,
  dl: `
items: DescriptionItem[] = [
  { label: 'Code client', value: 'CLI-1040', type: 'mono', copy: true },
  { label: 'Statut', value: 'Actif', type: 'badge', tone: 'success' },
  { label: 'Email', value: 'jean@yao.ci', type: 'email' },
  { label: 'Adresse', value: 'Lot 412\\nAbidjan', type: 'multiline', span: 'full' },
];

<app-description-list [items]="items" [columns]="3" />
<app-description-list [items]="items" [columns]="1" layout="horizontal" bordered />`,
  counter: `
<strong><app-stat-counter [value]="ca" format="compact" suffix=" FCFA" [decimals]="1" /></strong>
<app-stat-counter [value]="dispo" format="percent" [decimals]="1" [duration]="1200" />
<app-trend [value]="9.2" label="vs sept." />
<app-trend [value]="-18" inverse />   <!-- une baisse est positive -->`,
  diff: `
<app-text-diff [before]="v1" [after]="v2" title="contrat.txt" mode="split" [context]="2" />

import { diffLines } from 'shared/utils/diff.util';   // utilisable sans le composant`,
  audit: `
entries: AuditEntry[] = [{
  id: 'a1', at: '2026-10-15T09:12:00', action: 'update', target: 'Client CLI-1040',
  user: { name: 'Aminata Diallo', color: '#8b5cf6' },
  changes: [{ field: 'telephone', label: 'Téléphone', before: '+225 07…', after: '+225 05…' }],
}];

<app-audit-log [entries]="entries" />`,
  qr: `
<app-qr-code #qr value="https://suivi.example.com/v/CI-4521-AB" [size]="168" ecc="M" icon="local_shipping" />
<button (click)="qr.toPng(1024).then(download)">PNG</button>   <!-- ou qr.toSvg() -->

<app-barcode value="358240051111110" [height]="44" />`,

  tableBase: `
<div class="m3-table-container">
  <div class="m3-table">
    <div class="m3-table-header">
      <span class="col-select"><mat-checkbox (change)="toggleAll()" [checked]="allSelected" [indeterminate]="someSelected" /></span>
      <span>Code</span><span>Client</span><span class="text-right">Véhicules</span><span class="text-center">Statut</span><span></span>
    </div>
    @for (row of rows; track row._id) {
      <div class="m3-table-row" (click)="open(row)">
        <span class="col-select" (click)="$event.stopPropagation()"><mat-checkbox [checked]="isSelected(row)" (change)="toggle(row)" /></span>
        <span><span class="code-tag">{{ row.code }}</span></span>
        <div class="col-main-info"><span class="primary-text">{{ row.raison_sociale }}</span><span class="sub-text">{{ row.contact }}</span></div>
        <span class="text-right">{{ row.vehicules }}</span>
        <div class="text-center"><app-status-badge [label]="row.statut" [color]="statutColor[row.statut]" /></div>
        <div class="row-actions">…</div>
      </div>
    }
  </div>
</div>

/* SCSS de la page : @import 'styles/entity-list';
   .m3-table-header, .m3-table-row { grid-template-columns: 44px 110px 1.8fr 100px 110px 50px; } */`,
  card: `
<div class="cards-grid">
  <div class="m3-card entity-card">
    <div class="card-header">
      <div class="card-icon-box icon-purple"><mat-icon>inventory_2</mat-icon></div>
      <app-status-badge label="ACTIF" color="success" />
    </div>
    <div class="card-body">
      <div class="card-title-area">
        <span class="code-tag">PROD-001</span>
        <h3 class="card-title">Abonnement Standard</h3>
        <p class="card-desc">Suivi GPS temps réel, alertes, historique 90 jours.</p>
      </div>
      <div class="card-info-list">
        <div class="info-item"><mat-icon>repeat</mat-icon><span class="info-label">Abonnement :</span><span class="info-val font-bold">15 000 F CFA</span></div>
      </div>
    </div>
    <div class="card-footer">…</div>
  </div>
</div>`,
  kpi: `
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-icon indigo"><mat-icon>people</mat-icon></div>
    <div class="kpi-content">
      <span class="kpi-value">434</span>
      <span class="kpi-label">Clients actifs</span>
    </div>
  </div>
</div>
/* @import 'styles/detail-page'; */`,
  badge: `
<app-status-badge label="Actif" color="success" icon="check_circle" />
<!-- couleurs : success | warning | error | info | purple | cyan | neutral -->
<span class="m3-badge warning">En attente</span>`,
  empty: `
<app-empty-state
  icon="inventory_2"
  title="Aucun produit trouvé"
  subtitle="Ajustez vos critères de recherche ou ajoutez un nouveau produit."
  actionLabel="Nouveau produit"
  (actionClick)="create()" />`,
  chart: `
<div class="chart-box"><canvas baseChart type="line" [data]="lineData" [options]="lineOptions()"></canvas></div>
// options = computed(() => …) dérivé de ThemeService.mode() : textes, grille et liserés suivent le thème
/* provideCharts(withDefaultRegisterables()) est déclaré dans app.config.ts */`,
};
