import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { Result } from '../../../../components/feedback/Result';
import { BoxSelect } from '../../../../components/fields/BoxSelect';
import { CurrencyInput } from '../../../../components/fields/CurrencyInput';
import { SignaturePad } from '../../../../components/fields/SignaturePad';
import { TagInput } from '../../../../components/fields/TagInput';
import { FieldBoxDate } from '../../../../components/forms/DateFields';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import '../../ex-page.scss';
import '../form-page.scss';
import './application.scss';

interface Experience {
  title: string;
  company: string;
  from: string;
  to: string;
  current: boolean;
}
interface Model {
  civ: string;
  first: string;
  last: string;
  birth: Date | null;
  nationality: string;
  email: string;
  phone: string;
  city: string;
  skills: string[];
  level: string;
  experiences: Experience[];
  files: { name: string; size: string; kind: string }[];
  portfolio: string;
  salary: number | null;
  contract: string;
  start: Date | null;
  remote: boolean;
  relocation: boolean;
  signature: string | null;
  certify: boolean;
}

const SECTIONS = [
  { id: 'identity', label: 'Identité', icon: 'badge' },
  { id: 'experience', label: 'Expérience', icon: 'work_history' },
  { id: 'documents', label: 'Documents', icon: 'folder' },
  { id: 'terms', label: 'Prétentions', icon: 'payments' },
  { id: 'sign', label: 'Signature', icon: 'draw' },
];
const SKILLS = [
  'Angular',
  'TypeScript',
  'Figma',
  'Accessibilité',
  'SQL',
  'Gestion de projet',
  'Flutter',
  'Design system',
];
const CONTRACTS = ['CDI', 'CDD', 'Freelance', 'Stage'];
const LEVELS = ['Junior', 'Confirmé', 'Senior', 'Expert'];
const NATIONALITIES = ['Ivoirienne', 'Sénégalaise', 'Malienne', 'Burkinabè', 'Ghanéenne', 'Autre'].map((n) => ({
  value: n,
  label: n,
}));

/** Taux de complétion par section (affiché dans la navigation). */
function completion(m: Model, id: string): number {
  const parts: Record<string, boolean[]> = {
    identity: [!!m.first, !!m.last, !!m.birth, /@/.test(m.email), !!m.phone],
    experience: [m.experiences.length > 0 && !!m.experiences[0]?.title, m.skills.length >= 3],
    documents: [m.files.some((f) => f.kind === 'CV'), m.files.length > 1 || !!m.portfolio],
    terms: [(m.salary ?? 0) > 0, !!m.contract, !!m.start],
    sign: [!!m.signature, m.certify],
  };
  const p = parts[id] ?? [];
  return Math.round((p.filter(Boolean).length / p.length) * 100);
}

/**
 * /examples/forms/application — formulaire long découpé en sections : navigation collante,
 * taux de complétion, expériences répétables, dépôt de fichiers, prétentions, signature, brouillon.
 */
export function ApplicationFormPage() {
  const host = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [m, setM] = useState<Model>({
    civ: 'M.',
    first: '',
    last: '',
    birth: null,
    nationality: 'Ivoirienne',
    email: '',
    phone: '',
    city: 'Abidjan',
    skills: ['Angular', 'TypeScript'],
    level: 'Confirmé',
    experiences: [{ title: 'Développeur front-end', company: 'Digital Baobab', from: '2022', to: '', current: true }],
    files: [],
    portfolio: '',
    salary: 850000,
    contract: 'CDI',
    start: null,
    remote: true,
    relocation: false,
    signature: null,
    certify: false,
  });
  const [drag, setDrag] = useState(false);
  const [draftSaved, setDraftSaved] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [tried, setTried] = useState(false);
  const set = (p: Partial<Model>) => setM((x) => ({ ...x, ...p }));
  const total = Math.round(SECTIONS.reduce((s, x) => s + completion(m, x.id), 0) / SECTIONS.length);

  const addExperience = () =>
    set({ experiences: [...m.experiences, { title: '', company: '', from: '', to: '', current: false }] });
  const removeExperience = (i: number) => set({ experiences: m.experiences.filter((_, j) => j !== i) });
  const patchExp = (i: number, p: Partial<Experience>) =>
    set({ experiences: m.experiences.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  const addFiles = (list: FileList | null) => {
    const files = [...(list ?? [])].map((f, i) => ({
      name: f.name,
      size: f.size > 1e6 ? (f.size / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(f.size / 1e3)) + ' Ko',
      kind: !m.files.some((x) => x.kind === 'CV') && i === 0 ? 'CV' : 'Autre',
    }));
    set({ files: [...m.files, ...files] });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer?.files ?? null);
  };
  /** Ajoute des fichiers d'exemple (démonstration sans fichier local). */
  const sampleFiles = () =>
    set({
      files: [
        { name: 'CV-Jean-Kouassi.pdf', size: '248 Ko', kind: 'CV' },
        { name: 'Lettre-motivation.pdf', size: '96 Ko', kind: 'Lettre' },
      ],
    });
  const removeFile = (i: number) => set({ files: m.files.filter((_, j) => j !== i) });
  const scrollTo = (id: string) =>
    host.current?.querySelector('#sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const saveDraft = () => setDraftSaved(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const submit = () => {
    setTried(true);
    const missing = SECTIONS.find((s) => completion(m, s.id) < 100 && s.id !== 'documents');
    if (missing && (!m.first || !m.last || !/@/.test(m.email) || !m.signature || !m.certify)) {
      scrollTo(missing.id);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="ex-page ex-form ex-application" ref={host}>
      <div className="form-head">
        <span className="text-overline">Recrutement · Réf. DEV-FE-2026-14</span>
        <h1>Développeur·se front-end confirmé·e</h1>
        <p>
          Abidjan, Plateau · CDI · hybride. Comptez une dizaine de minutes ; votre brouillon est enregistré à tout
          moment.
        </p>
      </div>

      {submitted ? (
        <section className="card done">
          <Result
            status="success"
            icon="task_alt"
            title="Candidature envoyée"
            actions={
              <Button variant="outlined" color="inherit" onClick={() => setSubmitted(false)}>
                Revoir ma candidature
              </Button>
            }
          >
            <p className="result-text">
              Merci {m.first} ! Vous recevrez une réponse sous 10 jours ouvrés à <strong>{m.email}</strong>. Numéro de
              dossier : <code>CAND-2026-0871</code>.
            </p>
          </Result>
        </section>
      ) : (
        <div className="layout">
          <nav className="toc card" aria-label="Sections du formulaire">
            <div className="overall">
              <strong>{total} %</strong>
              <span>complété</span>
              <LinearProgress variant="determinate" value={total} />
            </div>
            {SECTIONS.map((s) => {
              const c = completion(m, s.id);
              return (
                <button key={s.id} type="button" onClick={() => scrollTo(s.id)} className={c === 100 ? 'full' : ''}>
                  <span className="ring" style={{ '--p': c } as CSSProperties}>
                    <MaterialIcon name={c === 100 ? 'check' : s.icon} />
                  </span>
                  <span className="lbl">{s.label}</span>
                  <small>{c} %</small>
                </button>
              );
            })}
          </nav>

          <form
            className="main"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <section className="card section" id="sec-identity">
              <h2>
                <span className="num">1</span>Identité
              </h2>
              <div className="form-field">
                <label className="field-label">Civilité</label>
                <RadioGroup
                  row
                  name="civ"
                  className="radios"
                  value={m.civ}
                  onChange={(e) => set({ civ: e.target.value })}
                >
                  {['Mme', 'M.', 'Autre'].map((c) => (
                    <FormControlLabel key={c} value={c} control={<Radio />} label={c} />
                  ))}
                </RadioGroup>
              </div>
              <div className="row-2">
                <div className={`form-field${tried && !m.first ? ' invalid' : ''}`}>
                  <label className="field-label">
                    Prénom<span className="req">*</span>
                  </label>
                  <div className="field-box">
                    <input
                      name="first"
                      value={m.first}
                      onChange={(e) => set({ first: e.target.value })}
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className={`form-field${tried && !m.last ? ' invalid' : ''}`}>
                  <label className="field-label">
                    Nom<span className="req">*</span>
                  </label>
                  <div className="field-box">
                    <input
                      name="last"
                      value={m.last}
                      onChange={(e) => set({ last: e.target.value })}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>
              <div className="row-3">
                <div className="form-field">
                  <label className="field-label">Date de naissance</label>
                  <FieldBoxDate
                    value={m.birth}
                    onChange={(birth) => set({ birth })}
                    placeholder="jj/mm/aaaa"
                    icon=""
                    matToggle
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Nationalité</label>
                  <div className="field-box select-box">
                    <BoxSelect
                      value={m.nationality}
                      onChange={(nationality) => set({ nationality })}
                      options={NATIONALITIES}
                      ariaLabel="Nationalité"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Ville</label>
                  <div className="field-box">
                    <MaterialIcon name="place" />
                    <input name="city" value={m.city} onChange={(e) => set({ city: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="row-2">
                <div className={`form-field${tried && !m.email.includes('@') ? ' invalid' : ''}`}>
                  <label className="field-label">
                    E-mail<span className="req">*</span>
                  </label>
                  <div className="field-box">
                    <MaterialIcon name="mail" />
                    <input
                      name="email"
                      type="email"
                      value={m.email}
                      onChange={(e) => set({ email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                  {tried && !m.email.includes('@') && (
                    <span className="err">
                      <MaterialIcon name="error" />
                      Adresse e-mail requise.
                    </span>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">Téléphone</label>
                  <div className="field-box">
                    <MaterialIcon name="call" />
                    <input
                      name="phone"
                      type="tel"
                      value={m.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      autoComplete="tel"
                      placeholder="+225 07 …"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card section" id="sec-experience">
              <h2>
                <span className="num">2</span>Expérience et compétences
              </h2>
              {m.experiences.map((x, i) => (
                <fieldset key={i} className="exp">
                  <legend>Poste {i + 1}</legend>
                  {m.experiences.length > 1 && (
                    <IconButton
                      type="button"
                      className="rm"
                      onClick={() => removeExperience(i)}
                      aria-label="Supprimer ce poste"
                    >
                      <MaterialIcon name="delete_outline" />
                    </IconButton>
                  )}
                  <div className="row-2">
                    <div className="form-field">
                      <label className="field-label">Intitulé</label>
                      <div className="field-box">
                        <input
                          name={'t' + i}
                          value={x.title}
                          onChange={(e) => patchExp(i, { title: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Entreprise</label>
                      <div className="field-box">
                        <input
                          name={'c' + i}
                          value={x.company}
                          onChange={(e) => patchExp(i, { company: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row-3 years">
                    <div className="form-field">
                      <label className="field-label">De</label>
                      <div className="field-box">
                        <input
                          name={'f' + i}
                          value={x.from}
                          onChange={(e) => patchExp(i, { from: e.target.value })}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="2020"
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">À</label>
                      <div className="field-box">
                        <input
                          name={'to' + i}
                          value={x.to}
                          onChange={(e) => patchExp(i, { to: e.target.value })}
                          disabled={x.current}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder={x.current ? 'Aujourd’hui' : '2024'}
                        />
                      </div>
                    </div>
                    <FormControlLabel
                      className="cur"
                      control={
                        <Checkbox
                          name={'cur' + i}
                          checked={x.current}
                          onChange={(e) => patchExp(i, { current: e.target.checked })}
                        />
                      }
                      label="Poste actuel"
                    />
                  </div>
                </fieldset>
              ))}
              <Button
                variant="outlined"
                color="inherit"
                type="button"
                className="add"
                onClick={addExperience}
                startIcon={<MaterialIcon name="add" />}
              >
                Ajouter un poste
              </Button>
              <div className="form-field">
                <label className="field-label">
                  Compétences <span className="help">(3 minimum)</span>
                </label>
                <TagInput
                  value={m.skills}
                  onChange={(skills) => set({ skills })}
                  suggestions={SKILLS}
                  placeholder="Ajouter une compétence…"
                  icon="psychology"
                  max={10}
                />
              </div>
              <div className="form-field">
                <label className="field-label">Niveau</label>
                <div className="chips-choice">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={m.level === l ? 'on' : ''}
                      onClick={() => set({ level: l })}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="card section" id="sec-documents">
              <h2>
                <span className="num">3</span>Documents
              </h2>
              <p className="sub">CV obligatoire. Lettre, diplômes et portfolio facultatifs.</p>
              <label
                className={`drop${drag ? ' over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
              >
                <MaterialIcon name="cloud_upload" />
                <strong>Glissez vos fichiers ici</strong>
                <span>
                  ou <u>parcourez votre ordinateur</u> · PDF, DOCX · 5 Mo max
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              {!m.files.length && (
                <Button
                  type="button"
                  onClick={sampleFiles}
                  className="sample"
                  startIcon={<MaterialIcon name="auto_fix_high" />}
                >
                  Utiliser des fichiers d’exemple
                </Button>
              )}
              {m.files.map((f, i) => (
                <div key={f.name} className="file">
                  <img src="/assets/icons-files/pdf.png" alt="" />
                  <span>
                    <strong>{f.name}</strong>
                    <small>{f.size}</small>
                  </span>
                  <span className={`m3-badge ${f.kind === 'CV' ? 'success' : 'neutral'}`}>{f.kind}</span>
                  <IconButton type="button" onClick={() => removeFile(i)} aria-label="Retirer">
                    <MaterialIcon name="close" />
                  </IconButton>
                </div>
              ))}
              <div className="form-field">
                <label className="field-label">Portfolio ou GitHub</label>
                <div className="field-box">
                  <MaterialIcon name="link" />
                  <input
                    name="pf"
                    type="url"
                    value={m.portfolio}
                    onChange={(e) => set({ portfolio: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>
            </section>

            <section className="card section" id="sec-terms">
              <h2>
                <span className="num">4</span>Prétentions et disponibilité
              </h2>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label">Salaire mensuel brut souhaité</label>
                  <CurrencyInput value={m.salary} onChange={(salary) => set({ salary })} inWords />
                </div>
                <div className="form-field">
                  <label className="field-label">Disponible à partir du</label>
                  <FieldBoxDate
                    value={m.start}
                    onChange={(start) => set({ start })}
                    placeholder="jj/mm/aaaa"
                    icon=""
                    matToggle
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Type de contrat</label>
                <div className="chips-choice">
                  {CONTRACTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={m.contract === c ? 'on' : ''}
                      onClick={() => set({ contract: c })}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <FormControlLabel
                control={
                  <Switch name="remote" checked={m.remote} onChange={(e) => set({ remote: e.target.checked })} />
                }
                label="Ouvert·e au travail hybride (2 jours sur site)"
              />
              <FormControlLabel
                control={
                  <Switch name="reloc" checked={m.relocation} onChange={(e) => set({ relocation: e.target.checked })} />
                }
                label="Prêt·e à déménager à Abidjan"
              />
            </section>

            <section className="card section" id="sec-sign">
              <h2>
                <span className="num">5</span>Signature
              </h2>
              <SignaturePad
                value={m.signature}
                onChange={(signature) => set({ signature })}
                invalid={tried && !m.signature}
                height="160px"
              />
              <FormControlLabel
                control={
                  <Checkbox name="certify" checked={m.certify} onChange={(e) => set({ certify: e.target.checked })} />
                }
                label={
                  <>
                    Je certifie l’exactitude des informations fournies.<span className="req">*</span>
                  </>
                }
              />
              {tried && (!m.signature || !m.certify) && (
                <span className="err">
                  <MaterialIcon name="error" />
                  Signature et attestation requises.
                </span>
              )}
            </section>

            <div className="card sticky-actions">
              <span className="help">
                {draftSaved ? (
                  <>
                    <MaterialIcon name="cloud_done" />
                    Brouillon enregistré à {draftSaved}
                  </>
                ) : (
                  <>
                    <MaterialIcon name="cloud_off" />
                    Non enregistré
                  </>
                )}
              </span>
              <span className="spacer" />
              <Button type="button" onClick={saveDraft}>
                Enregistrer le brouillon
              </Button>
              <Button variant="contained" disableElevation type="submit">
                Envoyer ma candidature
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
