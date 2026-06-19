'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Copy, Check, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

export interface OutreachEditorProps {
  /** Outreach message content */
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

export function OutreachEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: OutreachEditorProps) {
  const { t } = useTranslations();
  const [isCopied, setIsCopied] = React.useState(false);

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = content.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-purple-400" />
            <div className="absolute -inset-1 bg-purple-400/20 blur-md rounded-full" />
          </div>
          <h2 className="font-['Geist',_system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">
            {t('outreach.title')}
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
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
            className="h-9 px-4 bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-300"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-2" />
            )}
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!content}
            className={cn(
              'h-9 px-4 transition-all duration-300',
              isCopied
                ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 ring-1 ring-green-400/40 text-green-200 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                : 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 ring-1 ring-purple-400/40 hover:ring-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
            )}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-2" />
                {t('outreach.copied')}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-2" />
                {t('outreach.copy')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 p-5 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('outreach.editor.placeholder')}
          className={cn(
            'w-full h-full min-h-[250px] p-4',
            'font-["Geist",_system-ui] text-sm leading-relaxed',
            'rounded-lg bg-slate-950/50 backdrop-blur-sm',
            'ring-1 ring-white/10 focus:ring-purple-400/40',
            'text-slate-200 placeholder:text-slate-500',
            'resize-none',
            'focus:outline-none focus:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
            'transition-all duration-300',
            'custom-scrollbar'
          )}
        />
      </div>

      {/* Footer Tips */}
      <div className="relative px-5 py-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
          <p className="font-['Geist',_system-ui] text-xs text-slate-400 leading-relaxed">
            {t('outreach.editor.tip')}
          </p>
        </div>
      </div>
    </div>
  );
}
