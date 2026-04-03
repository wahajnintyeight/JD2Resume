'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
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
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-lg shadow-red-500/10">
          <AlertCircle className="w-8 h-8" />
        </div>
      ),
      buttonVariant: 'destructive' as const,
    },
    warning: {
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>
      ),
      buttonVariant: 'warning' as const,
    },
    success: {
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-lg shadow-green-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      ),
      buttonVariant: 'success' as const,
    },
    default: {
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
          <HelpCircle className="w-8 h-8" />
        </div>
      ),
      buttonVariant: 'default' as const,
    },
  };

  const { icon, buttonVariant } = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center gap-6">
            {icon}
            <div className="space-y-3">
              <DialogTitle className="text-2xl font-black tracking-tight leading-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium leading-relaxed px-4">
                {description}
              </DialogDescription>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 animate-in shake-1 duration-500">
              <p className="text-xs text-red-600 font-bold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            {showCancelButton && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:flex-1 h-12 rounded-2xl font-bold order-2 sm:order-1"
              >
                {finalCancelLabel}
              </Button>
            )}
            <Button
              variant={buttonVariant}
              onClick={handleConfirm}
              disabled={confirmDisabled}
              className="w-full sm:flex-1 h-12 rounded-2xl font-bold order-1 sm:order-2 shadow-lg"
            >
              {finalConfirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
