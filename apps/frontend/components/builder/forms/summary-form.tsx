'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/i18n';
import { ScrollText, Feather } from 'lucide-react';

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
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.58))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.32)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.12),transparent_22%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.10),transparent_20%)]" />

      <div className="relative mb-6 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.45rem] border border-white/10 bg-[linear-gradient(135deg,rgba(244,114,182,0.18),rgba(56,189,248,0.14))] text-fuchsia-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-fuchsia-200/80">
              opening narrative
            </p>
            <Label
              htmlFor="summary"
              className="mt-2 block font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl"
            >
              {t('resume.sections.summary')}
            </Label>
          </div>
        </div>
      </div>

      <div className="relative rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/10 bg-white/5 text-fuchsia-100">
            <Feather className="h-4 w-4" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              concise by design
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Write a clear professional snapshot with enough air between ideas.
            </p>
          </div>
        </div>

        <Textarea
          id="summary"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('builder.placeholders.summary')}
          className="min-h-[190px] resize-none rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-fuchsia-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-fuchsia-300/10"
        />
      </div>
    </section>
  );
};
