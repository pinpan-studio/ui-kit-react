import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { comboOf } from '../../lib/keys';
import { CommandPalette } from './CommandPalette';
import { InteractionContext } from './interactionContext';
import { ShortcutHelp } from './ShortcutHelp';
import { TourOverlay } from './TourOverlay';
import type { InteractionApi, PaletteCommand, Shortcut, TourOptions, TourStep } from './types';

const RECENT_KEY = 'kit-palette-recent';
const loadRecent = (): string[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * Équivalent React de ShortcutService + CommandPaletteService + TourService (Angular) :
 * registre global des raccourcis (combinaisons et séquences), palette ⌘K / Ctrl+K, aide « ? », visite guidée.
 */
export function InteractionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [commands, setCommands] = useState<PaletteCommand[]>([]);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tour, setTour] = useState<{ steps: TourStep[]; opts: TourOptions } | null>(null);
  const list = useRef<Shortcut[]>([]);
  const pending = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const registerShortcuts = useCallback((s: Shortcut[]) => {
    list.current = [...list.current, ...s];
    setShortcuts(list.current);
    return () => {
      list.current = list.current.filter((x) => !s.includes(x));
      setShortcuts(list.current);
    };
  }, []);
  const registerCommands = useCallback((cmds: PaletteCommand[], opts?: { prepend?: boolean }) => {
    setCommands((l) => {
      const rest = l.filter((c) => !cmds.some((n) => n.id === c.id));
      return opts?.prepend ? [...cmds, ...rest] : [...rest, ...cmds];
    });
    return () => setCommands((l) => l.filter((c) => !cmds.includes(c)));
  }, []);

  const togglePalette = useCallback(() => setPaletteOpen((o) => !o), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const startTour = useCallback((steps: TourStep[], opts: TourOptions = {}) => setTour({ steps, opts }), []);

  // Raccourcis globaux toujours actifs (palette et aide), comme dans le layout Angular.
  useEffect(
    () =>
      registerShortcuts([
        {
          keys: 'shift+?',
          description: 'Afficher les raccourcis clavier',
          group: 'Général',
          action: () => setHelpOpen(true),
        },
        {
          keys: 'mod+k',
          description: 'Ouvrir la palette de commandes',
          group: 'Général',
          allowInInput: true,
          action: () => setPaletteOpen((o) => !o),
        },
      ]),
    [registerShortcuts],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || ['Shift', 'Control', 'Meta', 'Alt'].includes(e.key)) return;
      const t = e.target as HTMLElement | null;
      const inInput = !!t?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
      const c = comboOf(e);
      const seq = pending.current ? `${pending.current} ${c}` : null;
      const match = (k: string) =>
        k.toLowerCase().replace(/\s+/g, ' ') === c || (seq !== null && k.toLowerCase() === seq);
      const hit = [...list.current].reverse().find((s) => match(s.keys) && (s.allowInInput || !inInput));
      clearTimeout(pendingTimer.current);
      if (hit) {
        e.preventDefault();
        pending.current = null;
        hit.action(e);
        return;
      }
      if (!inInput && list.current.some((s) => s.keys.toLowerCase().startsWith(c + ' '))) {
        pending.current = c;
        pendingTimer.current = setTimeout(() => (pending.current = null), 1200);
      } else pending.current = null;
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  const run = useCallback(
    (c: PaletteCommand) => {
      setPaletteOpen(false);
      setRecent((r) => {
        const next = [c.id, ...r.filter((x) => x !== c.id)].slice(0, 5);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          /* stockage indisponible */
        }
        return next;
      });
      if (c.route) void navigate(c.route);
      c.action?.();
    },
    [navigate],
  );

  const api = useMemo<InteractionApi>(
    () => ({
      commands,
      shortcuts,
      registerCommands,
      registerShortcuts,
      openPalette,
      togglePalette,
      openHelp,
      startTour,
    }),
    [commands, shortcuts, registerCommands, registerShortcuts, openPalette, togglePalette, openHelp, startTour],
  );

  return (
    <InteractionContext.Provider value={api}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
        recent={recent}
        onRun={run}
      />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} shortcuts={shortcuts} />
      {tour && (
        <TourOverlay
          steps={tour.steps}
          padding={tour.opts.padding}
          onEnd={(completed) => {
            setTour(null);
            tour.opts.onFinish?.(completed);
          }}
        />
      )}
    </InteractionContext.Provider>
  );
}
