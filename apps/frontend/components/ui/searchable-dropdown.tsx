'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ModelInfoCard } from './model-info-card';

export interface SearchableDropdownOption {
  id: string;
  label: string;
  description?: string;
  contextLength?: number | null;
  maxCompletionTokens?: number | null;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  allowFreeform?: boolean;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 15;

/**
 * Modern Searchable Dropdown Component
 * 
 * Design Principles:
 * - Soft rounded corners (rounded-2xl)
 * - Subtle layered shadows
 * - Sans-serif typography (font-sans)
 * - Glassmorphism effects (backdrop-blur)
 * - Clean, modern, non-retro look
 */
export function SearchableDropdown({
  options,
  value,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  placeholder,
  searchPlaceholder,
  loading = false,
  loadingText,
  emptyText,
  allowFreeform = false,
  pageSize = DEFAULT_PAGE_SIZE,
}: SearchableDropdownProps) {
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(pageSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.id.toLowerCase().includes(query) ||
        (opt.description?.toLowerCase().includes(query) ?? false)
    );
  }, [options, searchQuery]);

  // Get the paginated options to display
  const displayedOptions = useMemo(() => {
    return filteredOptions.slice(0, displayCount);
  }, [filteredOptions, displayCount]);

  // Check if there are more items to load
  const hasMore = filteredOptions.length > displayCount;

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [searchQuery, pageSize]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
    setDisplayCount(pageSize);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setDisplayCount(pageSize);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (allowFreeform) {
      onChange(newValue);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (value && !selectedOption) {
      setSearchQuery(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowFreeform && searchQuery.trim()) {
      onChange(searchQuery.trim());
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setDisplayCount((prev) => Math.min(prev + pageSize, filteredOptions.length));
    }
  }, [hasMore, filteredOptions.length, pageSize]);

  const formatTokens = (tokens: number | null | undefined): string => {
    if (!tokens) return '';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  };

  const getTokenInfo = (option: SearchableDropdownOption): string => {
    const parts: string[] = [];
    if (option.contextLength) parts.push(`${formatTokens(option.contextLength)} ctx`);
    if (option.maxCompletionTokens) parts.push(`${formatTokens(option.maxCompletionTokens)} max`);
    return parts.join(' • ');
  };

  const inputValue = isOpen ? searchQuery : (selectedOption?.label || value);
  const displayPlaceholder = isOpen
    ? searchPlaceholder || t('common.search')
    : placeholder || t('settings.llmConfiguration.modelLabel');

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="font-sans text-sm font-semibold tracking-tight text-slate-900 block px-1">
          {label}
        </label>
      )}

      {description && (
        <p className="text-xs text-slate-500 font-medium px-1 leading-relaxed">
          {description}
        </p>
      )}

      <div className="relative">
        <div className="relative group">
          <div className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300',
            isOpen ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'
          )}>
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            disabled={disabled}
            className={cn(
              'w-full bg-white pl-11 pr-24 py-3.5 font-sans text-sm transition-all duration-300 ease-in-out border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md focus:shadow-md focus:border-primary/40 focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm outline-none',
              isOpen && 'border-primary/40 ring-4 ring-primary/5 shadow-md'
            )}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all',
                isOpen && 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', isOpen && 'rotate-180')} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div 
              ref={listRef}
              className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar"
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="px-4 py-12 text-center flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-400 font-sans text-sm font-medium italic">
                    {loadingText || t('common.loading')}
                  </span>
                </div>
              ) : filteredOptions.length === 0 ? (
                allowFreeform && searchQuery.trim() ? (
                  <button
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="w-full text-left px-4 py-4 rounded-2xl transition-all duration-200 hover:bg-slate-50 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t('common.useCustomValue')}</span>
                      <span className="font-bold text-slate-900 text-sm">{searchQuery.trim()}</span>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-12 text-center text-slate-400 font-sans text-sm italic">
                    {emptyText || t('common.noResults')}
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  {displayedOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 group relative flex items-center justify-between',
                        option.id === value 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-primary'
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className={cn(
                          'font-bold text-sm truncate tracking-tight',
                          option.id === value ? 'text-white' : 'text-slate-900 group-hover:text-primary'
                        )}>
                          {option.label}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            'text-[10px] font-bold uppercase tracking-wider',
                            option.id === value ? 'text-white/60' : 'text-slate-400'
                          )}>
                            {option.id}
                          </span>
                          {getTokenInfo(option) && (
                            <>
                              <span className={cn('w-1 h-1 rounded-full', option.id === value ? 'bg-white/20' : 'bg-slate-200')} />
                              <span className={cn(
                                'text-[10px] font-medium',
                                option.id === value ? 'text-white/80' : 'text-slate-500'
                              )}>
                                {getTokenInfo(option)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {option.id === value && (
                        <Check className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>
                  ))}
                  {hasMore && (
                    <div className="px-4 py-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {t('common.scrollMore')} ({displayedOptions.length} / {filteredOptions.length})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOption && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <ModelInfoCard
            label="Selected Model"
            value={selectedOption.id}
            description={selectedOption.description}
            contextLength={selectedOption.contextLength}
            maxCompletionTokens={selectedOption.maxCompletionTokens}
          />
        </div>
      )}
    </div>
  );
}
