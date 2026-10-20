// Porté depuis ui-kit Angular (harnais/components/widgets/rich-widget).
import { Checkbox, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import type { HarnaisWidget } from '../../../data/static/harnais.data';
import { toneIcon } from '../../../theme/toneInk';
import { copyText } from '../harnaisUtils';
import './rich-widget.scss';

/** Icônes de fichiers disponibles dans assets/icons-files. */
const FILE_ICONS = new Set(
  'avi bat css csv eps exe gif html iso jpg js mov mp3 mp4 pdf php png ppt psd sql svg tiff ttf txt xls'.split(' '),
);
const toneVar = (tone?: string) =>
  !tone || tone === 'primary'
    ? 'var(--primary-color)'
    : tone === 'neutral'
      ? 'var(--text-muted)'
      : `var(--${tone}-color)`;
/** --tone + jetons du lot contraste (équivalent des sélecteurs [style*="var(--x-color)"] d'Angular). */
const toneStyle = (tone?: string): CSSProperties => {
  const v = toneVar(tone);
  const solid: Record<string, [string, string]> = {
    success: ['var(--success-color)', 'var(--tone-on-success)'],
    warning: ['var(--warning-color)', 'var(--tone-on-warning)'],
    error: ['var(--error-color)', 'var(--mat-sys-on-error)'],
    info: ['var(--tone-info-solid)', '#fff'],
    purple: ['var(--tone-purple-solid)', '#fff'],
    cyan: ['var(--cyan-color)', 'var(--tone-on-cyan)'],
  };
  const s = tone ? solid[tone] : undefined;
  return {
    '--tone': v,
    '--tone-icon': toneIcon(v),
    ...(s ? { '--tone-solid': s[0], '--tone-on': s[1] } : {}),
  } as CSSProperties;
};
const pct = (v: number, target?: number) => Math.min(100, Math.round((v / (target ?? 100)) * 100));
const fileIcon = (ext: string) =>
  `/assets/icons-files/${FILE_ICONS.has(ext.toLowerCase()) ? ext.toLowerCase() : 'other'}.png`;
const stepIcon = (s: string) => ({ done: 'check', current: 'more_horiz', error: 'priority_high', todo: '' })[s] ?? '';

/**
 * Widgets « de précision » : fiche clé/valeur, étapes, liste de contrôle, objectifs, diff de code,
 * sources citées, étiquettes, carte de chaleur, fichiers, cartes, comparatif.
 */
export function HzRich({ block: b }: { block: HarnaisWidget }) {
  /** Liste de contrôle : état local coché / décoché. */
  const [toggled, setToggled] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = (value: string) => {
    copyText(value);
    setCopied(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1200);
  };
  const copyIcon = (v: string) => <MaterialIcon name={copied === v ? 'check' : 'content_copy'} />;

  let body: React.ReactNode = null;
  switch (b.type) {
    case 'keyvalue':
      body = (
        <dl className="kv">
          {b.items.map((p) => (
            <div key={p.label} className="kv-item">
              <dt>
                {p.icon && <MaterialIcon name={p.icon} />}
                {p.label}
              </dt>
              <dd className={p.mono ? 'mono' : undefined} style={p.tone ? { color: toneVar(p.tone) } : undefined}>
                <span>{p.value}</span>
                {p.copy && (
                  <button type="button" className="copy" onClick={() => copy(p.value)} aria-label={'Copier ' + p.label}>
                    {copyIcon(p.value)}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      );
      break;
    case 'steps':
      body = (
        <ol className="steps">
          {b.steps.map((s, i) => (
            <li key={i} className={s.status}>
              <span className="dot">
                {stepIcon(s.status) ? <MaterialIcon name={stepIcon(s.status)} /> : <span>{i + 1}</span>}
              </span>
              <span className="st-text">
                <span className="st-label">{s.label}</span>
                {s.text && <span className="st-sub">{s.text}</span>}
              </span>
            </li>
          ))}
        </ol>
      );
      break;
    case 'checklist': {
      const items = b.items.map((it, i) => ({ ...it, done: toggled.has(i) ? !it.done : !!it.done }));
      const done = items.filter((i) => i.done).length;
      const flip = (i: number) =>
        setToggled((s) => {
          const n = new Set(s);
          if (n.has(i)) n.delete(i);
          else n.add(i);
          return n;
        });
      body = (
        <>
          <div className="cl-head">
            <span>
              {done} / {items.length} terminé(s)
            </span>
            <span className="bar">
              <i style={{ width: `${(done / items.length) * 100}%` }} />
            </span>
          </div>
          <ul className="checklist">
            {items.map((it, i) => (
              <li key={i} className={it.done ? 'done' : undefined}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={it.done} onChange={() => flip(i)} />}
                  label={<span className="cl-label">{it.label}</span>}
                />
                {it.hint && <span className="cl-hint">{it.hint}</span>}
              </li>
            ))}
          </ul>
        </>
      );
      break;
    }
    case 'progress':
      body = (
        <div className="meters">
          {b.items.map((m) => (
            <div key={m.label} className="meter" style={toneStyle(m.tone)}>
              <div className="m-head">
                <span className="m-label">{m.label}</span>
                <span className="m-val">
                  <strong>
                    {m.value}
                    {m.unit}
                  </strong>
                  {m.target && (
                    <span>
                      {' '}
                      / {m.target}
                      {m.unit}
                    </span>
                  )}
                </span>
              </div>
              <div className="m-bar">
                <i style={{ width: `${pct(m.value, m.target)}%` }} />
              </div>
              <span className="m-pct">{pct(m.value, m.target)} % de l’objectif</span>
            </div>
          ))}
        </div>
      );
      break;
    case 'diff': {
      let oldN = 0,
        newN = 0,
        added = 0,
        removed = 0;
      const lines = b.patch.split('\n').map((raw) => {
        const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(raw);
        if (hunk) {
          oldN = Number(hunk[1]) - 1;
          newN = Number(hunk[2]) - 1;
          return { kind: 'hunk', text: raw, old: '', new: '' };
        }
        const c = raw[0];
        const text = raw.slice(1);
        if (c === '+') {
          added++;
          return { kind: 'add', text, old: '', new: String(++newN) };
        }
        if (c === '-') {
          removed++;
          return { kind: 'del', text, old: String(++oldN), new: '' };
        }
        return { kind: 'ctx', text, old: String(++oldN), new: String(++newN) };
      });
      body = (
        <div className="diff">
          <div className="diff-head">
            <MaterialIcon name="description" />
            <code>{b.file}</code>
            <span className="spacer" />
            <span className="plus">+{added}</span>
            <span className="minus">−{removed}</span>
            <button type="button" className="copy" onClick={() => copy(b.patch)} aria-label="Copier le diff">
              {copyIcon(b.patch)}
            </button>
          </div>
          <div className="diff-body">
            {lines.map((l, i) => (
              <div key={i} className={`dl ${l.kind}`}>
                <span className="n">{l.old}</span>
                <span className="n">{l.new}</span>
                <span className="sign">{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ''}</span>
                <span className="t">{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }
    case 'sources':
      body = (
        <ol className="sources">
          {b.items.map((s, i) => (
            <li key={i}>
              <span className="src-n">{i + 1}</span>
              <span className="src-main">
                <span className="src-site">
                  <span className="fav">{s.site[0]}</span>
                  {s.site}
                  {s.date && <span> · {s.date}</span>}
                </span>
                <span className="src-title">{s.title}</span>
                {s.snippet && <span className="src-snippet">{s.snippet}</span>}
              </span>
            </li>
          ))}
        </ol>
      );
      break;
    case 'tags':
      body = (
        <div className="tags">
          {b.items.map((t) => (
            <span key={t.label} className="tag" style={toneStyle(t.tone)}>
              {t.label}
              {t.count !== undefined && <b>{t.count}</b>}
            </span>
          ))}
        </div>
      );
      break;
    case 'heatmap': {
      const max = Math.max(1, ...b.values.flat());
      const heat = (v: number) =>
        `color-mix(in srgb, var(--primary-color) ${Math.round(8 + (v / max) * 82)}%, var(--hover-bg))`;
      body = (
        <>
          <div className="heat" style={{ '--cols': b.cols.length } as CSSProperties}>
            <span />
            {b.cols.map((c, i) => (
              <span key={'c' + i} className="hc">
                {c}
              </span>
            ))}
            {b.rows.map((r, ri) => [
              <span key={'r' + ri} className="hr">
                {r}
              </span>,
              ...b.cols.map((c, ci) => (
                <Tooltip key={`${ri}-${ci}`} title={`${r} ${c} : ${b.values[ri]?.[ci] ?? 0}${b.unit ?? ''}`}>
                  <span className="cell" style={{ background: heat(b.values[ri]?.[ci] ?? 0) }} />
                </Tooltip>
              )),
            ])}
          </div>
          <div className="heat-legend">
            <span>Moins</span>
            {[0.1, 0.35, 0.6, 0.85, 1].map((k) => (
              <i key={k} style={{ background: heat(k * max) }} />
            ))}
            <span>Plus</span>
          </div>
        </>
      );
      break;
    }
    case 'files':
      body = (
        <ul className="files">
          {b.items.map((f) => (
            <li key={f.name}>
              <img src={fileIcon(f.ext)} alt={f.ext} width={30} height={30} />
              <span className="f-main">
                <span className="f-name">{f.name}</span>
                <span className="f-meta">
                  {f.size}
                  {f.date && <span> · {f.date}</span>}
                  {f.by && <span> · {f.by}</span>}
                </span>
              </span>
              <IconButton className="f-dl" aria-label="Télécharger" disabled>
                <MaterialIcon name="download" />
              </IconButton>
            </li>
          ))}
        </ul>
      );
      break;
    case 'cards':
      body = (
        <div className="cards">
          {b.items.map((c) => (
            <article key={c.title} className="card" style={toneStyle(c.tone)}>
              <div className="c-visual">
                {c.image ? (
                  <img src={c.image} alt={c.title} loading="lazy" />
                ) : (
                  <MaterialIcon name={c.icon ?? 'category'} />
                )}
              </div>
              <div className="c-body">
                <span className="c-title">{c.title}</span>
                {c.text && <span className="c-text">{c.text}</span>}
                {!!c.tags?.length && (
                  <span className="c-tags">
                    {c.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </span>
                )}
              </div>
              <div className="c-foot">
                {c.price && <strong>{c.price}</strong>}
                {c.meta && <span className="c-meta">{c.meta}</span>}
                {c.cta && (
                  <button type="button" className="c-cta">
                    {c.cta}
                    <MaterialIcon name="arrow_forward" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      );
      break;
    case 'compare':
      body = (
        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th />
                {b.plans.map((p) => (
                  <th key={p.name} className={p.recommended ? 'reco' : undefined}>
                    {p.recommended && <span className="reco-badge">Recommandé</span>}
                    <span className="p-name">{p.name}</span>
                    {p.price && <span className="p-price">{p.price}</span>}
                    {p.note && <span className="p-note">{p.note}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.features.map((f) => (
                <tr key={f.label}>
                  <td className="f-label">{f.label}</td>
                  {f.values.map((v, i) => (
                    <td key={i} className={b.plans[i]?.recommended ? 'reco' : undefined}>
                      {typeof v === 'boolean' ? (
                        <MaterialIcon name={v ? 'check_circle' : 'remove'} className={v ? 'yes' : 'no'} />
                      ) : (
                        <span>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      break;
  }
  return <div className="hz-rich">{body}</div>;
}
