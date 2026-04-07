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
  'rounded-[1.55rem] border border-white/10 bg-white/[0.035] p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05]';

const textareaClassName =
  'min-h-[150px] resize-none rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

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
    accentClass: string;
  }> = [
    {
      id: 'technicalSkills',
      label: t('resume.additional.technicalSkills'),
      placeholder: t('builder.additionalForm.placeholders.technicalSkills'),
      icon: <Cpu className="h-4 w-4" />,
      eyebrow: 'capability stack',
      accentClass: 'text-cyan-200/80',
    },
    {
      id: 'languages',
      label: t('resume.sections.languages'),
      placeholder: t('builder.additionalForm.placeholders.languages'),
      icon: <Languages className="h-4 w-4" />,
      eyebrow: 'voice range',
      accentClass: 'text-emerald-200/80',
    },
    {
      id: 'certificationsTraining',
      label: t('resume.sections.certifications'),
      placeholder: t('builder.additionalForm.placeholders.certifications'),
      icon: <BadgeCheck className="h-4 w-4" />,
      eyebrow: 'verified credentials',
      accentClass: 'text-fuchsia-200/80',
    },
    {
      id: 'awards',
      label: t('resume.sections.awards'),
      placeholder: t('builder.additionalForm.placeholders.awards'),
      icon: <Award className="h-4 w-4" />,
      eyebrow: 'signal moments',
      accentClass: 'text-amber-200/80',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.58))] p-6 shadow-[0_26px_70px_rgba(2,6,23,0.34)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_20%),linear-gradient(135deg,transparent,rgba(244,114,182,0.05))]" />

      <div className="relative mb-7 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.45rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(251,191,36,0.14))] text-cyan-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">
              supporting signals
            </p>
            <h3 className="mt-2 font-serif text-3xl font-black uppercase tracking-[0.08em] text-white">
              Skills & Awards
            </h3>
          </div>
        </div>

        <div className="max-w-md rounded-[1.45rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
            formatting rule
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add one item per line. Keep entries concise, scannable, and credibility-heavy.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className={panelClassName}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/10 bg-white/5 text-slate-200">
                <span className={field.accentClass}>{field.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                  {field.eyebrow}
                </p>
                <Label
                  htmlFor={field.id}
                  className="mt-1 block font-serif text-lg font-bold uppercase tracking-[0.06em] text-white"
                >
                  {field.label}
                </Label>
              </div>
            </div>

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
