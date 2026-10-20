import type { FeatureCollection } from 'geojson';
import { useState } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { MapView } from '../../../components/map/MapView';
import { BASEMAPS, type BasemapKey, type MapMarker, type MapState } from '../../../components/map/mapModels';
import {
  ABIDJAN,
  FLOTTE,
  POSITIONS_DENSES,
  TRAJETS,
  TRAJET_ETAPES,
  ZONES,
  ZONE_MARKERS,
} from '../../../data/static/map.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './mapsCode';
import './maps-gallery.scss';

const TOC: TocItem[] = [
  { id: 'basemaps', label: 'Fonds de carte' },
  { id: 'markers', label: 'Marqueurs' },
  { id: 'cluster', label: 'Clustering' },
  { id: 'routes', label: 'Trajets' },
  { id: 'zones', label: 'Zones' },
  { id: 'draw', label: 'Leaflet Draw' },
  { id: 'geoman', label: 'Geoman (gratuit)' },
  { id: 'compact', label: 'Carte compacte' },
  { id: 'states', label: 'États' },
];
const SINGLE: MapMarker[] = FLOTTE.slice(0, 1);
const FIRST = FLOTTE[0] as MapMarker;
const BASEMAP_LIST: { key: BasemapKey; label: string; url: string }[] = [
  { key: 'auto', label: 'Auto (gris clair / gris foncé)', url: 'server.arcgisonline.com' },
  ...Object.values(BASEMAPS).map((b) => ({
    key: b.key as BasemapKey,
    label: b.label,
    url: new URL(
      b.url
        .replace('{s}', 'a')
        .replace(/\{[a-z]\}/g, '0')
        .replace('{r}', ''),
    ).host,
  })),
];
const STATES: MapState[] = ['loading', 'error', 'empty', 'ready'];

function summary(fc: FeatureCollection | null): string {
  if (!fc?.features.length) return 'Aucune forme';
  const count = fc.features.reduce<Record<string, number>>((acc, f) => {
    const k = f.geometry.type === 'Point' && f.properties?.['radius'] ? 'Cercle' : f.geometry.type;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(count)
    .map(([k, n]) => `${n} ${k}`)
    .join(' · ');
}

export function MapsGalleryPage() {
  const snack = useSnackbar();
  const [basemap, setBasemap] = useState<BasemapKey>('auto');
  const [drawGeo, setDrawGeo] = useState<FeatureCollection | null>(null);
  const [geomanGeo, setGeomanGeo] = useState<FeatureCollection | null>(null);
  const [demoState, setDemoState] = useState<MapState>('loading');
  const [lastClick, setLastClick] = useState('—');
  const pick = (m: MapMarker) => snack(m.title ?? m.id, { action: 'Fermer', duration: 2000 });
  // JsonPipe Angular : JSON.stringify(v, null, 2).
  const json = (fc: FeatureCollection | null) =>
    fc ? JSON.stringify(fc, null, 2) : 'Dessinez une forme sur la carte…';

  return (
    <div className="gallery-maps">
      <DocPage
        title="Cartes"
        icon="map"
        toc={TOC}
        subtitle="Composant app-map (shared/components/map) basé sur Leaflet et ses plugins gratuits : fonds de carte libres sans clé d'API, marqueurs flat, clustering, trajets, zones, dessin avec Leaflet Draw ou Geoman (édition gratuite). Contrôles, popups et barres d'outils suivent le thème clair / sombre."
      >
        <DocSection
          id="basemaps"
          title="Fonds de carte"
          source="app-map [basemap] [basemapSwitcher]"
          cols={2}
          description="Fonds gratuits sans clé, retenus pour leur rapidité : Esri Canvas gris clair / gris foncé (avec libellés), Esri Rues, Esri Topographique, OpenStreetMap, Esri Satellite. « auto » bascule entre gris clair et gris foncé selon le thème ; les fonds clairs sont assombris en mode sombre. Au-delà du zoom natif d'un fond, ses tuiles sont agrandies plutôt que laissées vides."
        >
          <Demo label="Sélecteur de fond" code={CODE.basemaps} flush>
            <MapView
              center={ABIDJAN}
              zoom={12}
              basemap={basemap}
              onBasemapChange={setBasemap}
              basemapSwitcher
              basemapOptions={['auto', 'streets', 'topo', 'osm', 'esri-imagery']}
              markers={FLOTTE}
              height="360px"
            />
          </Demo>
          <Demo label="Fournisseurs disponibles" hint="aucune clé requise">
            <ul className="provider-list">
              {BASEMAP_LIST.map((b) => (
                <li key={b.key} className={basemap === b.key ? 'active' : undefined} onClick={() => setBasemap(b.key)}>
                  <code>{b.key}</code>
                  <span>{b.label}</span>
                  <small>{b.url}</small>
                </li>
              ))}
            </ul>
          </Demo>
        </DocSection>

        <DocSection
          id="markers"
          title="Marqueurs"
          source="MapMarker · divIcon flat"
          description="Pastilles colorées par tone avec icône Material, halo « en direct », flèche de cap, infobulle au survol et popup flat. Le contenu projeté [mapOverlay] sert de légende."
        >
          <Demo label="Flotte en temps réel" hint={`Dernier clic : ${lastClick}`} code={CODE.markers} flush>
            <MapView
              markers={FLOTTE}
              scale
              height="420px"
              onMarkerClick={pick}
              onMapClick={(p) => setLastClick(`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)}
              overlay={
                <div className="map-legend">
                  <span>
                    <i style={{ background: 'var(--success-color)' }} />
                    En mouvement
                  </span>
                  <span>
                    <i style={{ background: 'var(--warning-color)' }} />À l'arrêt
                  </span>
                  <span>
                    <i style={{ background: 'var(--info-color)' }} />
                    Maintenance
                  </span>
                  <span>
                    <i style={{ background: 'var(--error-color)' }} />
                    Alerte / hors ligne
                  </span>
                  <span>
                    <i style={{ background: 'var(--text-muted)' }} />
                    Moteur coupé
                  </span>
                </div>
              }
            />
          </Demo>
        </DocSection>

        <DocSection
          id="cluster"
          title="Clustering"
          source="leaflet.markercluster"
          description="420 balises regroupées par proximité ; les groupes éclatent au zoom. Pastilles de groupe flat, sans zone de couverture."
        >
          <Demo
            label="Parc de balises (Côte d'Ivoire)"
            hint={`${POSITIONS_DENSES.length} positions`}
            code={CODE.cluster}
            flush
          >
            <MapView
              markers={POSITIONS_DENSES}
              cluster
              center={[7.2, -5.4]}
              zoom={7}
              fitBounds={false}
              height="420px"
            />
          </Demo>
        </DocSection>

        <DocSection
          id="routes"
          title="Trajets"
          source="MapRoute (polyline)"
          description="Trajet réalisé avec points de départ / arrivée, itinéraire prévu en pointillés, événements (arrêts, excès de vitesse) en marqueurs."
        >
          <Demo label="Historique CI-4521-AB" code={CODE.routes} flush>
            <MapView routes={TRAJETS} markers={TRAJET_ETAPES} height="380px" onMarkerClick={pick} />
          </Demo>
        </DocSection>

        <DocSection
          id="zones"
          title="Zones / géofences"
          source="MapZone (cercle ou polygone)"
          description="Zones colorées par tone, contour fin et remplissage léger, libellé au survol."
        >
          <Demo label="Géofences d'exploitation" code={CODE.zones} flush>
            <MapView zones={ZONES} markers={ZONE_MARKERS} height="380px" />
          </Demo>
        </DocSection>

        <DocSection
          id="draw"
          title="Leaflet Draw"
          source='leaflet-draw · draw="leaflet-draw"'
          description="Barre d'outils de dessin (polygone, rectangle, cercle, ligne, point) avec édition et suppression. Le résultat est émis en GeoJSON."
        >
          <div className="draw-grid">
            <Demo label="Dessiner une zone" code={CODE.draw} flush>
              <MapView
                draw="leaflet-draw"
                center={ABIDJAN}
                zoom={13}
                fitBounds={false}
                height="400px"
                onDrawChange={setDrawGeo}
              />
            </Demo>
            <Demo label="Sortie GeoJSON" hint={summary(drawGeo)}>
              <pre className="geojson">{json(drawGeo)}</pre>
            </Demo>
          </div>
        </DocSection>

        <DocSection
          id="geoman"
          title="Geoman (édition gratuite)"
          source='@geoman-io/leaflet-geoman-free · draw="geoman"'
          description="Alternative libre et plus récente à Leaflet Draw : dessin, édition des sommets, déplacement, découpe et suppression, interface en français."
        >
          <div className="draw-grid">
            <Demo label="Dessiner et éditer" code={CODE.geoman} flush>
              <MapView
                draw="geoman"
                center={ABIDJAN}
                zoom={13}
                fitBounds={false}
                height="400px"
                onDrawChange={setGeomanGeo}
              />
            </Demo>
            <Demo label="Sortie GeoJSON" hint={summary(geomanGeo)}>
              <pre className="geojson">{json(geomanGeo)}</pre>
            </Demo>
          </div>
        </DocSection>

        <DocSection
          id="compact"
          title="Carte compacte"
          source='[interactive]="false"'
          cols={3}
          description="Aperçu statique pour fiches de détail ou cartes de liste : pas de zoom ni de déplacement."
        >
          <Demo label="Fiche véhicule" code={CODE.compact}>
            <div className="map-card">
              <MapView
                markers={SINGLE}
                interactive={false}
                fitBounds={false}
                center={[FIRST.lat, FIRST.lng]}
                zoom={15}
                height="170px"
              />
              <div className="map-card-body">
                <strong>CI-4521-AB</strong>
                <span>Plateau, bd de la République · il y a 2 min</span>
              </div>
            </div>
          </Demo>
          <Demo label="Satellite">
            <div className="map-card">
              <MapView
                markers={ZONE_MARKERS}
                basemap="esri-imagery"
                interactive={false}
                fitBounds={false}
                center={[5.303, -3.985]}
                zoom={16}
                height="170px"
              />
              <div className="map-card-body">
                <strong>Dépôt central</strong>
                <span>Marcory, zone 4</span>
              </div>
            </div>
          </Demo>
          <Demo label="Zone">
            <div className="map-card">
              <MapView zones={ZONES.slice(1, 2)} interactive={false} height="170px" />
              <div className="map-card-body">
                <strong>Zone portuaire</strong>
                <span>Accès restreint · 2 alertes ce mois</span>
              </div>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="states"
          title="États"
          source="[state]"
          description="Chargement, erreur (avec action Réessayer) et vide, superposés à la carte."
        >
          <Demo label="États de la carte" code={CODE.states}>
            <div className="state-toggle">
              {STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={demoState === s ? 'active' : undefined}
                  onClick={() => setDemoState(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <MapView markers={FLOTTE} state={demoState} height="300px" onRetry={() => setDemoState('ready')} />
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}
