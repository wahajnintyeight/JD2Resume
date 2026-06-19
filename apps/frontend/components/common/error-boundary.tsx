'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Orbit, ShieldAlert, Sparkles } from 'lucide-react';
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
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.10),transparent_30%)]" />
          <div className="absolute left-[-8rem] top-[-5rem] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-6rem] right-[-5rem] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

          <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_35%,transparent_70%)]" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    Stability Layer
                  </div>

                  <div className="mt-6 flex items-start gap-4 sm:gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-rose-400/20 bg-gradient-to-br from-rose-500/20 via-fuchsia-500/10 to-transparent text-rose-100 shadow-[0_18px_45px_rgba(244,63,94,0.18)]">
                      <AlertTriangle className="h-8 w-8" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
                        {strings.title}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                        {strings.description}
                      </p>
                    </div>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <div className="mt-6 rounded-[1.5rem] border border-rose-400/20 bg-slate-950/70 p-4 sm:p-5">
                      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-200/90">
                        <ShieldAlert className="h-4 w-4" />
                        Development details
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-rose-100/85">
                        {this.state.error.message}
                        {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                        {this.state.errorInfo?.componentStack
                          ? `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`
                          : ''}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="relative border-t border-white/10 bg-slate-950/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_34%)]" />
                  <div className="relative">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Recovery actions
                      </p>
                      <h3 className="mt-3 font-serif text-2xl text-white">Get back on track</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Start with a soft reset, then reload the page if the issue persists.
                      </p>

                      <div className="mt-6 flex flex-col gap-3">
                        <Button
                          onClick={this.handleReset}
                          className={cn(
                            'h-12 w-full rounded-xl border border-cyan-300/25',
                            'bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 text-slate-950',
                            'shadow-[0_14px_40px_rgba(34,211,238,0.28)] transition-all duration-200',
                            'hover:scale-[1.01] hover:shadow-[0_18px_48px_rgba(34,211,238,0.34)]'
                          )}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {strings.tryAgain}
                        </Button>

                        <Button
                          onClick={this.handleReload}
                          variant="outline"
                          className={cn(
                            'h-12 w-full rounded-xl border-white/15 bg-white/5 text-slate-100 backdrop-blur-xl',
                            'hover:border-white/25 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {strings.reloadPage}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
