import { Checkbox, ListItemText, MenuItem, Select } from '@mui/material';
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
}: {
  value: V | V[] | '';
  onChange: (v: V & V[]) => void;
  options: BoxOption<V>[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Select
      variant="standard"
      disableUnderline
      className="kit-box-select"
      value={value}
      multiple={multiple}
      disabled={disabled}
      displayEmpty={!!placeholder}
      inputProps={{ 'aria-label': ariaLabel ?? placeholder }}
      onChange={(e) => onChange(e.target.value as V & V[])}
      MenuProps={{ className: 'm3-dropdown-menu' }}
      renderValue={(v) => {
        const list = ([] as V[]).concat(v as V | V[]).filter((x) => x !== ('' as V));
        if (!list.length) return <span className="kit-box-select-placeholder">{placeholder}</span>;
        return list.map((x) => options.find((o) => o.value === x)?.label ?? String(x)).join(', ');
      }}
    >
      {options.map((o) => (
        <MenuItem key={String(o.value)} value={o.value}>
          {multiple && <Checkbox size="small" checked={Array.isArray(value) && value.includes(o.value)} />}
          {multiple ? <ListItemText primary={o.label} /> : o.label}
        </MenuItem>
      ))}
    </Select>
  );
}
