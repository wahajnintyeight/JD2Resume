'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Swiss International Style Toggle Switch Component
 *
 * Design Principles:
 * - Square corners (rounded-none on container, pill shape for toggle)
 * - High contrast states
 * - Clear label and description
 */

export interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  const labelId = React.useId();

  const handleToggle = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] rounded-xl',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex-1 mr-4">
        <div id={labelId} className="font-bold text-sm text-slate-900 dark:text-white">
          {label}
        </div>
        {description && <div className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'border-2 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          checked 
            ? 'bg-indigo-600 border-indigo-600' 
            : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
};
