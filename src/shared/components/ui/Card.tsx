import type { ReactElement, ReactNode } from 'react';

export type CardVariant = 'default' | 'inset';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border-[var(--divider-section)] bg-[var(--color-surface)]',
  inset: 'border-[var(--divider-item)] bg-[var(--color-surface-inset)]',
};

export default function Card({ children, className, variant = 'default' }: CardProps): ReactElement {
  return (
    <div
      className={[
        'rounded-[var(--radius-surface)] border',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
