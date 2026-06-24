'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollText } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface GenericTextFormProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const GenericTextForm: React.FC<GenericTextFormProps> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const { t } = useTranslations();
  const finalLabel = label ?? t('builder.customSections.contentLabel');
  const finalPlaceholder = placeholder ?? t('builder.customSections.defaultTextPlaceholder');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          narrative layer
        </p>
        <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">{finalLabel}</h3>
      </div>

      <div className="p-4">
        <Label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          <ScrollText className="h-3.5 w-3.5" />
          {finalLabel}
        </Label>
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className="min-h-[150px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
        />
      </div>
    </section>
  );
};
