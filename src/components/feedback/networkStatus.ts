import { useSyncExternalStore } from 'react';

// ── NetworkStatusService ────────────────────────────────
type NetState = { online: boolean; restoredAt: number | null };
let net: NetState = { online: typeof navigator === 'undefined' ? true : navigator.onLine, restoredAt: null };
const subs = new Set<() => void>();
const emit = (n: NetState) => {
  net = n;
  subs.forEach((f) => f());
};
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => emit({ online: true, restoredAt: Date.now() }));
  window.addEventListener('offline', () => emit({ ...net, online: false }));
}
/** Simulation (démo) : force l'état. */
export function simulateNetwork(online: boolean) {
  emit({ online, restoredAt: online && !net.online ? Date.now() : net.restoredAt });
}
export function useNetworkStatus() {
  const s = useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => net,
    () => net,
  );
  return { ...s, simulate: simulateNetwork };
}
