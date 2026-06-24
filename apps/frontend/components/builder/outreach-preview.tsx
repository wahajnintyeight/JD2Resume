'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Linkedin, Mail, CheckCircle2 } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

export interface OutreachPreviewProps {
  content: string;
  className?: string;
}

export function OutreachPreview({ content, className }: OutreachPreviewProps) {
  const { t } = useTranslations();
  return (
    <div
      className={cn('border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]', className)}
    >
      {/* Preview Header */}
      <div className="flex items-center gap-3 border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <div className="flex items-center gap-1.5 border border-black bg-white px-2.5 py-1">
          <Linkedin className="h-3.5 w-3.5 text-[#1D4ED8]" />
          <span className="font-mono text-xs uppercase tracking-wider text-black">
            {t('outreach.preview.channels.linkedin')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 border border-black bg-white px-2.5 py-1">
          <Mail className="h-3.5 w-3.5 text-[#4B5563]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#4B5563]">
            {t('outreach.preview.channels.email')}
          </span>
        </div>
      </div>

      {/* Message Preview */}
      <div className="p-4 md:p-6">
        {content ? (
          <div className="space-y-6">
            <div className="border border-black bg-[#F0F0E8] p-5">
              <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-black">
                {content}
              </p>
            </div>

            {/* Usage Tips */}
            <div className="border-t border-black pt-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                  {t('outreach.preview.howToUseTitle')}
                </p>
                <div className="h-px flex-1 bg-black" />
              </div>
              <ul className="space-y-2">
                {[
                  t('outreach.preview.steps.step1'),
                  t('outreach.preview.steps.step2'),
                  t('outreach.preview.steps.step3'),
                  t('outreach.preview.steps.step4'),
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />
                    <span className="font-sans text-xs leading-relaxed text-[#4B5563]">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 inline-block">
              <Mail className="h-12 w-12 text-[#4B5563]" />
            </div>
            <p className="mb-2 font-mono text-sm font-medium text-[#4B5563]">
              {t('outreach.preview.emptyTitle')}
            </p>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-[#4B5563]">
              {t('outreach.preview.emptyDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
