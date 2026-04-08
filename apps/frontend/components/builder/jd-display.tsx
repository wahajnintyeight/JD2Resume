'use client';

import { FileText, Sparkles } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface JDDisplayProps {
  content: string;
}

/**
 * Read-only display of the job description.
 * Shows the original JD text in a scrollable container.
 */
export function JDDisplay({ content }: JDDisplayProps) {
  const { t } = useTranslations();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="relative">
          <FileText className="w-4 h-4 text-cyan-400" />
          <div className="absolute -inset-1 bg-cyan-400/20 blur-md rounded-full" />
        </div>
        <h3 className="font-['Geist',_system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">
          {t('builder.jdMatch.jobDescriptionTitle')}
        </h3>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 ring-1 ring-cyan-400/20">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="font-['Geist',_system-ui] text-xs text-cyan-300">Source</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="font-['Geist',_system-ui] text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
