import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
  variant?: 'default' | 'sparkle' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingAnimation({
  message = 'Loading...',
  variant = 'default',
  size = 'md',
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'sparkle') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="relative">
          {/* Rotating gradient circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50 animate-spin-slow" />

          {/* Center icon */}
          <div
            className={`relative ${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl animate-spin`}
          >
            <Sparkles className="w-1/2 h-1/2 text-white" />
          </div>
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-medium text-slate-600 animate-pulse`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="relative flex items-center justify-center">
          {/* Pulsing rings */}
          <div
            className={`absolute ${sizeClasses[size]} rounded-full border-4 border-indigo-500 animate-ping opacity-75`}
          />
          <div
            className={`absolute ${sizeClasses[size]} rounded-full border-4 border-indigo-400 animate-ping opacity-50`}
            style={{ animationDelay: '0.4s' }}
          />
          <div
            className={`absolute ${sizeClasses[size]} rounded-full border-4 border-indigo-300 animate-ping opacity-25`}
            style={{ animationDelay: '0.8s' }}
          />

          {/* Center dot */}
          <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg animate-pulse`}
          />
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-medium text-slate-600 mt-8`}>{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-bounce" />
          <div
            className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-bounce"
            style={{ animationDelay: '0.15s' }}
          />
          <div
            className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-bounce"
            style={{ animationDelay: '0.3s' }}
          />
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-medium text-slate-600`}>{message}</p>
        )}
      </div>
    );
  }

  // Default variant - spinning loader
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <Loader2 className={`${sizeClasses[size]} text-indigo-600 animate-spin`} />

      {message && (
        <p className={`${textSizeClasses[size]} font-medium text-slate-600 animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Full-screen loading overlay
export function LoadingOverlay({
  message = 'Loading...',
  variant = 'sparkle',
}: Omit<LoadingAnimationProps, 'size'>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-8 animate-in zoom-in-95 duration-300">
        <LoadingAnimation message={message} variant={variant} size="lg" />
      </div>
    </div>
  );
}

// Inline loading state for sections
export function LoadingSection({
  message = 'Loading...',
  variant = 'dots',
  className = '',
}: LoadingAnimationProps & { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingAnimation message={message} variant={variant} size="md" />
    </div>
  );
}
