// Données reprises telles quelles de typography-gallery.component.ts (Angular).
export interface FontFamily {
  name: string;
  css: string;
  role: string;
  source: string;
  weights: number[];
  italic: boolean;
  sample: string;
}
export interface ScaleStep {
  cls: string;
  name: string;
  size: number;
  lh: string;
  weight: number;
  tracking: string;
  family: string;
  usage: string;
  sample: string;
}

export const FAMILIES: FontFamily[] = [
  {
    name: 'Outfit',
    css: "'Outfit', sans-serif",
    role: 'Titres, chiffres clés, titres de carte',
    source: '@fontsource/outfit',
    weights: [400, 500, 600, 700, 800],
    italic: false,
    sample: 'Tableau de bord Flotte',
  },
  {
    name: 'Inter',
    css: "'Inter', sans-serif",
    role: 'Texte courant, formulaires, tables, interface',
    source: '@fontsource/inter',
    weights: [300, 400, 500, 600, 700, 800],
    italic: false,
    sample: 'Le véhicule a quitté la zone autorisée.',
  },
  {
    name: 'Space Mono',
    css: "'Space Mono', monospace",
    role: 'Codes, références, IMEI, extraits de code',
    source: 'assets/fonts/spacemono-regular.ttf',
    weights: [400],
    italic: false,
    sample: 'FAC-2026-0981 · 358240051111110',
  },
  {
    name: 'TT Wellingtons',
    css: "'ttwellingtons', sans-serif",
    role: 'Marque, écrans d’accueil (usage ponctuel)',
    source: 'assets/fonts (@font-face styles.scss)',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    italic: true,
    sample: 'Lookas — suivi de flotte',
  },
  {
    name: 'Roboto',
    css: 'Roboto, sans-serif',
    role: 'Repli des composants Angular Material',
    source: '@fontsource/roboto',
    weights: [300, 400, 500],
    italic: false,
    sample: 'Composant Material par défaut',
  },
];
export const SCALE: ScaleStep[] = [
  {
    cls: 'text-display',
    name: 'Display',
    size: 40,
    lh: '1,15',
    weight: 700,
    tracking: '−0,03 em',
    family: 'Outfit',
    usage: 'Écrans d’accueil, chiffre héros',
    sample: '1 248 véhicules',
  },
  {
    cls: 'text-h1',
    name: 'Titre 1',
    size: 32,
    lh: '1,2',
    weight: 700,
    tracking: '−0,02 em',
    family: 'Outfit',
    usage: 'Titre principal (h1)',
    sample: 'Référentiel unique',
  },
  {
    cls: 'text-h2',
    name: 'Titre 2',
    size: 24,
    lh: '1,25',
    weight: 600,
    tracking: '−0,01 em',
    family: 'Outfit',
    usage: 'Sections de page (h2)',
    sample: 'Tableau de bord Finance',
  },
  {
    cls: 'text-page-title',
    name: 'Titre de page',
    size: 22,
    lh: '1,3',
    weight: 700,
    tracking: '0',
    family: 'Outfit',
    usage: 'En-tête des pages liste / fiche',
    sample: 'Registre des clients',
  },
  {
    cls: 'text-h3',
    name: 'Titre 3',
    size: 20,
    lh: '1,3',
    weight: 600,
    tracking: '0',
    family: 'Outfit',
    usage: 'Sous-sections, dialogs (h3)',
    sample: 'Informations générales',
  },
  {
    cls: 'text-h4',
    name: 'Titre 4',
    size: 16,
    lh: '1,4',
    weight: 600,
    tracking: '0',
    family: 'Outfit',
    usage: 'Groupes de champs (h4)',
    sample: 'Coordonnées',
  },
  {
    cls: 'text-card-title',
    name: 'Titre de carte',
    size: 16,
    lh: '1,35',
    weight: 700,
    tracking: '0',
    family: 'Outfit',
    usage: 'Cartes, panneaux',
    sample: 'Abonnement Standard',
  },
  {
    cls: 'text-body-lg',
    name: 'Corps large',
    size: 16,
    lh: '1,7',
    weight: 400,
    tracking: '0',
    family: 'Inter',
    usage: 'Textes longs, onboarding',
    sample: 'Suivez votre flotte en temps réel et recevez une alerte à chaque événement.',
  },
  {
    cls: 'text-body',
    name: 'Corps',
    size: 14,
    lh: '1,55',
    weight: 400,
    tracking: '0',
    family: 'Inter',
    usage: 'Texte par défaut de l’interface',
    sample: 'Le client signale une perte de signal entre 18 h et 20 h.',
  },
  {
    cls: 'text-body-sm',
    name: 'Corps petit',
    size: 13,
    lh: '1,55',
    weight: 400,
    tracking: '0',
    family: 'Inter',
    usage: 'Descriptions, textes secondaires',
    sample: 'Catalogue des offres et tarifs d’installation.',
  },
  {
    cls: 'text-label',
    name: 'Libellé',
    size: 12,
    lh: '1,4',
    weight: 600,
    tracking: '0',
    family: 'Inter',
    usage: 'Libellés de champs',
    sample: 'Raison sociale',
  },
  {
    cls: 'text-caption',
    name: 'Légende',
    size: 12,
    lh: '1,4',
    weight: 400,
    tracking: '0',
    family: 'Inter',
    usage: 'Aides, horodatages, mentions',
    sample: 'Mis à jour il y a 3 min',
  },
  {
    cls: 'text-overline',
    name: 'Surtitre',
    size: 11,
    lh: '1,4',
    weight: 700,
    tracking: '+0,06 em',
    family: 'Inter',
    usage: 'En-têtes de table, catégories',
    sample: 'Code client',
  },
];
export const GLYPHS = 'AaBbCcDdEeFfGg 0123456789 éèêàçù ÉÈÀÇ « » ’ – — … € % & @';
export const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};
export const LINE_HEIGHTS = [1, 1.25, 1.55, 2];
export const PARAGRAPH =
  'La plateforme enregistre chaque position GPS toutes les trente secondes. Les trajets sont reconstitués automatiquement, les arrêts détectés et les excès de vitesse signalés au gestionnaire de flotte, qui peut ensuite exporter un rapport détaillé pour chaque véhicule.';
export const TRACKINGS = [-0.03, -0.01, 0, 0.04, 0.1];
export const TEXT_TOKENS = [
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--primary-color',
  '--error-color',
  '--error-color-text',
  '--success-color',
  '--success-color-text',
  '--warning-color',
  '--warning-color-text',
];
export const AMOUNTS = [1111111, 888888, 4840000, 11110, 1171100];
export const LONG_TEXT =
  'Transports Yao & Fils — Société de transport de marchandises et de logistique, zone industrielle de Yopougon, lot 412, Abidjan, Côte d’Ivoire, avec une flotte de 48 véhicules suivis.';
export const LONG_TOKEN = 'https://suivi.example.com/partage/7f3a9c2e4b1d8f6a0c5e3b9d7f1a2c4e6b8d0f3a5c7e9b1d';
export const FR_RULES = [
  { rule: 'Espace insécable avant « : »', bad: 'Note: urgent', good: 'Note : urgent' },
  { rule: 'Espace fine insécable avant « ; ! ? »', bad: 'Vraiment ?', good: 'Vraiment ?' },
  { rule: 'Guillemets français avec espaces', bad: '"Actif"', good: '« Actif »' },
  { rule: 'Apostrophe typographique', bad: "L'équipe", good: 'L’équipe' },
  { rule: 'Points de suspension (un seul caractère)', bad: 'Chargement...', good: 'Chargement…' },
  { rule: 'Tiret demi-cadratin pour les incises / intervalles', bad: '9h - 18h', good: '9 h – 18 h' },
  { rule: 'Séparateur de milliers : espace fine', bad: '1250000 FCFA', good: '1 250 000 FCFA' },
  { rule: 'Majuscules accentuées', bad: 'ETAT DES LIEUX', good: 'ÉTAT DES LIEUX' },
  { rule: 'Unités séparées par une insécable', bad: '94km/h', good: '94 km/h' },
];
const NOW = new Date(2026, 9, 15, 14, 5);
export const FORMATS = [
  { label: 'Nombre', value: new Intl.NumberFormat('fr-FR').format(1248503.75), code: "Intl.NumberFormat('fr-FR')" },
  {
    label: 'Monnaie (XOF)',
    value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(1250000),
    code: "{ style: 'currency', currency: 'XOF' }",
  },
  {
    label: 'Monnaie (EUR)',
    value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(1990.5),
    code: "{ style: 'currency', currency: 'EUR' }",
  },
  {
    label: 'Pourcentage',
    value: new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(0.974),
    code: "{ style: 'percent' }",
  },
  {
    label: 'Compact',
    value: new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(55800000),
    code: "{ notation: 'compact' }",
  },
  {
    label: 'Unité',
    value: new Intl.NumberFormat('fr-FR', { style: 'unit', unit: 'kilometer-per-hour' }).format(94),
    code: "{ style: 'unit', unit: 'kilometer-per-hour' }",
  },
  {
    label: 'Date longue',
    value: NOW.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    code: "{ dateStyle: 'full' }",
  },
  { label: 'Date courte', value: NOW.toLocaleDateString('fr-FR'), code: "toLocaleDateString('fr-FR')" },
  {
    label: 'Heure',
    value: NOW.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h '),
    code: '14 h 05 (usage FR)',
  },
  {
    label: 'Relatif',
    value: new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(-1, 'day'),
    code: "Intl.RelativeTimeFormat('fr')",
  },
  { label: 'Ordinal', value: '1er · 2e · 3e · XXIe siècle', code: '1<sup>er</sup>, 2<sup>e</sup>' },
  {
    label: 'Liste',
    value: new Intl.ListFormat('fr', { type: 'conjunction' }).format(['Abidjan', 'Bouaké', 'San-Pédro']),
    code: "Intl.ListFormat('fr')",
  },
];
export const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

/** Ratio de contraste WCAG 2.x entre deux couleurs CSS `rgb(…)`. */
export function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? ['0', '0', '0'])
      .slice(0, 3)
      .map((x) => +x / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1 = 0, l2 = 0] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export const level = (r: number) =>
  r >= 7
    ? { label: 'AAA', tone: 'success' }
    : r >= 4.5
      ? { label: 'AA', tone: 'success' }
      : r >= 3
        ? { label: 'AA grand texte', tone: 'warning' }
        : { label: 'Insuffisant', tone: 'error' };
export const fmtRatio = (r: number) => r.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' : 1';
