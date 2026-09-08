import {
  forwardRef,
  useId,
  type ForwardedRef,
  type ReactElement,
  type TextareaHTMLAttributes,
} from 'react';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  label?: string;
  error?: string;
  monospace?: boolean;
  rows?: number;
}

const textareaBaseClasses =
  'w-full rounded-[var(--radius-control)] border border-[var(--divider-section)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text)] outline-none transition-colors duration-[var(--motion-fast)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] aria-[invalid=true]:border-rose-500';

const readOnlyClasses =
  'cursor-default border-[var(--divider-item)] bg-[var(--color-output-bg)] focus:border-[var(--divider-section)]';

function TextareaComponent(
  {
    'aria-describedby': ariaDescribedBy,
    className,
    error,
    id,
    label,
    monospace = false,
    readOnly = false,
    rows = 6,
    ...textareaProps
  }: TextareaProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
): ReactElement {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label className="text-sm font-medium text-[var(--color-text)]" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}

      <textarea
        {...textareaProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={[
          textareaBaseClasses,
          readOnly ? readOnlyClasses : '',
          monospace ? 'font-mono leading-6' : 'leading-6',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        id={textareaId}
        readOnly={readOnly}
        ref={ref}
        rows={rows}
      />

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(TextareaComponent);

Textarea.displayName = 'Textarea';

export default Textarea;
