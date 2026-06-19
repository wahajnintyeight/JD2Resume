'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdditionalInfo } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';
import { Sparkles, Languages, Award, BadgeCheck, Cpu, Plus, Trash2 } from 'lucide-react';

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
  const [newSkillSectionName, setNewSkillSectionName] = React.useState('');

  type ArrayField = 'technicalSkills' | 'languages' | 'certificationsTraining' | 'awards';

  const handleArrayChange = (field: ArrayField, value: string) => {
    const items = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({
      ...data,
      [field]: items,
    });
  };

  const formatArray = (arr?: string[]) => {
    return arr?.join('\n') || '';
  };

  const formatSkillSectionLabel = (key: string) => {
    const withSpaces = key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    if (!withSpaces) return 'Skill Section';

    return withSpaces
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const normalizeSkillSectionKey = (value: string) => {
    return value
      .trim()
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+(.)/g, (_, char: string) => char.toUpperCase())
      .replace(/^\w/, (char) => char.toLowerCase());
  };

  const handleSkillSectionChange = (sectionKey: string, value: string) => {
    const items = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({
      ...data,
      skillSections: {
        ...(data.skillSections || {}),
        [sectionKey]: items,
      },
    });
  };

  const handleAddSkillSection = () => {
    const sectionKey = normalizeSkillSectionKey(newSkillSectionName);
    if (!sectionKey || data.skillSections?.[sectionKey]) return;

    onChange({
      ...data,
      skillSections: {
        ...(data.skillSections || {}),
        [sectionKey]: [],
      },
    });
    setNewSkillSectionName('');
  };

  const handleRenameSkillSection = (oldKey: string, value: string) => {
    const nextKey = normalizeSkillSectionKey(value);
    if (!nextKey || nextKey === oldKey || data.skillSections?.[nextKey]) return;

    const nextSections = { ...(data.skillSections || {}) };
    nextSections[nextKey] = nextSections[oldKey] || [];
    delete nextSections[oldKey];
    onChange({
      ...data,
      skillSections: nextSections,
    });
  };

  const handleRemoveSkillSection = (sectionKey: string) => {
    const nextSections = { ...(data.skillSections || {}) };
    delete nextSections[sectionKey];
    onChange({
      ...data,
      skillSections: nextSections,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  const fields: Array<{
    id: ArrayField;
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

  const skillSections = Object.entries(data.skillSections || {}).sort(([a], [b]) =>
    formatSkillSectionLabel(a).localeCompare(formatSkillSectionLabel(b))
  );

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

      <div className="relative mt-5 space-y-4">
        <div className={panelClassName}>
          <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-blue-300/35 via-cyan-300/18 to-slate-400/10" />
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Label className="mb-2 block px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Additional Skill Sections
              </Label>
              <p className="px-1 font-sans text-xs leading-5 text-slate-500">
                Add grouped skills such as databases, DevOps, cloud platforms, practices, or domain
                expertise.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newSkillSectionName}
                onChange={(e) => setNewSkillSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkillSection();
                  }
                }}
                placeholder="Database, DevOps, Cloud"
                className="min-h-11 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:border-cyan-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/10"
              />
              <button
                type="button"
                onClick={handleAddSkillSection}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-cyan-300/30 bg-cyan-300/10 px-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/15"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {skillSections.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {skillSections.map(([sectionKey, skills]) => (
                <div
                  key={sectionKey}
                  className="rounded-[1.25rem] border border-white/10 bg-slate-950/30 p-3"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      defaultValue={formatSkillSectionLabel(sectionKey)}
                      onBlur={(e) => handleRenameSkillSection(sectionKey, e.target.value)}
                      className="min-h-10 flex-1 rounded-[0.9rem] border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-200 focus-visible:border-cyan-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/10"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillSection(sectionKey)}
                      aria-label={`Remove ${formatSkillSectionLabel(sectionKey)}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-red-300/25 bg-red-400/10 text-red-100 transition hover:bg-red-400/15"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Textarea
                    value={formatArray(skills)}
                    onChange={(e) => handleSkillSectionChange(sectionKey, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={'PostgreSQL\nRedis\nMongoDB'}
                    className={textareaClassName}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
