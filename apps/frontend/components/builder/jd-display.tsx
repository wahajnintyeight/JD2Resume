'use client';

import { FileText } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface JDDisplayProps {
  content: string;
}

export function JDDisplay({ content }: JDDisplayProps) {
  const { t } = useTranslations();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-black bg-[#F0F0E8] px-4 py-3">
        <FileText className="h-4 w-4 text-[#1D4ED8]" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
          {t('builder.jdMatch.jobDescriptionTitle')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#4B5563]">
          {content}
        </div>
      </div>
    </div>
  );
}
