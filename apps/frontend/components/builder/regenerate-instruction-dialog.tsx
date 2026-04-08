'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles, Briefcase, FolderKanban, Lightbulb } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import type { RegenerateItemInput } from '@/lib/api/enrichment';

interface RegenerateInstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: RegenerateItemInput[];
  instruction: string;
  onInstructionChange: (instruction: string) => void;
  error: string | null;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

/**
 * RegenerateInstructionDialog Component
 *
 * Second step of the regenerate wizard.
 * Shows selected items and allows user to input improvement instructions.
 * Swiss International Style design.
 */
export const RegenerateInstructionDialog: React.FC<RegenerateInstructionDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  instruction,
  onInstructionChange,
  error,
  onBack,
  onGenerate,
  isGenerating,
}) => {
  const { t } = useTranslations();

  const resolveErrorMessage = (value: string) => {
    if (value === 'No items selected') {
      return t('builder.regenerate.selectDialog.noItemsSelected');
    }

    if (/network|fetch/i.test(value) || value.includes('Failed to fetch')) {
      return t('builder.regenerate.errors.networkError');
    }

    return t('builder.regenerate.errors.generationFailed');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter key in textarea without closing dialog
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'experience':
        return <Briefcase className="w-4 h-4" />;
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      case 'skills':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-2 border-cyan-400/30 bg-transparent p-0 shadow-[0_32px_120px_rgba(2,6,23,0.72)] backdrop-blur-0 sm:max-w-[680px]">
        <div className="relative">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.95))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          
          <div className="relative">
            <DialogHeader className="border-b-2 border-cyan-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 pb-5 pt-6">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 backdrop-blur-md w-fit">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold tracking-[0.3em] text-cyan-300 font-mono">
                  STEP 2
                </span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 [font-family:'Orbitron',system-ui,sans-serif]">
                {t('builder.regenerate.instructionDialog.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-cyan-100/70 font-mono mt-2">
                {t('builder.regenerate.instructionDialog.subtitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6 bg-[#0a0a0f]">
              {error && (
                <div className="border-2 border-rose-500/60 bg-rose-950/30 backdrop-blur-sm p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-red-500/10 animate-pulse" />
                  <p className="font-mono text-sm text-rose-200 relative z-10">{resolveErrorMessage(error)}</p>
                </div>
              )}

              {/* Selected Items Summary */}
              <div className="space-y-3">
                <label className="block text-sm font-bold tracking-[0.25em] text-cyan-400 font-mono">
                  &gt; {t('builder.regenerate.instructionDialog.selectedItems').toUpperCase()}
                </label>
                <div className="border border-cyan-400/40 bg-slate-950/50 backdrop-blur-sm p-4 space-y-2 max-h-40 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.item_id} className="flex items-center gap-3 text-sm border-l-2 border-cyan-400/30 pl-3 py-1">
                      <span className="text-cyan-400">{getItemIcon(item.item_type)}</span>
                      <span className="font-semibold text-cyan-100 truncate font-mono">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-cyan-300/60 text-xs truncate font-mono">| {item.subtitle}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instruction Input */}
              <div className="space-y-3">
                <label
                  htmlFor="regenerate-instruction"
                  className="block text-sm font-bold tracking-[0.25em] text-cyan-400 font-mono"
                >
                  &gt; {t('builder.regenerate.instructionDialog.hint').toUpperCase()}
                </label>
                <Textarea
                  id="regenerate-instruction"
                  value={instruction}
                  onChange={(e) => onInstructionChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={2000}
                  placeholder={t('builder.regenerate.instructionDialog.placeholder')}
                  className="min-h-[140px] border border-cyan-400/40 bg-slate-950/50 text-cyan-100 font-mono text-sm px-4 py-3 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder:text-cyan-700 backdrop-blur-sm resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-cyan-400/60 font-mono">
                  {instruction.length}/2000
                </p>
              </div>
            </div>

            <DialogFooter className="border-t-2 border-cyan-400/30 bg-slate-950/80 backdrop-blur-sm px-6 py-4 flex-row justify-between gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isGenerating}
                className="h-12 bg-slate-950/50 hover:bg-slate-900/70 text-cyan-300 hover:text-cyan-200 font-bold tracking-[0.15em] text-sm border border-cyan-400/40 hover:border-cyan-400 backdrop-blur-sm transition-all font-mono"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('builder.regenerate.instructionDialog.backButton').toUpperCase()}
              </Button>
              <Button 
                onClick={onGenerate} 
                disabled={isGenerating}
                className="h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-[0.15em] text-sm border border-cyan-400/40 hover:border-cyan-400 transition-all disabled:opacity-50 font-mono relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isGenerating ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {t('builder.regenerate.diffPreview.loading').toUpperCase()}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4" />
                    {t('builder.regenerate.instructionDialog.generateButton').toUpperCase()}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateInstructionDialog;
