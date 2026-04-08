'use client';

import { useMemo } from 'react';
import { type ResumeData } from '@/components/dashboard/resume-component';
import { segmentTextByKeywords } from '@/lib/utils/keyword-matcher';
import { FileUser, Briefcase, GraduationCap, FolderKanban, Wrench, Zap } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface HighlightedResumeViewProps {
  resumeData: ResumeData;
  keywords: Set<string>;
}

/**
 * Display resume content with matching keywords highlighted.
 * Shows all resume sections with visual highlighting of JD matches.
 */
export function HighlightedResumeView({ resumeData, keywords }: HighlightedResumeViewProps) {
  const { t } = useTranslations();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="relative">
          <FileUser className="w-4 h-4 text-emerald-400" />
          <div className="absolute -inset-1 bg-emerald-400/20 blur-md rounded-full" />
        </div>
        <h3 className="font-['Geist',_system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">
          {t('builder.jdMatch.yourResume')}
        </h3>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 ring-1 ring-emerald-400/20">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span className="font-['Geist',_system-ui] text-xs text-emerald-300">
            {t('builder.jdMatch.matchingKeywordsHighlighted')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Summary */}
        {resumeData.summary && (
          <Section title={t('resume.sections.summary')} icon={<FileUser className="w-4 h-4" />}>
            <HighlightedText text={resumeData.summary} keywords={keywords} />
          </Section>
        )}

        {/* Work Experience */}
        {resumeData.workExperience && resumeData.workExperience.length > 0 && (
          <Section title={t('resume.sections.experience')} icon={<Briefcase className="w-4 h-4" />}>
            {resumeData.workExperience.map((exp) => (
              <div key={exp.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b border-white/5 last:border-0">
                <div className="font-semibold text-slate-200">
                  <HighlightedText text={exp.title || ''} keywords={keywords} />
                  {exp.company && (
                    <span className="text-slate-400 font-normal">
                      {' '}{t('builder.jdMatch.atSeparator')}{' '}
                      <HighlightedText text={exp.company} keywords={keywords} />
                    </span>
                  )}
                </div>
                {exp.years && <div className="text-xs text-slate-500 mt-1 mb-2">{exp.years}</div>}
                {exp.description && (
                  <ul className="space-y-2 mt-2">
                    {exp.description.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                        <span className="flex-1">
                          <HighlightedText text={bullet} keywords={keywords} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <Section
            title={t('resume.sections.education')}
            icon={<GraduationCap className="w-4 h-4" />}
          >
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-white/5 last:border-0">
                <div className="font-semibold text-slate-200">
                  <HighlightedText text={edu.degree || ''} keywords={keywords} />
                </div>
                {edu.institution && (
                  <div className="text-sm text-slate-400 mt-1">
                    <HighlightedText text={edu.institution} keywords={keywords} />
                  </div>
                )}
                {edu.years && <div className="text-xs text-slate-500 mt-1">{edu.years}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {resumeData.personalProjects && resumeData.personalProjects.length > 0 && (
          <Section
            title={t('resume.sections.projects')}
            icon={<FolderKanban className="w-4 h-4" />}
          >
            {resumeData.personalProjects.map((proj) => (
              <div key={proj.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b border-white/5 last:border-0">
                <div className="font-semibold text-slate-200">
                  <HighlightedText text={proj.name || ''} keywords={keywords} />
                  {proj.role && (
                    <span className="text-slate-400 font-normal">
                      {' '}{t('builder.jdMatch.roleSeparator')}{' '}
                      <HighlightedText text={proj.role} keywords={keywords} />
                    </span>
                  )}
                </div>
                {proj.years && <div className="text-xs text-slate-500 mt-1 mb-2">{proj.years}</div>}
                {proj.description && (
                  <ul className="space-y-2 mt-2">
                    {proj.description.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                        <span className="flex-1">
                          <HighlightedText text={bullet} keywords={keywords} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {resumeData.additional && (
          <Section title={t('resume.sections.skills')} icon={<Wrench className="w-4 h-4" />}>
            {resumeData.additional.technicalSkills &&
              resumeData.additional.technicalSkills.length > 0 && (
                <div className="mb-4">
                  <div className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    {t('resume.additional.technicalSkills')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.additional.technicalSkills.map((skill, i) => (
                      <SkillTag key={i} text={skill} keywords={keywords} />
                    ))}
                  </div>
                </div>
              )}

            {resumeData.additional.languages && resumeData.additional.languages.length > 0 && (
              <div className="mb-4">
                <div className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  {t('resume.sections.languages')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumeData.additional.languages.map((lang, i) => (
                    <SkillTag key={i} text={lang} keywords={keywords} />
                  ))}
                </div>
              </div>
            )}

            {resumeData.additional.certificationsTraining &&
              resumeData.additional.certificationsTraining.length > 0 && (
                <div className="mb-4">
                  <div className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    {t('resume.sections.certifications')}
                  </div>
                  <ul className="space-y-2">
                    {resumeData.additional.certificationsTraining.map((cert, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                        <span className="flex-1">
                          <HighlightedText text={cert} keywords={keywords} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Section>
        )}
      </div>
    </div>
  );
}

/**
 * Section wrapper component
 */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg overflow-hidden bg-white/[0.02] ring-1 ring-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="text-emerald-400">{icon}</div>
        <span className="font-['Geist',_system-ui] text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Component to render text with highlighted keywords.
 */
function HighlightedText({ text, keywords }: { text: string; keywords: Set<string> }) {
  const segments = useMemo(() => segmentTextByKeywords(text, keywords), [text, keywords]);

  return (
    <span>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark 
            key={i} 
            className="relative bg-gradient-to-r from-amber-400/40 to-yellow-400/40 text-black px-1.5 py-0.5 rounded ring-1 ring-amber-400/50 font-semibold shadow-[0_0_8px_rgba(251,191,36,0.2)]"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </span>
  );
}

/**
 * Skill tag with optional highlighting
 */
function SkillTag({ text, keywords }: { text: string; keywords: Set<string> }) {
  const isMatch = keywords.has(text.toLowerCase());

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-['Geist',_system-ui] font-medium transition-all ${
        isMatch 
          ? 'bg-gradient-to-r from-amber-400/30 to-yellow-400/30 text-black ring-1 ring-amber-400/50 shadow-[0_0_16px_rgba(251,191,36,0.25)] font-semibold' 
          : 'bg-white/[0.02] text-slate-400 ring-1 ring-white/5 hover:bg-white/[0.04]'
      }`}
    >
      {text}
    </span>
  );
}
