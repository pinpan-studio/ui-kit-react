import type { ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import './kit-stepper.scss';

export interface KitStep {
  label: string;
  /** Étape validée : icône « edit » (éditable) ou « done » (state="done"). */
  completed?: boolean;
  state?: 'edit' | 'done';
  content?: ReactNode;
}

/** Stepper M3 (rendu mat-stepper) : en-têtes 72px, pastilles 24px, lignes outline. */
export function KitStepper({
  steps,
  active,
  onSelect,
  orientation = 'horizontal',
  linear,
  children,
}: {
  steps: KitStep[];
  active: number;
  onSelect?: (i: number) => void;
  orientation?: 'horizontal' | 'vertical';
  linear?: boolean;
  children?: ReactNode;
}) {
  const header = (s: KitStep, i: number) => {
    const selected = i === active;
    const done = !!s.completed && !selected;
    const blocked = linear && i > active && !steps.slice(0, i).every((x) => x.completed);
    return (
      <button
        key={`h${i}`}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-disabled={blocked || undefined}
        className={`mat-step-header mat-${orientation}-stepper-header${selected ? ' selected' : ''}`}
        onClick={() => !blocked && onSelect?.(i)}
      >
        <span className={`mat-step-icon${selected || done ? ' mat-step-icon-selected' : ''}`}>
          {done ? <MaterialIcon name={s.state === 'done' ? 'done' : 'create'} /> : i + 1}
        </span>
        <span className={`mat-step-label${selected ? ' mat-step-label-selected' : ''}`}>{s.label}</span>
      </button>
    );
  };
  if (orientation === 'vertical') {
    return (
      <div className="kit-stepper mat-stepper-vertical" role="tablist" aria-orientation="vertical">
        {steps.map((s, i) => (
          <div className="mat-step" key={s.label}>
            {header(s, i)}
            <div
              className={`mat-vertical-content-container${i < steps.length - 1 ? ' mat-stepper-vertical-line' : ''}`}
            >
              {i === active && <div className="mat-vertical-content">{s.content}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="kit-stepper mat-stepper-horizontal">
      <div className="mat-horizontal-stepper-header-container" role="tablist">
        {steps.map((s, i) => [
          header(s, i),
          i < steps.length - 1 ? <div key={`l${i}`} className="mat-stepper-horizontal-line" /> : null,
        ])}
      </div>
      <div className="mat-horizontal-content-container" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
