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
  ].filter(Boolean).join(' | ');

  // Truncate description for preview
  const shouldTruncate = description && description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded
    ? `${description.slice(0, 150)}...`
    : description;

  return (
    <div className={`mt-3 rounded border-2 border-black bg-[#F0F0E8] p-3 ${className}`}>
      {/* Header with label and token info */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
            {label}
          </span>
        </div>
        {hasTokenInfo && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            <span>{tokenInfo}</span>
          </div>
        )}
      </div>

      {/* Model ID */}
      <p className="font-mono text-sm text-black font-semibold break-all mb-2">
        {value}
      </p>

      {/* Description */}
      {description && (
        <div className="text-sm text-gray-600 leading-relaxed">
          <p className={!isExpanded ? 'line-clamp-3' : ''}>
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs font-mono text-blue-600 hover:text-blue-700 transition-colors"
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
