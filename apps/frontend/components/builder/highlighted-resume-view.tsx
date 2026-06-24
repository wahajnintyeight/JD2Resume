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

export function HighlightedResumeView({ resumeData, keywords }: HighlightedResumeViewProps) {
  const { t } = useTranslations();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-black bg-[#F0F0E8] px-4 py-3">
        <FileUser className="h-4 w-4 text-[#15803D]" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
          {t('builder.jdMatch.yourResume')}
        </h3>
        <div className="ml-auto flex items-center gap-1.5 border border-black bg-white px-2 py-0.5">
          <Zap className="h-3 w-3 text-[#F97316]" />
          <span className="font-mono text-[10px] text-[#4B5563]">
            {t('builder.jdMatch.matchingKeywordsHighlighted')}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
        {resumeData.summary && (
          <Section title={t('resume.sections.summary')} icon={<FileUser className="h-4 w-4" />}>
            <HighlightedText text={resumeData.summary} keywords={keywords} />
          </Section>
        )}

        {resumeData.workExperience && resumeData.workExperience.length > 0 && (
          <Section title={t('resume.sections.experience')} icon={<Briefcase className="h-4 w-4" />}>
            {resumeData.workExperience.map((exp) => (
              <div
                key={exp.id}
                className="mb-3 border-b border-[#4B5563]/20 pb-3 last:mb-0 last:border-0 last:pb-0"
              >
                <div className="font-bold text-black">
                  <HighlightedText text={exp.title || ''} keywords={keywords} />
                  {exp.company && (
                    <span className="font-normal text-[#4B5563]">
                      {' '}
                      {t('builder.jdMatch.atSeparator')}{' '}
                      <HighlightedText text={exp.company} keywords={keywords} />
                    </span>
                  )}
                </div>
                {exp.years && (
                  <div className="mb-1.5 mt-1 font-mono text-xs text-[#4B5563]">{exp.years}</div>
                )}
                {exp.description && (
                  <ul className="mt-2 space-y-1.5">
                    {exp.description.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                        <span className="mt-1 shrink-0 text-[#15803D]">{'\u25CF'}</span>
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

        {resumeData.education && resumeData.education.length > 0 && (
          <Section
            title={t('resume.sections.education')}
            icon={<GraduationCap className="h-4 w-4" />}
          >
            {resumeData.education.map((edu) => (
              <div
                key={edu.id}
                className="mb-2 border-b border-[#4B5563]/20 pb-2 last:mb-0 last:border-0 last:pb-0"
              >
                <div className="font-bold text-black">
                  <HighlightedText text={edu.degree || ''} keywords={keywords} />
                </div>
                {edu.institution && (
                  <div className="mt-1 text-sm text-[#4B5563]">
                    <HighlightedText text={edu.institution} keywords={keywords} />
                  </div>
                )}
                {edu.years && (
                  <div className="mt-1 font-mono text-xs text-[#4B5563]">{edu.years}</div>
                )}
              </div>
            ))}
          </Section>
        )}

        {resumeData.personalProjects && resumeData.personalProjects.length > 0 && (
          <Section
            title={t('resume.sections.projects')}
            icon={<FolderKanban className="h-4 w-4" />}
          >
            {resumeData.personalProjects.map((proj) => (
              <div
                key={proj.id}
                className="mb-3 border-b border-[#4B5563]/20 pb-3 last:mb-0 last:border-0 last:pb-0"
              >
                <div className="font-bold text-black">
                  <HighlightedText text={proj.name || ''} keywords={keywords} />
                  {proj.role && (
                    <span className="font-normal text-[#4B5563]">
                      {' '}
                      {t('builder.jdMatch.roleSeparator')}{' '}
                      <HighlightedText text={proj.role} keywords={keywords} />
                    </span>
                  )}
                </div>
                {proj.years && (
                  <div className="mb-1.5 mt-1 font-mono text-xs text-[#4B5563]">{proj.years}</div>
                )}
                {proj.description && (
                  <ul className="mt-2 space-y-1.5">
                    {proj.description.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                        <span className="mt-1 shrink-0 text-[#15803D]">{'\u25CF'}</span>
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

        {resumeData.additional && (
          <Section title={t('resume.sections.skills')} icon={<Wrench className="h-4 w-4" />}>
            {resumeData.additional.technicalSkills &&
              resumeData.additional.technicalSkills.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                    {t('resume.additional.technicalSkills')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.additional.technicalSkills.map((skill, i) => (
                      <SkillTag key={i} text={skill} keywords={keywords} />
                    ))}
                  </div>
                </div>
              )}

            {resumeData.additional.languages && resumeData.additional.languages.length > 0 && (
              <div className="mb-3">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                  {t('resume.sections.languages')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.additional.languages.map((lang, i) => (
                    <SkillTag key={i} text={lang} keywords={keywords} />
                  ))}
                </div>
              </div>
            )}

            {resumeData.additional.certificationsTraining &&
              resumeData.additional.certificationsTraining.length > 0 && (
                <div>
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                    {t('resume.sections.certifications')}
                  </div>
                  <ul className="space-y-1.5">
                    {resumeData.additional.certificationsTraining.map((cert, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                        <span className="mt-1 shrink-0 text-[#15803D]">{'\u25CF'}</span>
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
    <div className="border border-black bg-[#F0F0E8]">
      <div className="flex items-center gap-2 border-b border-black bg-white px-3 py-2">
        <div className="text-[#15803D]">{icon}</div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-black">
          {title}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function HighlightedText({ text, keywords }: { text: string; keywords: Set<string> }) {
  const segments = useMemo(() => segmentTextByKeywords(text, keywords), [text, keywords]);

  return (
    <span>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark
            key={i}
            className="border border-[#F97316] bg-[#F97316]/20 px-1 py-0.5 font-bold text-black"
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

function SkillTag({ text, keywords }: { text: string; keywords: Set<string> }) {
  const isMatch = keywords.has(text.toLowerCase());

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 font-mono text-xs transition-colors ${
        isMatch
          ? 'border-[#F97316] bg-[#F97316]/20 font-bold text-black'
          : 'border-black bg-white text-[#4B5563] hover:bg-[#F0F0E8]'
      }`}
    >
      {text}
    </span>
  );
}
