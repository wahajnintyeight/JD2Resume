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

const inputClassName =
  'h-11 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

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
  }> = [
    {
      key: 'name',
      id: 'name',
      label: t('resume.personalInfo.name'),
      placeholder: t('builder.personalInfoForm.placeholders.name'),
      icon: <UserRound className="h-3.5 w-3.5" />,
    },
    {
      key: 'title',
      id: 'title',
      label: t('resume.personalInfo.title'),
      placeholder: t('builder.personalInfoForm.placeholders.title'),
      icon: <Briefcase className="h-3.5 w-3.5" />,
    },
    {
      key: 'email',
      id: 'email',
      type: 'email',
      label: t('resume.personalInfo.email'),
      placeholder: t('builder.personalInfoForm.placeholders.email'),
      icon: <AtSign className="h-3.5 w-3.5" />,
    },
    {
      key: 'phone',
      id: 'phone',
      type: 'tel',
      label: t('resume.personalInfo.phone'),
      placeholder: t('builder.personalInfoForm.placeholders.phone'),
      icon: <Phone className="h-3.5 w-3.5" />,
    },
    {
      key: 'location',
      id: 'location',
      label: t('resume.personalInfo.location'),
      placeholder: t('builder.personalInfoForm.placeholders.location'),
      icon: <MapPin className="h-3.5 w-3.5" />,
    },
    {
      key: 'website',
      id: 'website',
      label: t('resume.personalInfo.website'),
      placeholder: t('builder.personalInfoForm.placeholders.website'),
      icon: <Globe className="h-3.5 w-3.5" />,
    },
    {
      key: 'linkedin',
      id: 'linkedin',
      label: t('resume.personalInfo.linkedin'),
      placeholder: t('builder.personalInfoForm.placeholders.linkedin'),
      icon: <Linkedin className="h-3.5 w-3.5" />,
    },
    {
      key: 'github',
      id: 'github',
      label: t('resume.personalInfo.github'),
      placeholder: t('builder.personalInfoForm.placeholders.github'),
      icon: <Github className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
          credentials
        </p>
        <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">
          {t('builder.personalInfo')}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="border border-black bg-[#F0F0E8] p-3">
            <Label
              htmlFor={field.id}
              className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]"
            >
              {field.icon}
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClassName}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
