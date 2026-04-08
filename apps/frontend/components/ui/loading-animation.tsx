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
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="relative">
          {/* Rotating gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 blur-2xl opacity-40 animate-spin" style={{ animationDuration: '3s' }} />

          {/* Outer rotating border */}
          <div className={`relative ${sizeClasses[size]} border-2 border-cyan-400/30 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center animate-spin`} style={{ animationDuration: '2s' }}>
            {/* Inner icon container */}
            <div className="absolute inset-1 border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-1/2 h-1/2 text-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-bold text-cyan-300 font-mono tracking-wider uppercase animate-pulse`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="relative flex items-center justify-center">
          {/* Pulsing square rings */}
          <div
            className={`absolute ${sizeClasses[size]} border-2 border-cyan-400/60 animate-ping`}
          />
          <div
            className={`absolute ${sizeClasses[size]} border-2 border-blue-400/40 animate-ping`}
            style={{ animationDelay: '0.3s' }}
          />
          <div
            className={`absolute ${sizeClasses[size]} border-2 border-fuchsia-400/20 animate-ping`}
            style={{ animationDelay: '0.6s' }}
          />

          {/* Center square */}
          <div
            className={`${sizeClasses[size]} border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 backdrop-blur-sm animate-pulse`}
          />
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-bold text-cyan-300 font-mono tracking-wider uppercase mt-8`}>{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex gap-3">
          <div className="w-2 h-2 border border-cyan-400 bg-cyan-400 animate-bounce" />
          <div
            className="w-2 h-2 border border-blue-400 bg-blue-400 animate-bounce"
            style={{ animationDelay: '0.15s' }}
          />
          <div
            className="w-2 h-2 border border-fuchsia-400 bg-fuchsia-400 animate-bounce"
            style={{ animationDelay: '0.3s' }}
          />
        </div>

        {message && (
          <p className={`${textSizeClasses[size]} font-bold text-cyan-300 font-mono tracking-wider uppercase`}>{message}</p>
        )}
      </div>
    );
  }

  // Default variant - spinning loader with cyberpunk style
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse" />
        
        {/* Spinning loader */}
        <Loader2 className={`${sizeClasses[size]} text-cyan-400 animate-spin relative z-10`} />
      </div>

      {message && (
        <p className={`${textSizeClasses[size]} font-bold text-cyan-300 font-mono tracking-wider uppercase animate-pulse`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] backdrop-blur-sm animate-in fade-in duration-200">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #06b6d4 1px, transparent 1px),
            linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-tr from-fuchsia-500/15 via-pink-500/15 to-cyan-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative border-2 border-cyan-400/30 bg-slate-950/80 backdrop-blur-md p-10 shadow-[0_32px_120px_rgba(2,6,23,0.72)] animate-in zoom-in-95 duration-300">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
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
      <div className="border border-cyan-400/30 bg-slate-950/50 backdrop-blur-sm p-8">
        <LoadingAnimation message={message} variant={variant} size="md" />
      </div>
    </div>
  );
}
