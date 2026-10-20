import { Button } from '@mui/material';
import { useRef, useState } from 'react';
import { AuditLog } from '../../../components/data/AuditLog';
import { DataTable } from '../../../components/data/DataTable';
import { DescriptionList } from '../../../components/data/DescriptionList';
import { Barcode, QrCode, type QrCodeHandle } from '../../../components/data/QrCode';
import { StatCounter } from '../../../components/data/StatCounter';
import { TextDiff } from '../../../components/data/TextDiff';
import { Trend } from '../../../components/data/Trend';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEMO_CLIENTS } from '../../../data/static/showcase.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { DataBaseSections } from './DataBaseSections';
import { CODE } from './dataCode';
import { AUDIT, BULK, CFG1, CFG2, COLUMNS, CONTRAT, INFOS, V1, V2, VCARD, WIFI, type Row } from './dataDemo';
import './data-gallery.scss';

const TOC: TocItem[] = [
  { id: 'table', label: 'Table' },
  { id: 'table-states', label: 'États de table' },
  { id: 'data-table', label: 'Data table (Material)' },
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'badge', label: 'Badge' },
  { id: 'chip', label: 'Chip' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'stats', label: 'Statistics cards' },
  { id: 'charts', label: 'Graphiques' },
  { id: 'empty', label: 'Empty state' },
  { id: 'advanced-table', label: 'Table avancée' },
  { id: 'description-list', label: 'Liste descriptive' },
  { id: 'counters', label: 'Compteurs' },
  { id: 'diff', label: 'Diff' },
  { id: 'audit', label: 'Audit log' },
  { id: 'qr', label: 'QR / code-barres' },
];
const SPARK = [62, 70, 68, 75, 80, 78];
const jitter = (v: number, p: number) => Math.round(v * (1 + (Math.random() - 0.5) * p));

export function DataGalleryPage() {
  const snack = useSnackbar();
  const [rows, setRows] = useState<Row[]>(() => DEMO_CLIENTS.map((c, i) => ({ ...c, sante: (i * 37) % 101 })));
  const [kpi, setKpi] = useState({ ca: 55_800_000, vehicules: 1_248, dispo: 97.4, alertes: 23 });
  const [qrText, setQrText] = useState('https://suivi.example.com/v/CI-4521-AB');
  const qr = useRef<QrCodeHandle>(null);

  const onBulk = (e: { action: string; rows: Row[] }) => {
    if (e.action === 'delete') {
      const ids = new Set(e.rows.map((r) => r._id));
      const before = rows;
      setRows(before.filter((r) => !ids.has(r._id)));
      snack(`${ids.size} client(s) supprimé(s)`, {
        action: 'Annuler',
        duration: 5000,
        onAction: () => setRows(before),
      });
      return;
    }
    snack(
      `Action « ${BULK.find((b) => b.id === e.action)?.label ?? ''} » sur ${e.rows.length} client(s) — démo statique`,
      { action: 'Fermer', duration: 2500 },
    );
  };
  const refresh = () =>
    setKpi((k) => ({
      ca: jitter(k.ca, 0.2),
      vehicules: jitter(k.vehicules, 0.1),
      dispo: Math.min(100, +(k.dispo + (Math.random() - 0.5) * 3).toFixed(1)),
      alertes: Math.max(0, jitter(k.alertes, 0.6)),
    }));
  const download = async () => {
    if (!qr.current) return;
    const a = document.createElement('a');
    a.href = await qr.current.toPng(1024);
    a.download = 'qr-code.png';
    a.click();
  };

  return (
    <div className="gallery-data">
      <DocPage
        title="Data display"
        subtitle="Affichage de données du design system « registre » (styles/entity-list, styles/detail-page) : tables m3, cartes d'entité, listes compactes, timelines, badges de statut, KPI et graphiques Chart.js."
        icon="table_chart"
        toc={TOC}
      >
        <DataBaseSections />
        <DocSection
          id="advanced-table"
          title="Table avancée"
          source="app-data-table (shared/components/data)"
          description="Colonnes figées (code + raison sociale à gauche, statut à droite), redimensionnables (glisser le bord, double-clic pour ajuster), masquables (menu Colonnes : email et téléphone masqués par défaut). Tri, recherche, densité, export CSV, sélection multiple avec barre d'actions groupées (Maj+clic pour une plage), lignes dépliables, édition en ligne au double-clic (raison sociale, ville, véhicules, statut), totaux et pagination."
        >
          <Demo
            label="Clients"
            hint="essayez : double-clic sur une ville, cocher des lignes, Supprimer puis Annuler"
            code={CODE.table}
            flush
          >
            <DataTable<Row>
              rows={rows}
              columns={COLUMNS}
              rowKey="_id"
              title="Clients"
              selectable
              bulkActions={BULK}
              pageSize={8}
              maxHeight="560px"
              onBulkAction={onBulk}
              onCellEdit={(e) =>
                snack(`${e.row.code} · ${e.key} : « ${String(e.previous ?? '—')} » → « ${String(e.value ?? '—')} »`, {
                  action: 'Fermer',
                  duration: 2500,
                })
              }
              expanded={(row) => (
                <div className="row-detail">
                  <div className="rd-col">
                    <span className="rd-label">Contact</span>
                    <strong>{row.contact}</strong>
                    <span>{row.email}</span>
                    <span>{row.telephone}</span>
                  </div>
                  <div className="rd-col">
                    <span className="rd-label">Parc</span>
                    <strong>{row.vehicules} véhicules</strong>
                    <span>
                      {row.secteur} · {row.ville}
                    </span>
                  </div>
                  <div className="rd-col">
                    <span className="rd-label">Remontée GPS (7 j)</span>
                    <div className="spark">
                      {[...SPARK, row.sante].map((h, i) => (
                        <i key={i} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <span className="spacer" />
                  <Button variant="outlined" startIcon={<MaterialIcon name="open_in_new" />}>
                    Ouvrir la fiche
                  </Button>
                </div>
              )}
            />
          </Demo>
        </DocSection>

        <DocSection
          id="description-list"
          title="Liste descriptive (clé / valeur)"
          source="app-description-list (shared/components/data)"
          cols={2}
          description="Bloc standard des fiches détail : 1 à 4 colonnes (responsive), disposition verticale ou horizontale, bordée ou rayée, valeurs typées (mono, lien, email, téléphone, badge, multi-ligne), copie en un clic, valeur vide « — »."
        >
          <Demo label="Verticale, 3 colonnes" code={CODE.dl}>
            <DescriptionList items={INFOS} columns={3} />
          </Demo>
          <div className="col">
            <Demo label="Horizontale" hint='layout="horizontal"'>
              <DescriptionList items={CONTRAT} columns={1} layout="horizontal" title="Contrat en cours" />
            </Demo>
            <Demo label="Bordée" hint="bordered">
              <DescriptionList items={CONTRAT} columns={3} bordered />
            </Demo>
          </div>
        </DocSection>

        <DocSection
          id="counters"
          title="Compteurs animés & tendances"
          source="app-stat-counter · app-trend (shared/components/data)"
          description="Les valeurs s'animent à l'apparition puis à chaque mise à jour (easing, respecte prefers-reduced-motion). Formats nombre, FCFA, pourcentage, compact. Badge de tendance coloré selon que la hausse est bonne ou non (inverse)."
        >
          <Demo label="KPI animés" code={CODE.counter}>
            <div className="kpis">
              <div className="kpi">
                <span className="k-label">
                  <MaterialIcon name="payments" />
                  Chiffre d'affaires
                </span>
                <strong>
                  <StatCounter value={kpi.ca} format="compact" suffix=" FCFA" decimals={1} />
                </strong>
                <Trend value={9.2} label="vs sept." />
              </div>
              <div className="kpi">
                <span className="k-label">
                  <MaterialIcon name="local_shipping" />
                  Véhicules suivis
                </span>
                <strong>
                  <StatCounter value={kpi.vehicules} />
                </strong>
                <Trend value={3.1} label="vs sept." />
              </div>
              <div className="kpi">
                <span className="k-label">
                  <MaterialIcon name="wifi_tethering" />
                  Disponibilité
                </span>
                <strong>
                  <StatCounter value={kpi.dispo} format="percent" decimals={1} />
                </strong>
                <Trend value={0} label="stable" />
              </div>
              <div className="kpi">
                <span className="k-label">
                  <MaterialIcon name="notifications_active" />
                  Alertes ouvertes
                </span>
                <strong>
                  <StatCounter value={kpi.alertes} />
                </strong>
                <Trend value={-18} inverse label="moins d'alertes = mieux" />
              </div>
            </div>
            <div className="row demo-actions">
              <Button variant="outlined" startIcon={<MaterialIcon name="refresh" />} onClick={refresh}>
                Simuler une mise à jour
              </Button>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="diff"
          title="Comparaison de versions (diff)"
          source="app-text-diff (shared/components/data)"
          cols={2}
          description="Diff ligne à ligne (LCS) avec mots modifiés surlignés, vue unifiée ou côte à côte, numéros de ligne et lignes identiques repliées autour du contexte."
        >
          <Demo label="Contrat — v1 → v2" hint='mode="split"' code={CODE.diff}>
            <TextDiff before={V1} after={V2} title="contrat-cadre.txt" mode="split" context={1} />
          </Demo>
          <Demo label="Configuration de balise" hint="unifiée">
            <TextDiff before={CFG1} after={CFG2} title="gt06-config.json" />
          </Demo>
        </DocSection>

        <DocSection
          id="audit"
          title="Historique des modifications (audit log)"
          source="app-audit-log (shared/components/data)"
          description="Fil chronologique groupé par jour, filtres par type d'action et par auteur (avatars), détail champ par champ « avant → après » repliable, commentaires et contexte technique."
        >
          <Demo label="Activité du compte" code={CODE.audit}>
            <AuditLog entries={AUDIT} />
          </Demo>
        </DocSection>

        <DocSection
          id="qr"
          title="QR code & code-barres"
          source="app-qr-code · app-barcode (shared/utils/qr-code.util.ts)"
          cols={3}
          description="Générés localement en SVG, sans service externe : QR (versions 1–40, correction L/M/Q/H, UTF-8, logo ou icône central, export PNG / SVG) et Code 128 (jeu B, ou C pour les numéros). Validés avec le décodeur natif du navigateur."
        >
          <Demo label="Lien de suivi" code={CODE.qr}>
            <div className="qr-demo">
              <QrCode ref={qr} value={qrText} size={168} icon="local_shipping" />
              <div className="form-field w-100">
                <div className="field-box">
                  <MaterialIcon name="link" />
                  <input value={qrText} onChange={(e) => setQrText(e.target.value)} />
                </div>
              </div>
              <Button variant="outlined" startIcon={<MaterialIcon name="download" />} onClick={() => void download()}>
                Télécharger en PNG
              </Button>
            </div>
          </Demo>
          <Demo label="Wi-Fi & carte de visite">
            <div className="qr-pair">
              <div className="qr-card">
                <QrCode value={WIFI} size={120} ecc="Q" />
                <span>Wi-Fi atelier</span>
              </div>
              <div className="qr-card">
                <QrCode value={VCARD} size={120} color="#4f6bed" />
                <span>vCard contact</span>
              </div>
            </div>
          </Demo>
          <Demo label="Étiquette de balise" hint="Code 128">
            <div className="label-card">
              <div className="lc-head">
                <MaterialIcon name="router" />
                <strong>Balise GT06-N</strong>
                <span className="spacer" />
                <span className="lc-tag">4G</span>
              </div>
              <div className="lc-body">
                <QrCode value="IMEI:358240051111110" size={84} quiet={1} />
                <div className="lc-info">
                  <span>IMEI</span>
                  <strong>358240051111110</strong>
                  <span>Véhicule</span>
                  <strong>CI-4521-AB</strong>
                </div>
              </div>
              <Barcode value="358240051111110" height={44} moduleWidth={1.4} />
            </div>
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}
