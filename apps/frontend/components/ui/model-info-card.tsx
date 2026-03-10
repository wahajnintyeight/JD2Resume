'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ModelInfoCardProps {
  label: string;
  value: string;
  description?: string | null;
  contextLength?: number | null;
  maxCompletionTokens?: number | null;
  className?: string;
}

export function ModelInfoCard({
  label,
  value,
  description,
  contextLength,
  maxCompletionTokens,
  className = '',
}: ModelInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Build token info
  const hasTokenInfo = contextLength || maxCompletionTokens;
  const tokenInfo = [
    contextLength && `Context: ${formatTokens(contextLength)}`,
    maxCompletionTokens && `Max: ${formatTokens(maxCompletionTokens)}`,
  ]
    .filter(Boolean)
    .join(' | ');

  // Truncate description for preview
  const shouldTruncate = description && description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded
    ? `${description.slice(0, 150)}...`
    : description;

  return (
    <div
      className={`mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {/* Header with label and token info */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-white/70 font-mono">
            {label}
          </span>
        </div>
        {hasTokenInfo && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 dark:text-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20">
            <span>{tokenInfo}</span>
          </div>
        )}
      </div>

      {/* Model ID */}
      <p className="font-mono text-sm text-gray-900 dark:text-white font-semibold break-all mb-2">
        {value}
      </p>

      {/* Description */}
      {description && (
        <div className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
          <p className={!isExpanded ? 'line-clamp-3' : ''}>{displayDescription}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-700 transition-colors dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
