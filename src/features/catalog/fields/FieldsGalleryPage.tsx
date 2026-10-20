import { Button, CircularProgress } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { AddressField } from '../../../components/fields/AddressField';
import type { AddressValue } from '../../../components/fields/addressTypes';
import { ColorPicker } from '../../../components/fields/ColorPicker';
import { CopyField } from '../../../components/fields/CopyField';
import { CurrencyInput } from '../../../components/fields/CurrencyInput';
import { MarkdownEditor } from '../../../components/fields/MarkdownEditor';
import { NumberStepper } from '../../../components/fields/NumberStepper';
import { OtpInput } from '../../../components/fields/OtpInput';
import { PasswordField } from '../../../components/fields/PasswordField';
import { RangeSlider, type RangeValue } from '../../../components/fields/RangeSlider';
import { Rating } from '../../../components/fields/Rating';
import { RichTextEditor } from '../../../components/fields/RichTextEditor';
import { SignaturePad } from '../../../components/fields/SignaturePad';
import { TagInput } from '../../../components/fields/TagInput';
import { TransferList } from '../../../components/fields/TransferList';
import { TreeSelect } from '../../../components/fields/TreeSelect';
import type { TransferItem, TreeOption } from '../../../components/fields/treeTypes';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEMO_PLACES, searchPlaces } from '../../../data/static/address.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './fieldsCode';
import './fields-gallery.scss';

const TOC: TocItem[] = [
  { id: 'otp', label: 'OTP / PIN' },
  { id: 'stepper', label: 'Nombre +/−' },
  { id: 'currency', label: 'Montant' },
  { id: 'range', label: 'Intervalle' },
  { id: 'rating', label: 'Notation' },
  { id: 'color', label: 'Couleur' },
  { id: 'rich-text', label: 'Texte riche' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'signature', label: 'Signature' },
  { id: 'tree-select', label: 'Tree-select' },
  { id: 'transfer', label: 'Transfer list' },
  { id: 'tags', label: 'Tags' },
  { id: 'address', label: 'Adresse' },
  { id: 'password', label: 'Mot de passe' },
  { id: 'copy', label: 'Copier' },
  { id: 'form', label: 'Formulaire complet' },
];

const HISTO = [2, 4, 7, 12, 18, 26, 31, 28, 22, 19, 15, 12, 9, 7, 5, 4, 3, 2, 2, 1];
const fcfa = (v: number) => `${v.toLocaleString('fr-FR')} F`;
const BRAND = ['#4f6bed', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#64748b', '#0f172a'];
const RICH = `<h3>Compte rendu d’intervention</h3><p>Installation de la balise <b>GT06</b> sur le véhicule <i>CI-4521-AB</i>.</p><ul><li>Alimentation raccordée au +APC</li><li>Coupe-moteur testé</li></ul><blockquote>Client satisfait, PV signé sur place.</blockquote>`;
const MD = `## Procédure d’installation

1. Couper le contact et débrancher la batterie
2. Raccorder la balise au **+APC** et à la masse
3. Tester le *coupe-moteur* depuis la plateforme

- [x] Photos avant / après
- [ ] PV signé par le client

> Toujours vérifier la remontée GPS avant de quitter le site.

Documentation : [guide technique](https://example.com/guide) · code \`GT06-N\``;

const ZONES: TreeOption[] = [
  {
    value: 'abj',
    label: 'Abidjan',
    icon: 'location_city',
    children: [
      {
        value: 'abj-nord',
        label: 'Abidjan Nord',
        children: [
          { value: 'abobo', label: 'Abobo' },
          { value: 'adjame', label: 'Adjamé' },
          { value: 'yopougon', label: 'Yopougon' },
          { value: 'attecoube', label: 'Attécoubé' },
        ],
      },
      {
        value: 'abj-sud',
        label: 'Abidjan Sud',
        children: [
          { value: 'treichville', label: 'Treichville' },
          { value: 'marcory', label: 'Marcory' },
          { value: 'koumassi', label: 'Koumassi' },
          { value: 'port-bouet', label: 'Port-Bouët' },
        ],
      },
      { value: 'cocody', label: 'Cocody' },
      { value: 'plateau', label: 'Plateau' },
    ],
  },
  {
    value: 'centre',
    label: 'Centre',
    icon: 'landscape',
    children: [
      { value: 'yakro', label: 'Yamoussoukro' },
      { value: 'bouake', label: 'Bouaké' },
      { value: 'dimbokro', label: 'Dimbokro', disabled: true },
    ],
  },
  {
    value: 'ouest',
    label: 'Ouest',
    icon: 'forest',
    children: [
      { value: 'daloa', label: 'Daloa' },
      { value: 'man', label: 'Man' },
      { value: 'sanpedro', label: 'San-Pédro' },
    ],
  },
  {
    value: 'nord',
    label: 'Nord',
    icon: 'wb_sunny',
    children: [
      { value: 'korhogo', label: 'Korhogo' },
      { value: 'odienne', label: 'Odienné' },
    ],
  },
];
const VEHICULES: TransferItem[] = [
  ['CI-4521-AB', 'Toyota Hilux', 'local_shipping'],
  ['CI-2210-CD', 'Renault Kangoo', 'airport_shuttle'],
  ['CI-3307-EF', 'Suzuki Swift', 'directions_car'],
  ['CI-0418-GH', 'Yamaha Crux', 'two_wheeler'],
  ['CI-7781-JK', 'Mercedes Actros', 'local_shipping'],
  ['CI-1150-LM', 'Toyota Coaster', 'directions_bus'],
  ['CI-9902-NP', 'Isuzu D-Max', 'local_shipping'],
  ['CI-6630-QR', 'Peugeot Partner', 'airport_shuttle'],
  ['CI-5512-ST', 'Hyundai H100', 'airport_shuttle'],
  ['CI-8843-UV', 'Nissan Navara', 'local_shipping'],
].map(([value = '', d, icon], i) => ({ value, label: value, description: d, icon, disabled: i === 7 }));
const PERMISSIONS: TransferItem[] = [
  'Voir les véhicules',
  'Modifier les véhicules',
  'Voir les trajets',
  'Exporter les rapports',
  'Gérer les alertes',
  'Couper le moteur à distance',
  'Gérer les utilisateurs',
  'Facturation',
  'Paramètres du compte',
].map((label, i) => ({ value: 'p' + i, label, icon: i === 5 ? 'warning' : 'key' }));
const MOTS_CLES = [
  'Urgent',
  'Maintenance',
  'Installation',
  'Désinstallation',
  'Garantie',
  'Client VIP',
  'Flotte',
  'Balise',
  'Carburant',
  'Batterie',
  'Réclamation',
];
const isEmail = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
const lower = (t: string) => t.toLowerCase();
const EMBED = `<iframe src="https://suivi.example.com/partage/7f3a9c" width="600" height="400" frameborder="0"></iframe>`;
const BARS: [number, number][] = [
  [5, 62],
  [4, 38],
  [3, 15],
  [2, 8],
  [1, 5],
];

interface PvForm {
  quartier: string | null;
  adresse: AddressValue | null;
  balises: number;
  montant: number | null;
  etiquettes: string[];
  note: number;
  code: string;
  signature: string | null;
}
const PV_INITIAL: PvForm = {
  quartier: null,
  adresse: null,
  balises: 1,
  montant: null,
  etiquettes: [],
  note: 0,
  code: '',
  signature: null,
};
type PvKey = keyof PvForm;

/** Galerie /components/fields — champs avancés (tous contrôlés value / onChange). */
export function FieldsGalleryPage() {
  const snack = useSnackbar();
  // OTP
  const [otp, setOtp] = useState('');
  const [otpState, setOtpState] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
  const [pin, setPin] = useState('');
  const [alnum, setAlnum] = useState('');
  const verify = (code: string) => {
    setOtpState('checking');
    setTimeout(() => setOtpState(code === '246810' ? 'ok' : 'bad'), 700);
  };
  // Nombres / montants
  const [vehicules, setVehicules] = useState(12);
  const [quantite, setQuantite] = useState(1);
  const [tauxRemise, setTauxRemise] = useState(7.5);
  const [montant, setMontant] = useState<number | null>(1_250_000);
  const [montantEur, setMontantEur] = useState<number | null>(1990.5);
  const [montantVide, setMontantVide] = useState<number | null>(null);
  // Intervalle
  const [prix, setPrix] = useState<RangeValue>([50_000, 250_000]);
  const [vitesse, setVitesse] = useState<RangeValue>([30, 90]);
  // Notation
  const [note, setNote] = useState(4);
  const [noteDemi, setNoteDemi] = useState(3.5);
  const [coeur, setCoeur] = useState(3);
  const [satisfaction, setSatisfaction] = useState(4);
  // Couleur
  const [couleur, setCouleur] = useState('#4f6bed');
  const [couleurTag, setCouleurTag] = useState('#10b981');
  // Éditeurs
  const [rich, setRich] = useState(RICH);
  const [richEmpty, setRichEmpty] = useState('');
  const [md, setMd] = useState(MD);
  const [signature, setSignature] = useState<string | null>(null);
  // Tree / transfer / tags
  const [zoneSimple, setZoneSimple] = useState<string | null>('marcory');
  const [zonesMulti, setZonesMulti] = useState<string[]>(['abobo', 'adjame', 'bouake']);
  const [affectes, setAffectes] = useState(['CI-2210-CD', 'CI-1150-LM']);
  const [perms, setPerms] = useState(['p0', 'p2']);
  const [tags, setTags] = useState(['Installation', 'Flotte']);
  const [emails, setEmails] = useState(['aminata.diallo@example.com', 'koffi@']);
  const [fixedTags, setFixedTags] = useState(['Garantie']);
  // Adresse / mot de passe / copie
  const [adresse, setAdresse] = useState<AddressValue | null>(null);
  const [adresseMap, setAdresseMap] = useState<AddressValue | null>(DEMO_PLACES[0] ?? null);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('Abidjan2026');
  const [apiKey, setApiKey] = useState('sk_demo_51HqLyjA7cE2kd8Rw0qxPvT3mN9bZfY4u');
  const regen = () => {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    setApiKey('sk_demo_' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => c[b % c.length]).join(''));
    snack('Nouvelle clé générée (démo statique)', { action: 'Fermer', duration: 2000 });
  };

  // Formulaire complet (validation équivalente aux Validators Angular)
  const [form, setForm] = useState<PvForm>(PV_INITIAL);
  const [touched, setTouched] = useState<Partial<Record<PvKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const invalid: Record<PvKey, boolean> = {
    quartier: !form.quartier,
    adresse: !form.adresse,
    balises: form.balises < 1,
    montant: form.montant == null || form.montant < 10_000,
    etiquettes: false,
    note: form.note < 1,
    code: form.code.length < 4,
    signature: !form.signature,
  };
  const valid = !Object.values(invalid).some(Boolean);
  const err = (k: PvKey) => invalid[k] && (!!touched[k] || submitted);
  const setF = <K extends PvKey>(k: K, v: PvForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: PvKey) => setTouched((t) => ({ ...t, [k]: true }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (valid)
      snack('PV d’installation valide — aucune donnée envoyée (démo statique)', {
        action: 'Fermer',
        duration: 3000,
        panelClass: 'snackbar-success',
      });
  };
  const reset = () => {
    setForm(PV_INITIAL);
    setTouched({});
    setSubmitted(false);
  };
  const formJson = JSON.stringify({ ...form, signature: form.signature ? 'data:image/png;base64,…' : null }, null, 2);
  const hasBadEmail = emails.some((e) => !isEmail(e));

  return (
    <div className="gallery-fields">
      <DocPage
        title="Champs avancés"
        icon="dynamic_form"
        subtitle="Types de champs complémentaires aux formulaires de base, tous contrôlés (value / onChange) et alignés sur le motif « field-box » : codes OTP, nombres, montants FCFA, intervalles, notation, couleur, éditeurs, signature, sélection arborescente, transfert, tags, adresse, mot de passe et valeurs à copier."
        toc={TOC}
      >
        <DocSection
          id="otp"
          title="Code OTP / PIN"
          source="OtpInput (components/fields)"
          cols={3}
          description="Cases séparées avec avance automatique, retour arrière, flèches, collage d'un code complet et autocomplétion SMS (one-time-code). onCompleted se déclenche quand toutes les cases sont remplies."
        >
          <Demo label="Vérification SMS" hint="essayez 246810" code={CODE.otp}>
            <div className="otp-card">
              <MaterialIcon name="sms" className="otp-ic" />
              <strong>Saisissez le code reçu</strong>
              <span className="muted">Envoyé au +225 07 •• •• 42 18</span>
              <OtpInput
                value={otp}
                onChange={setOtp}
                onCompleted={verify}
                invalid={otpState === 'bad'}
                success={otpState === 'ok'}
              />
              {otpState === 'checking' && (
                <span className="otp-msg">
                  <CircularProgress size={14} className="mat-spinner" />
                  Vérification…
                </span>
              )}
              {otpState === 'ok' && (
                <span className="otp-msg ok">
                  <MaterialIcon name="check_circle" />
                  Numéro vérifié
                </span>
              )}
              {otpState === 'bad' && (
                <span className="otp-msg bad">
                  <MaterialIcon name="error" />
                  Code incorrect
                </span>
              )}
              {otpState === 'idle' && <Button className="otp-msg">Renvoyer le code (0:42)</Button>}
            </div>
          </Demo>
          <Demo label="PIN masqué" hint="length={4} mask">
            <div className="col center">
              <OtpInput value={pin} onChange={setPin} length={4} mask />
              <span className="caption">Valeur : {pin || '—'}</span>
            </div>
          </Demo>
          <Demo label="Alphanumérique + séparateur" hint="numeric={false} separator">
            <div className="col center">
              <OtpInput value={alnum} onChange={setAlnum} numeric={false} separator />
              <span className="caption">Code d'activation de balise : {alnum || '—'}</span>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="stepper"
          title="Nombre avec + / −"
          source="NumberStepper (components/fields)"
          cols={3}
          description="Bornes, pas, décimales, unité. Appui long pour répéter (accéléré), flèches ↑/↓ (Maj = ×10), saisie directe au clavier."
        >
          <Demo label="Quantité de véhicules" code={CODE.stepper}>
            <div className="form-field">
              <label className="field-label">Véhicules à équiper</label>
              <NumberStepper value={vehicules} onChange={setVehicules} min={1} max={500} unit="véh." />
              <span className="field-hint">Entre 1 et 500 · valeur : {vehicules}</span>
            </div>
          </Demo>
          <Demo label="Décimales + pas" hint="step={0.5} decimals={1}">
            <div className="form-field">
              <label className="field-label">Remise</label>
              <NumberStepper
                value={tauxRemise}
                onChange={setTauxRemise}
                min={0}
                max={30}
                step={0.5}
                decimals={1}
                unit="%"
              />
            </div>
          </Demo>
          <Demo label="Compact (panier)" hint="compact">
            <div className="cart-line">
              <MaterialIcon name="router" />
              <span className="spacer">Balise GPS 4G</span>
              <NumberStepper value={quantite} onChange={setQuantite} min={0} max={99} compact />
              <strong>{(quantite * 45000).toLocaleString('fr-FR')} F</strong>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="currency"
          title="Montant / devise"
          source="CurrencyInput (components/fields)"
          cols={3}
          description="Séparateurs de milliers fr-FR au fil de la frappe, curseur préservé, décimales selon la devise (FCFA : aucune), ↑/↓ = ±1 000. Valeur : nombre. Option « en toutes lettres » pour les documents."
        >
          <Demo label="FCFA + en lettres" code={CODE.currency}>
            <div className="form-field">
              <label className="field-label">Montant de la facture</label>
              <CurrencyInput value={montant} onChange={setMontant} inWords />
              <span className="field-hint">Modèle : {montant ?? 'null'}</span>
            </div>
          </Demo>
          <Demo label="Multi-devises" hint="currencies={['XOF','EUR','USD']}">
            <div className="form-field">
              <label className="field-label">Prix d'achat</label>
              <CurrencyInput
                value={montantEur}
                onChange={setMontantEur}
                currency="EUR"
                currencies={['XOF', 'EUR', 'USD']}
                icon="shopping_cart"
              />
              <span className="field-hint">Modèle : {montantEur ?? 'null'}</span>
            </div>
          </Demo>
          <Demo label="Vide + plafond" hint="max={5000000}">
            <div className="form-field">
              <label className="field-label">Caution (max 5 000 000)</label>
              <CurrencyInput
                value={montantVide}
                onChange={setMontantVide}
                max={5000000}
                placeholder="Saisir un montant"
                icon="savings"
              />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="range"
          title="Intervalle à double curseur"
          source="RangeSlider (components/fields)"
          cols={2}
          description="Filtre min / max avec histogramme de distribution (les barres dans l'intervalle sont colorées), infobulles, champs saisissables, clavier (←/→, Page ↑/↓, Début/Fin). Valeur : [min, max]."
        >
          <Demo label="Prix avec histogramme" code={CODE.range}>
            <div className="form-field">
              <label className="field-label">Prix de l'abonnement</label>
              <RangeSlider
                value={prix}
                onChange={setPrix}
                min={0}
                max={500000}
                step={5000}
                histogram={HISTO}
                unit="FCFA"
                format={fcfa}
                minGap={10000}
              />
              <span className="field-hint">
                {HISTO.length} tranches · sélection : {prix[0].toLocaleString('fr-FR')} –{' '}
                {prix[1].toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </Demo>
          <Demo label="Simple, sans champs" hint="inputs={false}">
            <div className="form-field">
              <label className="field-label">Vitesse tolérée</label>
              <RangeSlider
                value={vitesse}
                onChange={setVitesse}
                min={0}
                max={140}
                step={5}
                unit="km/h"
                inputs={false}
              />
              <span className="field-hint">
                Alerte si la vitesse sort de {vitesse[0]} – {vitesse[1]} km/h
              </span>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="rating"
          title="Notation"
          source="app-rating (shared/components/fields)"
          cols={3}
          description="Étoiles (demi-étoiles possibles), cœurs ou émojis de satisfaction. Aperçu au survol, clavier ←/→, re-clic pour effacer, lecture seule pour afficher une moyenne."
        >
          <Demo label="Étoiles" code={CODE.rating}>
            <div className="col">
              <Rating value={note} onChange={setNote} showValue />
              <Rating value={noteDemi} onChange={setNoteDemi} half showValue size="large" />
            </div>
          </Demo>
          <Demo label="Satisfaction (émojis)" hint='variant="emoji"'>
            <div className="col">
              <span className="muted">Comment s'est passée l'intervention ?</span>
              <Rating value={satisfaction} onChange={setSatisfaction} variant="emoji" size="large" showValue />
              <Rating value={coeur} onChange={setCoeur} variant="heart" />
            </div>
          </Demo>
          <Demo label="Lecture seule (moyenne)" hint="readonly">
            <div className="reviews">
              <div className="big">4,3</div>
              <div className="col tight">
                <Rating value={4.3} readonly half />
                <span className="muted">128 avis clients</span>
              </div>
            </div>
            <div className="bars">
              {BARS.map(([n, c]) => (
                <div key={n} className="bar-row">
                  <span>{n}</span>
                  <MaterialIcon name="star" />
                  <div className="bar">
                    <i style={{ width: `${(c / 0.62) * 0.95}%` }} />
                  </div>
                  <em>{c}</em>
                </div>
              ))}
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="color"
          title="Sélecteur de couleur"
          source="ColorPicker (components/fields)"
          cols={3}
          description="Champ hexadécimal + panneau : saturation / luminosité, teinte, palette, couleurs récentes et pipette (EyeDropper, Chrome / Edge). Mode inline = palette seule."
        >
          <Demo label="Champ + panneau" code={CODE.color}>
            <div className="form-field">
              <label className="field-label">Couleur du groupe</label>
              <ColorPicker value={couleur} onChange={setCouleur} />
            </div>
            <div className="color-preview" style={{ background: couleur }}>
              <MaterialIcon name="local_shipping" />
              Groupe Nord
            </div>
          </Demo>
          <Demo label="Palette de marque" hint="swatches={brand}">
            <div className="form-field">
              <label className="field-label">Couleur d'étiquette</label>
              <ColorPicker value={couleurTag} onChange={setCouleurTag} swatches={BRAND} />
            </div>
          </Demo>
          <Demo label="Inline" hint="inline">
            <ColorPicker value={couleurTag} onChange={setCouleurTag} swatches={BRAND} inline />
            <span className="tag-preview" style={{ background: couleurTag + '22', color: couleurTag }}>
              <i style={{ background: couleurTag }} />
              Maintenance
            </span>
          </Demo>
        </DocSection>

        <DocSection
          id="rich-text"
          title="Éditeur de texte riche"
          source="RichTextEditor (components/fields)"
          cols={2}
          description="Éditeur léger sans dépendance (contenteditable) : styles de paragraphe, gras, italique, souligné, barré, listes, lien, nettoyage, annuler / rétablir, compteur. Le collage est converti en texte brut. Valeur : HTML."
        >
          <Demo label="Compte rendu" code={CODE.rich}>
            <RichTextEditor value={rich} onChange={setRich} maxLength={1000} />
          </Demo>
          <Demo label="Vide + aperçu HTML">
            <RichTextEditor
              value={richEmpty}
              onChange={setRichEmpty}
              placeholder="Notes pour le technicien…"
              minHeight="100px"
            />
            <pre className="html-out">{richEmpty || '(vide)'}</pre>
          </Demo>
        </DocSection>

        <DocSection
          id="markdown"
          title="Éditeur Markdown"
          source="MarkdownEditor (components/fields)"
          description="Écrire / Aperçu / Côte à côte, barre d'insertion, raccourcis Ctrl+B / I / K, Tab, continuation automatique des listes. Rendu par markdownToHtml (lib/markdown.ts), texte échappé."
        >
          <Demo label="Procédure (côte à côte)" code={CODE.markdown}>
            <MarkdownEditor value={md} onChange={setMd} mode="split" minHeight="300px" />
          </Demo>
        </DocSection>

        <DocSection
          id="signature"
          title="Signature"
          source="app-signature-pad (shared/components/fields)"
          cols={2}
          description="Souris, doigt ou stylet (pression prise en compte) ; trait lissé à épaisseur variable selon la vitesse, annuler, effacer, choix d'encre, rendu net en haute densité. Valeur : PNG transparent (data URL)."
        >
          <Demo label="PV d'installation" code={CODE.signature}>
            <div className="form-field">
              <label className="field-label">
                Signature du client <span className="req">*</span>
              </label>
              <SignaturePad value={signature} onChange={setSignature} />
            </div>
          </Demo>
          <Demo label="Résultat (PNG)">
            <div className="sig-out">
              {signature ? (
                <img src={signature} alt="Signature" />
              ) : (
                <span className="muted">Signez à gauche pour voir l'image produite.</span>
              )}
            </div>
            {signature && <span className="caption">{(signature.length / 1024).toFixed(0)} Ko · fond transparent</span>}
          </Demo>
        </DocSection>

        <DocSection
          id="tree-select"
          title="Sélection arborescente"
          source="TreeSelect (components/fields)"
          cols={2}
          description="Hiérarchie dans un panneau déroulant : recherche insensible aux accents (garde les ancêtres), dépli / repli, simple (chemin affiché) ou multiple avec cases tri-état — cocher un parent coche toutes ses feuilles."
        >
          <Demo label="Simple" hint="chemin complet" code={CODE.tree}>
            <div className="form-field">
              <label className="field-label">Quartier d'intervention</label>
              <TreeSelect
                options={ZONES}
                value={zoneSimple}
                onChange={(v) => setZoneSimple(v as string | null)}
                placeholder="Choisir un quartier…"
                icon="location_on"
                leafOnly
              />
              <span className="field-hint">Valeur : {zoneSimple ?? 'null'}</span>
            </div>
          </Demo>
          <Demo label="Multiple (tri-état)" hint="multiple">
            <div className="form-field">
              <label className="field-label">Zones couvertes</label>
              <TreeSelect
                options={ZONES}
                value={zonesMulti}
                onChange={(v) => setZonesMulti((v as string[] | null) ?? [])}
                multiple
                placeholder="Toutes les zones"
              />
              <span className="field-hint">
                {zonesMulti.length} feuille(s) : {zonesMulti.join(', ') || '—'}
              </span>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="transfer"
          title="Liste de transfert"
          source="TransferList (components/fields)"
          description="Deux colonnes filtrables ; sélection multiple (Maj+clic pour une plage), boutons de transfert, double-clic, ou glisser-déposer entre colonnes (et réordonnancement à droite). Les éléments désactivés restent en place."
        >
          <Demo label="Affecter des véhicules à un groupe" code={CODE.transfer}>
            <TransferList
              items={VEHICULES}
              value={affectes}
              onChange={setAffectes}
              sourceTitle="Parc disponible"
              targetTitle="Groupe « Livraisons Nord »"
            />
            <span className="caption">Ordre de tournée : {affectes.join(' → ') || '—'}</span>
          </Demo>
          <Demo label="Permissions d'un rôle">
            <TransferList
              items={PERMISSIONS}
              value={perms}
              onChange={setPerms}
              sourceTitle="Permissions"
              targetTitle="Rôle « Superviseur »"
            />
          </Demo>
        </DocSection>

        <DocSection
          id="tags"
          title="Tags libres avec suggestions"
          source="TagInput (components/fields)"
          cols={3}
          description="Entrée, virgule ou Tab pour valider ; collage d'une liste ; retour arrière pour retirer ; double-clic pour modifier ; suggestions au clavier ; limite, validation et normalisation."
        >
          <Demo label="Mots-clés" hint="max={6}" code={CODE.tags}>
            <div className="form-field">
              <label className="field-label">Étiquettes du ticket</label>
              <TagInput
                value={tags}
                onChange={setTags}
                suggestions={MOTS_CLES}
                max={6}
                placeholder="Ajouter une étiquette…"
              />
            </div>
          </Demo>
          <Demo label="Destinataires (validation)" hint="validator={isEmail}">
            <div className="form-field">
              <label className="field-label">Envoyer le rapport à</label>
              <TagInput
                value={emails}
                onChange={setEmails}
                validator={isEmail}
                transform={lower}
                icon="mail"
                invalidMessage="Adresse email invalide"
                placeholder="email@exemple.ci"
              />
              {hasBadEmail && <span className="field-error">Une adresse est invalide (soulignée).</span>}
            </div>
          </Demo>
          <Demo label="Liste fermée" hint="allowCustom={false}">
            <div className="form-field">
              <label className="field-label">Catégories</label>
              <TagInput
                value={fixedTags}
                onChange={setFixedTags}
                suggestions={MOTS_CLES}
                allowCustom={false}
                icon="category"
                placeholder="Choisir…"
              />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="address"
          title="Adresse avec carte"
          source="AddressField (components/fields)"
          cols={2}
          description="La recherche est fournie par l'hôte (search : répertoire local ici, géocodeur en production). « Ma position » utilise la géolocalisation du navigateur ; un clic sur la carte place un repère précis. Valeur : { label, detail, lat, lng }."
        >
          <Demo label="Autocomplétion" hint="essayez « port », « cocody », « bouake »" code={CODE.address}>
            <div className="form-field">
              <label className="field-label">Adresse de livraison</label>
              <AddressField search={searchPlaces} value={adresse} onChange={setAdresse} />
            </div>
          </Demo>
          <Demo label="Avec carte" hint="map">
            <div className="form-field">
              <label className="field-label">Lieu d'installation</label>
              <AddressField search={searchPlaces} value={adresseMap} onChange={setAdresseMap} map />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="password"
          title="Mot de passe avec jauge"
          source="PasswordField (components/fields)"
          cols={2}
          description="Jauge de robustesse en 4 niveaux (longueur, variété, pénalités pour suites et mots courants), règles cochées en direct, alerte de verrouillage majuscules, générateur (crypto.getRandomValues)."
        >
          <Demo label="Création de compte" code={CODE.password}>
            <div className="form-field">
              <label className="field-label">Nouveau mot de passe</label>
              <PasswordField value={pwd} onChange={setPwd} generator showRulesEmpty />
            </div>
          </Demo>
          <Demo label="Mot de passe faible" hint="contient un mot courant">
            <div className="form-field">
              <label className="field-label">Mot de passe</label>
              <PasswordField value={pwd2} onChange={setPwd2} />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="copy"
          title="Valeur à copier"
          source="CopyField (components/fields)"
          cols={3}
          description="Clé API, lien de partage, IMEI, code d'intégration : bouton de copie avec confirmation, secret masqué (4 premiers / 4 derniers caractères), régénération, variante multi-ligne."
        >
          <Demo label="Clé API (secret)" code={CODE.copy}>
            <div className="form-field">
              <label className="field-label">Clé API de production</label>
              <CopyField value={apiKey} secret regenerable icon="key" label="la clé API" onRegenerate={regen} />
              <span className="field-hint">Ne la partagez jamais publiquement.</span>
            </div>
          </Demo>
          <Demo label="Lien de partage">
            <div className="form-field">
              <label className="field-label">Suivi en temps réel (24 h)</label>
              <CopyField value="https://suivi.example.com/partage/7f3a9c" icon="link" />
            </div>
            <div className="form-field mt">
              <label className="field-label">IMEI</label>
              <CopyField value="358240051111110" icon="router" />
            </div>
          </Demo>
          <Demo label="Code d'intégration" hint="multiline">
            <div className="form-field">
              <label className="field-label">Widget à intégrer</label>
              <CopyField value={EMBED} multiline />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="form"
          title="Formulaire complet (réactif)"
          source="FormGroup + composants ControlValueAccessor"
          description="Tous les champs avancés s'utilisent avec formControlName, Validators et l'état touched — exactement comme un input natif."
        >
          <Demo label="PV d'installation" code={CODE.form}>
            <form onSubmit={submit} className="pv-form" noValidate>
              <div className="grid-2">
                <div className="form-field">
                  <label className="field-label">
                    Quartier <span className="req">*</span>
                  </label>
                  <TreeSelect
                    options={ZONES}
                    value={form.quartier}
                    onChange={(v) => setF('quartier', v as string | null)}
                    onBlur={() => touch('quartier')}
                    leafOnly
                    icon="location_on"
                  />
                  {err('quartier') && <span className="field-error">Choisissez un quartier</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Adresse exacte <span className="req">*</span>
                  </label>
                  <AddressField
                    value={form.adresse}
                    onChange={(v) => setF('adresse', v)}
                    onBlur={() => touch('adresse')}
                    search={searchPlaces}
                    showCoords={false}
                  />
                  {err('adresse') && <span className="field-error">Adresse requise</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Balises installées <span className="req">*</span>
                  </label>
                  <NumberStepper
                    value={form.balises}
                    onChange={(v) => setF('balises', v)}
                    onBlur={() => touch('balises')}
                    min={0}
                    max={50}
                  />
                  {err('balises') && <span className="field-error">Au moins une balise</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Montant encaissé <span className="req">*</span>
                  </label>
                  <CurrencyInput
                    value={form.montant}
                    onChange={(v) => setF('montant', v)}
                    onBlur={() => touch('montant')}
                  />
                  {err('montant') && <span className="field-error">Minimum 10 000 FCFA</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">Étiquettes</label>
                  <TagInput value={form.etiquettes} onChange={(v) => setF('etiquettes', v)} suggestions={MOTS_CLES} />
                </div>
                <div className="form-field">
                  <label className="field-label">Satisfaction du client</label>
                  <Rating
                    value={form.note}
                    onChange={(v) => {
                      setF('note', v);
                      touch('note');
                    }}
                    size="large"
                  />
                  {err('note') && <span className="field-error">Merci de noter l'intervention</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Code de validation client <span className="req">*</span>
                  </label>
                  <OtpInput
                    value={form.code}
                    onChange={(v) => setF('code', v)}
                    onBlur={() => touch('code')}
                    length={4}
                    invalid={err('code')}
                  />
                  {err('code') && <span className="field-error">Code à 4 chiffres requis</span>}
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Signature <span className="req">*</span>
                  </label>
                  <SignaturePad
                    value={form.signature}
                    onChange={(v) => setF('signature', v)}
                    onBlur={() => touch('signature')}
                    height="140px"
                    invalid={err('signature')}
                  />
                  {err('signature') && <span className="field-error">Signature requise</span>}
                </div>
              </div>
              <div className="row form-actions">
                <span className="muted">{valid ? 'Formulaire valide' : 'Champs requis manquants'}</span>
                <span className="spacer" />
                <Button variant="outlined" type="button" onClick={reset}>
                  Réinitialiser
                </Button>
                <Button variant="contained" type="submit" startIcon={<MaterialIcon name="task_alt" />}>
                  Valider le PV
                </Button>
              </div>
              <details className="json">
                <summary>Valeur du formulaire</summary>
                <pre>{formJson}</pre>
              </details>
            </form>
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}
