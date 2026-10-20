import { ClickAwayListener, IconButton, Popper } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { formatTime, parseTime } from './dateUtils';

/** matTimepicker dans une field-box : liste d'heures à intervalle fixe (panneau .mat-timepicker-panel). */
export function FieldBoxTime({
  value,
  onChange,
  intervalMin = 15,
  placeholder = 'HH:MM',
  icon = 'schedule',
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  intervalMin?: number;
  placeholder?: string;
  icon?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(formatTime(value));
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setText(formatTime(value));
  }
  const opts = useMemo(() => {
    const b = value ?? new Date();
    return Array.from(
      { length: (24 * 60) / intervalMin },
      (_, i) => new Date(b.getFullYear(), b.getMonth(), b.getDate(), 0, i * intervalMin),
    );
  }, [value, intervalMin]);
  const sel = formatTime(value);
  return (
    <div className="field-box">
      <MaterialIcon name={icon} />
      <input
        ref={input}
        value={text}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        onChange={(e) => {
          setText(e.target.value);
          const d = parseTime(e.target.value, value);
          if (d) {
            setLast(d);
            onChange(d);
          }
        }}
        onBlur={() => setText(formatTime(last))}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      <IconButton type="button" onClick={() => setOpen((o) => !o)} aria-label="Choisir une heure">
        <MaterialIcon name="expand_more" />
      </IconButton>
      <Popper
        className="cdk-overlay-pane"
        open={open && !!input.current}
        anchorEl={input.current}
        placement="bottom-start"
        style={{ zIndex: 1300, width: input.current?.offsetWidth }}
        modifiers={[{ name: 'flip', options: { fallbackPlacements: ['top-start'] } }]}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!(e.target instanceof Node && input.current?.parentElement?.contains(e.target))) setOpen(false);
          }}
        >
          <div
            className="mat-timepicker-panel"
            role="listbox"
            ref={(el) => {
              const s = el?.querySelector<HTMLElement>('.mdc-list-item--selected');
              if (s && el) el.scrollTop = s.offsetTop - el.clientHeight / 2 + s.offsetHeight / 2;
            }}
          >
            {opts.map((o) => {
              const l = formatTime(o);
              return (
                <div
                  key={l}
                  role="option"
                  aria-selected={l === sel}
                  className={`mat-mdc-option mdc-list-item${l === sel ? ' mdc-list-item--selected' : ''}`}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  <span className="mdc-list-item__primary-text">{l}</span>
                </div>
              );
            })}
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
