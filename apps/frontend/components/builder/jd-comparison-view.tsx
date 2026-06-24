'use client';

import { useMemo } from 'react';
import { type ResumeData } from '@/components/dashboard/resume-component';
import { extractKeywords, calculateMatchStats } from '@/lib/utils/keyword-matcher';
import { JDDisplay } from './jd-display';
import { HighlightedResumeView } from './highlighted-resume-view';
import { CheckCircle, Target, TrendingUp } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface JDComparisonViewProps {
  jobDescription: string;
  resumeData: ResumeData;
}

export function JDComparisonView({ jobDescription, resumeData }: JDComparisonViewProps) {
  const { t } = useTranslations();

  const keywords = useMemo(() => extractKeywords(jobDescription), [jobDescription]);

  const resumeText = useMemo(() => {
    const parts: string[] = [];

    if (resumeData.summary) parts.push(resumeData.summary);

    resumeData.workExperience?.forEach((exp) => {
      if (exp.title) parts.push(exp.title);
      if (exp.company) parts.push(exp.company);
      exp.description?.forEach((d) => parts.push(d));
    });

    resumeData.education?.forEach((edu) => {
      if (edu.degree) parts.push(edu.degree);
      if (edu.institution) parts.push(edu.institution);
    });

    resumeData.personalProjects?.forEach((proj) => {
      if (proj.name) parts.push(proj.name);
      if (proj.role) parts.push(proj.role);
      proj.description?.forEach((d) => parts.push(d));
    });

    if (resumeData.additional) {
      resumeData.additional.technicalSkills?.forEach((s) => parts.push(s));
      resumeData.additional.languages?.forEach((l) => parts.push(l));
      resumeData.additional.certificationsTraining?.forEach((c) => parts.push(c));
    }

    return parts.join(' ');
  }, [resumeData]);

  const stats = useMemo(() => calculateMatchStats(resumeText, keywords), [resumeText, keywords]);

  const matchColor =
    stats.matchPercentage >= 50
      ? 'text-[#15803D]'
      : stats.matchPercentage >= 30
        ? 'text-[#F97316]'
        : 'text-[#DC2626]';

  return (
    <div className="flex h-full flex-col">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-black bg-white px-3 py-1.5">
            <Target className="h-4 w-4 text-[#1D4ED8]" />
            <span className="font-mono text-xs text-black">
              {t('builder.jdMatch.stats.keywordsExtracted', { count: keywords.size })}
            </span>
          </div>
          <div className="flex items-center gap-2 border border-black bg-white px-3 py-1.5">
            <CheckCircle className="h-4 w-4 text-[#15803D]" />
            <span className="font-mono text-xs text-black">
              {t('builder.jdMatch.stats.matchesFound', { count: stats.matchCount })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#4B5563]" />
            <span className="font-mono text-xs text-[#4B5563]">
              {t('builder.jdMatch.stats.matchRateLabel')}
            </span>
          </div>
          <div className="border border-black bg-white px-4 py-1.5">
            <span className={`font-mono text-2xl font-bold ${matchColor}`}>
              {stats.matchPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-black md:grid-cols-2">
        <div className="relative overflow-hidden bg-white">
          <JDDisplay content={jobDescription} />
        </div>
        <div className="relative overflow-hidden bg-white">
          <HighlightedResumeView resumeData={resumeData} keywords={keywords} />
        </div>
      </div>
    </div>
  );
}
