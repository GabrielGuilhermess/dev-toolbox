import {
  forwardRef,
  useId,
  type ForwardedRef,
  type ReactElement,
  type SelectHTMLAttributes,
} from 'react';
import { inputBaseClasses } from '@/shared/components/ui/Input';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  controlSize?: 'md' | 'lg';
}

function SelectComponent(
  {
    'aria-describedby': ariaDescribedBy,
    className,
    controlSize = 'lg',
    error,
    id,
    label,
    options,
    ...selectProps
  }: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>,
): ReactElement {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label className="text-sm font-medium text-[var(--color-text)]" htmlFor={selectId}>
          {label}
        </label>
      ) : null}

      <select
        {...selectProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={[
          inputBaseClasses,
          controlSize === 'lg' ? 'h-11' : 'h-10',
          'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        id={selectId}
        ref={ref}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(SelectComponent);

Select.displayName = 'Select';

export default Select;
