/* eslint-disable @typescript-eslint/no-explicit-any -- les API des plugins (draw, geoman, cluster) ne sont pas typées ici */
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { FeatureCollection } from 'geojson';
import type * as Leaflet from 'leaflet';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useThemeMode } from '../../hooks/useThemeMode';
import { MaterialIcon } from '../ui/MaterialIcon';
import {
  BASEMAPS,
  MAP_MAX_ZOOM,
  escapeHtml,
  loadLeaflet,
  mapToneColor,
  mapToneInk,
  type BasemapKey,
  type LeafletNs,
  type MapDrawEngine,
  type MapDrawShape,
  type MapMarker,
  type MapRoute,
  type MapState,
  type MapZone,
} from './mapModels';
import './map.scss';

export interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  basemap?: BasemapKey;
  onBasemapChange?: (b: BasemapKey) => void;
  basemapSwitcher?: boolean;
  basemapOptions?: BasemapKey[];
  markers?: MapMarker[];
  cluster?: boolean;
  routes?: MapRoute[];
  zones?: MapZone[];
  /** Ajuste la vue sur l'ensemble des objets affichés. */
  fitBounds?: boolean;
  interactive?: boolean;
  zoomControl?: boolean;
  scale?: boolean;
  draw?: MapDrawEngine;
  drawShapes?: MapDrawShape[];
  drawColor?: string;
  state?: MapState;
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  onMarkerClick?: (m: MapMarker) => void;
  onMapClick?: (p: { lat: number; lng: number }) => void;
  /** GeoJSON des formes dessinées (cercles : `properties.radius` en mètres). */
  onDrawChange?: (fc: FeatureCollection) => void;
  onReady?: (map: Leaflet.Map) => void;
  onRetry?: () => void;
  /** Contenu superposé (légende…), équivalent de `[mapOverlay]`. */
  overlay?: ReactNode;
}

const EMPTY: never[] = [];
const DEFAULT_SHAPES: MapDrawShape[] = ['polygon', 'rectangle', 'circle', 'polyline', 'marker'];
const DEFAULT_OPTIONS: BasemapKey[] = ['auto', 'streets', 'topo', 'osm', 'esri-imagery'];

/**
 * app-map : carte Leaflet générique, rendu flat (clair / sombre). Fond (+ sélecteur), marqueurs (+ clustering),
 * trajets, zones, dessin (Leaflet Draw ou Geoman), carte statique, états loading / error / empty, légende superposée.
 * Initialisée à l'apparition à l'écran (IntersectionObserver), comme côté Angular.
 */
export function MapView(props: MapViewProps) {
  const {
    center = [5.336, -4.027],
    zoom = 12,
    height = '380px',
    basemapSwitcher = false,
    basemapOptions = DEFAULT_OPTIONS,
    markers = EMPTY,
    cluster = false,
    routes = EMPTY,
    zones = EMPTY,
    fitBounds = true,
    interactive = true,
    zoomControl = true,
    scale = false,
    draw = 'none',
    drawShapes = DEFAULT_SHAPES,
    drawColor = 'var(--primary-color)',
    state = 'ready',
    loadingLabel = 'Chargement de la carte…',
    errorLabel = 'Les tuiles n’ont pas pu être chargées.',
    emptyLabel = 'Aucun élément géolocalisé à afficher.',
  } = props;
  const { mode } = useThemeMode();
  const dark = mode === 'dark';
  const [innerBasemap, setInnerBasemap] = useState<BasemapKey>(props.basemap ?? 'auto');
  const basemap = props.basemap ?? innerBasemap;
  const setBasemap = (b: BasemapKey) => {
    setInnerBasemap(b);
    props.onBasemapChange?.(b);
  };
  const def = BASEMAPS[basemap === 'auto' ? (dark ? 'dark' : 'light') : basemap];
  const dim = dark && !!def.dimInDark;

  const canvas = useRef<HTMLDivElement>(null);
  const ref = useRef<{
    L?: LeafletNs;
    map?: Leaflet.Map;
    tiles?: Leaflet.TileLayer;
    labels?: Leaflet.TileLayer;
    markerLayer?: Leaflet.LayerGroup;
    shapeLayer?: Leaflet.FeatureGroup;
    drawn?: Leaflet.FeatureGroup;
    fitted: boolean;
  }>({ fitted: false });
  // Dernières props pour les rappels Leaflet (évite de recréer la carte).
  const latest = useRef(props);
  latest.current = props;
  const [loaded, setLoaded] = useState(false);

  const cssColor = (v: string): string => {
    if (!v.startsWith('var(') || !canvas.current) return v;
    const probe = document.createElement('span');
    probe.style.color = v;
    canvas.current.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color || '#3b82f6';
  };
  const pinIcon = (L: LeafletNs, m: Pick<MapMarker, 'icon' | 'tone' | 'color' | 'pulse' | 'heading'>) => {
    const color = m.color ?? mapToneColor(m.tone);
    const heading =
      m.heading != null ? `<span class="kit-pin__heading" style="transform: rotate(${m.heading}deg)"></span>` : '';
    return L.divIcon({
      className: 'kit-pin-wrap',
      html: `<div class="kit-pin${m.pulse ? ' kit-pin--pulse' : ''}" style="--pin:${color};--pin-ink:${m.color ? '#fff' : mapToneInk(m.tone)}">${heading}<span class="material-icons">${escapeHtml(m.icon ?? 'place')}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
      tooltipAnchor: [16, 0],
    });
  };
  const dotIcon = (L: LeafletNs, color: string, end: boolean) =>
    L.divIcon({
      className: 'kit-pin-wrap',
      html: `<span class="kit-dot${end ? ' kit-dot--end' : ''}" style="--pin:${color}"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

  // Initialisation (une fois, à l'apparition à l'écran).
  useEffect(() => {
    const el = canvas.current;
    // Sans IntersectionObserver (jsdom), la carte n'est pas initialisée.
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    const init = async () => {
      const L = await loadLeaflet({ cluster, draw: draw === 'leaflet-draw', geoman: draw === 'geoman' });
      if (disposed) return;
      const map = L.map(el, {
        center,
        zoom,
        maxZoom: MAP_MAX_ZOOM,
        minZoom: 2,
        zoomControl: false,
        attributionControl: true,
        ...(draw === 'geoman' ? { pmIgnore: false } : {}),
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      } as Leaflet.MapOptions);
      map.attributionControl.setPrefix(false);
      const labelsPane = map.createPane('kit-labels');
      labelsPane.style.zIndex = '350';
      labelsPane.style.pointerEvents = 'none';
      if (interactive && zoomControl)
        L.control.zoom({ position: 'topright', zoomInTitle: 'Zoom avant', zoomOutTitle: 'Zoom arrière' }).addTo(map);
      if (scale) L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
      map.on('click', (e: Leaflet.LeafletMouseEvent) =>
        latest.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
      );
      ref.current.shapeLayer = L.featureGroup().addTo(map);
      ref.current.L = L;
      ref.current.map = map;

      const shapeStyle = () => {
        const c = cssColor(drawColor);
        return { color: c, weight: 2, fillColor: c, fillOpacity: 0.15 };
      };
      const emitDrawn = (layers: Leaflet.Layer[]) => {
        const features = layers.map((l: any) => {
          const f = l.toGeoJSON();
          if (l instanceof L.Circle) f.properties = { ...f.properties, radius: Math.round(l.getRadius()) };
          return f;
        });
        latest.current.onDrawChange?.({ type: 'FeatureCollection', features });
      };
      const has = (s: MapDrawShape) => drawShapes.includes(s);
      if (draw === 'leaflet-draw') {
        const LL = L as any;
        const shapeOptions = shapeStyle();
        const drawn = LL.featureGroup().addTo(map);
        ref.current.drawn = drawn;
        map.addControl(
          new LL.Control.Draw({
            position: 'topleft',
            edit: { featureGroup: drawn, edit: { selectedPathOptions: { ...shapeOptions, dashArray: '6 6' } } },
            draw: {
              polyline: has('polyline') && { shapeOptions: { ...shapeOptions, fillOpacity: 0 } },
              polygon: has('polygon') && { allowIntersection: false, showArea: false, shapeOptions },
              rectangle: has('rectangle') && { showArea: false, shapeOptions },
              circle: has('circle') && { showRadius: true, metric: true, shapeOptions },
              marker: has('marker') && { icon: pinIcon(L, { icon: 'place', color: drawColor }) },
              circlemarker: false,
            },
          }),
        );
        const sync = () => emitDrawn(drawn.getLayers());
        map.on(LL.Draw.Event.CREATED, (e: any) => {
          drawn.addLayer(e.layer);
          sync();
        });
        map.on(LL.Draw.Event.EDITED, sync);
        map.on(LL.Draw.Event.DELETED, sync);
      }
      if (draw === 'geoman') {
        const m = map as any;
        m.pm.setLang('fr');
        m.pm.setGlobalOptions({
          pathOptions: { ...shapeStyle(), pmIgnore: false },
          templineStyle: { color: cssColor(drawColor) },
          hintlineStyle: { color: cssColor(drawColor), dashArray: '5 5' },
          markerStyle: { icon: pinIcon(L, { icon: 'place', color: drawColor }), pmIgnore: false },
        });
        m.pm.addControls({
          position: 'topleft',
          drawMarker: has('marker'),
          drawPolyline: has('polyline'),
          drawPolygon: has('polygon'),
          drawRectangle: has('rectangle'),
          drawCircle: has('circle'),
          drawCircleMarker: false,
          drawText: false,
          rotateMode: false,
        });
        const sync = () => emitDrawn(m.pm.getGeomanLayers());
        m.on('pm:create', (e: any) => {
          e.layer.on('pm:edit pm:dragend', sync);
          sync();
        });
        m.on('pm:remove pm:cut', sync);
      }
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(el);
      setLoaded(true);
      latest.current.onReady?.(map);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void init();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      disposed = true;
      io.disconnect();
      ro?.disconnect();
      ref.current.map?.remove();
      ref.current = { fitted: false };
      setLoaded(false);
    };
    // Options d'initialisation lues une seule fois, comme les inputs Angular lus dans init().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fond de carte.
  useEffect(() => {
    const { L, map } = ref.current;
    if (!loaded || !L || !map) return;
    ref.current.tiles?.remove();
    ref.current.labels?.remove();
    const retry = (layer: Leaflet.TileLayer) => {
      layer.on('tileerror', (e: Leaflet.TileErrorEvent) => {
        const img = e.tile as HTMLImageElement;
        if (img.dataset['retried']) return;
        img.dataset['retried'] = '1';
        const src = img.src;
        setTimeout(() => {
          img.src = '';
          img.src = src;
        }, 800);
      });
      return layer;
    };
    const opts: Leaflet.TileLayerOptions = {
      attribution: def.attribution,
      maxZoom: MAP_MAX_ZOOM,
      maxNativeZoom: def.maxNativeZoom,
      subdomains: def.subdomains ?? 'abc',
      keepBuffer: 4,
    };
    ref.current.tiles = retry(L.tileLayer(def.url, opts)).addTo(map);
    ref.current.labels = def.labelsUrl
      ? retry(L.tileLayer(def.labelsUrl, { ...opts, attribution: '', pane: 'kit-labels' })).addTo(map)
      : undefined;
  }, [loaded, def]);

  // Données (les couleurs SVG résolues dépendent du thème).
  useEffect(() => {
    const r = ref.current;
    const L = r.L as any;
    const map = r.map;
    if (!loaded || !L || !map || !r.shapeLayer) return;
    r.markerLayer?.remove();
    r.shapeLayer.clearLayers();
    const group: Leaflet.LayerGroup = cluster
      ? L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (c: any) => {
            const n = c.getChildCount();
            const size = n < 10 ? 34 : n < 100 ? 40 : 48;
            return L.divIcon({
              className: 'kit-pin-wrap',
              html: `<div class="kit-cluster" style="width:${size}px;height:${size}px">${n}</div>`,
              iconSize: [size, size],
            });
          },
        })
      : L.layerGroup();
    for (const m of markers) {
      const mk = L.marker([m.lat, m.lng], { icon: pinIcon(L, m), keyboard: false });
      if (m.title || m.lines?.length) {
        const lines = (m.lines ?? []).map((l) => `<span>${escapeHtml(l)}</span>`).join('');
        mk.bindPopup(`<div class="kit-popup__body"><strong>${escapeHtml(m.title ?? '')}</strong>${lines}</div>`, {
          className: 'kit-popup',
          closeButton: false,
          maxWidth: 260,
        });
      }
      if (m.tooltip) mk.bindTooltip(escapeHtml(m.tooltip), { className: 'kit-tooltip', direction: 'right' });
      mk.on('click', () => latest.current.onMarkerClick?.(m));
      group.addLayer(mk);
    }
    r.markerLayer = group.addTo(map);
    for (const rt of routes) {
      const color = cssColor(rt.color ?? mapToneColor(rt.tone));
      L.polyline(rt.points, {
        color,
        weight: 4,
        opacity: 0.9,
        dashArray: rt.dashed ? '8 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      })
        .bindTooltip(rt.label ? escapeHtml(rt.label) : '', { className: 'kit-tooltip', sticky: true })
        .addTo(r.shapeLayer);
      const first = rt.points[0];
      const last = rt.points[rt.points.length - 1];
      if (rt.endpoints && rt.points.length > 1 && first && last) {
        L.marker(first, { icon: dotIcon(L, color, false), interactive: false }).addTo(r.shapeLayer);
        L.marker(last, { icon: dotIcon(L, color, true), interactive: false }).addTo(r.shapeLayer);
      }
    }
    for (const z of zones) {
      const color = cssColor(z.color ?? mapToneColor(z.tone, 'var(--info-color)'));
      const style = { color, weight: 1.5, fillColor: color, fillOpacity: 0.12 };
      const layer = z.circle
        ? L.circle(z.circle.center, { ...style, radius: z.circle.radius })
        : z.polygon
          ? L.polygon(z.polygon, style)
          : null;
      if (!layer) continue;
      if (z.label) layer.bindTooltip(escapeHtml(z.label), { className: 'kit-tooltip', sticky: true });
      layer.addTo(r.shapeLayer);
    }
    if (fitBounds && !r.fitted) {
      const b = L.latLngBounds([]);
      markers.forEach((m) => b.extend([m.lat, m.lng]));
      r.shapeLayer.eachLayer((l: any) =>
        l.getBounds ? b.extend(l.getBounds()) : l.getLatLng && b.extend(l.getLatLng()),
      );
      if (b.isValid()) {
        map.fitBounds(b, { padding: [36, 36], maxZoom: 15 });
        r.fitted = true;
      }
    }
  }, [loaded, markers, routes, zones, cluster, dark, fitBounds]);

  return (
    <div className="app-map">
      <div
        className={`kit-map${dim ? ' kit-map--dim' : ''}${interactive ? '' : ' kit-map--static'}`}
        style={{ height }}
      >
        <div className="kit-map__canvas" ref={canvas} />
        {basemapSwitcher && state === 'ready' && (
          <div className="kit-map__switch">
            {basemapOptions.map((k) => (
              <button
                key={k}
                type="button"
                className={basemap === k ? 'active' : undefined}
                onClick={() => setBasemap(k)}
              >
                {k === 'auto' ? 'Plan' : BASEMAPS[k].label}
              </button>
            ))}
          </div>
        )}
        <div className="kit-map__overlay">{props.overlay}</div>
        {state === 'loading' && (
          <div className="kit-map__state">
            <span className="kit-map__spinner" />
            <span>{loadingLabel}</span>
          </div>
        )}
        {state === 'error' && (
          <div className="kit-map__state">
            <MaterialIcon name="cloud_off" />
            <strong>Carte indisponible</strong>
            <span>{errorLabel}</span>
            <button type="button" onClick={() => props.onRetry?.()}>
              Réessayer
            </button>
          </div>
        )}
        {state === 'empty' && (
          <div className="kit-map__state soft">
            <MaterialIcon name="location_off" />
            <strong>Aucune position</strong>
            <span>{emptyLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
