import type { DeviceKind } from './showcases.data';

/** Dimensions CSS de la zone d'affichage (viewport de l'iframe) de chaque appareil, en portrait. */
export const DEVICE_SPECS: Record<
  DeviceKind,
  { label: string; icon: string; width: number; height: number; model: string }
> = {
  desktop: { label: 'Ordinateur', icon: 'desktop_windows', width: 1440, height: 860, model: 'Écran 1440 × 860' },
  tablet: { label: 'Tablette', icon: 'tablet_mac', width: 820, height: 1180, model: 'iPad Air · 820 × 1180' },
  phone: { label: 'Mobile', icon: 'phone_iphone', width: 393, height: 852, model: 'iPhone 15 Pro · 393 × 852' },
};
export const DEVICES = Object.keys(DEVICE_SPECS) as DeviceKind[];
