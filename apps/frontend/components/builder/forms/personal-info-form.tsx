'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonalInfo } from '@/components/dashboard/resume-component';
import { UserRound, AtSign, Phone, MapPin, Globe, Linkedin, Github, Briefcase } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

const fieldShellClassName =
  'h-13 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const fields: Array<{
    key: keyof PersonalInfo;
    id: string;
    label: string;
    placeholder: string;
    type?: React.HTMLInputTypeAttribute;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      key: 'name',
      id: 'name',
      label: t('resume.personalInfo.name'),
      placeholder: t('builder.personalInfoForm.placeholders.name'),
      icon: <UserRound className="h-4 w-4" />,
      accent: 'from-amber-300/35 to-orange-400/10',
    },
    {
      key: 'title',
      id: 'title',
      label: t('resume.personalInfo.title'),
      placeholder: t('builder.personalInfoForm.placeholders.title'),
      icon: <Briefcase className="h-4 w-4" />,
      accent: 'from-fuchsia-300/35 to-violet-400/10',
    },
    {
      key: 'email',
      id: 'email',
      type: 'email',
      label: t('resume.personalInfo.email'),
      placeholder: t('builder.personalInfoForm.placeholders.email'),
      icon: <AtSign className="h-4 w-4" />,
      accent: 'from-cyan-300/35 to-sky-400/10',
    },
    {
      key: 'phone',
      id: 'phone',
      type: 'tel',
      label: t('resume.personalInfo.phone'),
      placeholder: t('builder.personalInfoForm.placeholders.phone'),
      icon: <Phone className="h-4 w-4" />,
      accent: 'from-emerald-300/35 to-teal-400/10',
    },
    {
      key: 'location',
      id: 'location',
      label: t('resume.personalInfo.location'),
      placeholder: t('builder.personalInfoForm.placeholders.location'),
      icon: <MapPin className="h-4 w-4" />,
      accent: 'from-rose-300/35 to-pink-400/10',
    },
    {
      key: 'website',
      id: 'website',
      label: t('resume.personalInfo.website'),
      placeholder: t('builder.personalInfoForm.placeholders.website'),
      icon: <Globe className="h-4 w-4" />,
      accent: 'from-blue-300/35 to-indigo-400/10',
    },
    {
      key: 'linkedin',
      id: 'linkedin',
      label: t('resume.personalInfo.linkedin'),
      placeholder: t('builder.personalInfoForm.placeholders.linkedin'),
      icon: <Linkedin className="h-4 w-4" />,
      accent: 'from-sky-300/35 to-cyan-400/10',
    },
    {
      key: 'github',
      id: 'github',
      label: t('resume.personalInfo.github'),
      placeholder: t('builder.personalInfoForm.placeholders.github'),
      icon: <Github className="h-4 w-4" />,
      accent: 'from-slate-300/35 to-slate-500/10',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.38)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_22%)]" />

      <div className="relative mb-8 flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(34,211,238,0.14))] text-amber-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <span className="font-serif text-2xl font-black uppercase">F</span>
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              opening credentials
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">
              {t('builder.personalInfo')}
            </h3>
          </div>
        </div>

         
      </div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
        {fields.map((field) => (
          <div
            key={field.id}
            className="group rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055]"
          >
            <div className={`mb-3 h-1 rounded-full bg-gradient-to-r ${field.accent}`} />
            <Label
              htmlFor={field.id}
              className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400"
            >
              <span className="text-slate-500">{field.icon}</span>
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={fieldShellClassName}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
