'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/i18n';
import { ListChecks } from 'lucide-react';

interface GenericListFormProps {
  items: string[];
  onChange: (items: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const GenericListForm: React.FC<GenericListFormProps> = ({
  items,
  onChange,
  label,
  placeholder,
}) => {
  const { t } = useTranslations();
  const finalLabel = label ?? t('builder.customSections.itemsLabel');
  const finalPlaceholder = placeholder ?? t('builder.customSections.itemsPlaceholder');

  const handleChange = (value: string) => {
    const newItems = value.split('\n').filter((item) => item.trim() !== '');
    onChange(newItems);
  };

  const formatItems = (arr?: string[]) => {
    return arr?.join('\n') || '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          modular entries
        </p>
        <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">{finalLabel}</h3>
      </div>

      <div className="p-4">
        <Label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          <ListChecks className="h-3.5 w-3.5" />
          {finalLabel}
        </Label>
        <p className="mb-3 text-xs text-[#4B5563]">
          One item per line. Press Enter to create a new item.
        </p>
        <Textarea
          value={formatItems(items)}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className="min-h-[170px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
        />
      </div>
    </section>
  );
};
