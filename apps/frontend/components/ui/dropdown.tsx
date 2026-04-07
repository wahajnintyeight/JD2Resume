'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
  placeholder?: string;
}

/**
 * Modern Dropdown Component
 *
 * Design Principles:
 * - Soft rounded corners (rounded-2xl)
 * - Subtle layered shadows
 * - Sans-serif typography (font-sans)
 * - Animated transitions
 * - Clean, non-retro aesthetic
 */
export function Dropdown({
  options,
  value,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  placeholder,
}: DropdownProps) {
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current || typeof window === 'undefined') return;

    const updateDirection = () => {
      const triggerRect = buttonRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const estimatedMenuHeight = Math.min(options.length * 72 + 16, 320) + 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      setOpenDirection(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? 'up' : 'down');
    };

    updateDirection();
    window.addEventListener('resize', updateDirection);
    window.addEventListener('scroll', updateDirection, true);

    return () => {
      window.removeEventListener('resize', updateDirection);
      window.removeEventListener('scroll', updateDirection, true);
    };
  }, [isOpen, options.length]);

  return (
    <div className={cn('space-y-3', className)} ref={containerRef}>
      {label && (
        <label className="font-serif text-lg font-black uppercase tracking-tight text-slate-900 block px-1">
          {label}
        </label>
      )}

      {description && (
        <p className="text-sm text-slate-500 font-medium px-1 leading-relaxed italic">
          {'// '}
          {description}
        </p>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between bg-white px-5 py-3.5 font-sans text-sm transition-all duration-300 ease-in-out border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm',
            isOpen && 'ring-2 ring-primary/10 border-primary/40 shadow-md'
          )}
        >
          <div className="flex-1 text-left min-w-0">
            {selectedOption ? (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 truncate">{selectedOption.label}</span>
                {selectedOption.description && (
                  <span className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                    {selectedOption.description}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-medium italic">
                {placeholder || t('common.selectOption')}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 transition-transform duration-300 ml-3 shrink-0 text-slate-400',
              isOpen && 'rotate-180 text-primary'
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={cn(
              'absolute left-0 right-0 z-[120] bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200',
              openDirection === 'down'
                ? 'top-full mt-2 origin-top'
                : 'bottom-full mb-2 origin-bottom'
            )}
          >
            <div className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 font-sans text-sm italic">
                  {t('common.noOptions')}
                </div>
              ) : (
                <div className="space-y-1">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 group relative flex items-center justify-between',
                        option.id === value
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-primary'
                      )}
                      onClick={() => handleSelect(option.id)}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div
                          className={cn(
                            'font-bold text-sm truncate tracking-tight',
                            option.id === value
                              ? 'text-white'
                              : 'text-slate-900 group-hover:text-primary'
                          )}
                        >
                          {option.label}
                        </div>
                        {option.description && (
                          <div
                            className={cn(
                              'text-[11px] mt-0.5 font-medium truncate',
                              option.id === value ? 'text-white/80' : 'text-slate-500'
                            )}
                          >
                            {option.description}
                          </div>
                        )}
                      </div>
                      {option.id === value && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
