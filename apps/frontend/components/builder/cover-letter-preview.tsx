'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { User, Mail, Phone, MapPin, Globe, Linkedin, Github, Calendar, FileText } from 'lucide-react';

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
  /** Cover letter content */
  content: string;
  /** Personal info for header */
  personalInfo: CoverLetterPersonalInfo;
  /** Page size for styling */
  pageSize?: 'A4' | 'LETTER';
  /** Additional class names */
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

  // Parse content into paragraphs
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

      {/* Letter Content */}
      <div
        className={cn('relative p-8 md:p-12', pageSize === 'A4' ? 'min-h-[297mm]' : 'min-h-[11in]')}
        style={{
          maxWidth: pageSize === 'A4' ? '210mm' : '8.5in',
        }}
      >
        {/* Header - Personal Info */}
        <header className="mb-8 pb-6 border-b border-white/10">
          <h1 className="font-['Playfair_Display',_Georgia,_serif] text-3xl font-bold tracking-tight text-slate-100 mb-3">
            {personalInfo.name || t('coverLetter.preview.defaultName')}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {personalInfo.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.linkedin}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.website}</span>
              </div>
            )}
            {personalInfo.github && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Github className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-['Geist',_system-ui]">{personalInfo.github}</span>
              </div>
            )}
          </div>
        </header>

        {/* Date */}
        <div className="mb-8 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <p className="font-['Geist',_system-ui] text-sm text-slate-400">{today}</p>
        </div>

        {/* Body */}
        <div className="space-y-5">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, idx) => (
              <p 
                key={idx} 
                className="font-['Crimson_Pro',_Georgia,_serif] text-base leading-relaxed text-slate-300 first-letter:text-2xl first-letter:font-bold first-letter:text-blue-400 first-letter:mr-1"
              >
                {para}
              </p>
            ))
          ) : (
            <div className="text-center py-16 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-4">
                <FileText className="w-12 h-12 text-slate-600" />
                <div className="absolute -inset-2 bg-blue-500/10 blur-xl rounded-full" />
              </div>
              <p className="font-['Geist',_system-ui] text-sm font-medium text-slate-400 mb-2">
                {t('coverLetter.preview.emptyTitle')}
              </p>
              <p className="font-['Geist',_system-ui] text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {t('coverLetter.preview.emptyDescription')}
              </p>
            </div>
          )}
        </div>

        {/* Signature Area */}
        {paragraphs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="font-['Crimson_Pro',_Georgia,_serif] text-base text-slate-300 mb-4">
              Sincerely,
            </p>
            <p className="font-['Playfair_Display',_Georgia,_serif] text-lg font-semibold text-slate-200">
              {personalInfo.name || t('coverLetter.preview.defaultName')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
