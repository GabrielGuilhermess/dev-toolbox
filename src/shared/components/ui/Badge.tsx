import type { ReactElement, ReactNode } from 'react';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const badgeClasses: Record<BadgeVariant, string> = {
  success:
    'border-emerald-300 bg-emerald-500/20 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300',
  error:
    'border-rose-300 bg-rose-500/20 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300',
  warning:
    'border-amber-300 bg-amber-500/20 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'border-sky-300 bg-sky-500/20 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300',
  neutral:
    'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
};

export default function Badge({ variant = 'info', children, className }: BadgeProps): ReactElement {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        badgeClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
    >
      {children}
    </span>
  );
}
