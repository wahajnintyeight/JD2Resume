import React from 'react';
import type {
  ResumeData,
  SectionMeta,
  AdditionalSectionLabels,
} from '@/components/dashboard/resume-component';
import { getSortedSections } from '@/lib/utils/section-helpers';
import { formatDateRange } from '@/lib/utils';
import { DynamicResumeSection } from './dynamic-resume-section';
import { SafeHtml } from './safe-html';
import baseStyles from './styles/_base.module.css';
import styles from './styles/classic-ats.module.css';

interface ResumeClassicAtsProps {
  data: ResumeData;
  showContactIcons?: boolean;
  additionalSectionLabels?: Partial<AdditionalSectionLabels>;
}

/**
 * Classic ATS Resume Template
 *
 * Ultra-clean single-column layout optimized for Applicant Tracking Systems.
 * Features:
 * - Prominent name and title header
 * - Clear contact information line
 * - Section headers in ALL CAPS with underline
 * - Right-aligned dates and locations
 * - Grouped skills by category
 * - Bullet-point descriptions with metrics
 *
 * Best for: Maximum ATS compatibility, traditional tech roles
 */
export const ResumeClassicAts: React.FC<ResumeClassicAtsProps> = ({
  data,
  additionalSectionLabels,
}) => {
  const { personalInfo, summary, workExperience, education, personalProjects, additional } = data;

  // Get sorted visible sections and enforce specific order for Classic ATS
  const preferredOrder: Record<string, number> = {
    summary: 1,
    workExperience: 2,
    additional: 3,
    personalProjects: 4,
    education: 5,
  };

  const sortedSections = getSortedSections(data).sort((a, b) => {
    const orderA = preferredOrder[a.key] || 99;
    const orderB = preferredOrder[b.key] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.order - b.order;
  });

  // Helper to render contact line
  const renderContactLine = () => {
    const parts: string[] = [];

    if (personalInfo?.location) parts.push(personalInfo.location);
    if (personalInfo?.phone) parts.push(personalInfo.phone);
    if (personalInfo?.email) parts.push(personalInfo.email);

    return parts.join(' | ');
  };

  // Render a section based on its key
  const renderSection = (section: SectionMeta) => {
    switch (section.key) {
      case 'personalInfo':
        return null;

      case 'summary':
        if (!summary) return null;
        return (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.displayName.toUpperCase()}</h3>
            <p className={styles.summaryText}>{summary}</p>
          </div>
        );

      case 'workExperience':
        if (!workExperience || workExperience.length === 0) return null;
        return (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.displayName.toUpperCase()}</h3>
            <div className={styles.experienceList}>
              {workExperience.map((exp) => (
                <div key={exp.id} className={styles.experienceItem}>
                  <div className={styles.experienceHeader}>
                    <div className={styles.experienceLeft}>
                      <span className={styles.companyName}>{exp.company}</span>
                      <span className={styles.jobTitle}>{exp.title}</span>
                    </div>
                    <div className={styles.experienceRight}>
                      <span className={styles.location}>{exp.location}</span>
                      <span className={styles.dateRange}>{formatDateRange(exp.years)}</span>
                    </div>
                  </div>
                  {exp.description && exp.description.length > 0 && (
                    <ul className={styles.bulletList}>
                      {exp.description.map((desc, index) => (
                        <li key={index} className={styles.bulletItem}>
                          <SafeHtml html={desc} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!education || education.length === 0) return null;
        return (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.displayName.toUpperCase()}</h3>
            <div className={styles.educationList}>
              {education.map((edu) => (
                <div key={edu.id} className={styles.educationItem}>
                  <div className={styles.educationHeader}>
                    <div className={styles.educationLeft}>
                      <span className={styles.institution}>{edu.institution}</span>
                      <span className={styles.degree}>{edu.degree}</span>
                    </div>
                    <div className={styles.educationRight}>
                      {edu.years && (
                        <span className={styles.dateRange}>{formatDateRange(edu.years)}</span>
                      )}
                    </div>
                  </div>
                  {edu.description && (
                    <p className={styles.educationDescription}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'personalProjects':
        if (!personalProjects || personalProjects.length === 0) return null;
        return (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.displayName.toUpperCase()}</h3>
            <div className={styles.projectList}>
              {personalProjects.map((project) => (
                <div key={project.id} className={styles.projectItem}>
                  <div className={styles.projectHeader}>
                    <div className={styles.projectLeft}>
                      <span className={styles.projectName}>{project.name}</span>
                      <span className={styles.projectTech}>
                        {project.role ||
                          [project.github, project.website].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <div className={styles.projectRight}>
                      {project.years && (
                        <span className={styles.dateRange}>{formatDateRange(project.years)}</span>
                      )}
                    </div>
                  </div>
                  {project.description && project.description.length > 0 && (
                    <ul className={styles.bulletList}>
                      {project.description.map((desc, index) => (
                        <li key={index} className={styles.bulletItem}>
                          <SafeHtml html={desc} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'additional':
        if (!additional) return null;
        const hasSkills = additional.technicalSkills && additional.technicalSkills.length > 0;
        const hasLanguages = additional.languages && additional.languages.length > 0;
        const hasCerts =
          additional.certificationsTraining && additional.certificationsTraining.length > 0;
        const hasAwards = additional.awards && additional.awards.length > 0;

        if (!hasSkills && !hasLanguages && !hasCerts && !hasAwards) return null;

        return (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.displayName.toUpperCase()}</h3>
            <div className={styles.skillsList}>
              {hasSkills && (
                <div className={styles.skillCategory}>
                  <span className={styles.skillLabel}>
                    {(additionalSectionLabels?.technicalSkills || 'Technical Skills').replace(
                      /:$/,
                      ''
                    )}
                    :
                  </span>
                  <span className={styles.skillValues}>
                    {' '}
                    {additional.technicalSkills?.join(', ')}
                  </span>
                </div>
              )}
              {hasLanguages && (
                <div className={styles.skillCategory}>
                  <span className={styles.skillLabel}>Languages:</span>
                  <span className={styles.skillValues}> {additional.languages?.join(', ')}</span>
                </div>
              )}
              {hasCerts && (
                <div className="mt-2">
                  <span className={styles.skillLabel}>Certifications:</span>
                  <ul className={styles.certList}>
                    {additional.certificationsTraining?.map((cert, index) => (
                      <li key={index} className={styles.certItem}>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasAwards && (
                <div className="mt-2">
                  <span className={styles.skillLabel}>Awards:</span>
                  <ul className={styles.awardList}>
                    {additional.awards?.map((award, index) => (
                      <li key={index} className={styles.awardItem}>
                        {award}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      default:
        // Render custom sections
        return <DynamicResumeSection key={section.id} sectionMeta={section} resumeData={data} />;
    }
  };

  return (
    <div className={styles.resumeContainer}>
      {/* Header */}
      <header className={styles.header}>
        {personalInfo?.name && <h1 className={styles.name}>{personalInfo.name.toUpperCase()}</h1>}
        {personalInfo?.title && <p className={styles.title}>{personalInfo.title}</p>}
        <div className={styles.contactLine}>{renderContactLine()}</div>
        {personalInfo?.linkedin && (
          <div className={styles.linkedinLine}>
            LinkedIn:{' '}
            <a
              href={
                personalInfo.linkedin.startsWith('http')
                  ? personalInfo.linkedin
                  : `https://${personalInfo.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {personalInfo.linkedin.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </header>

      {/* Sections */}
      <main className={styles.main}>{sortedSections.map((section) => renderSection(section))}</main>
    </div>
  );
};

export default ResumeClassicAts;
