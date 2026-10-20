/** Accès localStorage tolérant (navigation privée, SSR, quotas). */
export function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = globalThis.localStorage?.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* stockage indisponible : préférence non persistée */
  }
}
