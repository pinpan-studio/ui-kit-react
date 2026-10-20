import { CircularProgress, Popper } from '@mui/material';
import type * as Leaflet from 'leaflet';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MapView } from '../map/MapView';
import type { MapMarker } from '../map/mapModels';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { AddressValue, PlaceOption } from './addressTypes';
import { Tip } from './Tip';
import './address-field.scss';

const KIND_ICON: Record<string, string> = {
  road: 'signpost',
  poi: 'place',
  area: 'location_city',
  gps: 'my_location',
  pin: 'push_pin',
};
const DEFAULT_CENTER: [number, number] = [7.54, -5.55];

/**
 * app-address-field : autocomplétion (recherche fournie par l'hôte), « Ma position » (géolocalisation),
 * carte optionnelle où un clic place un repère précis. Valeur : `{ label, detail, lat, lng, … }`.
 */
export function AddressField({
  search,
  value,
  onChange,
  placeholder = 'Rechercher une adresse…',
  map = false,
  mapHeight = '220px',
  showCoords = true,
  minChars = 2,
  defaultCenter = DEFAULT_CENTER,
  disabled = false,
  onBlur,
}: {
  search: (q: string) => PlaceOption[] | Promise<PlaceOption[]>;
  value: AddressValue | null;
  onChange: (v: AddressValue | null) => void;
  placeholder?: string;
  map?: boolean;
  mapHeight?: string;
  showCoords?: boolean;
  minChars?: number;
  defaultCenter?: [number, number];
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const origin = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const leaflet = useRef<Leaflet.Map | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seq = useRef(0);
  const [text, setText] = useState(value?.label ?? '');
  const [results, setResults] = useState<PlaceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(300);
  const geolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // writeValue
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(value?.label ?? '');
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const markers = useMemo<MapMarker[]>(
    () =>
      value
        ? [
            {
              id: 'addr',
              lat: value.lat,
              lng: value.lng,
              title: value.label,
              lines: value.detail ? [value.detail] : [],
              icon: 'location_on',
              tone: 'primary',
            },
          ]
        : [],
    [value],
  );
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  const set = (v: AddressValue | null) => {
    setLast(v);
    setText(v?.label ?? '');
    onChange(v);
    if (v && v.kind !== 'pin') leaflet.current?.flyTo([v.lat, v.lng], 15, { duration: 0.6 });
  };
  const onInput = (q: string) => {
    setText(q);
    setError('');
    setWidth(origin.current?.getBoundingClientRect().width ?? 300);
    clearTimeout(timer.current);
    if (q.trim().length < minChars) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const id = ++seq.current;
    timer.current = setTimeout(async () => {
      const r = await search(q);
      if (id !== seq.current) return;
      setResults(r);
      setActive(0);
      setSearched(true);
      setLoading(false);
    }, 200);
  };
  const select = (p: PlaceOption) => {
    set(p);
    setResults([]);
    setSearched(false);
    inp.current?.blur();
  };
  const onKey = (e: KeyboardEvent) => {
    const r = results;
    if (e.key === 'ArrowDown' && r.length) {
      e.preventDefault();
      setActive((active + 1) % r.length);
    } else if (e.key === 'ArrowUp' && r.length) {
      e.preventDefault();
      setActive((active - 1 + r.length) % r.length);
    } else if (e.key === 'Enter' && r[active]) {
      e.preventDefault();
      select(r[active]);
    } else if (e.key === 'Escape') setFocused(false);
  };
  const blur = () => {
    setFocused(false);
    // Texte modifié sans choisir de suggestion : retour à l'adresse validée.
    if (value && text !== value.label) setText(value.label);
    onBlur?.();
  };
  const pin = (e: { lat: number; lng: number }) => {
    if (disabled) return;
    set({
      id: 'pin-' + Date.now(),
      label: value && value.kind !== 'pin' ? value.label : 'Point choisi sur la carte',
      detail: value?.detail ?? 'Repère manuel',
      city: value?.city,
      lat: e.lat,
      lng: e.lng,
      kind: 'pin',
    });
  };
  const locate = () => {
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        set({
          id: 'gps',
          label: 'Ma position actuelle',
          detail: `Précision ± ${Math.round(pos.coords.accuracy)} m`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          kind: 'gps',
        });
      },
      (err) => {
        setLocating(false);
        setError(err.code === 1 ? 'Accès à la position refusé.' : 'Position indisponible.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const open = focused && (results.length > 0 || (searched && !loading));

  return (
    <div className="app-address-field">
      <div className="form-field kit-field">
        <div ref={origin} className={`field-box${disabled ? ' is-disabled' : ''}`}>
          <MaterialIcon name="location_on" />
          <input
            ref={inp}
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            autoComplete="off"
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={blur}
          />
          {loading && <CircularProgress size={18} className="mat-spinner" />}
          {value && !disabled && (
            <Tip title="Effacer">
              <button
                type="button"
                className="af-btn"
                onClick={() => {
                  set(null);
                  inp.current?.focus();
                }}
              >
                <MaterialIcon name="close" />
              </button>
            </Tip>
          )}
          {geolocation && !disabled && (
            <Tip title="Utiliser ma position">
              <button type="button" className="af-btn" onClick={locate} disabled={locating}>
                <MaterialIcon name={locating ? 'hourglass_top' : 'my_location'} />
              </button>
            </Tip>
          )}
        </div>
      </div>
      {error && <span className="field-error">{error}</span>}
      {value && showCoords && (
        <span className="field-hint af-coords">
          <MaterialIcon name="pin_drop" />
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          {value.detail ? ` · ${value.detail}` : ''}
        </span>
      )}
      {map && (
        <div className="af-map">
          <MapView
            markers={markers}
            center={center}
            zoom={value ? 15 : 7}
            height={mapHeight}
            fitBounds={false}
            onMapClick={pin}
            onReady={(m) => {
              leaflet.current = m;
            }}
          />
          <span className="af-map-hint">
            <MaterialIcon name="touch_app" />
            Cliquez sur la carte pour ajuster le point
          </span>
        </div>
      )}
      <Popper
        open={open && !!origin.current}
        anchorEl={origin.current}
        placement="bottom-start"
        className="cdk-overlay-pane"
        style={{ zIndex: 1300, width, display: 'flex' }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
        ]}
      >
        <div className="kit-suggest-panel" onMouseDown={(e) => e.preventDefault()}>
          {results.map((p, i) => (
            <div
              key={p.id}
              className={`sg-item${i === active ? ' active' : ''}`}
              onClick={() => select(p)}
              onMouseEnter={() => setActive(i)}
            >
              <MaterialIcon name={KIND_ICON[p.kind || 'road'] ?? 'signpost'} />
              <span className="sg-text">
                <span>{p.label}</span>
                {p.detail && <span>{p.detail}</span>}
              </span>
            </div>
          ))}
          {!results.length && <div className="sg-empty">Aucune adresse trouvée pour « {text} »</div>}
        </div>
      </Popper>
    </div>
  );
}
