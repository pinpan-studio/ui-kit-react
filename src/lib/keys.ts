// Repris de shared/components/interaction/shortcut.service.ts (Angular).
export const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Libellés affichables d'une combinaison (« mod+shift+k » → ['⌘', '⇧', 'K'] sur Mac, ['Ctrl', 'Maj', 'K'] ailleurs). */
export function keyLabels(combo: string, mac = isMac()): string[] {
  const map: Record<string, string> = mac
    ? {
        mod: '⌘',
        ctrl: '⌃',
        alt: '⌥',
        shift: '⇧',
        enter: '↵',
        escape: 'Échap',
        esc: 'Échap',
        backspace: '⌫',
        up: '↑',
        down: '↓',
        left: '←',
        right: '→',
        space: 'Espace',
        tab: '⇥',
      }
    : {
        mod: 'Ctrl',
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Maj',
        enter: 'Entrée',
        escape: 'Échap',
        esc: 'Échap',
        backspace: '⌫',
        up: '↑',
        down: '↓',
        left: '←',
        right: '→',
        space: 'Espace',
        tab: 'Tab',
      };
  return combo
    .split('+')
    .map((k) => map[k.toLowerCase()] ?? (k.length === 1 || /^f\d{1,2}$/i.test(k) ? k.toUpperCase() : k));
}

/** Combinaison normalisée d'un évènement clavier (même logique qu'Angular). */
export function comboOf(e: KeyboardEvent, mac = isMac()): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push(mac ? (e.metaKey ? 'mod' : 'ctrl') : 'mod');
  if (e.altKey) parts.push('alt');
  const key = e.key === ' ' ? 'space' : e.key.toLowerCase();
  if (e.shiftKey && (key.length > 1 || key === '?' || /[a-z0-9]/.test(key))) parts.push('shift');
  const arrows: Record<string, string> = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };
  parts.push(arrows[key] ?? key);
  return parts.join('+');
}
