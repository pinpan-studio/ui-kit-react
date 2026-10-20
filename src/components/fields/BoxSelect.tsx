import { MatSelect } from '../forms/MatSelect';
import './box-select.scss';

export interface BoxOption<V> {
  value: V;
  label: string;
}

/** mat-select dans une .field-box.select-box (déclencheur Inter 14/500, panneau m3-dropdown-menu). */
export function BoxSelect<V extends string | number>({
  value,
  onChange,
  options,
  multiple,
  placeholder,
  disabled,
  ariaLabel,
  onBlur,
}: {
  value: V | V[] | '' | null;
  onChange: (v: V & V[]) => void;
  options: BoxOption<V>[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onBlur?: () => void;
}) {
  const byKey = new Map(options.map((o) => [String(o.value), o.value]));
  return (
    <MatSelect
      aria-label={ariaLabel ?? placeholder}
      options={options.map((o) => ({ value: String(o.value), label: o.label }))}
      value={Array.isArray(value) ? value.map(String) : value == null || value === '' ? null : String(value)}
      multiple={multiple}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={onBlur}
      onChange={(v) => onChange((Array.isArray(v) ? v.map((k) => byKey.get(k)) : byKey.get(v)) as V & V[])}
    />
  );
}
