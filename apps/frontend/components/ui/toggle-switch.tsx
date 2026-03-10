'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

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
        'flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300',
        checked ? 'bg-indigo-600/10 border-indigo-500/20 shadow-lg shadow-indigo-500/10' : '',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex-1 mr-4">
        <div id={labelId} className="font-semibold text-sm tracking-tight text-white mb-1">
          {label}
        </div>
        {description && <div className="text-xs text-white/40 leading-relaxed">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full',
          'border border-white/10 transition-colors duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
          'disabled:cursor-not-allowed',
          checked ? 'bg-indigo-600 border-indigo-400/50' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full shadow-md bg-white border border-black/10',
            'transition-transform duration-300 ease-out',
            checked ? 'translate-x-[22px]' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
};
