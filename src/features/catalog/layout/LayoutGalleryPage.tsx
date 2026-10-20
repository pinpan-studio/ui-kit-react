import { Button, IconButton, Slider } from '@mui/material';
import { useState } from 'react';
import { StatusBadge } from '../../../components/content/StatusBadge';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import './layout-gallery.scss';

const TOC: TocItem[] = [
  { id: 'page', label: 'Page layout' },
  { id: 'dashboard', label: 'Dashboard layout' },
  { id: 'two-cols', label: 'Two columns' },
  { id: 'three-cols', label: 'Three columns' },
  { id: 'sidebar', label: 'Sidebar layout' },
  { id: 'full', label: 'Full width' },
  { id: 'sections', label: 'Card sections' },
  { id: 'responsive', label: 'Responsive containers' },
  { id: 'breakpoints', label: 'Breakpoints' },
];

const BREAKPOINTS = [
  { mixin: '@include xs / sm / md', range: '≤ 375 / 480 / 600px', usage: 'Petits mobiles : 1 colonne, textes réduits' },
  { mixin: '@include mobile', range: '≤ 768px', usage: 'Sidenavs en mode over, grilles 1 colonne, titres masqués' },
  { mixin: '@include lg', range: '≤ 960px', usage: 'Tablette paysage : bouton de fermeture du menu de module' },
  { mixin: '@include tablet', range: '≤ 1024px', usage: 'Grilles 2 colonnes, actions qui passent à la ligne' },
  { mixin: '@include xl / xxl', range: '≤ 1280 / 1440px', usage: 'Grands écrans : densité des grilles' },
  { mixin: '@include desktop', range: '≥ 1025px', usage: 'Mise en page desktop complète' },
  { mixin: '@include from-sm … from-2xl', range: 'min-width', usage: 'Approche mobile-first' },
  { mixin: '@include responsive-grid(4, 2, 1)', range: '—', usage: 'Grille 4/2/1 colonnes prête à l’emploi' },
];

const CODE = {
  page: `
<div className="page-container">          {/* max-width 1440px, padding 24px */}
  <div className="page-header">…</div>    {/* titre + actions */}
  <div className="toolbar-search-filters">…</div>
  <div className="m3-table-container">…</div>
  <Paginator … />
</div>
/* SCSS : @use 'styles/entity-list';  ou  @use 'styles/detail-page'; */`,
  detail: `
<div className="detail-grid">          {/* 2fr / 1fr, 1 colonne < 1280px */}
  <div className="detail-main"> <div className="panel-card">…</div> </div>
  <aside className="detail-aside"> <div className="panel-card">…</div> </aside>
</div>`,
  sections: `
<div className="panel-card">
  <div className="section-header-flex">
    <div className="section-title-box"><MaterialIcon name="business" /><h3>Informations</h3></div>
    <IconButton className="action-icon-btn"><MaterialIcon name="edit" /></IconButton>
  </div>
  <div className="info-grid">
    <div className="info-field"><span className="lbl">Raison sociale</span><span className="val">…</span></div>
  </div>
</div>`,
  module: `
<div className="module-sidenav-container">
  {open && <nav className="module-sidenav">…sections + items…</nav>}
  <div className="module-content"><Outlet /></div>
</div>
{/* Les pages enfants basculent le menu du module via un contexte (équivalent ModuleDrawerService). */}`,
};

const r = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const Field = ({ l, v }: { l: string; v: React.ReactNode }) => (
  <div className="info-field">
    <span className="lbl">{l}</span>
    <span className="val">{v}</span>
  </div>
);
const Head = ({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) => (
  <div className="section-header-flex">
    <div className="section-title-box">
      <MaterialIcon name={icon} />
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

/** Galerie /components/layout — structures de page réutilisables (LayoutGalleryComponent). */
export function LayoutGalleryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [width, setWidth] = useState(100);
  return (
    <DocPage
      title="Layout"
      icon="dashboard_customize"
      className="gallery-layout"
      subtitle="Structures de page du projet : conteneur de page, en-tête, grilles de tableau de bord, fiche détail en deux colonnes, panneaux de section et conteneurs responsive. Voir aussi la galerie des layouts complets (/layouts)."
      toc={TOC}
    >
      <DocSection
        id="page"
        title="Page layout"
        source=".page-container · .page-header · contenu"
        description="Squelette commun à toutes les pages liste et détail."
      >
        <Demo label="Structure" muted code={CODE.page}>
          <div className="wire page-wire">
            <div className="w-header">
              <div className="w-title">
                <span className="w-ico">
                  <MaterialIcon name="menu" />
                </span>
                <div>
                  <b>Titre de la page</b>
                  <i>Sous-titre descriptif — 128 élément(s)</i>
                </div>
              </div>
              <div className="w-actions">
                <span className="w-btn sq" />
                <span className="w-btn primary">+ Nouveau</span>
              </div>
            </div>
            <div className="w-search">
              <MaterialIcon name="search" />
              <span>Rechercher…</span>
              <span className="w-sep" />
              <span className="w-filter">Statut : Tous ▾</span>
            </div>
            <div className="w-table">
              {r(5).map((i) => (
                <div key={i} className="w-row">
                  <span className="w-tag" />
                  <span className="w-line" />
                  <span className="w-line short" />
                  <span className="w-pill" />
                </div>
              ))}
            </div>
            <div className="w-pager">
              <span />
              <span className="active" />
              <span />
              <span />
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="dashboard"
        title="Dashboard layout"
        source=".kpi-grid · grilles de graphiques · panneaux d'alertes"
      >
        <Demo label="KPI + graphiques + listes" muted>
          <div className="wire">
            <div className="w-kpis">
              {['indigo', 'success', 'warning', 'danger'].map((k) => (
                <div key={k} className="w-kpi">
                  <span className={'w-kpi-ico ' + k} />
                  <div>
                    <b />
                    <i />
                  </div>
                </div>
              ))}
            </div>
            <div className="w-dash">
              <div className="w-card big">
                <div className="w-card-h" />
                <div className="w-chart">
                  {[40, 65, 52, 80, 70, 92, 85].map((h, i) => (
                    <span key={i} style={{ height: h + '%' }} />
                  ))}
                </div>
              </div>
              <div className="w-card">
                <div className="w-card-h" />
                <div className="w-donut" />
              </div>
            </div>
            <div className="w-dash even">
              {['', 'warn'].map((c) => (
                <div key={c} className="w-card">
                  <div className="w-card-h" />
                  {r(3).map((i) => (
                    <div key={i} className="w-li">
                      <span className={`w-dot ${c}`} />
                      <span className="w-line" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="two-cols"
        title="Two columns"
        source=".detail-grid · .detail-main · .detail-aside (styles/detail-page)"
        description="Fiche détail : colonne principale 2fr + colonne latérale 1fr ; bascule en une colonne sous 1280px."
      >
        <Demo label="Fiche détail" code={CODE.detail}>
          <div className="detail-grid">
            <div className="detail-main">
              <div className="panel-card">
                <Head icon="business" title="Informations générales" />
                <div className="info-grid">
                  <Field l="Raison sociale" v="Bolloré Logistics CI" />
                  <Field l="Secteur" v="Logistique" />
                  <Field l="Téléphone" v="+225 07 21 45 33" />
                  <Field l="Email" v="contact@bollore.ci" />
                </div>
              </div>
              <div className="panel-card">
                <Head icon="directions_car" title="Véhicules (3)" />
                <div className="mini-list">
                  {['AB-1234-CI', 'AB-5678-CI', 'CD-9012-CI'].map((v) => (
                    <div key={v} className="mini-row">
                      <div className="item-left">
                        <span className="code-tag">{v}</span>
                      </div>
                      <div className="item-right">
                        <StatusBadge label="Actif" color="success" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <aside className="detail-aside">
              <div className="panel-card">
                <Head icon="insights" title="Résumé" />
                <div className="info-grid one">
                  <Field l="Statut" v={<StatusBadge label="Actif" color="success" />} />
                  <Field l="CA mensuel" v="1 240 000 F" />
                  <Field l="Gestionnaire" v="Aminata Diallo" />
                </div>
              </div>
            </aside>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="three-cols" title="Three columns" source="grilles CSS (kanban, tableaux de bord)">
        <Demo label="3 colonnes égales → 1 colonne en mobile">
          <div className="three-cols">
            {[
              { t: 'À faire', n: 4, col: 'neutral' },
              { t: 'En cours', n: 3, col: 'info' },
              { t: 'Terminé', n: 6, col: 'success' },
            ].map((c) => (
              <div key={c.t} className="col-card">
                <div className="col-head">
                  <strong>{c.t}</strong>
                  <StatusBadge label={'' + c.n} color={c.col} />
                </div>
                {r(2).map((i) => (
                  <div key={i} className="col-item">
                    <span className="w-line" />
                    <span className="w-line short" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="sidebar"
        title="Sidebar layout"
        source="module shell : mat-sidenav-container + sidenav de module"
        description="Chaque module (Produits, Finance, ASSAC…) encapsule ses pages dans un conteneur avec sa propre sous-navigation repliable."
      >
        <Demo label="Shell de module" hint="bascule" flush code={CODE.module}>
          <div className="sidebar-demo" style={{ display: 'flex', overflow: 'hidden' }}>
            {sidebarOpen && (
              <nav className="sd-nav" style={{ flexShrink: 0 }}>
                <div className="sd-inner">
                  <div className="sd-head">
                    <span className="w-kpi-ico indigo" />
                    <b>Module</b>
                  </div>
                  {['Tableau de bord', 'Catalogue', 'Paramètres'].map((s, i) => (
                    <div key={s} style={{ display: 'contents' }}>
                      <div className="sd-sec">{s}</div>
                      <div className={`sd-item${i === 1 ? ' active' : ''}`}>
                        <MaterialIcon name="chevron_right" /> Élément {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </nav>
            )}
            <div className="sd-content" style={{ flex: 1, minWidth: 0 }}>
              <IconButton onClick={() => setSidebarOpen((o) => !o)} aria-label="Basculer le menu du module">
                <MaterialIcon name="menu" />
              </IconButton>
              <div className="wire inner">
                <div className="w-table">
                  {r(3).map((i) => (
                    <div key={i} className="w-row">
                      <span className="w-tag" />
                      <span className="w-line" />
                      <span className="w-pill" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="full" title="Full width" source="pages plein écran (kanban, planning, calendrier, explorateur)">
        <Demo label="Contenu pleine largeur avec défilement horizontal" muted>
          <div className="full-scroll">
            {['Lun 12', 'Mar 13', 'Mer 14', 'Jeu 15', 'Ven 16', 'Sam 17', 'Dim 18', 'Lun 19', 'Mar 20'].map((d, i) => (
              <div key={d} className="day-col">
                <b>{d}</b>
                <span className="ev" style={{ height: 40 + (i % 3) * 18 }} />
                {i % 2 === 1 && <span className="ev alt" />}
              </div>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="sections"
        title="Card sections"
        source=".panel-card · .section-header-flex · .info-grid · .notes-block · .empty-section"
        cols={2}
      >
        <Demo label="Section avec grille d'attributs" code={CODE.sections}>
          <div className="panel-card">
            <Head icon="receipt_long" title="Facturation">
              <IconButton className="action-icon-btn" aria-label="Modifier">
                <MaterialIcon name="edit" />
              </IconButton>
            </Head>
            <div className="info-grid">
              <Field l="Profil" v="Mensuel standard" />
              <Field l="Groupe" v="Grands comptes" />
              <Field l="Échéance" v="5 du mois" />
              <Field l="Mode" v="Virement" />
            </div>
            <div className="notes-block">
              <span className="lbl">Notes</span>
              <p>Facture groupée pour toutes les filiales.</p>
            </div>
          </div>
        </Demo>
        <Demo label="Section vide">
          <div className="panel-card">
            <Head icon="description" title="Contrats">
              <Button variant="outlined" startIcon={<MaterialIcon name="add" />}>
                Ajouter
              </Button>
            </Head>
            <div className="empty-section">
              <MaterialIcon name="description" />
              <span>Aucun contrat pour ce client</span>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="responsive"
        title="Responsive containers"
        source=".cards-grid (auto-fill 300px) · .form-grid (2 → 1 col < 560px) · .kpi-grid"
        description="Faites varier la largeur du conteneur pour voir la grille se réorganiser."
      >
        <Demo label="cards-grid" hint={width + ' %'}>
          <Slider
            min={30}
            max={100}
            step={5}
            className="w-100"
            valueLabelDisplay="auto"
            value={width}
            onChange={(_, v) => setWidth(v as number)}
            aria-label="Largeur du conteneur"
          />
          <div className="resizable" style={{ width: width + '%' }}>
            <div className="cards-grid">
              {r(6).map((i) => (
                <div key={i} className="entity-card mini">
                  <span className="w-kpi-ico success" />
                  <span className="w-line" />
                  <span className="w-line short" />
                </div>
              ))}
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="breakpoints" title="Breakpoints" source="src/styles/_breakpoints.scss (mixins SCSS)">
        <Demo label="Mixins disponibles">
          <div className="bp-table">
            <div className="bp-row head">
              <span>Mixin</span>
              <span>Plage</span>
              <span>Usage typique</span>
            </div>
            {BREAKPOINTS.map((b) => (
              <div key={b.mixin} className="bp-row">
                <code>{b.mixin}</code>
                <span>{b.range}</span>
                <span>{b.usage}</span>
              </div>
            ))}
          </div>
          <p className="muted">
            Dans un SCSS de composant : <code>@use 'styles/breakpoints' as *;</code> puis{' '}
            <code>
              @include mobile {'{'} … {'}'}
            </code>
            .
          </p>
        </Demo>
      </DocSection>
    </DocPage>
  );
}
