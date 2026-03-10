'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface DropdownOption {
  id: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  label,
  description,
  disabled,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-14 w-full items-center justify-between rounded-full border px-6 py-2 text-sm transition-all duration-300',
            'border-white/10 bg-white/5 text-white',
            'hover:bg-white/10 hover:border-white/20',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#050505]',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-indigo-500/50 bg-white/10'
          )}
        >
          <div className="flex flex-col items-start">
            <span className="font-semibold">{selectedOption?.label || 'Select option'}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-white/40 transition-transform duration-300',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-2 backdrop-blur-2xl shadow-2xl shadow-black"
            >
              <div className="max-h-60 overflow-y-auto no-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors',
                      'hover:bg-white/5',
                      value === option.id
                        ? 'bg-indigo-600/10 text-indigo-300'
                        : 'text-white/80'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-white/40 mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {value === option.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {description && (
        <p className="text-[10px] text-white/40 ml-4">{description}</p>
      )}
    </div>
  );
}
