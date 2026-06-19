'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

export interface CoverLetterEditorProps {
  /** Cover letter content */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when save is triggered */
  onSave: () => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Additional class names */
  className?: string;
}

export function CoverLetterEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: CoverLetterEditorProps) {
  const { t } = useTranslations();
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = content.length;

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FileText className="w-4 h-4 text-blue-400" />
            <div className="absolute -inset-1 bg-blue-400/20 blur-md rounded-full" />
          </div>
          <h2 className="font-['Geist',_system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">
            {t('coverLetter.title')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-md bg-white/[0.02] ring-1 ring-white/5">
            <span className="font-['Geist_Mono',_monospace] text-[10px] text-slate-400">
              {t('builder.contentStats.wordsChars', { wordCount, charCount })}
            </span>
          </div>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-9 px-4 bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 ring-1 ring-blue-400/40 hover:ring-blue-400/60 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-2" />
            )}
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 p-5 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('coverLetter.editor.placeholder')}
          className={cn(
            'w-full h-full min-h-[400px] p-4',
            'font-["Geist",_system-ui] text-sm leading-relaxed',
            'rounded-lg bg-slate-950/50 backdrop-blur-sm',
            'ring-1 ring-white/10 focus:ring-blue-400/40',
            'text-slate-200 placeholder:text-slate-500',
            'resize-none',
            'focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
            'transition-all duration-300',
            'custom-scrollbar'
          )}
        />
      </div>

      {/* Footer Tips */}
      <div className="relative px-5 py-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="font-['Geist',_system-ui] text-xs text-slate-400 leading-relaxed">
            {t('coverLetter.editor.tip')}
          </p>
        </div>
      </div>
    </div>
  );
}
