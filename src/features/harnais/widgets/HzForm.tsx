// Porté depuis ui-kit Angular (harnais/components/widgets/form-widget) : FormGroup → état local (valeurs + touchés).
import {
  Autocomplete,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Switch,
  TextField,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import { AddressField } from '../../../components/fields/AddressField';
import { ColorPicker } from '../../../components/fields/ColorPicker';
import { CopyField } from '../../../components/fields/CopyField';
import { CurrencyInput } from '../../../components/fields/CurrencyInput';
import { MarkdownEditor } from '../../../components/fields/MarkdownEditor';
import { NumberStepper } from '../../../components/fields/NumberStepper';
import { OtpInput } from '../../../components/fields/OtpInput';
import { PasswordField } from '../../../components/fields/PasswordField';
import { RangeSlider } from '../../../components/fields/RangeSlider';
import { RichTextEditor } from '../../../components/fields/RichTextEditor';
import { SignaturePad } from '../../../components/fields/SignaturePad';
import { TagInput } from '../../../components/fields/TagInput';
import { TransferList } from '../../../components/fields/TransferList';
import { TreeSelect } from '../../../components/fields/TreeSelect';
import type { DateRange } from '../../../components/forms/Calendar';
import { FieldBoxDate, FieldBoxDateRange } from '../../../components/forms/DateFields';
import { FileUpload } from '../../../components/forms/FileUpload';
import { MaskedInput } from '../../../components/forms/MaskedInput';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { searchPlaces } from '../../../data/static/address.data';
import type { HarnaisWidget, HzField } from '../../../data/static/harnais.data';
import { describeValue } from '../harnaisScenarios';
import './form-widget.scss';

type FormBlock = Extract<HarnaisWidget, { type: 'form' }>;
type Values = Record<string, unknown>;

/** Champs du kit rendus sans champ Material : libellé, aide et erreur sont posés autour par le formulaire. */
const KIT_FIELDS = new Set([
  'otp',
  'stepper',
  'currency',
  'range',
  'color',
  'richtext',
  'markdown',
  'signature',
  'treeselect',
  'transfer',
  'tags',
  'address',
  'password',
  'copy',
  'file',
]);
/** Champs qui prennent toute la largeur de la grille par défaut. */
const WIDE_FIELDS = new Set(['textarea', 'richtext', 'markdown', 'signature', 'transfer', 'range', 'address', 'otp']);
const STARS = [1, 2, 3, 4, 5];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initial(f: HzField): unknown {
  if (f.value !== undefined) return Array.isArray(f.value) ? [...f.value] : f.value;
  switch (f.kind) {
    case 'chips':
    case 'multiselect':
    case 'tags':
    case 'transfer':
      return [];
    case 'treeselect':
      return f.multiple ? [] : null;
    case 'checkbox':
    case 'toggle':
      return false;
    case 'slider':
    case 'stepper':
      return f.min ?? 0;
    case 'range':
      return [f.min ?? 0, f.max ?? 100];
    case 'daterange':
      return { start: null, end: null };
    case 'color':
      return '#4f6bed';
    case 'rating':
      return 0;
    default:
      return null;
  }
}

/** Équivalent des validateurs Angular : null = valide, sinon le code d'erreur. */
function error(f: HzField, v: unknown): 'required' | 'email' | null {
  const empty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
  if (f.kind === 'email' && !empty && !EMAIL.test(String(v))) return 'email';
  if (!f.required) return null;
  if (f.kind === 'checkbox' || f.kind === 'toggle') return v === true ? null : 'required';
  if (f.kind === 'daterange') {
    const r = v as DateRange | null;
    return r?.start && r?.end ? null : 'required';
  }
  if (f.kind === 'otp') return String(v ?? '').length >= (f.length ?? 6) ? null : 'required';
  return empty ? 'required' : null;
}

/**
 * Formulaire demandé par l'agent : tous les types de champs du kit. Une fois envoyé, il se fige en récapitulatif.
 */
export function HzForm({
  block: b,
  disabled = false,
  onSubmit,
}: {
  block: FormBlock;
  disabled?: boolean;
  onSubmit?: (values: Values) => void;
}) {
  const init = useMemo(() => Object.fromEntries(b.fields.map((f) => [f.key, initial(f)])), [b.fields]);
  const [values, setValues] = useState<Values>(init);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());

  if (b.values) {
    const sent = b.values;
    return (
      <div className="hz-form">
        <dl className="summary">
          {b.fields.map((f) => (
            <div key={f.key} className="row">
              <dt>{f.label}</dt>
              <dd>{describeValue(f, sent[f.key])}</dd>
            </div>
          ))}
        </dl>
        <div className="sent">
          <MaterialIcon name="check_circle" />
          Envoyé à l’agent
        </div>
      </div>
    );
  }

  const value = (k: string) => values[k];
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));
  const touch = (k: string) => setTouched((s) => (s.has(k) ? s : new Set(s).add(k)));
  const setTouch = (k: string, v: unknown) => {
    set(k, v);
    touch(k);
  };
  const invalid = (f: HzField) => touched.has(f.key) && error(f, values[f.key]) !== null;
  const labels = (f: HzField) => (f.options ?? []).map((o) => o.label);
  const blur = (f: HzField) => () => touch(f.key);

  const submit = () => {
    if (b.fields.some((f) => error(f, values[f.key]))) {
      setTouched(new Set(b.fields.map((f) => f.key)));
      return;
    }
    onSubmit?.({ ...values });
  };
  const reset = () => {
    setValues(init);
    setTouched(new Set());
  };

  const prefix = (icon?: string) =>
    icon ? (
      <InputAdornment position="start">
        <MaterialIcon name={icon} />
      </InputAdornment>
    ) : undefined;
  const helper = (f: HzField, err = 'Champ requis') => (invalid(f) ? err : f.hint);

  function kit(f: HzField): ReactNode {
    const k = f.key;
    const v = value(k);
    switch (f.kind) {
      case 'otp':
        return (
          <OtpInput
            value={String(v ?? '')}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            length={f.length ?? 6}
            invalid={invalid(f)}
          />
        );
      case 'stepper':
        return (
          <NumberStepper
            value={v as number | null}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            min={f.min ?? 0}
            max={f.max ?? 9999}
            step={f.step ?? 1}
            unit={f.unit ?? ''}
          />
        );
      case 'currency':
        return (
          <CurrencyInput
            value={v as number | null}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            currency={f.currency ?? 'XOF'}
            placeholder={f.placeholder ?? '0'}
            inWords
          />
        );
      case 'range':
        return (
          <RangeSlider
            value={v as [number, number] as never}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            min={f.min ?? 0}
            max={f.max ?? 100}
            step={f.step ?? 1}
            unit={f.unit ?? ''}
            histogram={f.histogram ?? []}
          />
        );
      case 'color':
        return <ColorPicker value={String(v ?? '')} onChange={(x) => set(k, x)} />;
      case 'richtext':
        return (
          <RichTextEditor
            value={String(v ?? '')}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            placeholder={f.placeholder ?? 'Saisissez votre texte…'}
            minHeight="120px"
          />
        );
      case 'markdown':
        return (
          <MarkdownEditor
            value={String(v ?? '')}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            placeholder={f.placeholder ?? 'Rédigez en Markdown…'}
            minHeight="160px"
          />
        );
      case 'signature':
        return (
          <SignaturePad
            value={v as string | null}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            height="160px"
            invalid={invalid(f)}
          />
        );
      case 'treeselect':
        return (
          <TreeSelect
            value={v as string | string[] | null}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            options={(f.options ?? []) as never}
            multiple={!!f.multiple}
            placeholder={f.placeholder ?? 'Sélectionner…'}
            icon={f.icon ?? 'account_tree'}
          />
        );
      case 'transfer':
        return (
          <TransferList value={(v as string[]) ?? []} onChange={(x) => set(k, x)} items={(f.options ?? []) as never} />
        );
      case 'tags':
        return (
          <TagInput
            value={(v as string[]) ?? []}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            suggestions={labels(f)}
            placeholder={f.placeholder ?? 'Ajouter…'}
            icon={f.icon ?? 'sell'}
            max={f.max ?? null}
          />
        );
      case 'address':
        return (
          <AddressField
            value={v as never}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            search={searchPlaces}
            map={!!f.map}
            mapHeight="200px"
            placeholder={f.placeholder ?? 'Rechercher une adresse…'}
          />
        );
      case 'password':
        return (
          <PasswordField
            value={String(v ?? '')}
            onChange={(x) => set(k, x)}
            onBlur={blur(f)}
            generator={!!f.secret}
            placeholder={f.placeholder ?? 'Mot de passe'}
          />
        );
      case 'copy':
        return <CopyField value={String(f.value ?? '')} label={f.label} icon={f.icon ?? ''} secret={!!f.secret} />;
      case 'file':
        return (
          <FileUpload
            accept={f.accept}
            placeholder={f.placeholder ?? 'Joindre un fichier'}
            disabled={disabled}
            onUpload={(file) => setTouch(k, file)}
          />
        );
    }
    return null;
  }

  function material(f: HzField): ReactNode {
    const k = f.key;
    const v = value(k);
    const common = { fullWidth: true, size: 'small' as const, className: 'hz-ff', error: invalid(f), onBlur: blur(f) };
    switch (f.kind) {
      case 'select':
      case 'multiselect': {
        const multi = f.kind === 'multiselect';
        const id = `hz-${k}`;
        return (
          <FormControl {...common}>
            <InputLabel id={id}>{f.label}</InputLabel>
            <Select
              labelId={id}
              multiple={multi}
              value={multi ? ((v as string[]) ?? []) : ((v as string) ?? '')}
              onChange={(e) => set(k, e.target.value)}
              input={<OutlinedInput label={f.label} startAdornment={prefix(f.icon)} />}
              renderValue={
                multi
                  ? (sel) =>
                      (f.options ?? [])
                        .filter((o) => (sel as string[]).includes(o.value))
                        .map((o) => o.label)
                        .join(', ')
                  : undefined
              }
            >
              {(f.options ?? []).map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {multi ? (
                    <>
                      <Checkbox size="small" checked={((v as string[]) ?? []).includes(o.value)} />
                      <ListItemText primary={o.label} />
                    </>
                  ) : (
                    o.label
                  )}
                </MenuItem>
              ))}
            </Select>
            {!multi && helper(f) && <FormHelperText>{helper(f)}</FormHelperText>}
          </FormControl>
        );
      }
      case 'autocomplete':
        return (
          <Autocomplete
            freeSolo
            options={labels(f)}
            inputValue={String(v ?? '')}
            onInputChange={(_, x) => set(k, x)}
            renderInput={(p) => (
              <TextField
                {...p}
                {...common}
                label={f.label}
                placeholder={f.placeholder ?? ''}
                helperText={helper(f)}
                slotProps={{
                  input: { ...p.InputProps, startAdornment: prefix(f.icon ?? 'search') },
                }}
              />
            )}
          />
        );
      case 'mask':
        return (
          <TextField
            {...common}
            label={f.label}
            value={String(v ?? '')}
            helperText={invalid(f) ? 'Champ requis' : (f.hint ?? 'Format : ' + f.mask)}
            slotProps={{
              input: {
                startAdornment: prefix(f.icon),
                inputComponent: MaskedInput as never,
                inputProps: {
                  mask: f.mask ?? '',
                  onValueChange: (x: string) => set(k, x),
                  placeholder: f.placeholder ?? '',
                  inputMode: 'text',
                },
              },
            }}
          />
        );
      case 'daterange':
        return (
          <>
            <span className="label">{f.label}</span>
            <FieldBoxDateRange
              value={(v as DateRange) ?? { start: null, end: null }}
              onChange={(r) => setTouch(k, r)}
            />
            {invalid(f) ? (
              <span className="err mat-error-hint">Période requise</span>
            ) : (
              f.hint && <span className="hint">{f.hint}</span>
            )}
          </>
        );
      case 'date':
        return (
          <>
            <span className="label">{f.label}</span>
            <FieldBoxDate
              value={(v as Date | null) ?? null}
              onChange={(d) => setTouch(k, d)}
              placeholder="jj/mm/aaaa"
            />
            {invalid(f) && <span className="err">Date requise</span>}
          </>
        );
      case 'time':
        return (
          <TextField
            {...common}
            type="time"
            label={f.label}
            value={String(v ?? '')}
            onChange={(e) => set(k, e.target.value)}
            helperText={helper(f, 'Heure requise')}
            slotProps={{
              inputLabel: { shrink: true },
              input: { startAdornment: prefix(f.icon ?? 'schedule') },
              htmlInput: { step: (f.step ?? 15) * 60, placeholder: 'HH:MM' },
            }}
          />
        );
      case 'textarea':
        return (
          <TextField
            {...common}
            multiline
            rows={3}
            label={f.label}
            value={String(v ?? '')}
            placeholder={f.placeholder ?? ''}
            onChange={(e) => set(k, e.target.value)}
          />
        );
      case 'segmented':
        return (
          <>
            <span className="label">{f.label}</span>
            <div className="segmented" role="radiogroup" aria-label={f.label}>
              {(f.options ?? []).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={v === o.value}
                  className={v === o.value ? 'on' : undefined}
                  onClick={() => set(k, o.value)}
                >
                  {o.icon && <MaterialIcon name={o.icon} />}
                  {o.label}
                </button>
              ))}
            </div>
          </>
        );
      case 'radio':
        return (
          <>
            <span className="label">{f.label}</span>
            <RadioGroup
              row
              className="radios"
              aria-label={f.label}
              value={(v as string) ?? ''}
              onChange={(e) => set(k, e.target.value)}
            >
              {(f.options ?? []).map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio size="small" />} label={o.label} />
              ))}
            </RadioGroup>
          </>
        );
      case 'chips': {
        const cur = (v as string[]) ?? [];
        return (
          <>
            <span className="label">{f.label}</span>
            <div className="chips">
              {(f.options ?? []).map((o) => {
                const on = cur.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    className={`chip${on ? ' on' : ''}`}
                    aria-pressed={on}
                    onClick={() => set(k, on ? cur.filter((x) => x !== o.value) : [...cur, o.value])}
                  >
                    <MaterialIcon name={on ? 'check' : 'add'} />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </>
        );
      }
      case 'slider':
        return (
          <>
            <span className="label">
              {f.label}{' '}
              <strong>
                {String(v)}
                {f.unit}
              </strong>
            </span>
            <Slider
              className="slider"
              min={f.min ?? 0}
              max={f.max ?? 100}
              step={f.step ?? 1}
              valueLabelDisplay="auto"
              value={Number(v ?? 0)}
              onChange={(_, x) => set(k, x)}
              aria-label={f.label}
            />
          </>
        );
      case 'rating':
        return (
          <>
            <span className="label">{f.label}</span>
            <div className="stars" role="radiogroup" aria-label={f.label}>
              {STARS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={v === n}
                  aria-label={n + ' sur 5'}
                  className={Number(v) >= n ? 'on' : undefined}
                  onClick={() => set(k, n)}
                >
                  <MaterialIcon name={Number(v) >= n ? 'star' : 'star_border'} />
                </button>
              ))}
            </div>
          </>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            className="hz-check"
            control={<Checkbox checked={!!v} onChange={(e) => setTouch(k, e.target.checked)} />}
            label={f.label}
          />
        );
      case 'toggle':
        return (
          <div className="toggle-row">
            <span className="toggle-label">
              {f.label}
              {f.hint && <small>{f.hint}</small>}
            </span>
            <Switch
              checked={!!v}
              onChange={(e) => setTouch(k, e.target.checked)}
              slotProps={{ input: { 'aria-label': f.label } }}
            />
          </div>
        );
      default: {
        const err = error(f, v);
        return (
          <TextField
            {...common}
            type={f.kind}
            label={f.label}
            value={v === null || v === undefined ? '' : String(v)}
            placeholder={f.placeholder ?? ''}
            onChange={(e) =>
              set(k, f.kind === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)
            }
            helperText={invalid(f) ? (err === 'email' ? 'Adresse invalide' : 'Champ requis') : f.hint}
            slotProps={{
              input: {
                startAdornment: prefix(f.icon),
                endAdornment: f.unit ? <InputAdornment position="end">{f.unit}</InputAdornment> : undefined,
              },
              htmlInput: { min: f.min, max: f.max },
            }}
          />
        );
      }
    }
  }

  return (
    <div className="hz-form">
      {b.description && <p className="desc">{b.description}</p>}
      <form
        className="grid"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {b.fields.map((f) => {
          const isKit = KIT_FIELDS.has(f.kind);
          const wide = !!f.wide || WIDE_FIELDS.has(f.kind);
          return (
            <div key={f.key} className={`field${wide ? ' wide' : ''}${invalid(f) ? ' invalid' : ''}`}>
              {isKit ? (
                <>
                  <span className="label">
                    {f.label}
                    {f.required && <em className="req">*</em>}
                  </span>
                  {kit(f)}
                  {invalid(f) ? (
                    <span className="err">Champ requis</span>
                  ) : (
                    f.hint && <span className="hint">{f.hint}</span>
                  )}
                </>
              ) : (
                material(f)
              )}
            </div>
          );
        })}
        <div className="actions wide">
          <Button type="button" onClick={reset} disabled={disabled}>
            Réinitialiser
          </Button>
          <Button type="submit" variant="contained" disableElevation disabled={disabled}>
            <MaterialIcon name="send" />
            {b.submitLabel ?? 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
