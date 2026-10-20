export interface Shortcut {
  /** Combinaison (« mod+k », « shift+? », « g c » pour une séquence). `mod` = ⌘ sur macOS, Ctrl ailleurs. */
  keys: string;
  description: string;
  group?: string;
  action: (e: KeyboardEvent) => void;
  /** Actif même quand le focus est dans un champ de saisie. */
  allowInInput?: boolean;
}

export interface PaletteCommand {
  id: string;
  label: string;
  group?: string;
  icon?: string;
  hint?: string;
  keywords?: string[];
  shortcut?: string;
  route?: string;
  action?: () => void;
}

export interface TourStep {
  target?: string | HTMLElement;
  title: string;
  content: string;
  icon?: string;
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  before?: () => void | Promise<void>;
}
export interface TourOptions {
  onFinish?: (completed: boolean) => void;
  padding?: number;
}

export interface InteractionApi {
  commands: PaletteCommand[];
  shortcuts: Shortcut[];
  /** `prepend` : placées avant les commandes existantes (layouts, montés après leurs écrans en React). */
  registerCommands: (cmds: PaletteCommand[], opts?: { prepend?: boolean }) => () => void;
  registerShortcuts: (s: Shortcut[]) => () => void;
  openPalette: () => void;
  togglePalette: () => void;
  openHelp: () => void;
  startTour: (steps: TourStep[], opts?: TourOptions) => void;
}
