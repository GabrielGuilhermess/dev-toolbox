import { LoaderCircle } from 'lucide-react';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors duration-[var(--motion-fast)] disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary-action)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--divider-section)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost: 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
  outline:
    'border border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]',
  icon: 'border border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-primary)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  xl: 'h-12 px-6 text-base',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
  xl: 'h-12 w-12',
};

function ButtonComponent(
  {
    children,
    className,
    disabled,
    loading = false,
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...buttonProps
  }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
): ReactElement {
  const isDisabled = disabled || loading;
  const isIcon = variant === 'icon';
  const buttonClassName = [
    baseClasses,
    variantClasses[variant],
    isIcon ? iconSizeClasses[size] : sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...buttonProps}
      aria-busy={loading || undefined}
      className={buttonClassName}
      data-size={size}
      data-variant={variant}
      disabled={isDisabled}
      ref={ref}
      type={type}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
      {loading && children === undefined ? 'Carregando...' : null}
    </button>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonComponent);

Button.displayName = 'Button';

export default Button;
