'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/i18n';

interface SummaryFormProps {
  value: string;
  onChange: (value: string) => void;
}

export const SummaryForm: React.FC<SummaryFormProps> = ({ value, onChange }) => {
  const { t } = useTranslations();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          narrative
        </p>
        <Label
          htmlFor="summary"
          className="mt-1 block font-serif text-xl font-black uppercase text-black"
        >
          {t('resume.sections.summary')}
        </Label>
      </div>

      <div className="p-4">
        <Textarea
          id="summary"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('builder.placeholders.summary')}
          className="min-h-[180px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
        />
      </div>
    </section>
  );
};
