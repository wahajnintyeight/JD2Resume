'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdditionalInfo } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';
import { Sparkles, Languages, Award, BadgeCheck, Cpu } from 'lucide-react';

interface AdditionalFormProps {
  data: AdditionalInfo;
  onChange: (data: AdditionalInfo) => void;
}

const panelClassName =
  'rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055]';

const textareaClassName =
  'min-h-[124px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

export const AdditionalForm: React.FC<AdditionalFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  const handleArrayChange = (field: keyof AdditionalInfo, value: string) => {
    const items = value.split('\n').filter((item) => item.trim() !== '');
    onChange({
      ...data,
      [field]: items,
    });
  };

  const formatArray = (arr?: string[]) => {
    return arr?.join('\n') || '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  const fields: Array<{
    id: keyof AdditionalInfo;
    label: string;
    placeholder: string;
    icon: React.ReactNode;
    eyebrow: string;
    accent: string;
    iconTint: string;
  }> = [
    {
      id: 'technicalSkills',
      label: t('resume.additional.technicalSkills'),
      placeholder: t('builder.additionalForm.placeholders.technicalSkills'),
      icon: <Cpu className="h-4 w-4" />,
      eyebrow: 'capability stack',
      accent: 'from-cyan-300/35 via-sky-300/18 to-slate-400/10',
      iconTint: 'text-cyan-200',
    },
    {
      id: 'languages',
      label: t('resume.sections.languages'),
      placeholder: t('builder.additionalForm.placeholders.languages'),
      icon: <Languages className="h-4 w-4" />,
      eyebrow: 'voice range',
      accent: 'from-emerald-300/35 via-teal-300/18 to-cyan-400/10',
      iconTint: 'text-emerald-200',
    },
    {
      id: 'certificationsTraining',
      label: t('resume.sections.certifications'),
      placeholder: t('builder.additionalForm.placeholders.certifications'),
      icon: <BadgeCheck className="h-4 w-4" />,
      eyebrow: 'verified credentials',
      accent: 'from-fuchsia-300/35 via-violet-300/18 to-indigo-400/10',
      iconTint: 'text-fuchsia-200',
    },
    {
      id: 'awards',
      label: t('resume.sections.awards'),
      placeholder: t('builder.additionalForm.placeholders.awards'),
      icon: <Award className="h-4 w-4" />,
      eyebrow: 'signal moments',
      accent: 'from-amber-300/35 via-orange-300/18 to-rose-400/10',
      iconTint: 'text-amber-200',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.38)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.08),transparent_24%)]" />

      <div className="relative mb-8 flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(251,191,36,0.14))] text-cyan-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              supporting signals
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">
              Skills & Awards
            </h3>
          </div>
        </div>

        
      </div>

      <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
        {fields.map((field) => (
          <div key={field.id} className={panelClassName}>
            <div className={`mb-3 h-1 rounded-full bg-gradient-to-r ${field.accent}`} />
            <Label
              htmlFor={field.id}
              className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400"
            >
              <span className={field.iconTint}>{field.icon}</span>
              {field.label}
            </Label>
            <p className="mb-3 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">
              {field.eyebrow}
            </p>
            <Textarea
              id={field.id}
              value={formatArray(data[field.id])}
              onChange={(e) => handleArrayChange(field.id, e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder}
              className={textareaClassName}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
