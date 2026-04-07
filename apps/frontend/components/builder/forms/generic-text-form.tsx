'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ListChecks, Sparkles, ScrollText, FileStack } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface GenericTextFormProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const textareaClassName =
  'min-h-[150px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

/**
 * Generic Text Form Component
 *
 * Used for TEXT type sections (like Summary).
 * Renders a single textarea for text content.
 */
export const GenericTextForm: React.FC<GenericTextFormProps> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const { t } = useTranslations();
  const finalLabel = label ?? t('builder.customSections.contentLabel');
  const finalPlaceholder = placeholder ?? t('builder.customSections.defaultTextPlaceholder');

  // Explicitly allow Enter key to create newlines
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.38)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_22%)]" />

      <div className="relative mb-6 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(34,211,238,0.14))] text-amber-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              narrative layer
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">
              {finalLabel}
            </h3>
          </div>
        </div>

        <div className="w-full shrink-0 lg:max-w-sm rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            voice calibration
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Shape a clear, compact narrative that carries tone, scope, and intent at a glance.
          </p>
        </div>
      </div>

      <div className="relative rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055]">
        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 via-sky-300/20 to-amber-300/10" />
        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
          <ScrollText className="h-3.5 w-3.5 text-cyan-200/80" />
          {finalLabel}
        </Label>
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className={textareaClassName}
        />
      </div>
    </section>
  );
};
