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

  const displayedOptions = useMemo(
    () => filteredOptions.slice(0, displayCount),
    [filteredOptions, displayCount]
  );

  const hasMore = filteredOptions.length > displayCount;

  useEffect(() => {
    setDisplayCount(pageSize);
  }, [searchQuery, pageSize]);

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
  }, [filteredOptions.length, hasMore, pageSize]);

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

  const inputValue = isOpen ? searchQuery : selectedOption?.label || value;
  const displayPlaceholder = isOpen
    ? searchPlaceholder || t('common.search')
    : placeholder || t('settings.llmConfiguration.modelLabel');

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="block px-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}

      {description && (
        <p className="px-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      )}

      <div className="relative">
        <div className="group relative">
          <div
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 transition-colors',
              isOpen
                ? 'text-violet-600 dark:text-violet-300'
                : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300'
            )}
          >
            <Search className="h-4 w-4" />
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
              'w-full rounded-2xl border px-11 py-3.5 pr-24 text-sm font-medium outline-none transition-all',
              'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
              'hover:border-violet-300/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10',
              'dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500',
              'dark:hover:border-violet-300/30 dark:focus:border-violet-300/40 dark:focus:ring-violet-300/10',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isOpen && 'border-violet-400 ring-4 ring-violet-500/10 dark:border-violet-300/40'
            )}
            autoComplete="off"
          />

          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-white/10" />

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'rounded-xl p-1.5 transition-all',
                'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                'dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300',
                isOpen &&
                  'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20'
              )}
              aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div
            className={cn(
              'absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border',
              'border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]',
              'dark:border-white/10 dark:bg-[#0b1020] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]'
            )}
          >
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar"
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent dark:border-violet-300 dark:border-t-transparent" />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {loadingText || t('common.loading')}
                  </span>
                </div>
              ) : filteredOptions.length === 0 ? (
                allowFreeform && searchQuery.trim() ? (
                  <button
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700 transition-transform group-hover:scale-105 dark:bg-violet-500/10 dark:text-violet-300">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {t('common.useCustomValue')}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {searchQuery.trim()}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {emptyText || t('common.noResults')}
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  {displayedOptions.map((option) => {
                    const isSelected = option.id === value;
                    const tokenInfo = getTokenInfo(option);

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={cn(
                          'relative flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all',
                          isSelected
                            ? 'bg-violet-600 text-white dark:bg-violet-500/20'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div
                            className={cn(
                              'truncate text-sm font-semibold',
                              isSelected
                                ? 'text-white dark:text-violet-100'
                                : 'text-slate-900 dark:text-white'
                            )}
                          >
                            {option.label}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[10px] uppercase tracking-[0.2em]',
                                isSelected
                                  ? 'text-violet-100/80 dark:text-violet-200/80'
                                  : 'text-slate-500 dark:text-slate-500'
                              )}
                            >
                              {option.id}
                            </span>

                            {tokenInfo && (
                              <>
                                <span
                                  className={cn(
                                    'h-1 w-1 rounded-full',
                                    isSelected
                                      ? 'bg-violet-100/70 dark:bg-violet-200/70'
                                      : 'bg-slate-300 dark:bg-slate-600'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'text-[10px]',
                                    isSelected
                                      ? 'text-violet-100/90 dark:text-violet-200/90'
                                      : 'text-slate-500 dark:text-slate-400'
                                  )}
                                >
                                  {tokenInfo}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-white dark:text-violet-100" />
                        )}
                      </button>
                    );
                  })}

                  {hasMore && (
                    <div className="px-4 py-3 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {t('common.scrollMore')} ({displayedOptions.length} /{' '}
                        {filteredOptions.length})
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
        <div className="mt-4">
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
