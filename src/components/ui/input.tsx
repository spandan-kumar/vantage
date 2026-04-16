import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'h-10 w-full rounded-md border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text-main placeholder:text-theme-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/25 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = 'Input';
