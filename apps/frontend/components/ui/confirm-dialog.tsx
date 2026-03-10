'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'warning' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  closeOnConfirm?: boolean;
  confirmDisabled?: boolean;
  errorMessage?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  closeOnConfirm = true,
  confirmDisabled = false,
  errorMessage,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (closeOnConfirm) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md"
          >
            <Card className="border-white/10">
              <button
                onClick={handleCancel}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  {variant === 'warning' && (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                  <CardTitle className="text-2xl">{title}</CardTitle>
                </div>
                <CardDescription className="text-white/60">{description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-6">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    variant={variant === 'destructive' ? 'destructive' : 'default'}
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={confirmDisabled}
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
