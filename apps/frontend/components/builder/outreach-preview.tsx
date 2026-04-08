'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Linkedin, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

export interface OutreachPreviewProps {
  /** Outreach message content */
  content: string;
  /** Additional class names */
  className?: string;
}

export function OutreachPreview({ content, className }: OutreachPreviewProps) {
  const { t } = useTranslations();
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />

      {/* Preview Header */}
      <div className="relative px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0077B5]/10 ring-1 ring-[#0077B5]/30">
            <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
            <span className="font-['Geist',_system-ui] text-xs uppercase tracking-wider text-[#0077B5]">
              {t('outreach.preview.channels.linkedin')}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-700/30 ring-1 ring-white/10">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-['Geist',_system-ui] text-xs uppercase tracking-wider text-slate-400">
              {t('outreach.preview.channels.email')}
            </span>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="relative p-6 md:p-8">
        {content ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Message Bubble Style */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg p-5 ring-1 ring-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                <p className="font-['Geist',_system-ui] text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                  {content}
                </p>
              </div>
            </div>

            {/* Usage Tips */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {t('outreach.preview.howToUseTitle')}
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <ul className="space-y-3">
                {[
                  t('outreach.preview.steps.step1'),
                  t('outreach.preview.steps.step2'),
                  t('outreach.preview.steps.step3'),
                  t('outreach.preview.steps.step4'),
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <div className="relative mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 transition-transform group-hover:scale-110" />
                      <div className="absolute -inset-1 bg-purple-400/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-['Geist',_system-ui] text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative inline-block mb-4">
              <Mail className="w-12 h-12 text-slate-600" />
              <div className="absolute -inset-2 bg-purple-500/10 blur-xl rounded-full" />
            </div>
            <p className="font-['Geist',_system-ui] text-sm font-medium text-slate-400 mb-2">
              {t('outreach.preview.emptyTitle')}
            </p>
            <p className="font-['Geist',_system-ui] text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {t('outreach.preview.emptyDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
