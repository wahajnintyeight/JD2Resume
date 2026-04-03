import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Modern Design Button Component
 *
 * Design Principles:
 * - Soft rounded corners (rounded-xl)
 * - Layered, soft shadows for depth
 * - Vibrant colors with subtle gradients
 * - Micro-interactions (hover scale, active press)
 * - Clean sans-serif typography
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'whitespace-nowrap text-sm font-semibold font-sans tracking-tight',
      'transition-all duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      'rounded-xl select-none'
    );

    const variants = {
      // Modern Indigo/Blue Gradient
      default: cn(
        'bg-primary text-primary-foreground',
        'bg-gradient-to-b from-primary/100 to-primary/90',
        'shadow-[0_4px_12px_rgba(29,78,216,0.25)]',
        'hover:from-primary/95 hover:to-primary/85 hover:shadow-[0_6px_16px_rgba(29,78,216,0.3)]',
        'hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]'
      ),

      // Soft Red
      destructive: cn(
        'bg-destructive text-destructive-foreground',
        'shadow-[0_4px_12px_rgba(220,38,38,0.2)]',
        'hover:bg-destructive/90 hover:shadow-[0_6px_16px_rgba(220,38,38,0.25)]',
        'hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]'
      ),

      // Modern Green
      success: cn(
        'bg-green-600 text-white',
        'shadow-[0_4px_12px_rgba(22,163,74,0.2)]',
        'hover:bg-green-700 hover:shadow-[0_6px_16px_rgba(22,163,74,0.25)]',
        'hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]'
      ),

      // Modern Orange
      warning: cn(
        'bg-amber-500 text-white',
        'shadow-[0_4px_12px_rgba(245,158,11,0.2)]',
        'hover:bg-amber-600 hover:shadow-[0_6px_16px_rgba(245,158,11,0.25)]',
        'hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]'
      ),

      // Glassy/Outline
      outline: cn(
        'bg-transparent text-foreground',
        'border-2 border-border',
        'hover:bg-accent hover:text-accent-foreground',
        'hover:border-primary/30',
        'active:scale-[0.98]'
      ),

      // Soft Grey
      secondary: cn(
        'bg-secondary text-secondary-foreground',
        'shadow-sm hover:bg-secondary/80',
        'active:scale-[0.98]'
      ),

      // Ghostly
      ghost: cn(
        'bg-transparent text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'active:scale-[0.95]'
      ),

      // Minimal Link
      link: cn(
        'bg-transparent text-primary p-0 h-auto underline-offset-4 hover:underline'
      ),
    };

    const sizes = {
      default: 'h-11 px-6 py-2',
      sm: 'h-9 px-4 py-1 text-xs',
      lg: 'h-14 px-10 py-3 text-base',
      icon: 'h-11 w-11 p-0',
    };

    const variantClass = variants[variant];
    const sizeClass = sizes[size];

    return (
      <button ref={ref} className={cn(baseStyles, variantClass, sizeClass, className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button };
