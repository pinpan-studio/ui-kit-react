import { IconButton, TextField } from '@mui/material';
import { useRef, useState, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Calendar, type DateRange } from './Calendar';
import { DatePopup } from './DatePopup';
import { formatDate, parseDate } from './dateUtils';

/** Saisie texte JJ/MM/AAAA synchronisée avec une Date (comme matDatepicker + NativeDateAdapter fr-FR). */
function useDateText(value: Date | null, onChange: (d: Date | null) => void) {
  const [text, setText] = useState(formatDate(value));
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setText(formatDate(value));
  }
  return {
    value: text,
    onChange: (e: { target: { value: string } }) => {
      setText(e.target.value);
      const d = parseDate(e.target.value);
      if (d || !e.target.value) {
        setLast(d);
        onChange(d);
      }
    },
    onBlur: () => setText(formatDate(last)),
  };
}

const CalendarToggleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24px"
    height="24px"
    fill="currentColor"
    focusable="false"
    aria-hidden="true"
    className="mat-datepicker-toggle-default-icon"
  >
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
  </svg>
);

/** Date dans une field-box : input + bouton calendrier. */
export function FieldBoxDate({
  value,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  icon = 'event',
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  icon?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const t = useDateText(value, onChange);
  return (
    <div className="field-box">
      <MaterialIcon name={icon} />
      <input ref={input} {...t} placeholder={placeholder} aria-haspopup="dialog" />
      <IconButton type="button" onClick={() => setOpen((o) => !o)} aria-label="Ouvrir le calendrier">
        <MaterialIcon name="calendar_month" />
      </IconButton>
      <DatePopup anchor={input.current} open={open} onClose={() => setOpen(false)}>
        <Calendar
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </DatePopup>
    </div>
  );
}

/** mat-form-field outline + matDatepicker (bornes min/max, toggle en suffixe). */
export function OutlineDate({ label, hint, min, max }: { label: string; hint?: ReactNode; min?: Date; max?: Date }) {
  const [value, setValue] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const t = useDateText(value, setValue);
  const outOfBounds = !!value && ((!!min && value < min) || (!!max && value > max));
  return (
    <>
      <TextField
        className="kit-outline-field w-100"
        variant="outlined"
        label={label}
        helperText={hint}
        error={outOfBounds}
        autoComplete="off"
        {...t}
        slotProps={{
          input: {
            ref: root,
            endAdornment: (
              <IconButton
                className="mat-datepicker-toggle"
                onClick={() => setOpen((o) => !o)}
                aria-label="Ouvrir le calendrier"
                edge="end"
              >
                <CalendarToggleIcon />
              </IconButton>
            ),
          },
        }}
      />
      <DatePopup anchor={root.current} open={open} onClose={() => setOpen(false)}>
        <Calendar
          selected={value}
          min={min}
          max={max}
          startAt={value ?? (max && new Date() > max ? max : null)}
          onSelect={(d) => {
            setValue(d);
            setOpen(false);
          }}
        />
      </DatePopup>
    </>
  );
}

/** mat-date-range-input dans une field-box (+ mat-date-range-picker). */
export function FieldBoxDateRange({
  value,
  onChange,
  icon = 'date_range',
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  icon?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const s = useDateText(value.start, (d) => onChange({ ...value, start: d }));
  const e = useDateText(value.end, (d) => onChange({ ...value, end: d }));
  return (
    <div className="field-box">
      <MaterialIcon name={icon} />
      <div className="mat-date-range-input" ref={box}>
        <div className="mat-date-range-input-container">
          <div className="mat-date-range-input-wrapper">
            <input
              {...s}
              className="mat-start-date mat-date-range-input-inner"
              placeholder="Début"
              aria-label="Date de début"
            />
            <span className="mat-date-range-input-mirror" aria-hidden="true">
              {s.value || 'Début'}
            </span>
          </div>
          <span className="mat-date-range-input-separator">–</span>
          <div className="mat-date-range-input-wrapper mat-date-range-input-end-wrapper">
            <input
              {...e}
              className="mat-end-date mat-date-range-input-inner"
              placeholder="Fin"
              aria-label="Date de fin"
            />
            <span className="mat-date-range-input-mirror" aria-hidden="true">
              {e.value || 'Fin'}
            </span>
          </div>
        </div>
      </div>
      <IconButton type="button" onClick={() => setOpen((o) => !o)} aria-label="Ouvrir le calendrier">
        <MaterialIcon name="calendar_month" />
      </IconButton>
      <DatePopup anchor={box.current} open={open} onClose={() => setOpen(false)}>
        <Calendar
          range={value}
          onRangeChange={(r) => {
            onChange(r);
            if (r.end) setOpen(false);
          }}
        />
      </DatePopup>
    </div>
  );
}
