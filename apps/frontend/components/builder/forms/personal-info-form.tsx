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
    <div className="space-y-4 border border-neutral-700 p-6 bg-neutral-900/[0.02] rounded-lg">
      <h3 className="text-xl font-bold border-b border-neutral-700 pb-2 mb-4 text-neutral-100">
        {t('builder.personalInfo')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.name')}
          </Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.name')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.title')}
          </Label>
          <Input
            id="title"
            value={data.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.title')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.email')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.phone')}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.phone')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.location')}
          </Label>
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.location')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="website"
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
          >
            {t('resume.personalInfo.website')}
          </Label>
          <Input
            id="website"
            value={data.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.website')}
            className="bg-neutral-900/[0.02] border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="linkedin"
            className="text-[10px] font-bold uppercase tracking-widest text-white/40"
          >
            {t('resume.personalInfo.linkedin')}
          </Label>
          <Input
            id="linkedin"
            value={data.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.linkedin')}
            className="bg-white/[0.02] border-white/10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="github"
            className="text-[10px] font-bold uppercase tracking-widest text-white/40"
          >
            {t('resume.personalInfo.github')}
          </Label>
          <Input
            id="github"
            value={data.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder={t('builder.personalInfoForm.placeholders.github')}
            className="bg-white/[0.02] border-white/10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 text-white placeholder:text-white/30"
          />
        </div>
      </div>
    </div>
  );
};
