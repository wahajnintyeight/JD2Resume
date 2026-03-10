import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Dark Luxury Style Button Component
 *
 * Design Principles:
 * - Rounded corners (pill-shaped)
 * - Subtle glassmorphism and glows
 * - High-quality typography (tracking-tight)
 * - Smooth transitions and scale effects
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
      'whitespace-nowrap text-sm font-semibold tracking-tight',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-95',
      '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0',
      'rounded-full'
    );

    const variants = {
      // PRIMARY - Indigo Glow
      default: cn(
        'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
        'hover:bg-indigo-500 hover:shadow-indigo-500/40',
        'border border-indigo-400/20'
      ),

      // DESTRUCTIVE - Muted Red
      destructive: cn(
        'bg-red-500/10 text-red-400 border border-red-500/20',
        'hover:bg-red-500/20 hover:border-red-500/40'
      ),

      // SUCCESS - Muted Emerald
      success: cn(
        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        'hover:bg-emerald-500/20 hover:border-emerald-500/40'
      ),

      // WARNING - Muted Amber
      warning: cn(
        'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        'hover:bg-amber-500/20 hover:border-amber-500/40'
      ),

      // OUTLINE - Glassy
      outline: cn(
        'bg-white/5 text-white border border-white/10 backdrop-blur-md',
        'hover:bg-white/10 hover:border-white/20'
      ),

      // SECONDARY - Darker Glass
      secondary: cn(
        'bg-white/[0.02] text-white/80 border border-white/5',
        'hover:bg-white/5 hover:text-white hover:border-white/10'
      ),

      // GHOST - Minimal
      ghost: cn(
        'bg-transparent text-white/60',
        'hover:bg-white/5 hover:text-white'
      ),

      // LINK - Underlined
      link: cn(
        'bg-transparent text-indigo-400',
        'underline-offset-4 hover:underline p-0 h-auto'
      ),
    };

    const sizes = {
      default: 'h-11 px-6 py-2',
      sm: 'h-9 px-4 py-1 text-xs',
      lg: 'h-14 px-10 py-3 text-base',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button };
