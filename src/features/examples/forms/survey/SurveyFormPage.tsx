import { Button, IconButton } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Rating } from '../../../../components/fields/Rating';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import '../../ex-page.scss';
import '../form-page.scss';
import './survey.scss';

type Q =
  | { id: string; kind: 'nps'; title: string; hint?: string }
  | { id: string; kind: 'rating'; title: string; hint?: string; items: string[] }
  | { id: string; kind: 'single' | 'multi'; title: string; hint?: string; options: { label: string; icon: string }[] }
  | { id: string; kind: 'text'; title: string; hint?: string; placeholder: string };
type Answers = Record<string, number | string | string[] | undefined>;

const QUESTIONS: Q[] = [
  {
    id: 'nps',
    kind: 'nps',
    title: 'Recommanderiez-vous SC Storage à un collègue ?',
    hint: 'De 0 (pas du tout) à 10 (sans hésiter).',
  },
  {
    id: 'use',
    kind: 'single',
    title: 'À quelle fréquence utilisez-vous l’application ?',
    options: [
      { label: 'Plusieurs fois par jour', icon: 'bolt' },
      { label: 'Tous les jours', icon: 'today' },
      { label: 'Chaque semaine', icon: 'date_range' },
      { label: 'Rarement', icon: 'hourglass_empty' },
    ],
  },
  {
    id: 'rate',
    kind: 'rating',
    title: 'Comment évaluez-vous ces aspects ?',
    hint: 'Une étoile = très insatisfait, cinq = très satisfait.',
    items: ['Rapidité', 'Facilité d’utilisation', 'Application mobile', 'Support client'],
  },
  {
    id: 'features',
    kind: 'multi',
    title: 'Quelles fonctionnalités aimeriez-vous voir arriver ?',
    hint: 'Plusieurs réponses possibles.',
    options: [
      { label: 'Mode hors ligne', icon: 'cloud_off' },
      { label: 'Signature électronique', icon: 'draw' },
      { label: 'Paiement Mobile Money intégré', icon: 'phone_iphone' },
      { label: 'Rapports personnalisés', icon: 'insights' },
      { label: 'API publique', icon: 'api' },
    ],
  },
  {
    id: 'free',
    kind: 'text',
    title: 'Un dernier mot pour l’équipe ?',
    placeholder: 'Ce qui vous plaît, ce qui vous agace, vos idées…',
  },
];
const NPS = Array.from({ length: 11 }, (_, n) => n);
const LETTERS = 'ABCDEFGH';

function isAnswered(q: Q, a: Answers): boolean {
  if (q.kind === 'rating') return q.items.some((it) => a[q.id + ':' + it]);
  if (q.kind === 'multi') return ((a[q.id] as string[] | undefined) ?? []).length > 0;
  if (q.kind === 'text') return !!((a[q.id] as string | undefined) ?? '').trim();
  return a[q.id] !== undefined;
}

/** /examples/forms/survey — questionnaire plein écran, une question par écran, navigation au clavier. */
export function SurveyFormPage() {
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const [a, setA] = useState<Answers>({});
  // Lecture à jour pour les actions différées (avance automatique) et le clavier.
  const live = useRef({ i, finished, a });
  live.current = { i, finished, a };

  const q = QUESTIONS[i] ?? (QUESTIONS[0] as Q);
  const progress = ((i + (finished ? 1 : 0)) / QUESTIONS.length) * 100;
  const answered = isAnswered(q, a);

  const next = (skip = false) => {
    const s = live.current;
    const cur = QUESTIONS[s.i];
    if (!cur || (!skip && !isAnswered(cur, s.a))) return;
    if (s.i < QUESTIONS.length - 1) setI(s.i + 1);
    else setFinished(true);
  };
  const prev = () => setI((n) => Math.max(0, n - 1));
  const pick = (id: string, v: number | string) => {
    live.current = { ...live.current, a: { ...live.current.a, [id]: v } };
    setA((x) => ({ ...x, [id]: v }));
    // Choix unique : on avance automatiquement après un court instant.
    setTimeout(() => next(), 280);
  };
  const has = (id: string, v: string) => ((a[id] as string[] | undefined) ?? []).includes(v);
  const toggle = (id: string, v: string) =>
    setA((x) => {
      const l = (x[id] as string[] | undefined) ?? [];
      return { ...x, [id]: l.includes(v) ? l.filter((y) => y !== v) : [...l, v] };
    });
  const restart = () => {
    setA({});
    setI(0);
    setFinished(false);
  };

  /** Entrée valide, ↑ ↓ naviguent, A–H choisissent une option. */
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e) => {
    if (finished || (e.target as HTMLElement).closest('textarea, input')) return;
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      next();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      prev();
      return;
    }
    const k = LETTERS.indexOf(e.key.toUpperCase());
    if ((q.kind === 'single' || q.kind === 'multi') && k >= 0 && k < q.options.length) {
      const label = q.options[k]?.label ?? '';
      if (q.kind === 'single') pick(q.id, label);
      else toggle(q.id, label);
    }
    if (q.kind === 'nps' && /^\d$/.test(e.key)) pick('nps', +e.key);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="ex-page ex-form ex-survey">
      <div className="survey">
        <header className="top">
          <Link to="/examples/app/modules" className="brand">
            <img src="/assets/logo.png" alt="" />
            SC Storage
          </Link>
          <div className="bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: progress + '%' }} />
          </div>
          <span className="count">
            {Math.min(i + 1, QUESTIONS.length)} / {QUESTIONS.length}
          </span>
        </header>

        <main className="stage">
          {finished ? (
            <div className="q done">
              <span className="big-emoji" aria-hidden="true">
                🙏
              </span>
              <h1>Merci pour vos réponses !</h1>
              <p className="hint">
                Vos retours arrivent directement à l’équipe produit. Score NPS donné :{' '}
                <strong>{(a['nps'] as number | undefined) ?? '–'}</strong>.
              </p>
              <div className="nav">
                <Button variant="outlined" color="inherit" onClick={restart} startIcon={<MaterialIcon name="replay" />}>
                  Recommencer
                </Button>
                <Button variant="contained" disableElevation component={Link} to="/examples/app/dashboard">
                  Retour à l’application
                </Button>
              </div>
            </div>
          ) : (
            <div className="q" data-k={i}>
              <span className="qnum">
                Question {i + 1}
                <MaterialIcon name="arrow_forward" />
              </span>
              <h1>{q.title}</h1>
              {q.hint && <p className="hint">{q.hint}</p>}

              {q.kind === 'nps' && (
                <>
                  <div className="nps" role="radiogroup" aria-label={q.title}>
                    {NPS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={a['nps'] === n}
                        className={`n${n <= 6 ? ' det' : n <= 8 ? ' pas' : ' pro'}${a['nps'] === n ? ' on' : ''}`}
                        onClick={() => pick('nps', n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="nps-legend">
                    <span>Pas du tout probable</span>
                    <span>Très probable</span>
                  </div>
                </>
              )}
              {q.kind === 'rating' && (
                <div className="ratings">
                  {q.items.map((it) => (
                    <div key={it} className="r-row">
                      <span>{it}</span>
                      <Rating
                        value={(a[q.id + ':' + it] as number | undefined) ?? 0}
                        onChange={(v) => setA((x) => ({ ...x, [q.id + ':' + it]: v }))}
                        size="large"
                        label={it}
                      />
                    </div>
                  ))}
                </div>
              )}
              {q.kind === 'single' && (
                <div className="opts">
                  {q.options.map((o, k) => (
                    <button
                      key={o.label}
                      type="button"
                      className={`opt${a[q.id] === o.label ? ' on' : ''}`}
                      onClick={() => pick(q.id, o.label)}
                    >
                      <kbd>{LETTERS[k]}</kbd>
                      <MaterialIcon name={o.icon} />
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {q.kind === 'multi' && (
                <div className="opts">
                  {q.options.map((o, k) => (
                    <button
                      key={o.label}
                      type="button"
                      className={`opt${has(q.id, o.label) ? ' on' : ''}`}
                      aria-pressed={has(q.id, o.label)}
                      onClick={() => toggle(q.id, o.label)}
                    >
                      <kbd>{LETTERS[k]}</kbd>
                      <MaterialIcon name={o.icon} />
                      {o.label}
                      {has(q.id, o.label) && <MaterialIcon name="check" className="tick" />}
                    </button>
                  ))}
                </div>
              )}
              {q.kind === 'text' && (
                <div className="form-field">
                  <div className="field-box textarea-box big">
                    <textarea
                      rows={4}
                      value={(a[q.id] as string | undefined) ?? ''}
                      onChange={(e) => setA((x) => ({ ...x, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                    />
                  </div>
                </div>
              )}

              <div className="nav">
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => next()}
                  disabled={!answered}
                  endIcon={<MaterialIcon name="check" />}
                >
                  {i === QUESTIONS.length - 1 ? 'Envoyer' : 'Valider'}
                </Button>
                <span className="kbd-hint">
                  ou appuyez sur <kbd>Entrée ↵</kbd>
                </span>
                {(q.kind === 'text' || q.kind === 'multi') && <Button onClick={() => next(true)}>Passer</Button>}
              </div>
            </div>
          )}
        </main>

        {!finished && (
          <footer className="arrows">
            <IconButton onClick={prev} disabled={i === 0} aria-label="Question précédente">
              <MaterialIcon name="keyboard_arrow_up" />
            </IconButton>
            <IconButton onClick={() => next()} disabled={!answered} aria-label="Question suivante">
              <MaterialIcon name="keyboard_arrow_down" />
            </IconButton>
          </footer>
        )}
      </div>
    </div>
  );
}
