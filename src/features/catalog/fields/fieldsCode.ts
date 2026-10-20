/** Extraits de code de la galerie Champs avancés (équivalents React des snippets Angular). */
export const CODE = {
  otp: `
<OtpInput
  value={code}
  onChange={setCode}
  length={6}              // nombre de cases
  numeric                 // false : alphanumérique
  invalid={erreur}
  onCompleted={verify} />`,
  stepper: `
<div className="form-field">
  <label className="field-label">Véhicules à équiper</label>
  <NumberStepper value={vehicules} onChange={setVehicules} min={1} max={500} step={1} unit="véh." />
</div>

<NumberStepper value={qte} onChange={setQte} min={0} compact />   {/* pilule */}`,
  currency: `
<CurrencyInput value={montant} onChange={setMontant} currency="XOF" inWords />
<CurrencyInput value={prix} onChange={setPrix} currency="EUR" currencies={['XOF', 'EUR', 'USD']} />

import { amountInWords } from 'components/fields/amountInWords';
amountInWords(1250000); // « Un million deux-cent-cinquante-mille »`,
  range: `
<RangeSlider
  value={prix}                    // [min, max]
  onChange={setPrix}
  min={0} max={500000} step={5000}
  minGap={10000}
  histogram={distribution}        // effectifs par tranche égale
  unit="FCFA"
  inputs />`,
  rating: `
<Rating value={note} onChange={setNote} half showValue />
<Rating value={satisfaction} onChange={setSatisfaction} variant="emoji" size="large" />
<Rating value={4.3} readonly half size="small" />`,
  color: `
<ColorPicker value={couleur} onChange={setCouleur} />                 // '#rrggbb'
<ColorPicker value={tag} onChange={setTag} swatches={brand} inline />`,
  rich: `
<RichTextEditor
  value={notes}                   // HTML
  onChange={setNotes}
  placeholder="Compte rendu d'intervention…"
  minHeight="140px"
  maxLength={2000} />`,
  markdown: `
<MarkdownEditor value={description} onChange={setDescription} mode="split" minHeight="300px" />

import { markdownToHtml } from 'lib/markdown';
<div className="kit-markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(description) }} />`,
  signature: `
<SignaturePad
  value={signature}               // data:image/png;base64,… ou null
  onChange={setSignature}
  height="200px"
  inks={['#0f172a', '#1d4ed8', '#b91c1c']}
  showDate />`,
  tree: `
const zones: TreeOption[] = [
  { value: 'abj', label: 'Abidjan', children: [
    { value: 'cocody', label: 'Cocody' }, { value: 'plateau', label: 'Plateau' } ] },
];

<TreeSelect options={zones} value={quartier} onChange={setQuartier} leafOnly />     // string | null
<TreeSelect options={zones} value={selection} onChange={setSelection} multiple />   // string[] (feuilles)`,
  transfer: `
<TransferList
  items={vehicules}               // TransferItem[] : { value, label, description?, icon?, disabled? }
  value={affectes}                // string[] (colonne de droite, ordonnée)
  onChange={setAffectes}
  sourceTitle="Parc disponible"
  targetTitle="Groupe Nord" />`,
  tags: `
<TagInput value={tags} onChange={setTags} suggestions={motsCles} max={6} />
<TagInput value={emails} onChange={setEmails} validator={isEmail} transform={(t) => t.toLowerCase()} icon="mail" />
<TagInput value={cats} onChange={setCats} suggestions={liste} allowCustom={false} />`,
  address: `
<AddressField search={searchPlaces} value={adresse} onChange={setAdresse} map />

// searchPlaces : (q) => PlaceOption[] | Promise<PlaceOption[]>
// valeur : { id, label, detail, city, lat, lng, kind }`,
  password: `
<PasswordField value={pwd} onChange={setPwd} generator showRulesEmpty />
<PasswordField value={pwd} onChange={setPwd} rules={[{ label: '12 caractères', test: (v) => v.length >= 12 }]} />`,
  copy: `
<CopyField value={apiKey} secret regenerable icon="key" label="la clé API" onRegenerate={regen} />
<CopyField value={embedCode} multiline />`,
  form: `
const [v, setV] = useState({ quartier: null, balises: 1, montant: null, code: '', signature: null });
const errors = {
  quartier: !v.quartier,
  balises: v.balises < 1,
  montant: v.montant == null || v.montant < 10000,
  code: v.code.length < 4,
  signature: !v.signature,
};

<TreeSelect options={zones} value={v.quartier} onChange={(q) => setV({ ...v, quartier: q })} onBlur={() => touch('quartier')} leafOnly />
{err('quartier') && <span className="field-error">Choisissez un quartier</span>}`,
};
