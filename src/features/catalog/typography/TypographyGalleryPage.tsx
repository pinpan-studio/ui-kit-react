import { IconButton, Slider, Switch, FormControlLabel, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { useThemeMode } from '../../../hooks/useThemeMode';
import { frenchTypography, revealSpaces } from '../../../lib/frenchTypography';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { TYPO_SNIPPETS as code } from './typographyCode';
import {
  AMOUNTS,
  FAMILIES,
  FORMATS,
  FR_RULES,
  GLYPHS,
  LINE_HEIGHTS,
  LONG_TEXT,
  LONG_TOKEN,
  PARAGRAPH,
  SCALE,
  TEXT_TOKENS,
  TRACKINGS,
  WEIGHT_NAMES,
  contrast,
  fcfa,
  fmtRatio,
  level,
} from './typographyData';
import './typography-gallery.scss';

const TOC: TocItem[] = [
  { id: 'families', label: 'Familles' },
  { id: 'scale', label: 'Échelle' },
  { id: 'hierarchy', label: 'Hiérarchie' },
  { id: 'weights', label: 'Graisses' },
  { id: 'line-height', label: 'Interlignage' },
  { id: 'tracking', label: 'Interlettrage' },
  { id: 'measure', label: 'Longueur de ligne' },
  { id: 'color', label: 'Couleur & contraste' },
  { id: 'alignment', label: 'Alignement' },
  { id: 'numbers', label: 'Chiffres' },
  { id: 'overflow', label: 'Troncature' },
  { id: 'inline', label: 'Styles en ligne' },
  { id: 'prose', label: 'Listes & citations' },
  { id: 'french', label: 'Typographie française' },
  { id: 'fluid', label: 'Responsive' },
  { id: 'a11y', label: 'Accessibilité' },
  { id: 'playground', label: 'Testeur' },
];
const VARS = [
  '--font-heading',
  '--font-body',
  '--font-mono',
  '--fs-display',
  '--fs-h1',
  '--fs-h2',
  '--fs-h3',
  '--fs-body',
  '--fs-label',
  '--lh-heading',
  '--lh-body',
  '--measure',
];
const A11Y = [
  [
    'format_size',
    'Taille minimale',
    '14 px pour le texte d’interface, 12 px uniquement pour les mentions secondaires ; jamais en dessous de 11 px.',
  ],
  [
    'zoom_in',
    'Zoom à 200 %',
    'Le contenu doit rester lisible sans défilement horizontal : préférez des largeurs fluides et laissez les lignes se replier.',
  ],
  [
    'contrast',
    'Contraste',
    '4,5 : 1 minimum pour le texte courant, 3 : 1 pour le grand texte et les icônes porteuses de sens.',
  ],
  [
    'format_line_spacing',
    'Espacement ajustable',
    'Supporter un interligne de 1,5, un espacement de paragraphes de 2× et un interlettrage de 0,12 em sans perte de contenu.',
  ],
  [
    'text_rotation_none',
    'Pas de texte en image',
    'Le texte doit rester du texte : traduisible, copiable, agrandissable et lisible par les lecteurs d’écran.',
  ],
  [
    'title',
    'Titres sémantiques',
    'Une hiérarchie h1 → h2 → h3 sans saut permet aux lecteurs d’écran de naviguer par titres.',
  ],
  [
    'text_decrease',
    'Majuscules avec parcimonie',
    'Les longs passages en capitales sont plus lents à lire ; réservez-les aux surtitres courts.',
  ],
  [
    'language',
    'Langue déclarée',
    'lang="fr" sur la page (et sur les passages en d’autres langues) : prononciation et césure correctes.',
  ],
  ['motion_photos_off', 'Animations de texte', 'Respecter prefers-reduced-motion pour les compteurs et textes animés.'],
] as const;
const prevent = (e: React.MouseEvent) => e.preventDefault();
const badgeCls = (tone: string) =>
  `badge${tone === 'success' ? ' ok' : tone === 'warning' ? ' warn' : tone === 'error' ? ' bad' : ''}`;

function useContrasts(mode: string) {
  const [rows, setRows] = useState<{ token: string; color: string; bg: string; ratio: number }[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      const probe = document.createElement('span');
      document.body.appendChild(probe);
      const resolve = (v: string) => {
        probe.style.color = '';
        probe.style.color = v;
        return getComputedStyle(probe).color;
      };
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      // Peint la couleur sur le fond (canvas 1×1) : gère color-mix(), color(srgb …) et la transparence.
      const paint = (fg: string, base: string): string => {
        if (!ctx) return fg;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      };
      const bg = paint(resolve('var(--card-bg)'), '#fff');
      setRows(
        TEXT_TOKENS.map((token) => {
          const color = paint(resolve(`var(${token})`), bg);
          return { token, color, bg, ratio: contrast(color, bg) };
        }),
      );
      probe.remove();
    }, 50);
    return () => clearTimeout(t);
  }, [mode]);
  return rows;
}

function useFontStatus() {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!('fonts' in document)) return;
      await document.fonts.ready;
      const res: Record<string, boolean> = {};
      for (const f of FAMILIES) {
        const fam = f.css.split(',')[0] ?? '';
        try {
          await document.fonts.load(`400 16px ${fam}`);
        } catch {
          /* ignoré */
        }
        res[f.name] =
          document.fonts.check(`400 16px ${fam}`) &&
          [...document.fonts].some(
            (ff) =>
              ff.family.replace(/['"]/g, '').toLowerCase() === fam.replace(/['"]/g, '').toLowerCase() &&
              ff.status === 'loaded',
          );
      }
      if (alive) setLoaded(res);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return loaded;
}

/** Galerie /components/typography — tous les concepts typographiques du kit (TypographyGalleryComponent). */
export function TypographyGalleryPage() {
  const snack = useSnackbar();
  const { mode } = useThemeMode();
  const contrasts = useContrasts(mode);
  const loaded = useFontStatus();
  const [fontSample, setFontSample] = useState('Le véhicule CI-4521-AB a parcouru 1 248 km en octobre.');
  const [weightFamily, setWeightFamily] = useState("'Inter', sans-serif");
  const weightsFor = FAMILIES.find((f) => f.css === weightFamily)?.weights ?? [400];
  const [measure, setMeasure] = useState(68);
  const measureState = measure < 45 ? 'trop court' : measure > 80 ? 'trop long' : 'confortable';
  const [truncWidth, setTruncWidth] = useState(320);
  const [frInput, setFrInput] = useState(
    `Attention : le vehicule "CI-4521-AB" a depasse la vitesse autorisee ! Prix : 1250000 FCFA... L'equipe d'intervention - 3 techniciens - arrive a 14h05 ; merci de patienter ?`,
  );
  const frOutput = useMemo(() => frenchTypography(frInput), [frInput]);
  const frReveal = useMemo(() => revealSpaces(frOutput), [frOutput]);
  const [fluidWidth, setFluidWidth] = useState(720);
  const [pg, setPg] = useState({
    family: "'Outfit', sans-serif",
    size: 28,
    weight: 600,
    lh: 1.25,
    tracking: -0.01,
    transform: 'none' as 'none' | 'uppercase' | 'capitalize',
    italic: false,
  });
  const set = <K extends keyof typeof pg>(k: K, v: (typeof pg)[K]) => setPg((p) => ({ ...p, [k]: v }));
  const pgCss = [
    `font-family: ${pg.family};`,
    `font-size: ${pg.size}px;`,
    `font-weight: ${pg.weight};`,
    `line-height: ${pg.lh};`,
    `letter-spacing: ${pg.tracking}em;`,
    ...(pg.transform !== 'none' ? [`text-transform: ${pg.transform};`] : []),
    ...(pg.italic ? ['font-style: italic;'] : []),
  ].join('\n');

  const copy = (text: string, what = 'Copié') => {
    void navigator.clipboard?.writeText(text);
    snack(`${what} dans le presse-papiers`, { duration: 1500 });
  };
  const ratio = (i: number) => {
    const cur = SCALE[i];
    const next = SCALE[i + 1];
    return cur && next ? (cur.size / next.size).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '';
  };
  const slider = (
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    step: number,
    label: string,
    className?: string,
  ) => (
    <Slider
      className={className}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(_, v) => onChange(v as number)}
      aria-label={label}
      size="small"
    />
  );

  return (
    <DocPage
      title="Typographie"
      icon="text_fields"
      eyebrow="Fondations"
      className="gallery-typography"
      subtitle="Tous les concepts typographiques du kit : familles de polices, échelle et hiérarchie, graisses, interlignage, interlettrage, longueur de ligne, couleur et contraste, chiffres, troncature, styles en ligne, règles de la typographie française, tailles fluides, accessibilité, et un testeur pour composer vos propres styles."
      toc={TOC}
    >
      <DocSection
        id="families"
        title="Familles de polices"
        source="styles/_typography.scss · --font-heading / --font-body / --font-mono / --font-brand"
        description="Toutes les polices sont servies localement (@fontsource et assets/fonts) : aucune requête vers Google Fonts. Modifiez le texte d'aperçu pour tester vos propres contenus."
      >
        <div className="form-field sample-input">
          <label className="field-label" htmlFor="typo-sample">
            Texte d'aperçu
          </label>
          <div className="field-box">
            <MaterialIcon name="edit" />
            <input id="typo-sample" value={fontSample} onChange={(e) => setFontSample(e.target.value)} />
          </div>
        </div>
        <div className="families">
          {FAMILIES.map((f) => (
            <article key={f.name} className="family">
              <header>
                <div className="fam-big" style={{ fontFamily: f.css }}>
                  Aa
                </div>
                <div className="fam-meta">
                  <strong>{f.name}</strong>
                  <span>{f.role}</span>
                  <code onClick={() => copy('font-family: ' + f.css + ';', 'Déclaration')} title="Copier">
                    font-family: {f.css}
                  </code>
                </div>
                {loaded[f.name] !== undefined && (
                  <span className={`fam-status${loaded[f.name] ? ' ok' : ''}`}>
                    <MaterialIcon name={loaded[f.name] ? 'check_circle' : 'error'} />
                    {loaded[f.name] ? 'Chargée' : 'Repli système'}
                  </span>
                )}
              </header>
              <p className="fam-sample" style={{ fontFamily: f.css }}>
                {fontSample}
              </p>
              <p className="fam-glyphs" style={{ fontFamily: f.css }}>
                {GLYPHS}
              </p>
              <footer>
                <span className="fam-weights">
                  {f.weights.map((w) => (
                    <span key={w} style={{ fontFamily: f.css, fontWeight: w }} title={WEIGHT_NAMES[w]}>
                      {w}
                    </span>
                  ))}
                </span>
                {f.italic && (
                  <span className="chip-mini" style={{ fontFamily: f.css }}>
                    <i>Italique</i>
                  </span>
                )}
                <span className="spacer" />
                <span className="muted">{f.source}</span>
              </footer>
            </article>
          ))}
        </div>
        <Demo
          label="Pairing recommandé"
          hint="Outfit pour l'accroche, Inter pour la lecture, Space Mono pour les identifiants"
          code={code.families}
        >
          <div className="pairing">
            <span className="text-overline">Facture</span>
            <h3 className="text-h3">Abonnement Premium — octobre</h3>
            <p className="text-body">
              Prestations de géolocalisation pour 48 véhicules, maintenance des balises incluse.
            </p>
            <div className="pairing-foot">
              <span className="text-mono">FAC-2026-0981</span>
              <strong className="text-h4 text-tabular">1 250 000 FCFA</strong>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="scale"
        title="Échelle typographique"
        source="classes .text-* · variables --fs-*"
        description="Treize styles nommés couvrent toute l'interface ; ils remplacent les tailles en dur. Les classes gagnent sur les règles globales h1–h4 : on peut donc donner l'apparence d'un h3 à un h2 sans casser la sémantique. Cliquez une ligne pour copier sa classe."
      >
        <div className="scale">
          <div className="scale-head">
            <span>Style</span>
            <span>Aperçu</span>
            <span>Taille / interligne</span>
            <span>Graisse</span>
            <span>Interlettrage</span>
          </div>
          {SCALE.map((s, i) => (
            <button
              key={s.cls}
              type="button"
              className="scale-row"
              onClick={() => copy(s.cls, 'Classe « ' + s.cls + ' »')}
            >
              <span className="sc-name">
                <strong>{s.name}</strong>
                <code>.{s.cls}</code>
              </span>
              <span className={'sc-sample ' + s.cls}>{s.sample}</span>
              <span className="sc-num">
                {s.size} px / {s.lh}
                {ratio(i) && <em>× {ratio(i)}</em>}
              </span>
              <span className="sc-num">
                {s.weight} · {s.family}
              </span>
              <span className="sc-num">{s.tracking}</span>
              <span className="sc-usage">{s.usage}</span>
            </button>
          ))}
        </div>
        <Demo label="Variables et classes" code={code.scale}>
          <div className="vars">
            {VARS.map((v) => (
              <button key={v} type="button" className="var-chip" onClick={() => copy('var(' + v + ')', 'Variable')}>
                <code>{v}</code>
              </button>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="hierarchy"
        title="Hiérarchie & rythme vertical"
        source="taille · graisse · couleur · espacement"
        cols={2}
        description="La hiérarchie ne repose pas que sur la taille : graisse, couleur et espace au-dessus d'un titre (plus grand qu'en dessous) indiquent ce qui va ensemble. Un seul h1 par page, des niveaux sans saut (h2 → h3, jamais h2 → h4)."
      >
        <Demo label="À faire" hint="contraste de tailles net, espace proximal">
          <div className="hier good">
            <span className="text-overline">Client · CLI-1040</span>
            {/* Apparence de titre de page sans second h1 (un seul h1 par page). */}
            <div className="text-page-title" role="heading" aria-level={2}>
              Transports Yao & Fils
            </div>
            <p className="text-body-sm">Client depuis mars 2019 · 48 véhicules · Abidjan</p>
            <h2 className="text-h4 h-gap">Contrat en cours</h2>
            <p className="text-body">Offre Premium Flotte, renouvelée par tacite reconduction au 28 février 2027.</p>
            <h2 className="text-h4 h-gap">Dernière intervention</h2>
            <p className="text-body">Remplacement d'une balise sur CI-4521-AB le 14 octobre.</p>
          </div>
        </Demo>
        <Demo label="À éviter" hint="tout se ressemble, espacements égaux">
          <div className="hier bad">
            <span>Client · CLI-1040</span>
            <span className="b-title">Transports Yao & Fils</span>
            <span>Client depuis mars 2019 · 48 véhicules · Abidjan</span>
            <span className="b-title">Contrat en cours</span>
            <span>Offre Premium Flotte, renouvelée par tacite reconduction au 28 février 2027.</span>
            <span className="b-title">Dernière intervention</span>
            <span>Remplacement d'une balise sur CI-4521-AB le 14 octobre.</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="weights"
        title="Graisses"
        source="font-weight 100–900"
        description="Seules les graisses réellement embarquées s'affichent correctement ; les autres sont simulées par le navigateur (« faux gras »). Usage : 400 texte, 500 valeurs, 600 libellés et titres secondaires, 700 titres."
      >
        <div className="weight-tabs">
          {FAMILIES.map((f) => (
            <button
              key={f.name}
              type="button"
              className={weightFamily === f.css ? 'on' : undefined}
              onClick={() => setWeightFamily(f.css)}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="weights">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
            <div key={w} className={`weight${weightsFor.includes(w) ? '' : ' synth'}`}>
              <span className="w-num">{w}</span>
              <span className="w-sample" style={{ fontFamily: weightFamily, fontWeight: w }}>
                Flotte 2026
              </span>
              <span className="w-name">
                {WEIGHT_NAMES[w]}
                {!weightsFor.includes(w) && ' · simulée'}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="line-height"
        title="Interlignage"
        source="line-height · --lh-tight / --lh-heading / --lh-body / --lh-relaxed"
        description="Plus le texte est petit et long, plus l'interligne doit être généreux : 1,15–1,3 pour les titres, 1,5–1,6 pour le texte d'interface, 1,7 pour la lecture longue. Sans unité, il s'adapte à la taille de police."
      >
        <div className="lh-grid">
          {LINE_HEIGHTS.map((lh) => (
            <div key={lh} className={`lh-card${lh === 1.55 ? ' rec' : ''}`}>
              <div className="lh-head">
                <code>line-height: {lh}</code>
                {lh === 1.55 && <span className="badge ok">Recommandé</span>}
                {lh === 1 && <span className="badge bad">Trop serré</span>}
                {lh === 2 && <span className="badge warn">Trop aéré</span>}
              </div>
              <p style={{ lineHeight: lh }}>{PARAGRAPH}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="tracking"
        title="Interlettrage"
        source="letter-spacing (em)"
        cols={2}
        description="Les grands titres gagnent à être légèrement resserrés (−0,01 à −0,03 em) ; les petites capitales et surtitres doivent être espacés (+0,04 à +0,1 em) pour rester lisibles. Le texte courant reste à 0."
      >
        <Demo label="Titre (Outfit 28)">
          {TRACKINGS.map((t) => (
            <div key={t} className="tr-row">
              <code>
                {t > 0 ? '+' : ''}
                {t} em
              </code>
              <span className="tr-title" style={{ letterSpacing: t + 'em' }}>
                Rapport mensuel
              </span>
            </div>
          ))}
        </Demo>
        <Demo label="Majuscules (Inter 11)">
          {TRACKINGS.map((t) => (
            <div key={t} className="tr-row">
              <code>
                {t > 0 ? '+' : ''}
                {t} em
              </code>
              <span className="tr-caps" style={{ letterSpacing: t + 'em' }}>
                Véhicules en ligne
              </span>
              {(t === 0.04 || t === 0.1) && <MaterialIcon name="check" className="ok-ic" />}
            </div>
          ))}
        </Demo>
      </DocSection>

      <DocSection
        id="measure"
        title="Longueur de ligne (mesure)"
        source="max-width en ch · .text-measure (68ch)"
        description="Entre 45 et 75 caractères par ligne pour un texte confortable. Au-delà, l'œil peine à retrouver le début de la ligne suivante ; en deçà, le rythme est haché. Faites varier la largeur."
      >
        <Demo label="Ajustez la mesure">
          <div className="measure-ctrl">
            {slider(measure, setMeasure, 25, 120, 1, 'Mesure en caractères', 'measure-slider')}
            <span className={`badge ${measureState === 'confortable' ? 'ok' : 'warn'}`}>
              {measure} ch · {measureState}
            </span>
          </div>
          <p className="measure-text text-body-lg" style={{ maxWidth: measure + 'ch' }}>
            {PARAGRAPH} {PARAGRAPH}
          </p>
        </Demo>
      </DocSection>

      <DocSection
        id="color"
        title="Couleur du texte & contraste"
        source="--text-primary / --text-secondary / --text-muted · WCAG 2.1"
        description="Ratios calculés en direct sur le fond des cartes, pour le thème actif (basculez clair / sombre pour comparer). AA exige 4,5 : 1 pour le texte courant et 3 : 1 pour le texte de 18 px et plus (ou 14 px gras)."
      >
        <div className="contrast-table">
          {contrasts.map((c) => (
            <div key={c.token} className="ct-row">
              <span className="ct-swatch" style={{ background: c.color }} />
              <code>{c.token}</code>
              <span className="ct-sample" style={{ color: c.color }}>
                Texte d'exemple — 14 px
              </span>
              <span className="ct-ratio">{fmtRatio(c.ratio)}</span>
              <span className={badgeCls(level(c.ratio).tone)}>{level(c.ratio).label}</span>
            </div>
          ))}
        </div>
        <p className="muted">
          Pour du texte coloré, utilisez les variantes <b>-text</b> (<code>--success-color-text</code>,{' '}
          <code>--warning-color-text</code>…) : les couleurs vives de base sont faites pour les fonds, pastilles et
          icônes, pas pour le texte courant.
        </p>
        <p className="muted">
          Règle : <b>--text-muted</b> est réservé aux informations accessoires (horodatages, aides) — jamais à un
          contenu indispensable. Une couleur ne doit pas être le seul porteur d'information (ajoutez une icône ou un
          libellé).
        </p>
      </DocSection>

      <DocSection
        id="alignment"
        title="Alignement, césure & retour à la ligne"
        source="text-align · hyphens · text-wrap"
        cols={3}
        description="Alignez à gauche le texte courant ; le justifié crée des « rivières » d'espaces sans césure. Centrez seulement les textes très courts. text-wrap: balance équilibre les titres sur plusieurs lignes, pretty évite les veuves."
      >
        <Demo label="Gauche (par défaut)">
          <p className="al-p">{PARAGRAPH}</p>
        </Demo>
        <Demo label="Justifié sans césure" hint="rivières">
          <p className="al-p" style={{ textAlign: 'justify' }}>
            {PARAGRAPH}
          </p>
        </Demo>
        <Demo label="Justifié + césure" hint=".text-hyphens">
          <p className="al-p text-hyphens" lang="fr" style={{ textAlign: 'justify' }}>
            {PARAGRAPH}
          </p>
        </Demo>
        <Demo label="Titre sans équilibrage">
          <h3 className="text-h3 al-title">Suivi de flotte en temps réel pour les entreprises ivoiriennes</h3>
        </Demo>
        <Demo label="Titre équilibré" hint=".text-balance">
          <h3 className="text-h3 al-title text-balance">
            Suivi de flotte en temps réel pour les entreprises ivoiriennes
          </h3>
        </Demo>
        <Demo label="Centré (court uniquement)">
          <div className="al-center">
            <MaterialIcon name="inbox" />
            <strong className="text-h4">Aucun résultat</strong>
            <span className="text-body-sm">Modifiez vos filtres pour élargir la recherche.</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="numbers"
        title="Chiffres & formats"
        source="font-variant-numeric · Intl (fr-FR)"
        cols={2}
        description="Dans les tableaux et compteurs, utilisez les chiffres tabulaires (.text-tabular) : chaque chiffre a la même largeur, les colonnes s'alignent et les valeurs ne « sautent » pas en changeant. Formatez toujours avec Intl en fr-FR."
      >
        <Demo label="Proportionnels vs tabulaires" code={code.numbers}>
          <div className="nums">
            <div>
              <span className="text-overline">Proportionnels</span>
              {AMOUNTS.map((a) => (
                <span key={a} className="num-cell prop">
                  {fcfa(a)}
                </span>
              ))}
            </div>
            <div>
              <span className="text-overline">Tabulaires</span>
              {AMOUNTS.map((a) => (
                <span key={a} className="num-cell text-tabular">
                  {fcfa(a)}
                </span>
              ))}
            </div>
          </div>
        </Demo>
        <Demo label="Formats français (Intl)">
          <table className="fmt-table">
            <tbody>
              {FORMATS.map((f) => (
                <tr key={f.label}>
                  <td>{f.label}</td>
                  <td className="fmt-val">{f.value}</td>
                  <td>
                    <code>{f.code}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Demo>
      </DocSection>

      <DocSection
        id="overflow"
        title="Troncature & mots longs"
        source=".text-truncate · .text-clamp-2/3 · .text-break"
        description="Tronquez sur une ligne dans les tableaux et listes (avec infobulle du texte complet), sur 2–3 lignes dans les cartes. Les URL, IMEI et identifiants sans espace doivent pouvoir se couper (.text-break) pour ne pas déborder."
      >
        <div className="trunc-ctrl">
          <span className="text-label">Largeur du conteneur</span>
          {slider(truncWidth, setTruncWidth, 160, 560, 10, 'Largeur du conteneur', 'trunc-slider')}
          <code>{truncWidth} px</code>
        </div>
        <div className="trunc-grid">
          <div className="trunc-box" style={{ width: truncWidth }}>
            <span className="text-overline">.text-truncate</span>
            <p className="text-truncate" title={LONG_TEXT}>
              {LONG_TEXT}
            </p>
          </div>
          <div className="trunc-box" style={{ width: truncWidth }}>
            <span className="text-overline">.text-clamp-2</span>
            <p className="text-clamp-2">{LONG_TEXT}</p>
          </div>
          <div className="trunc-box" style={{ width: truncWidth }}>
            <span className="text-overline">Sans .text-break</span>
            <p className="overflowing">{LONG_TOKEN}</p>
          </div>
          <div className="trunc-box" style={{ width: truncWidth }}>
            <span className="text-overline">.text-break</span>
            <p className="text-break text-mono">{LONG_TOKEN}</p>
          </div>
        </div>
      </DocSection>

      <DocSection
        id="inline"
        title="Styles en ligne"
        source="strong · em · mark · code · kbd · abbr · sup · sub · small · del · a"
        cols={2}
        description="Utilisez les balises sémantiques (lues par les lecteurs d'écran) plutôt que des styles visuels seuls."
      >
        <Demo label="Balises sémantiques" code={code.inline}>
          <div className="inline-list">
            <p>
              <strong>Gras</strong> — importance (<code>&lt;strong&gt;</code>)
            </p>
            <p>
              <em>Italique</em> — emphase, termes étrangers (<code>&lt;em&gt;</code>)
            </p>
            <p>
              <mark>Surligné</mark> — résultat de recherche (<code>&lt;mark&gt;</code>)
            </p>
            <p>
              <code>CI-4521-AB</code> — code, identifiant (<code>&lt;code&gt;</code>)
            </p>
            <p>
              Appuyez sur <kbd>Ctrl</kbd> + <kbd>K</kbd> — touches (<code>&lt;kbd&gt;</code>)
            </p>
            <p>
              <abbr title="Global Positioning System">GPS</abbr> — abréviation expliquée (<code>&lt;abbr&gt;</code>)
            </p>
            <p>
              1<sup>er</sup> trimestre, CO<sub>2</sub> — exposant / indice
            </p>
            <p>
              <del>45 000 F</del> 39 000 F — prix barré (<code>&lt;del&gt;</code>)
            </p>
            <p>
              <small>Mentions légales et conditions</small> (<code>&lt;small&gt;</code>)
            </p>
          </div>
        </Demo>
        <Demo label="Liens">
          <div className="inline-list links">
            <p>
              Lien{' '}
              <a href="#" onClick={prevent}>
                dans le texte
              </a>{' '}
              : souligné, couleur primaire.
            </p>
            <p>
              Lien{' '}
              <a className="visited" href="#" onClick={prevent}>
                déjà visité
              </a>
              .
            </p>
            <p>
              Lien{' '}
              <a className="focus" href="#" onClick={prevent}>
                au focus clavier
              </a>{' '}
              : anneau visible.
            </p>
            <p>
              Lien{' '}
              <a href="https://example.com" target="_blank" rel="noopener">
                externe
                <MaterialIcon name="open_in_new" />
              </a>{' '}
              : icône + nouvel onglet.
            </p>
            <p className="muted">Ne jamais utiliser « cliquez ici » : le libellé doit décrire la destination.</p>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="prose"
        title="Listes, citations & contenu éditorial"
        source=".kit-markdown (rendu Markdown / contenu riche)"
        cols={2}
        description="La classe .kit-markdown met en forme un contenu long (aide, CGU, notes, rendu Markdown) : titres, paragraphes, listes, tâches, citations, code, séparateurs."
      >
        <Demo label="Article (.kit-markdown)">
          <article className="kit-markdown prose">
            <h2>Installer une balise GPS</h2>
            <p>
              Avant toute intervention, vérifiez que le véhicule est <strong>à l’arrêt, contact coupé</strong>.
              L’installation prend environ <em>45 minutes</em>.
            </p>
            <h3>Étapes</h3>
            <ol>
              <li>Débrancher la batterie</li>
              <li>
                Raccorder la balise au <code>+APC</code> et à la masse
              </li>
              <li>Tester la remontée GPS</li>
            </ol>
            <ul>
              <li className="task">
                <span className="box on" />
                Photos avant / après
              </li>
              <li className="task">
                <span className="box" />
                PV signé par le client
              </li>
            </ul>
            <blockquote>
              Ne jamais quitter le site sans avoir vérifié la première position sur la plateforme.
            </blockquote>
            <hr />
            <p>
              Besoin d’aide ? Consultez{' '}
              <a href="#" onClick={prevent}>
                le guide technique
              </a>
              .
            </p>
          </article>
        </Demo>
        <Demo label="Liste de définitions & citation mise en avant">
          <dl className="defs">
            <dt>Géofence</dt>
            <dd>Zone géographique virtuelle déclenchant une alerte à l’entrée ou à la sortie d’un véhicule.</dd>
            <dt>APC</dt>
            <dd>Alimentation après contact : présente uniquement moteur allumé.</dd>
            <dt>Coupe-moteur</dt>
            <dd>Relais permettant d’immobiliser un véhicule à distance.</dd>
          </dl>
          <figure className="pullquote">
            <blockquote>« Depuis l’installation, nos coûts de carburant ont baissé de 18 %. »</blockquote>
            <figcaption>— Jean Kouassi, Transports Yao & Fils</figcaption>
          </figure>
        </Demo>
      </DocSection>

      <DocSection
        id="french"
        title="Règles de la typographie française"
        source="src/lib/frenchTypography.ts"
        description="Espaces insécables avant les ponctuations hautes, guillemets en chevrons, apostrophe courbe, points de suspension, tirets, séparateurs de milliers, majuscules accentuées. Le correcteur ci-dessous applique ces règles à n'importe quel texte saisi (◦ = espace insécable, · = espace fine insécable)."
      >
        <div className="fr-rules">
          {FR_RULES.map((r) => (
            <div key={r.rule} className="fr-rule">
              <span className="fr-label">{r.rule}</span>
              <span className="fr-bad">
                <MaterialIcon name="close" />
                {r.bad}
              </span>
              <span className="fr-good">
                <MaterialIcon name="check" />
                {r.good}
              </span>
            </div>
          ))}
        </div>
        <Demo label="Correcteur typographique" code={code.french}>
          <div className="fr-tool">
            <div className="form-field">
              <label className="field-label" htmlFor="fr-in">
                Texte saisi
              </label>
              <div className="field-box textarea-box">
                <textarea id="fr-in" rows={3} value={frInput} onChange={(e) => setFrInput(e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <span className="field-label">Résultat corrigé</span>
              <div className="fr-out">
                {frReveal.map((p, i) =>
                  p.kind === 'text' ? (
                    <span key={i}>{p.t}</span>
                  ) : (
                    <span
                      key={i}
                      className={`sp${p.kind === 'nnbsp' ? ' fine' : ''}`}
                      title={p.kind === 'nbsp' ? 'Espace insécable U+00A0' : 'Espace fine insécable U+202F'}
                    >
                      {' '}
                    </span>
                  ),
                )}
              </div>
              <div className="row">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => copy(frOutput, 'Texte corrigé')}
                  startIcon={<MaterialIcon name="content_copy" />}
                >
                  Copier le texte corrigé
                </Button>
                <span className="legend">
                  <span className="sp"> </span> insécable · <span className="sp fine"> </span> fine insécable
                </span>
              </div>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="fluid"
        title="Typographie responsive (fluide)"
        source="clamp() · unités cqi / vw"
        description="Plutôt que des paliers fixes, clamp(min, préférée, max) fait varier la taille en continu avec la largeur, sans jamais descendre sous un minimum lisible. Ici la taille suit la largeur du conteneur (container queries) : déplacez le curseur."
      >
        <Demo label="Simulateur de largeur" code={code.fluid}>
          <div className="trunc-ctrl">
            <span className="text-label">Largeur</span>
            {slider(fluidWidth, setFluidWidth, 320, 1100, 10, 'Largeur simulée', 'trunc-slider')}
            <code>
              {fluidWidth} px · {fluidWidth < 600 ? 'mobile' : fluidWidth < 960 ? 'tablette' : 'bureau'}
            </code>
          </div>
          <div className="fluid-frame" style={{ width: fluidWidth }}>
            <div className="fluid-in">
              <span className="fl-over">Nouveau</span>
              <h2 className="fl-title">Votre flotte, en temps réel</h2>
              <p className="fl-body">
                Localisez chaque véhicule, recevez les alertes et analysez vos coûts depuis un seul tableau de bord.
              </p>
              <code className="fl-meta">titre : clamp(24px, 3.2cqi + 12px, 44px)</code>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="a11y"
        title="Accessibilité typographique"
        source="WCAG 2.1 — 1.4.3, 1.4.4, 1.4.8, 1.4.12"
        cols={3}
      >
        {A11Y.map(([ic, t, d]) => (
          <div key={t} className="a11y-card">
            <MaterialIcon name={ic} />
            <strong>{t}</strong>
            <span>{d}</span>
          </div>
        ))}
      </DocSection>

      <DocSection
        id="playground"
        title="Testeur typographique"
        source="génère la déclaration CSS"
        description="Composez un style et copiez la déclaration CSS correspondante."
      >
        <div className="pg">
          <div className="pg-ctrls">
            <div className="form-field">
              <label className="field-label" htmlFor="pg-font">
                Police
              </label>
              <div className="field-box select-box">
                <select id="pg-font" value={pg.family} onChange={(e) => set('family', e.target.value)}>
                  {FAMILIES.map((f) => (
                    <option key={f.name} value={f.css}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-field">
              <span className="field-label">Taille · {pg.size} px</span>
              {slider(pg.size, (v) => set('size', v), 10, 64, 1, 'Taille')}
            </div>
            <div className="form-field">
              <span className="field-label">Graisse · {pg.weight}</span>
              {slider(pg.weight, (v) => set('weight', v), 100, 900, 100, 'Graisse')}
            </div>
            <div className="form-field">
              <span className="field-label">Interligne · {pg.lh}</span>
              {slider(pg.lh, (v) => set('lh', v), 0.9, 2.2, 0.05, 'Interligne')}
            </div>
            <div className="form-field">
              <span className="field-label">Interlettrage · {pg.tracking} em</span>
              {slider(pg.tracking, (v) => set('tracking', v), -0.05, 0.2, 0.01, 'Interlettrage')}
            </div>
            <div className="form-field">
              <span className="field-label">Casse</span>
              <ToggleButtonGroup
                exclusive
                value={pg.transform}
                onChange={(_, v: typeof pg.transform | null) => v && set('transform', v)}
              >
                {[
                  ['none', 'Aa'],
                  ['uppercase', 'AA'],
                  ['capitalize', 'Ab Cd'],
                ].map(([v, l]) => (
                  <ToggleButton key={v} value={v ?? ''}>
                    {pg.transform === v && <MaterialIcon name="check" className="seg-check" />}
                    {l}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <FormControlLabel
                control={<Switch checked={pg.italic} onChange={(e) => set('italic', e.target.checked)} />}
                label="Italique"
              />
            </div>
          </div>
          <div className="pg-out">
            <div
              className="pg-preview"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              style={{
                fontFamily: pg.family,
                fontSize: pg.size,
                fontWeight: pg.weight,
                lineHeight: pg.lh,
                letterSpacing: pg.tracking + 'em',
                textTransform: pg.transform,
                fontStyle: pg.italic ? 'italic' : 'normal',
              }}
            >
              Suivez chaque véhicule, en temps réel.
            </div>
            <div className="pg-css">
              <pre>{pgCss}</pre>
              <IconButton onClick={() => copy(pgCss, 'CSS')} aria-label="Copier le CSS">
                <MaterialIcon name="content_copy" />
              </IconButton>
            </div>
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
