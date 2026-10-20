import {
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Popper,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { CrudDialog, type CrudDialogConfig } from '../../../components/feedback/dialogs/CrudDialog';
import { useDialog } from '../../../components/feedback/dialogs/useDialog';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { BoxSelect } from '../../../components/fields/BoxSelect';
import { Calendar } from '../../../components/forms/Calendar';
import { FieldBoxDate, FieldBoxDateRange, OutlineDate } from '../../../components/forms/DateFields';
import { EntityAutocomplete } from '../../../components/forms/EntityAutocomplete';
import { FileUpload, type LocalFile } from '../../../components/forms/FileUpload';
import { FilterDropdown, type FilterOption } from '../../../components/forms/FilterDropdown';
import { MaskedInput } from '../../../components/forms/MaskedInput';
import { SearchableSelect, type SelectOption } from '../../../components/forms/SearchableSelect';
import { FieldBoxTime } from '../../../components/forms/TimePicker';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DEMO_CLIENTS, SECTEUR_OPTIONS, VILLE_OPTIONS, type DemoClient } from '../../../data/static/showcase.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './formsCode';
import './forms-gallery.scss';

const TOC: TocItem[] = [
  { id: 'input', label: 'Input' },
  { id: 'input-material', label: 'Input Material' },
  { id: 'textarea', label: 'Textarea' },
  { id: 'mask', label: 'Masque de saisie' },
  { id: 'select', label: 'Select' },
  { id: 'multi-select', label: 'Multi-select' },
  { id: 'autocomplete', label: 'Autocomplete' },
  { id: 'date', label: 'Date picker' },
  { id: 'date-range', label: 'Date range' },
  { id: 'time', label: 'Time picker' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'radio', label: 'Radio' },
  { id: 'toggle', label: 'Toggle' },
  { id: 'slider', label: 'Slider' },
  { id: 'upload', label: 'File upload' },
  { id: 'search', label: 'Search' },
  { id: 'validation', label: 'Form validation' },
  { id: 'crud-dialog', label: 'Formulaire en modale' },
];

const PRIORITY_OPTIONS: SelectOption<string>[] = [
  { value: 'BASSE', label: 'Basse', icon: 'arrow_downward', color: '#64748b', description: 'Traitement sous 5 jours' },
  { value: 'NORMALE', label: 'Normale', icon: 'remove', color: '#3b82f6', description: 'Traitement sous 48 h' },
  { value: 'HAUTE', label: 'Haute', icon: 'arrow_upward', color: '#f59e0b', description: 'Traitement sous 24 h' },
  {
    value: 'CRITIQUE',
    label: 'Critique',
    icon: 'priority_high',
    color: '#ef4444',
    description: 'Intervention immédiate',
  },
];
const STATUT_OPTIONS: FilterOption<string>[] = [
  { value: '', label: 'Tous', icon: 'list', count: 40 },
  { value: 'ACTIF', label: 'Actifs', icon: 'check_circle', color: '#22c55e', count: 22 },
  { value: 'SUSPENDU', label: 'Suspendus', icon: 'pause_circle', color: '#eab308', count: 5 },
  { value: 'INACTIF', label: 'Inactifs', icon: 'remove_circle_outline', count: 8 },
  { value: 'RESILIE', label: 'Résiliés', icon: 'cancel', color: '#ef4444', count: 5 },
];
const VILLE_FILTER_OPTIONS: FilterOption<string>[] = [
  { value: '', label: 'Toutes', icon: 'public' },
  ...VILLE_OPTIONS.map((v) => ({ ...v, icon: 'location_on' })),
];
const CHOICES = [
  { v: 'MENSUEL', i: 'calendar_view_month', l: 'Mensuel', d: 'Facture chaque mois' },
  { v: 'TRIMESTRIEL', i: 'date_range', l: 'Trimestriel', d: '-5 % de remise' },
  { v: 'ANNUEL', i: 'event_repeat', l: 'Annuel', d: '-12 % de remise' },
];
const EMAIL_RE =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const clientSearch = (term: string) => {
  const q = term.toLowerCase();
  return Promise.resolve(
    DEMO_CLIENTS.filter((c) => c.raison_sociale.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(
      0,
      8,
    ),
  );
};

interface FormValues {
  raison_sociale: string;
  email: string;
  telephone: string;
  ville: string | null;
  vehicules: string;
  cgu: boolean;
}
const EMPTY_FORM: FormValues = { raison_sociale: '', email: '', telephone: '', ville: null, vehicules: '', cgu: false };
function validate(v: FormValues): Partial<Record<keyof FormValues, string>> {
  const e: Partial<Record<keyof FormValues, string>> = {};
  if (!v.raison_sociale) e.raison_sociale = 'La raison sociale est requise';
  else if (v.raison_sociale.length < 3) e.raison_sociale = '3 caractères minimum';
  if (!v.email || !EMAIL_RE.test(v.email)) e.email = 'invalid';
  if (!v.telephone || !/^\+225 ?\d{2}( ?\d{2}){4}$/.test(v.telephone)) e.telephone = 'invalid';
  if (!v.ville) e.ville = 'required';
  const n = v.vehicules === '' ? NaN : Number(v.vehicules);
  if (Number.isNaN(n) || n < 1 || n > 500) e.vehicules = 'range';
  if (!v.cgu) e.cgu = 'required';
  return e;
}

function PasswordDemo() {
  const [shown, setShown] = useState(false);
  return (
    <div className="field-box">
      <MaterialIcon name="lock" />
      <input type={shown ? 'text' : 'password'} defaultValue="motdepasse" aria-label="Mot de passe" />
      <IconButton type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Masquer' : 'Afficher'}>
        <MaterialIcon name={shown ? 'visibility_off' : 'visibility'} />
      </IconButton>
    </div>
  );
}

/** Galerie /components/forms — champs, sélecteurs, dates, choix, upload, recherche, validation. */
export function FormsGalleryPage() {
  const snack = useSnackbar();
  const open = useDialog();
  const [filled, setFilled] = useState('Transports Yao & Fils');
  const [errorValue, setErrorValue] = useState('jean.kouassi@');
  const [successValue, setSuccessValue] = useState('jean.kouassi@example.com');
  const [matOutline, setMatOutline] = useState('Marie Yao');
  const [matError, setMatError] = useState('abc');
  const [comment, setComment] = useState(
    "Le client signale une perte de signal récurrente entre 18h et 20h sur l'axe Yopougon–Abobo.",
  );
  const [mask, setMask] = useState({ tel: '', plaque: '', date: '', code: '' });
  const [matSelectValue, setMatSelectValue] = useState('Abidjan');
  const [errSelect, setErrSelect] = useState<string>('');
  const [nativeSelect, setNativeSelect] = useState('Transport');
  const [searchableValue, setSearchableValue] = useState<string | null>('NORMALE');
  const [searchableEmpty, setSearchableEmpty] = useState<string | null>(null);
  const [multiValue, setMultiValue] = useState<string[]>(['Abidjan', 'Bouaké']);
  const [chipsValue, setChipsValue] = useState<string[]>(['Transport', 'Logistique']);
  const [selectedClient, setSelectedClient] = useState<DemoClient | null>(null);
  const [villeAuto, setVilleAuto] = useState('');
  const [villeAutoOpen, setVilleAutoOpen] = useState(false);
  const villeBox = useRef<HTMLDivElement>(null);
  const [dateValue, setDateValue] = useState<Date | null>(new Date(2026, 9, 13));
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(2026, 9, 1),
    end: new Date(2026, 9, 31),
  });
  const [timeValue, setTimeValue] = useState<Date | null>(new Date(2026, 9, 13, 8, 30));
  const [checks, setChecks] = useState({ sms: true, mail: false, push: true });
  const allChecked = checks.sms && checks.mail && checks.push;
  const someChecked = !allChecked && (checks.sms || checks.mail || checks.push);
  const [radioValue, setRadioValue] = useState('MENSUEL');
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [view, setView] = useState('list');
  const [sliderValue, setSliderValue] = useState(40);
  const [speed, setSpeed] = useState<number[]>([25, 75]);
  const [uploaded, setUploaded] = useState<{ name?: string; nom?: string } | null>(null);
  const [photo, setPhoto] = useState<LocalFile | null>(null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [touched, setTouched] = useState<Set<keyof FormValues>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(form);
  const formValid = Object.keys(errors).length === 0;
  const showError = (k: keyof FormValues) => !!errors[k] && (touched.has(k) || submitted);
  const touch = (k: keyof FormValues) => setTouched((t) => new Set(t).add(k));
  const setF = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setForm((f) => ({ ...f, [k]: v }));

  const villes = VILLE_OPTIONS.map((v) => v.label).filter((l) => l.toLowerCase().includes(villeAuto.toLowerCase()));
  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    return DEMO_CLIENTS.filter(
      (c) =>
        (!q || c.raison_sociale.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) &&
        (!statutFilter || c.statut === statutFilter) &&
        (!villeFilter || c.ville === villeFilter),
    );
  }, [search, statutFilter, villeFilter]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched(new Set(Object.keys(form) as (keyof FormValues)[]));
    if (formValid)
      snack('Formulaire valide — aucune donnée envoyée (démo statique)', {
        action: 'Fermer',
        duration: 3000,
        panelClass: 'snackbar-success',
      });
  };
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setTouched(new Set());
    setSubmitted(false);
  };

  const openCrud = (mode: 'create' | 'edit' | 'view') => {
    const c = DEMO_CLIENTS[0] as DemoClient;
    const config: CrudDialogConfig = {
      title: mode === 'create' ? 'Nouveau client' : mode === 'edit' ? 'Modifier le client' : 'Fiche client',
      subtitle: mode === 'create' ? 'Ajouter un client au référentiel' : `${c.code} — ${c.raison_sociale}`,
      mode,
      data:
        mode === 'create'
          ? { statut: 'ACTIF', actif: true }
          : { ...c, actif: c.statut === 'ACTIF', date_debut: c.created_at },
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Ex : CLI-1040' },
        { key: 'raison_sociale', label: 'Raison sociale', type: 'text', required: true, icon: 'business' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'contact@societe.ci' },
        { key: 'vehicules', label: 'Véhicules', type: 'number', placeholder: '0' },
        { key: 'ville', label: 'Ville', type: 'select', options: VILLE_OPTIONS },
        { key: 'secteurs', label: 'Secteurs', type: 'multiselect', options: SECTEUR_OPTIONS },
        { key: 'date_debut', label: 'Date de début', type: 'date' },
        {
          key: 'gestionnaire',
          label: 'Gestionnaire',
          type: 'autocomplete',
          options: [
            { value: 'u-1', label: 'Aminata Diallo' },
            { value: 'u-2', label: 'Koffi N’Guessan' },
            { value: 'u-3', label: 'Serge Kouamé' },
          ],
        },
        { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Informations complémentaires…' },
        { key: 'actif', label: 'Statut', type: 'checkbox', placeholder: 'Client actif' },
      ],
    };
    void open((d) => <CrudDialog config={config} dialog={d} />, {
      width: '700px',
      panelClass: 'assac-dialog-panel',
    }).then((r) => {
      if (r) snack('Enregistré localement (démo statique)', { action: 'Fermer', duration: 2500 });
    });
  };

  return (
    <div className="gallery-forms">
      <DocPage
        title="Formulaires"
        icon="edit_note"
        subtitle="Champs de saisie du projet : le motif maison « field-box » (form-field / field-label / field-box), les champs Angular Material « outline » (écrans de compte), les sélecteurs riches, les dates, les choix et la validation."
        toc={TOC}
      >
        {/* ═══════════ INPUT (field-box) ═══════════ */}
        <DocSection
          id="input"
          title="Input"
          source=".form-field > .field-box (styles.scss)"
          cols={3}
          description="Motif de champ utilisé dans la quasi-totalité des formulaires et dialogs (CrudDialog, formulaires de modules). Fond « surface-container-high », bordure 1px, rayon 12px, halo primaire au focus."
        >
          <Demo label="Default" code={CODE.fieldBox}>
            <div className="form-field">
              <label className="field-label">Raison sociale</label>
              <div className="field-box">
                <MaterialIcon name="business" />
                <input placeholder="Ex : Transports Yao & Fils" aria-label="Raison sociale" />
              </div>
            </div>
          </Demo>
          <Demo label="Focused" hint="état :focus-within">
            <div className="form-field">
              <label className="field-label">Raison sociale</label>
              <div className="field-box is-focused">
                <MaterialIcon name="business" />
                <input placeholder="Saisie en cours…" aria-label="Raison sociale" />
              </div>
            </div>
          </Demo>
          <Demo label="Filled">
            <div className="form-field">
              <label className="field-label">Raison sociale</label>
              <div className="field-box">
                <MaterialIcon name="business" />
                <input value={filled} onChange={(e) => setFilled(e.target.value)} aria-label="Raison sociale" />
              </div>
            </div>
          </Demo>
          <Demo label="Disabled">
            <div className="form-field">
              <label className="field-label">Code client</label>
              <div className="field-box is-disabled">
                <MaterialIcon name="tag" />
                <input value="CLI-1040" disabled aria-label="Code client" />
              </div>
            </div>
          </Demo>
          <Demo label="Readonly">
            <div className="form-field">
              <label className="field-label">Référence</label>
              <div className="field-box is-readonly">
                <MaterialIcon name="lock" />
                <input value="CLI-1043" readOnly aria-label="Référence" />
              </div>
            </div>
          </Demo>
          <Demo label="Error" code={CODE.fieldError}>
            <div className="form-field">
              <label className="field-label">Email *</label>
              <div className="field-box field-invalid">
                <MaterialIcon name="alternate_email" />
                <input value={errorValue} onChange={(e) => setErrorValue(e.target.value)} aria-label="Email" />
              </div>
              <span className="field-error">Adresse email invalide</span>
            </div>
          </Demo>
          <Demo label="Success">
            <div className="form-field">
              <label className="field-label">Email</label>
              <div className="field-box field-valid">
                <MaterialIcon name="alternate_email" />
                <input value={successValue} onChange={(e) => setSuccessValue(e.target.value)} aria-label="Email" />
                <MaterialIcon name="check_circle" className="state-icon ok" />
              </div>
            </div>
          </Demo>
          <Demo label="Required">
            <div className="form-field">
              <label className="field-label">
                Téléphone <span className="req">*</span>
              </label>
              <div className="field-box">
                <MaterialIcon name="phone" />
                <input placeholder="+225 07 00 00 00 00" required aria-label="Téléphone" />
              </div>
            </div>
          </Demo>
          <Demo label="With icon / action">
            <div className="form-field">
              <label className="field-label">Montant</label>
              <div className="field-box">
                <MaterialIcon name="payments" />
                <input type="number" defaultValue="250000" aria-label="Montant" />
                <span className="unit">FCFA</span>
                <Tooltip title="Effacer">
                  <IconButton type="button" aria-label="Effacer">
                    <MaterialIcon name="close" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </Demo>
          <Demo label="With helper text">
            <div className="form-field">
              <label className="field-label">IMEI de la balise</label>
              <div className="field-box">
                <MaterialIcon name="router" />
                <input placeholder="15 chiffres" aria-label="IMEI" />
              </div>
              <span className="field-hint">Inscrit sous le boîtier, 15 chiffres sans espace.</span>
            </div>
          </Demo>
          <Demo label="Loading">
            <div className="form-field">
              <label className="field-label">Vérification du code</label>
              <div className="field-box">
                <MaterialIcon name="qr_code" />
                <input defaultValue="SC-77812" aria-label="Code" />
                <CircularProgress size={18} />
              </div>
            </div>
          </Demo>
          <Demo label="Password">
            <div className="form-field">
              <label className="field-label">Mot de passe</label>
              <PasswordDemo />
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ INPUT MATERIAL ═══════════ */}
        <DocSection
          id="input-material"
          title="Input Material (outline / fill)"
          source="mat-form-field"
          cols={3}
          description="Utilisés par les écrans de compte (profil, mot de passe, inscription)."
        >
          <Demo label="Outline" code={CODE.matOutline}>
            <TextField
              className="kit-outline-field w-100"
              variant="outlined"
              label="Nom complet"
              placeholder="Prénom(s) Nom"
              value={matOutline}
              onChange={(e) => setMatOutline(e.target.value)}
              helperText="Affiché sur les documents"
              autoComplete="off"
              slotProps={{ input: { endAdornment: <MaterialIcon name="person" className="kit-suffix" /> } }}
            />
          </Demo>
          <Demo label="Outline — erreur">
            <TextField
              className="kit-outline-field w-100"
              variant="outlined"
              label="Email"
              value={matError}
              onChange={(e) => setMatError(e.target.value)}
              error={!!matError && !EMAIL_RE.test(matError)}
              helperText={
                matError && !EMAIL_RE.test(matError) ? 'Vous devez renseigner une adresse mail valide' : undefined
              }
              autoComplete="off"
              slotProps={{ input: { endAdornment: <MaterialIcon name="alternate_email" className="kit-suffix" /> } }}
            />
          </Demo>
          <Demo label="Fill — disabled">
            <TextField
              className="kit-fill-field w-100"
              variant="filled"
              label="E-mail"
              value="jean.kouassi@example.com"
              disabled
            />
          </Demo>
        </DocSection>

        {/* ═══════════ TEXTAREA ═══════════ */}
        <DocSection id="textarea" title="Textarea" source=".field-box.textarea-box" cols={3}>
          <Demo label="Default" code={CODE.textarea}>
            <div className="form-field">
              <label className="field-label">Description</label>
              <div className="field-box textarea-box">
                <textarea rows={3} placeholder="Décrivez la demande…" aria-label="Description" />
              </div>
            </div>
          </Demo>
          <Demo label="Filled + compteur">
            <div className="form-field">
              <label className="field-label">Commentaire</label>
              <div className="field-box textarea-box">
                <textarea
                  rows={3}
                  maxLength={200}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  aria-label="Commentaire"
                />
              </div>
              <span className="field-hint right">{comment.length}/200</span>
            </div>
          </Demo>
          <Demo label="Disabled">
            <div className="form-field">
              <label className="field-label">Notes internes</label>
              <div className="field-box textarea-box is-disabled">
                <textarea rows={3} disabled defaultValue="Lecture seule." aria-label="Notes internes" />
              </div>
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ MASQUE ═══════════ */}
        <DocSection
          id="mask"
          title="Masque de saisie"
          source="input[appInputMask] (shared/directives/input-mask.directive.ts)"
          cols={2}
          description="Directive légère sur un input de field-box : formate la saisie au fil de la frappe (0 chiffre, A lettre, * alphanumérique, autres caractères insérés automatiquement). La valeur du modèle est la valeur masquée."
        >
          {(
            [
              ['tel', 'Téléphone', '+225 00 00 00 00 00', 'call', '+225 07 00 00 00 00', 'tel', CODE.mask],
              ['plaque', 'Immatriculation', '0000 AA 00', 'directions_car', '1234 AB 01', undefined, undefined],
              ['date', 'Date de naissance', '00/00/0000', 'cake', 'JJ/MM/AAAA', 'numeric', undefined],
              ['code', 'Code client', 'CLI-00000', 'tag', 'CLI-00000', 'numeric', undefined],
            ] as const
          ).map(([k, label, m, icon, ph, im, code], i) => (
            <Demo
              key={k}
              label={['Téléphone', 'Immatriculation', 'Date saisie au clavier', 'Code avec préfixe'][i] as string}
              hint={m}
              code={code}
            >
              <div className="form-field">
                <label className="field-label">{label}</label>
                <div className="field-box">
                  <MaterialIcon name={icon} />
                  <MaskedInput
                    mask={m}
                    value={mask[k]}
                    onValueChange={(v) => setMask((s) => ({ ...s, [k]: v }))}
                    placeholder={ph}
                    inputMode={im}
                    aria-label={label}
                  />
                </div>
                <span className="field-hint">Valeur : {mask[k] || '—'}</span>
              </div>
            </Demo>
          ))}
        </DocSection>

        {/* ═══════════ SELECT ═══════════ */}
        <DocSection
          id="select"
          title="Select"
          source="mat-select · app-searchable-select · select natif"
          cols={3}
          description="Trois variantes coexistent : mat-select dans une field-box (panel « m3-dropdown-menu »), le sélecteur riche recherchable app-searchable-select (icônes, couleurs, descriptions, clavier) et le select natif (paginateur)."
        >
          <Demo label="mat-select" code={CODE.matSelect}>
            <div className="form-field">
              <label className="field-label">Ville</label>
              <div className="field-box select-box">
                <MaterialIcon name="location_on" />
                <BoxSelect
                  ariaLabel="Ville"
                  value={matSelectValue}
                  onChange={(v) => setMatSelectValue(v)}
                  options={VILLE_OPTIONS}
                />
              </div>
            </div>
          </Demo>
          <Demo label="app-searchable-select" code={CODE.searchable}>
            <div className="form-field">
              <label className="field-label">Priorité</label>
              <SearchableSelect
                options={PRIORITY_OPTIONS}
                value={searchableValue}
                onChange={setSearchableValue}
                placeholder="Priorité…"
                icon="flag"
                clearable
              />
            </div>
          </Demo>
          <Demo label="Vide + allowNull">
            <div className="form-field">
              <label className="field-label">Secteur</label>
              <SearchableSelect
                options={SECTEUR_OPTIONS}
                value={searchableEmpty}
                onChange={setSearchableEmpty}
                placeholder="Sélectionner un secteur…"
                icon="category"
                allowNull
                nullLabel="— Aucun —"
              />
            </div>
          </Demo>
          <Demo label="Disabled">
            <div className="form-field">
              <label className="field-label">Ville (verrouillée)</label>
              <SearchableSelect options={VILLE_OPTIONS} value="Abidjan" disabled icon="location_on" />
            </div>
          </Demo>
          <Demo label="Natif">
            <div className="form-field">
              <label className="field-label">Secteur</label>
              <div className="field-box">
                <MaterialIcon name="category" />
                <select value={nativeSelect} onChange={(e) => setNativeSelect(e.target.value)} aria-label="Secteur">
                  {SECTEUR_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Demo>
          <Demo label="Erreur">
            <div className="form-field">
              <label className="field-label">Ville *</label>
              <div className="field-box select-box field-invalid">
                <MaterialIcon name="location_on" />
                <BoxSelect
                  ariaLabel="Ville"
                  placeholder="Choisir…"
                  value={errSelect}
                  onChange={(v) => setErrSelect(v)}
                  options={VILLE_OPTIONS}
                />
              </div>
              <span className="field-error">Ville est requis</span>
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ MULTI SELECT ═══════════ */}
        <DocSection id="multi-select" title="Multi-select" source="mat-select multiple · mat-chip-grid" cols={2}>
          <Demo label="mat-select multiple" code={CODE.multi}>
            <div className="form-field">
              <label className="field-label">Zones couvertes</label>
              <div className="field-box select-box">
                <MaterialIcon name="checklist" />
                <BoxSelect
                  ariaLabel="Zones couvertes"
                  multiple
                  value={multiValue}
                  onChange={(v) => setMultiValue(v)}
                  options={VILLE_OPTIONS}
                  placeholder="Choisir des villes"
                />
              </div>
              <span className="field-hint">{multiValue.length} sélectionnée(s)</span>
            </div>
          </Demo>
          <Demo label="Chips">
            <div className="form-field">
              <label className="field-label">Secteurs</label>
              <div className="form-chips" role="listbox" aria-label="Secteurs" aria-multiselectable>
                {SECTEUR_OPTIONS.map((s) => {
                  const on = chipsValue.includes(s.value);
                  return (
                    <Chip
                      key={s.value}
                      role="option"
                      aria-selected={on}
                      className={`kit-chip-option${on ? ' selected' : ''}`}
                      label={s.label}
                      icon={on ? <MaterialIcon name="check" /> : undefined}
                      onClick={() => setChipsValue((v) => (on ? v.filter((x) => x !== s.value) : [...v, s.value]))}
                    />
                  );
                })}
              </div>
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ AUTOCOMPLETE ═══════════ */}
        <DocSection
          id="autocomplete"
          title="Autocomplete"
          source="app-entity-autocomplete · mat-autocomplete"
          cols={2}
          description="app-entity-autocomplete : recherche avec debounce, spinner, bouton d'effacement et état « aucun résultat ». Ici la fonction de recherche filtre une liste statique (of())."
        >
          <Demo label="app-entity-autocomplete" hint="tapez « trans » ou « CLI-10 »" code={CODE.autocomplete}>
            <div className="form-field">
              <label className="field-label">Client</label>
              <EntityAutocomplete<DemoClient & Record<string, unknown>>
                placeholder="Rechercher un client…"
                icon="business"
                searchFn={clientSearch as never}
                displayFn={(c) => (c ? `${c.code} — ${c.raison_sociale}` : '')}
                onItemSelected={setSelectedClient}
              />
              {selectedClient && (
                <span className="field-hint">
                  Sélection : {selectedClient.raison_sociale} ({selectedClient.ville})
                </span>
              )}
            </div>
          </Demo>
          <Demo label="mat-autocomplete">
            <div className="form-field">
              <label className="field-label">Ville</label>
              <div className="field-box" ref={villeBox}>
                <MaterialIcon name="location_on" />
                <input
                  value={villeAuto}
                  placeholder="Commencez à taper…"
                  aria-label="Ville"
                  role="combobox"
                  aria-expanded={villeAutoOpen}
                  onChange={(e) => {
                    setVilleAuto(e.target.value);
                    setVilleAutoOpen(true);
                  }}
                  onFocus={() => setVilleAutoOpen(true)}
                  onBlur={() => setVilleAutoOpen(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setVilleAutoOpen(false)}
                />
              </div>
              <VilleAutocompletePanel
                anchor={villeBox.current}
                open={villeAutoOpen && villes.length > 0}
                options={villes}
                onPick={(v) => {
                  setVilleAuto(v);
                  setVilleAutoOpen(false);
                }}
              />
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ DATES ═══════════ */}
        <DocSection id="date" title="Date picker" source="matDatepicker (adaptateur natif fr-FR)" cols={3}>
          <Demo label="field-box" code={CODE.date}>
            <div className="form-field">
              <label className="field-label">Date d'installation</label>
              <FieldBoxDate value={dateValue} onChange={setDateValue} />
            </div>
          </Demo>
          <Demo label="Outline + bornes">
            <OutlineDate
              label="Échéance (2026)"
              hint="JJ/MM/AAAA"
              min={new Date(2026, 0, 1)}
              max={new Date(2026, 11, 31)}
            />
          </Demo>
          <Demo label="Calendrier inline">
            <div className="mat-mdc-card inline-cal">
              <Calendar selected={dateValue} onSelect={setDateValue} />
            </div>
          </Demo>
        </DocSection>

        <DocSection id="date-range" title="Date range" source="mat-date-range-input" cols={2}>
          <Demo label="Période" code={CODE.range}>
            <div className="form-field">
              <label className="field-label">Période de facturation</label>
              <FieldBoxDateRange value={range} onChange={setRange} />
            </div>
          </Demo>
          <Demo label="Raccourcis de période" hint=".period-filter-group">
            <div className="m3-filter-toggle">
              <button type="button" className="active">
                Ce mois
              </button>
              <button type="button">Trimestre</button>
              <button type="button">Année</button>
              <button type="button">Personnalisé</button>
            </div>
          </Demo>
        </DocSection>

        <DocSection id="time" title="Time picker" source="matTimepicker (Angular Material ≥ 19)" cols={2}>
          <Demo label="Heure" code={CODE.time}>
            <div className="form-field">
              <label className="field-label">Heure de passage</label>
              <FieldBoxTime value={timeValue} onChange={setTimeValue} />
            </div>
          </Demo>
          <Demo label="Créneau (field-box)">
            <div className="form-field">
              <label className="field-label">Créneau</label>
              <div className="field-box">
                <MaterialIcon name="schedule" />
                <input type="time" defaultValue="08:30" aria-label="Début" />
                <span className="unit">→</span>
                <input type="time" defaultValue="10:00" aria-label="Fin" />
              </div>
            </div>
          </Demo>
        </DocSection>

        {/* ═══════════ CHOIX ═══════════ */}
        <DocSection id="checkbox" title="Checkbox" source="mat-checkbox" cols={3}>
          <Demo label="États" code={CODE.checkbox}>
            <div className="stack">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checks.sms}
                    onChange={(e) => setChecks((c) => ({ ...c, sms: e.target.checked }))}
                  />
                }
                label="Coché"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checks.mail}
                    onChange={(e) => setChecks((c) => ({ ...c, mail: e.target.checked }))}
                  />
                }
                label="Non coché"
              />
              <FormControlLabel control={<Checkbox checked disabled />} label="Coché désactivé" />
              <FormControlLabel control={<Checkbox disabled />} label="Désactivé" />
            </div>
          </Demo>
          <Demo label="Indéterminé (tout sélectionner)">
            <div className="stack">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={(e) =>
                      setChecks({ sms: e.target.checked, mail: e.target.checked, push: e.target.checked })
                    }
                  />
                }
                label={<strong>Canaux de notification</strong>}
              />
              <div className="stack indent">
                {(['sms', 'mail', 'push'] as const).map((k) => (
                  <FormControlLabel
                    key={k}
                    control={
                      <Checkbox
                        checked={checks[k]}
                        onChange={(e) => setChecks((c) => ({ ...c, [k]: e.target.checked }))}
                      />
                    }
                    label={{ sms: 'SMS', mail: 'Email', push: 'Push' }[k]}
                  />
                ))}
              </div>
            </div>
          </Demo>
          <Demo label="Erreur (CGU)">
            <FormControlLabel className="cb-error" control={<Checkbox />} label="J'accepte les conditions générales" />
            <span className="field-error">Vous devez accepter les conditions</span>
          </Demo>
        </DocSection>

        <DocSection id="radio" title="Radio" source="mat-radio-group" cols={2}>
          <Demo label="Vertical" code={CODE.radio}>
            <RadioGroup className="stack" value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
              <FormControlLabel value="MENSUEL" control={<Radio />} label="Mensuel" />
              <FormControlLabel value="TRIMESTRIEL" control={<Radio />} label="Trimestriel" />
              <FormControlLabel value="ANNUEL" control={<Radio />} label="Annuel" />
              <FormControlLabel value="PONCTUEL" control={<Radio />} label="Ponctuel (indisponible)" disabled />
            </RadioGroup>
          </Demo>
          <Demo label="Cartes de choix">
            <div className="choice-cards">
              {CHOICES.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  className={`choice-card${radioValue === o.v ? ' active' : ''}`}
                  onClick={() => setRadioValue(o.v)}
                >
                  <MaterialIcon name={o.i} />
                  <strong>{o.l}</strong>
                  <span>{o.d}</span>
                </button>
              ))}
            </div>
          </Demo>
        </DocSection>

        <DocSection id="toggle" title="Toggle" source="mat-slide-toggle · mat-button-toggle-group" cols={2}>
          <Demo label="Slide toggle" code={CODE.toggle}>
            <div className="stack">
              <FormControlLabel
                control={<Switch checked={toggleA} onChange={(e) => setToggleA(e.target.checked)} />}
                label="Notifications actives"
              />
              <FormControlLabel
                control={<Switch checked={toggleB} onChange={(e) => setToggleB(e.target.checked)} />}
                label="Mode maintenance"
              />
              <FormControlLabel control={<Switch checked disabled />} label="Verrouillé" />
            </div>
          </Demo>
          <Demo label="Button toggle">
            <ToggleButtonGroup
              exclusive
              value={view}
              onChange={(_, v: string | null) => v && setView(v)}
              aria-label="Vue"
            >
              <ToggleButton value="card" aria-label="Cartes">
                <MaterialIcon name="grid_view" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="Liste">
                <MaterialIcon name="view_list" />
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="Calendrier">
                <MaterialIcon name="calendar_month" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Demo>
        </DocSection>

        <DocSection id="slider" title="Slider" source="mat-slider" cols={2}>
          <Demo label="Valeur simple">
            <Slider
              className="w-100"
              min={0}
              max={100}
              step={5}
              valueLabelDisplay="auto"
              value={sliderValue}
              onChange={(_, v) => setSliderValue(v as number)}
              aria-label="Seuil d'alerte batterie"
            />
            <span className="field-hint">Seuil d'alerte batterie : {sliderValue} %</span>
          </Demo>
          <Demo label="Intervalle">
            <Slider
              className="w-100"
              min={0}
              max={100}
              valueLabelDisplay="auto"
              value={speed}
              onChange={(_, v) => setSpeed(v as number[])}
              getAriaLabel={(i) => (i ? 'Vitesse max' : 'Vitesse min')}
            />
            <span className="field-hint">
              Vitesse tolérée : {speed[0]} – {speed[1]} km/h
            </span>
          </Demo>
        </DocSection>

        {/* ═══════════ UPLOAD ═══════════ */}
        <DocSection
          id="upload"
          title="File upload"
          source="app-file-upload (core/components/file-upload)"
          cols={3}
          description="Le fichier choisi est lu localement (blob URL) : aucun envoi réseau. Modes « champ » et « photo »."
        >
          <Demo label="Champ — vide" code={CODE.upload}>
            <FileUpload placeholder="Joindre un document" accept="application/pdf" onUpload={setUploaded} />
          </Demo>
          <Demo label="Champ — fichier joint">
            <FileUpload
              fichier={{ _id: 'doc-1', nom: 'contrat-cadre-2026.pdf', taille: 1_245_000, url: '' }}
              placeholder="Document"
            />
          </Demo>
          <Demo label="Photo">
            <FileUpload mode="photo" placeholder="Photo" accept="image/*" fichier={photo} onUpload={setPhoto} />
          </Demo>
          <Demo label="Zone de dépôt" hint="motif des écrans d'import">
            <label className="drop-zone">
              <input type="file" hidden onChange={(e) => setUploaded(e.target.files?.[0] ?? null)} />
              <MaterialIcon name="cloud_upload" />
              <strong>Glissez un fichier ici</strong>
              <span>ou cliquez pour parcourir — CSV, XLSX (max 10 Mo)</span>
              {(uploaded?.name || uploaded?.nom) && <span className="code-tag">{uploaded.name || uploaded.nom}</span>}
            </label>
          </Demo>
          <Demo label="Disabled">
            <FileUpload placeholder="Pièce justificative" disabled />
          </Demo>
        </DocSection>

        {/* ═══════════ SEARCH ═══════════ */}
        <DocSection
          id="search"
          title="Search"
          source=".toolbar-search-filters · .m3-search-bar-unified · app-filter-dropdown · .m3-search-bar"
          description="Barre de recherche unifiée des pages liste : champ + séparateur + filtres popover recherchables. Filtrage local en direct."
        >
          <Demo label="Recherche unifiée + filtres" hint={`${searchResults.length} résultat(s)`} code={CODE.search}>
            <div className="toolbar-search-filters">
              <div className="m3-search-bar-unified">
                <div className="search-input-wrapper">
                  <MaterialIcon name="search" className="search-icon" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par code, raison sociale…"
                    aria-label="Rechercher"
                  />
                  {search && (
                    <button className="clear-btn" onClick={() => setSearch('')} aria-label="Effacer">
                      <MaterialIcon name="close" />
                    </button>
                  )}
                </div>
                <div className="divider" />
                <FilterDropdown
                  options={STATUT_OPTIONS}
                  value={statutFilter}
                  onChange={setStatutFilter}
                  labelPrefix="Statut"
                />
                <FilterDropdown
                  options={VILLE_FILTER_OPTIONS}
                  value={villeFilter}
                  onChange={setVilleFilter}
                  labelPrefix="Ville"
                />
              </div>
            </div>
            <div className="result-chips">
              {searchResults.slice(0, 8).map((c) => (
                <span key={c._id} className="code-tag">
                  {c.code} · {c.raison_sociale}
                </span>
              ))}
              {searchResults.length > 8 && <span className="more">+{searchResults.length - 8}</span>}
              {!searchResults.length && <span className="more">Aucun résultat</span>}
            </div>
          </Demo>
          <div className="grid-2">
            <Demo label="Barre compacte (.m3-search-bar)">
              <div className="m3-search-bar">
                <MaterialIcon name="search" className="search-icon" />
                <input type="text" placeholder="Rechercher…" aria-label="Rechercher" />
              </div>
            </Demo>
            <Demo label="Filtre seul (standalone)">
              <FilterDropdown
                options={STATUT_OPTIONS}
                value={statutFilter}
                onChange={setStatutFilter}
                labelPrefix="Statut"
                standalone
              />
            </Demo>
          </div>
        </DocSection>

        {/* ═══════════ VALIDATION ═══════════ */}
        <DocSection
          id="validation"
          title="Form validation"
          source="ReactiveForms + .field-error"
          description="Validation visuelle : les erreurs apparaissent après interaction ou à la soumission. Rien n'est envoyé."
        >
          <Demo label="Formulaire client" code={CODE.validation}>
            <form className="validation-form" onSubmit={submit} noValidate>
              <div className="form-grid">
                <div className="form-field span-2">
                  <label className="field-label" htmlFor="v-rs">
                    Raison sociale *
                  </label>
                  <div className={`field-box${showError('raison_sociale') ? ' field-invalid' : ''}`}>
                    <MaterialIcon name="business" />
                    <input
                      id="v-rs"
                      value={form.raison_sociale}
                      onChange={(e) => setF('raison_sociale', e.target.value)}
                      onBlur={() => touch('raison_sociale')}
                      placeholder="Ex : Bolloré Logistics CI"
                    />
                  </div>
                  {showError('raison_sociale') && <span className="field-error">{errors.raison_sociale}</span>}
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="v-email">
                    Email *
                  </label>
                  <div className={`field-box${showError('email') ? ' field-invalid' : ''}`}>
                    <MaterialIcon name="alternate_email" />
                    <input
                      id="v-email"
                      value={form.email}
                      onChange={(e) => setF('email', e.target.value)}
                      onBlur={() => touch('email')}
                      placeholder="contact@societe.ci"
                    />
                  </div>
                  {showError('email') && <span className="field-error">Adresse email invalide</span>}
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="v-tel">
                    Téléphone *
                  </label>
                  <div className={`field-box${showError('telephone') ? ' field-invalid' : ''}`}>
                    <MaterialIcon name="phone" />
                    <input
                      id="v-tel"
                      value={form.telephone}
                      onChange={(e) => setF('telephone', e.target.value)}
                      onBlur={() => touch('telephone')}
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>
                  {showError('telephone') ? (
                    <span className="field-error">Format attendu : +225 07 00 00 00 00</span>
                  ) : (
                    <span className="field-hint">Format international</span>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">Ville *</label>
                  <div className={`field-box select-box${showError('ville') ? ' field-invalid' : ''}`}>
                    <MaterialIcon name="location_on" />
                    <BoxSelect
                      ariaLabel="Ville"
                      placeholder="Choisir…"
                      value={form.ville}
                      onChange={(v) => setF('ville', v)}
                      onBlur={() => touch('ville')}
                      options={VILLE_OPTIONS}
                    />
                  </div>
                  {showError('ville') && <span className="field-error">La ville est requise</span>}
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="v-veh">
                    Nombre de véhicules *
                  </label>
                  <div className={`field-box${showError('vehicules') ? ' field-invalid' : ''}`}>
                    <MaterialIcon name="directions_car" />
                    <input
                      id="v-veh"
                      type="number"
                      value={form.vehicules}
                      onChange={(e) => setF('vehicules', e.target.value)}
                      onBlur={() => touch('vehicules')}
                      placeholder="1 – 500"
                    />
                  </div>
                  {showError('vehicules') && <span className="field-error">Entre 1 et 500 véhicules</span>}
                </div>
                <div className="form-field span-2">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.cgu}
                        onChange={(e) => {
                          setF('cgu', e.target.checked);
                          touch('cgu');
                        }}
                      />
                    }
                    label="J'accepte les conditions générales de service"
                  />
                  {showError('cgu') && <span className="field-error">Vous devez accepter les conditions</span>}
                </div>
              </div>
              <div className="form-actions">
                <span className={`status${formValid ? ' ok' : ''}`}>
                  <MaterialIcon name={formValid ? 'check_circle' : 'info'} />
                  {formValid ? 'Formulaire valide' : 'Champs requis manquants'}
                </span>
                <span className="spacer" />
                <Button type="button" onClick={resetForm}>
                  Réinitialiser
                </Button>
                <Button variant="contained" type="submit" startIcon={<MaterialIcon name="save" />}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </Demo>
        </DocSection>

        {/* ═══════════ CRUD DIALOG ═══════════ */}
        <DocSection
          id="crud-dialog"
          title="Formulaire en modale"
          source="CrudDialogComponent (shared/components/crud-dialog)"
          description="Formulaire générique piloté par configuration (text, number, email, select, multiselect, textarea, checkbox, date, autocomplete) — utilisé pour toutes les créations/éditions rapides."
        >
          <Demo label="Modes create / edit / view" code={CODE.crud}>
            <div className="row">
              <Button variant="contained" startIcon={<MaterialIcon name="add" />} onClick={() => openCrud('create')}>
                Créer
              </Button>
              <Button variant="outlined" startIcon={<MaterialIcon name="edit" />} onClick={() => openCrud('edit')}>
                Modifier
              </Button>
              <Button startIcon={<MaterialIcon name="visibility" />} onClick={() => openCrud('view')}>
                Consulter
              </Button>
            </div>
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}

function VilleAutocompletePanel({
  anchor,
  open,
  options,
  onPick,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  options: string[];
  onPick: (v: string) => void;
}) {
  return (
    <Popper
      className="cdk-overlay-pane"
      open={open && !!anchor}
      anchorEl={anchor}
      placement="bottom-start"
      style={{ zIndex: 1300, width: anchor?.offsetWidth }}
      modifiers={[{ name: 'flip', options: { fallbackPlacements: ['top-start'] } }]}
    >
      <div
        className="mat-mdc-autocomplete-panel app-autocomplete-panel"
        role="listbox"
        onMouseDown={(e) => e.preventDefault()}
      >
        {options.map((v) => (
          <div
            key={v}
            role="option"
            aria-selected={false}
            className="mat-mdc-option mdc-list-item"
            onClick={() => onPick(v)}
          >
            <span className="mdc-list-item__primary-text">{v}</span>
          </div>
        ))}
      </div>
    </Popper>
  );
}
