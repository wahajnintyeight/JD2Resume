'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface ErrorBoundaryStrings {
  title: string;
  description: string;
  tryAgain: string;
  reloadPage: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  strings?: ErrorBoundaryStrings;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Redesigned Error Boundary for ResumeMaster AI
 * Matches the dark, professional aesthetic of the application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const strings: ErrorBoundaryStrings = this.props.strings ?? {
      title: 'System Interruption',
      description: 'An unexpected error occurred within the application engine. Our team has been notified.',
      tryAgain: 'Reset Session',
      reloadPage: 'Reload Application',
    };

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] text-zinc-100 font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl">
              {/* Icon & Badge */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-1">Critical Error</div>
                  <h2 className="text-2xl font-bold tracking-tight">{strings.title}</h2>
                </div>
              </div>

              <p className="text-zinc-400 text-base leading-relaxed mb-8">
                {strings.description}
              </p>

              {/* Error Details (Dev Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 rounded-2xl bg-black border border-zinc-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
                    <Terminal size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stack Trace</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="font-mono text-xs text-red-400/80 leading-relaxed whitespace-pre-wrap">
                      {this.state.error.message}
                      {this.state.error.stack && `\n\n${this.state.error.stack.split('\n').slice(0, 3).join('\n')}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-bold rounded-2xl transition-all active:scale-95"
                >
                  <Home size={18} />
                  {strings.tryAgain}
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
                >
                  <RefreshCw size={18} />
                  {strings.reloadPage}
                </button>
              </div>

              {/* Support Link */}
              <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
                <p className="text-xs text-zinc-500">
                  Need immediate assistance? <a href="#" className="text-indigo-400 hover:underline font-medium">Contact Support</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with an error boundary.
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
