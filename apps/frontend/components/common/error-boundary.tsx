'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';

import { cn } from '@/lib/utils';

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
 * Modern Error Boundary component to catch React errors and display a fallback UI.
 * Prevents entire app from crashing when a component throws an error.
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
    // Log error to console (could be sent to error tracking service)
    console.error('Error Boundary caught an error:', error, errorInfo);
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
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. This has been logged for review.',
      tryAgain: 'Try Again',
      reloadPage: 'Reload Page',
    };

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F0F0E8]">
          <div className="max-w-md w-full bg-white border-1 rounded-sm border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-6 mb-8">
              <div className="w-24 h-24 border-1 rounded-sm border-black bg-red-600 flex items-center justify-center text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="font-serif text-4xl font-black uppercase tracking-tight text-black">
                  {strings.title}
                </h2>
                <p className="text-gray-700 font-mono font-bold text-sm uppercase leading-relaxed px-4">
                  {strings.description}
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <p className="font-mono text-xs text-red-700 break-all leading-relaxed font-bold uppercase">
                  {'// ERROR: '}
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="w-full h-14 border-2 border-black bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {strings.tryAgain}
              </Button>
              <Button
                onClick={this.handleReload}
                className="w-full h-14 border-2 border-black bg-blue-700 text-white font-bold uppercase tracking-widest hover:bg-blue-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <RefreshCw className="w-5 h-5 mr-3" />
                {strings.reloadPage}
              </Button>
            </div>
          </div>
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

export function LocalizedErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { t } = useTranslations();
  const strings: ErrorBoundaryStrings = {
    title: t('errors.boundary.title'),
    description: t('errors.boundary.description'),
    tryAgain: t('errors.boundary.tryAgain'),
    reloadPage: t('errors.boundary.reloadPage'),
  };

  return (
    <ErrorBoundary fallback={fallback} strings={strings}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
