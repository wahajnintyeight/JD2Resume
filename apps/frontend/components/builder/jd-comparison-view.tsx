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

/**
 * Split view comparing job description with resume.
 * Left: JD (read-only)
 * Right: Resume with matching keywords highlighted
 */
export function JDComparisonView({ jobDescription, resumeData }: JDComparisonViewProps) {
  const { t } = useTranslations();

  // Extract keywords from JD
  const keywords = useMemo(() => extractKeywords(jobDescription), [jobDescription]);

  // Build full resume text for stats calculation
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

  // Calculate match statistics
  const stats = useMemo(() => calculateMatchStats(resumeText, keywords), [resumeText, keywords]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      
      {/* Stats Bar */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/30">
            <div className="relative">
              <Target className="w-4 h-4 text-cyan-400" />
              <div className="absolute -inset-1 bg-cyan-400/20 blur-md rounded-full" />
            </div>
            <span className="font-['Geist',_system-ui] text-sm text-cyan-200">
              {t('builder.jdMatch.stats.keywordsExtracted', { count: keywords.size })}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/30">
            <div className="relative">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <div className="absolute -inset-1 bg-emerald-400/20 blur-md rounded-full" />
            </div>
            <span className="font-['Geist',_system-ui] text-sm text-emerald-200">
              {t('builder.jdMatch.stats.matchesFound', { count: stats.matchCount })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="font-['Geist',_system-ui] text-sm text-slate-400">
              {t('builder.jdMatch.stats.matchRateLabel')}
            </span>
          </div>
          <div className="relative px-5 py-2 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 ring-1 ring-white/10">
            <div
              className={`absolute inset-0 rounded-lg blur-lg opacity-50 ${
                stats.matchPercentage >= 50
                  ? 'bg-emerald-500/30'
                  : stats.matchPercentage >= 30
                    ? 'bg-amber-500/30'
                    : 'bg-rose-500/30'
              }`}
            />
            <span
              className={`relative font-['Geist_Mono',_monospace] text-2xl font-bold ${
                stats.matchPercentage >= 50
                  ? 'text-emerald-400'
                  : stats.matchPercentage >= 30
                    ? 'text-amber-400'
                    : 'text-rose-400'
              }`}
            >
              {stats.matchPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="relative flex-1 grid grid-cols-2 min-h-0 gap-px bg-white/5">
        {/* Left: JD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          <JDDisplay content={jobDescription} />
        </div>

        {/* Right: Resume with highlights */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          <HighlightedResumeView resumeData={resumeData} keywords={keywords} />
        </div>
      </div>
    </div>
  );
}
