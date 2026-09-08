import {
  forwardRef,
  useId,
  type ForwardedRef,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const inputBaseClasses =
  'w-full min-h-10 rounded-[var(--radius-control)] border border-[var(--divider-section)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors duration-[var(--motion-fast)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] aria-[invalid=true]:border-rose-500';

function InputComponent(
  { 'aria-describedby': ariaDescribedBy, className, error, id, label, ...inputProps }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label className="text-sm font-medium text-[var(--color-text)]" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <input
        {...inputProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={[inputBaseClasses, className].filter(Boolean).join(' ')}
        id={inputId}
        ref={ref}
      />

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const Input = forwardRef<HTMLInputElement, InputProps>(InputComponent);

Input.displayName = 'Input';

export default Input;
