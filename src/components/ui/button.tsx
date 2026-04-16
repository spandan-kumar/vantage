import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    default: 'bg-theme-accent text-white hover:opacity-90',
    secondary: 'bg-theme-bg text-theme-text-main hover:bg-theme-border/60',
    outline: 'border border-theme-border bg-transparent text-theme-text-main hover:bg-theme-bg',
    ghost: 'bg-transparent text-theme-text-muted hover:text-theme-text-main hover:bg-theme-bg',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-6',
    icon: 'h-10 w-10',
  },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
