'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
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
  /**
   * When true, allows entering values not in the options list.
   * When false (default), only allows selecting from the options.
   */
  allowFreeform?: boolean;
  /**
   * Number of items to show initially and load on scroll
   */
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
    // Pre-populate search with current value for easy filtering
    if (value && !selectedOption) {
      setSearchQuery(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowFreeform && searchQuery.trim()) {
      // Allow Enter to confirm the typed value when in freeform mode
      onChange(searchQuery.trim());
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Load more when user scrolls to within 50px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setDisplayCount((prev) => Math.min(prev + pageSize, filteredOptions.length));
    }
  }, [hasMore, filteredOptions.length, pageSize]);

  // Format token count for display
  const formatTokens = (tokens: number | null | undefined): string => {
    if (!tokens) return '';
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  // Build token info string
  const getTokenInfo = (option: SearchableDropdownOption): string => {
    const parts: string[] = [];
    if (option.contextLength) {
      parts.push(`Context: ${formatTokens(option.contextLength)}`);
    }
    if (option.maxCompletionTokens) {
      parts.push(`Max: ${formatTokens(option.maxCompletionTokens)}`);
    }
    return parts.join(' | ');
  };

  // Determine what to display in the input
  const inputValue = isOpen ? searchQuery : value;
  const displayPlaceholder = isOpen
    ? searchPlaceholder || t('common.search')
    : placeholder || t('settings.llmConfiguration.modelLabel');

  return (
    <div className={`space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-white/70 block">
          {label}
        </label>
      )}

      {description && <p className="text-sm text-gray-600 dark:text-white/50">{description}</p>}

      <div className="relative">
        {/* Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            disabled={disabled}
            className="w-full rounded-full border border-gray-300 bg-white px-5 py-3 pr-20 font-mono text-sm text-gray-900 transition-all duration-200 ease-out placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-[#050505]"
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-white/10"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-white/60" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-white/10"
              aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-white/60 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-gray-200 bg-white shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#0A0A0A]/95 dark:shadow-2xl dark:shadow-black/60 dark:backdrop-blur-2xl overflow-hidden">
            {/* Options List */}
            <div
              ref={listRef}
              className="max-h-64 overflow-y-auto"
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-white/50 font-mono text-sm">
                  {loadingText || t('common.loading')}
                </div>
              ) : filteredOptions.length === 0 ? (
                allowFreeform && searchQuery.trim() ? (
                  <button
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="w-full px-4 py-3 text-left font-mono transition-colors duration-150 border-b border-gray-200 last:border-b-0 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-white/50">{t('common.useCustomValue')}:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{searchQuery.trim()}</span>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-white/50 font-mono text-sm">
                    {emptyText || t('common.noResults')}
                  </div>
                )
              ) : (
                <>
                  {allowFreeform && searchQuery.trim() && !filteredOptions.some((opt) => opt.id === searchQuery.trim()) && (
                    <button
                      onClick={() => handleSelect(searchQuery.trim())}
                      className="w-full px-4 py-3 text-left font-mono transition-colors duration-150 border-b border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-white/50">{t('common.useCustomValue')}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{searchQuery.trim()}</span>
                      </div>
                    </button>
                  )}
                  {displayedOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`w-full px-4 py-3 text-left font-mono transition-colors duration-150 border-b border-gray-200 last:border-b-0 dark:border-white/10 ${
                        option.id === value
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50 dark:bg-transparent dark:text-white/80 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{option.label}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-80 font-mono truncate">{option.id}</span>
                          </div>
                          {/* Token info */}
                          {getTokenInfo(option) && (
                            <div
                              className={`text-xs mt-1 font-mono ${
                                option.id === value
                                  ? 'text-indigo-700/80 dark:text-white/80'
                                  : 'text-gray-500 dark:text-white/50'
                              }`}
                            >
                              {getTokenInfo(option)}
                            </div>
                          )}
                        </div>
                        {option.id === value && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mt-0.5 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                  {/* Loading indicator for more items */}
                  {hasMore && (
                    <div className="px-4 py-2 text-center text-gray-500 dark:text-white/40 font-mono text-xs border-b border-gray-200 dark:border-white/10">
                      Scroll for more... ({displayedOptions.length} / {filteredOptions.length})
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show selected option details if available */}
      {selectedOption && (
        <ModelInfoCard
          label="Selected Model"
          value={selectedOption.id}
          description={selectedOption.description}
          contextLength={selectedOption.contextLength}
          maxCompletionTokens={selectedOption.maxCompletionTokens}
        />
      )}
    </div>
  );
}
