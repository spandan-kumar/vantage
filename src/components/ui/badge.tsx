import * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: 'bg-theme-accent/10 text-theme-accent border-theme-accent/20',
  secondary: 'bg-theme-bg text-theme-text-main border-theme-border',
  outline: 'bg-transparent text-theme-text-main border-theme-border',
  success: 'bg-theme-success text-white border-theme-success',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  destructive: 'bg-red-100 text-red-800 border-red-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
