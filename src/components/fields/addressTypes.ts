export interface PlaceOption {
  id: string;
  label: string;
  detail?: string;
  city?: string;
  lat: number;
  lng: number;
  kind?: 'road' | 'poi' | 'area' | 'gps' | 'pin';
}
export type AddressValue = PlaceOption;
