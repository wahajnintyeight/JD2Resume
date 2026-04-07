'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonalInfo } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
          <span className="font-serif text-xl font-black">P</span>
        </div>
        <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-slate-900">
          {t('builder.personalInfo')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.name')}
          </Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.name')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.title')}
          </Label>
          <Input
            id="title"
            value={data.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.title')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.email')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.phone')}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.phone')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.location')}
          </Label>
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.location')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="website"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.website')}
          </Label>
          <Input
            id="website"
            value={data.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.website')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="linkedin"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.linkedin')}
          </Label>
          <Input
            id="linkedin"
            value={data.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.linkedin')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="github"
            className="font-sans text-[11px] font-black uppercase tracking-widest text-slate-400 px-1"
          >
            {t('resume.personalInfo.github')}
          </Label>
          <Input
            id="github"
            value={data.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.github')}
            className="h-12 px-5 rounded-2xl border-slate-200 focus-visible:ring-primary/5 focus-visible:border-primary bg-slate-50/30 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
