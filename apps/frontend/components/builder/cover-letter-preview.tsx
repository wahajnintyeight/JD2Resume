'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Calendar, FileText } from 'lucide-react';

export interface CoverLetterPersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface CoverLetterPreviewProps {
  content: string;
  personalInfo: CoverLetterPersonalInfo;
  pageSize?: 'A4' | 'LETTER';
  className?: string;
}

export function CoverLetterPreview({
  content,
  personalInfo,
  pageSize = 'A4',
  className,
}: CoverLetterPreviewProps) {
  const { t, locale } = useTranslations();
  const today = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div
      className={cn('border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]', className)}
    >
      <div
        className={cn('relative p-6 md:p-10', pageSize === 'A4' ? 'min-h-[297mm]' : 'min-h-[11in]')}
        style={{
          maxWidth: pageSize === 'A4' ? '210mm' : '8.5in',
        }}
      >
        <header className="mb-8 border-b border-black pb-6">
          <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight text-black">
            {personalInfo.name || t('coverLetter.preview.defaultName')}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {personalInfo.email && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Mail className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Phone className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <MapPin className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Linkedin className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.linkedin}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Globe className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.website}</span>
              </div>
            )}
            {personalInfo.github && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Github className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span className="font-sans">{personalInfo.github}</span>
              </div>
            )}
          </div>
        </header>

        <div className="mb-8 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1D4ED8]" />
          <p className="font-sans text-sm text-[#4B5563]">{today}</p>
        </div>

        <div className="space-y-5">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, idx) => (
              <p
                key={idx}
                className="font-serif text-base leading-relaxed text-black first-letter:mr-1 first-letter:text-2xl first-letter:font-bold first-letter:text-[#1D4ED8]"
              >
                {para}
              </p>
            ))
          ) : (
            <div className="py-16 text-center">
              <div className="mb-4 inline-block">
                <FileText className="h-12 w-12 text-[#4B5563]" />
              </div>
              <p className="mb-2 font-mono text-sm font-medium text-[#4B5563]">
                {t('coverLetter.preview.emptyTitle')}
              </p>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-[#4B5563]">
                {t('coverLetter.preview.emptyDescription')}
              </p>
            </div>
          )}
        </div>

        {paragraphs.length > 0 && (
          <div className="mt-12 border-t border-black pt-8">
            <p className="mb-4 font-serif text-base text-black">Sincerely,</p>
            <p className="font-serif text-lg font-semibold text-black">
              {personalInfo.name || t('coverLetter.preview.defaultName')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
