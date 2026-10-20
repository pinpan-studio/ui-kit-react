import type { ComponentProps, FormEvent } from 'react';
import { formatMask, maskPlaceholder } from './inputMask';

/** input[appInputMask] : la valeur exposée est la valeur masquée. */
export function MaskedInput({
  mask,
  value,
  onValueChange,
  placeholder,
  ...rest
}: { mask: string; value: string; onValueChange: (v: string) => void } & Omit<
  ComponentProps<'input'>,
  'value' | 'onChange'
>) {
  const onInput = (e: FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const formatted = formatMask(mask, input.value);
    if (formatted !== input.value) {
      const pos = Math.min(formatMask(mask, input.value.slice(0, caret)).length, formatted.length);
      input.value = formatted;
      input.setSelectionRange(pos, pos);
    }
    onValueChange(formatted);
  };
  return <input {...rest} value={value} onChange={onInput} placeholder={placeholder || maskPlaceholder(mask)} />;
}
