import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Refined Button Component
 *
 * Design Principles:
 * - Softer 2026-inspired radii
 * - Layered glassy highlights and atmospheric shadows
 * - Smooth hover lift and press feedback
 * - Premium, less robotic visual treatment
 * - Clear accessibility and focus states
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
      'relative inline-flex items-center justify-center gap-2 overflow-hidden',
      'whitespace-nowrap font-sans text-sm font-semibold tracking-[-0.015em]',
      'select-none rounded-[1.15rem]',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-white',
      'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
      "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:rounded-full before:bg-white/60 before:content-['']"
    );

    const variants = {
      default: cn(
        'border border-transparent text-primary-foreground',
        'bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_55%,#8b5cf6_100%)]',
        'shadow-[0_18px_40px_rgba(79,70,229,0.24)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(79,70,229,0.32)] hover:saturate-[1.06]',
        'active:translate-y-0 active:scale-[0.985] active:shadow-[0_12px_24px_rgba(79,70,229,0.2)]'
      ),

      destructive: cn(
        'border border-rose-200/70 text-white',
        'bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_55%,#e11d48_100%)]',
        'shadow-[0_18px_40px_rgba(244,63,94,0.22)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(244,63,94,0.28)]',
        'active:translate-y-0 active:scale-[0.985]'
      ),

      success: cn(
        'border border-emerald-200/70 text-white',
        'bg-[linear-gradient(135deg,#34d399_0%,#10b981_55%,#059669_100%)]',
        'shadow-[0_18px_40px_rgba(16,185,129,0.2)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(16,185,129,0.26)]',
        'active:translate-y-0 active:scale-[0.985]'
      ),

      warning: cn(
        'border border-amber-200/80 text-white',
        'bg-[linear-gradient(135deg,#fbbf24_0%,#f59e0b_55%,#ea580c_100%)]',
        'shadow-[0_18px_40px_rgba(245,158,11,0.22)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(245,158,11,0.28)]',
        'active:translate-y-0 active:scale-[0.985]'
      ),

      outline: cn(
        'border border-white/75 bg-white/72 text-slate-700 backdrop-blur-xl',
        'shadow-[0_12px_28px_rgba(15,23,42,0.06)]',
        'hover:-translate-y-0.5 hover:border-white hover:bg-white/90 hover:text-slate-950 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]',
        'active:scale-[0.985]'
      ),

      secondary: cn(
        'border border-white/65 bg-slate-100/90 text-slate-700',
        'shadow-[0_10px_24px_rgba(15,23,42,0.05)]',
        'hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]',
        'active:scale-[0.985]'
      ),

      ghost: cn(
        'border border-transparent bg-transparent text-slate-700 shadow-none before:hidden',
        'hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/70 hover:text-slate-950 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]',
        'active:scale-[0.98]'
      ),

      link: cn(
        'h-auto rounded-none border-none bg-transparent p-0 text-primary shadow-none before:hidden',
        'hover:text-primary/80 hover:underline underline-offset-4',
        'active:scale-100'
      ),
    };

    const sizes = {
      default: 'h-11 px-6 py-2.5',
      sm: 'h-9 px-4 py-2 text-xs rounded-[1rem]',
      lg: 'h-14 px-10 py-3 text-base rounded-[1.35rem]',
      icon: 'h-11 w-11 p-0 rounded-[1.1rem]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
