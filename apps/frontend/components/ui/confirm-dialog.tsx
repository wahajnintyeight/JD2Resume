'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { useTranslations } from '@/lib/i18n';

import { AlertTriangle, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

/**
 * Modern Design Confirm Dialog Component
 *
 * A modal dialog for confirming user actions with modern semantic variants.
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  errorMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  variant?: 'danger' | 'warning' | 'success' | 'default';
  closeOnConfirm?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  errorMessage,
  confirmLabel,
  cancelLabel,
  confirmDisabled = false,
  variant = 'default',
  closeOnConfirm = true,
  onConfirm,
  onCancel,
  showCancelButton = true,
}) => {
  const { t } = useTranslations();
  const finalConfirmLabel = confirmLabel ?? t('common.confirm');
  const finalCancelLabel = cancelLabel ?? t('common.cancel');

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm();
    if (closeOnConfirm) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="h-7 w-7" />,
      badge: 'Critical Action',
      iconWrap:
        'border-rose-300/30 bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(15,23,42,0.9))] text-rose-100 shadow-[0_18px_40px_rgba(244,63,94,0.22)]',
      accent: 'text-rose-200',
      panel:
        'border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(15,23,42,0.94))]',
      confirmClass:
        'border border-rose-200/20 bg-[linear-gradient(135deg,#fb7185,#f43f5e_55%,#fb923c)] text-white shadow-[0_16px_40px_rgba(244,63,94,0.28)] hover:-translate-y-0.5',
    },
    warning: {
      icon: <AlertTriangle className="h-7 w-7" />,
      badge: 'Attention Needed',
      iconWrap:
        'border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.24),rgba(15,23,42,0.9))] text-amber-100 shadow-[0_18px_40px_rgba(251,191,36,0.2)]',
      accent: 'text-amber-200',
      panel:
        'border-amber-300/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.94))]',
      confirmClass:
        'border border-amber-200/20 bg-[linear-gradient(135deg,#fbbf24,#fb923c_58%,#f97316)] text-slate-950 shadow-[0_16px_40px_rgba(249,115,22,0.22)] hover:-translate-y-0.5',
    },
    success: {
      icon: <CheckCircle2 className="h-7 w-7" />,
      badge: 'Ready to Proceed',
      iconWrap:
        'border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(15,23,42,0.9))] text-emerald-100 shadow-[0_18px_40px_rgba(16,185,129,0.2)]',
      accent: 'text-emerald-200',
      panel:
        'border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.94))]',
      confirmClass:
        'border border-emerald-200/20 bg-[linear-gradient(135deg,#34d399,#10b981_52%,#22d3ee)] text-slate-950 shadow-[0_16px_40px_rgba(16,185,129,0.24)] hover:-translate-y-0.5',
    },
    default: {
      icon: <HelpCircle className="h-7 w-7" />,
      badge: 'Confirmation',
      iconWrap:
        'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.24),rgba(15,23,42,0.9))] text-cyan-100 shadow-[0_18px_40px_rgba(34,211,238,0.2)]',
      accent: 'text-cyan-200',
      panel:
        'border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.94))]',
      confirmClass:
        'border border-cyan-200/20 bg-[linear-gradient(135deg,#22d3ee,#0ea5e9_52%,#fb923c)] text-slate-950 shadow-[0_16px_40px_rgba(14,165,233,0.28)] hover:-translate-y-0.5',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="confirm-dialog-shell overflow-hidden border border-white/15 bg-[#07111f] p-0 text-white shadow-[0_40px_120px_rgba(2,6,23,0.72)] sm:max-w-[470px]">
          <div className="pointer-events-none absolute inset-0 opacity-95">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_24%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#07111f_0%,#091528_48%,#0d1831_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(circle_at_center,black,transparent_95%)]" />
            <div className="absolute -left-12 top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />
          </div>

          <div className="relative p-7 md:p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-300">
                <span
                  className={`h-2 w-2 rounded-full ${currentVariant.accent} bg-current shadow-[0_0_12px_currentColor]`}
                />
                {currentVariant.badge}
              </div>

              <div
                className={`flex h-20 w-20 items-center justify-center rounded-[26px] border ${currentVariant.iconWrap}`}
              >
                {currentVariant.icon}
              </div>

              <div className={`w-full rounded-[26px] border p-6 ${currentVariant.panel}`}>
                <DialogTitle className='font-["Fraunces",Georgia,serif] text-3xl font-semibold leading-tight tracking-[0.01em] text-white'>
                  {title}
                </DialogTitle>
                <DialogDescription className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-300">
                  {description}
                </DialogDescription>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-[22px] border border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(15,23,42,0.96))] p-4 shadow-[0_14px_40px_rgba(244,63,94,0.16)] animate-in fade-in-0 duration-300">
                <p className="text-sm font-medium leading-7 text-rose-100">{errorMessage}</p>
              </div>
            )}

            <DialogFooter className="mt-7 flex-col gap-3 sm:flex-row sm:gap-4">
              {showCancelButton && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="order-2 h-12 w-full rounded-full border-white/15 bg-white/5 font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10 sm:order-1 sm:flex-1"
                >
                  {finalCancelLabel}
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className={`order-1 h-12 w-full rounded-full font-semibold uppercase tracking-[0.16em] transition-all duration-300 disabled:translate-y-0 disabled:opacity-50 sm:order-2 sm:flex-1 ${currentVariant.confirmClass}`}
              >
                {finalConfirmLabel}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

        .confirm-dialog-shell {
          animation: confirm-dialog-rise 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes confirm-dialog-rise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </>
  );
};
