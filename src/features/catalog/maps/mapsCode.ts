// Extraits de code de la galerie Cartes (portés depuis maps-gallery.component.ts).
export const CODE = {
  basemaps: `
<!-- auto = Esri Canvas gris clair en clair, gris foncé en sombre ; les fonds clairs sont assombris en mode sombre -->
<app-map [(basemap)]="basemap" [basemapSwitcher]="true"
  [basemapOptions]="['auto', 'streets', 'topo', 'osm', 'esri-imagery']" />`,
  markers: `
<app-map [markers]="vehicules" [scale]="true" (markerClick)="open($event)">
  <div mapOverlay class="legend">…</div>   <!-- contenu projeté en bas à droite -->
</app-map>

const vehicules: MapMarker[] = [{
  id: 'v1', lat: 5.3237, lng: -4.0193,
  title: 'CI-4521-AB', lines: ['En mouvement · 54 km/h'],   // popup
  icon: 'local_shipping', tone: 'success',                   // pastille flat
  pulse: true, heading: 120, tooltip: 'CI-4521-AB',
}];`,
  cluster: `<app-map [markers]="positions" [cluster]="true" [zoom]="7" />   <!-- leaflet.markercluster, chargé à la demande -->`,
  routes: `
<app-map [routes]="trajets" [markers]="etapes" />

const trajets: MapRoute[] = [
  { id: 't1', points: [[5.32, -4.01], …], tone: 'primary', endpoints: true, label: 'Trajet réalisé' },
  { id: 't2', points: […], tone: 'warning', dashed: true, label: 'Itinéraire prévu' },
];`,
  zones: `
const zones: MapZone[] = [
  { id: 'z1', label: 'Dépôt central', tone: 'success', circle: { center: [5.303, -3.985], radius: 600 } },
  { id: 'z2', label: 'Zone portuaire', tone: 'error', polygon: [[5.299, -4.018], …] },
];
<app-map [zones]="zones" [markers]="depots" />`,
  draw: `
<app-map draw="leaflet-draw" [drawShapes]="['polygon', 'rectangle', 'circle', 'polyline', 'marker']"
  (drawChange)="geojson = $event" />   <!-- FeatureCollection, cercles : properties.radius (m) -->`,
  geoman: `
<!-- @geoman-io/leaflet-geoman-free : dessin, édition, déplacement, découpe, suppression -->
<app-map draw="geoman" (drawChange)="geojson = $event" />`,
  compact: `<app-map [markers]="[vehicule]" [interactive]="false" [zoom]="15" height="180px" [fitBounds]="false" [center]="[v.lat, v.lng]" />`,
  states: `<app-map state="loading" />   <!-- loading | error | empty | ready ; (retry) sur l'état error -->`,
};
