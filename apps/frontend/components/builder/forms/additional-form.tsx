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

const textareaClassName =
  'min-h-[100px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const labelClassName =
  'mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]';

const fieldWrapperClassName = 'border border-black bg-[#F0F0E8] p-3';

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
  }> = [
    {
      id: 'technicalSkills',
      label: t('resume.additional.technicalSkills'),
      placeholder: t('builder.additionalForm.placeholders.technicalSkills'),
      icon: <Cpu className="h-3.5 w-3.5" />,
    },
    {
      id: 'languages',
      label: t('resume.sections.languages'),
      placeholder: t('builder.additionalForm.placeholders.languages'),
      icon: <Languages className="h-3.5 w-3.5" />,
    },
    {
      id: 'certificationsTraining',
      label: t('resume.sections.certifications'),
      placeholder: t('builder.additionalForm.placeholders.certifications'),
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
    },
    {
      id: 'awards',
      label: t('resume.sections.awards'),
      placeholder: t('builder.additionalForm.placeholders.awards'),
      icon: <Award className="h-3.5 w-3.5" />,
    },
  ];

  const skillSections = Object.entries(data.skillSections || {}).sort(([a], [b]) =>
    formatSkillSectionLabel(a).localeCompare(formatSkillSectionLabel(b))
  );

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          supporting signals
        </p>
        <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">
          Skills &amp; Awards
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className={fieldWrapperClassName}>
            <Label htmlFor={field.id} className={labelClassName}>
              {field.icon}
              {field.label}
            </Label>
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

      <div className="border-t-2 border-black p-4">
        <div className={fieldWrapperClassName}>
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Label className={`${labelClassName} mb-1`}>
                <Sparkles className="h-3.5 w-3.5" />
                Additional Skill Sections
              </Label>
              <p className="text-xs text-[#4B5563]">
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
                className="h-10 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={handleAddSkillSection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-none border-2 border-black bg-[#1D4ED8] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {skillSections.length > 0 && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {skillSections.map(([sectionKey, skills]) => (
                <div key={sectionKey} className="border border-black bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      defaultValue={formatSkillSectionLabel(sectionKey)}
                      onBlur={(e) => handleRenameSkillSection(sectionKey, e.target.value)}
                      className="h-9 flex-1 rounded-none border border-black bg-[#F0F0E8] px-2 font-mono text-xs font-bold uppercase tracking-wider text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillSection(sectionKey)}
                      aria-label={`Remove ${formatSkillSectionLabel(sectionKey)}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-black bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
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
