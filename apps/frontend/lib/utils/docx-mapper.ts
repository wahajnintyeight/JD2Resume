/**
 * DOCX Template Mapper
 *
 * Maps frontend ResumeData to backend DOCX template placeholders.
 * This ensures the data structure matches what the backend expects.
 */

import type { ResumeData } from '@/components/dashboard/resume-component';

/**
 * Map frontend resume data to backend DOCX template format.
 *
 * Backend placeholders:
 * - {{NAME}}, {{DESIGNATION_TITLE}}, {{LOCATION}}, {{PHONE}}, {{EMAIL}}, {{LINKEDIN_URL}}
 * - {{SUMMARY_START}} ... {{SUMMARY}} ... {{SUMMARY_END}}
 * - {{EXPERIENCE_START}} ... {{EXP_COMPANY}}, {{EXP_TITLE}}, {{EXP_LOCATION}}, {{EXP_DATES}}, {{EXP_BULLETS}} ... {{EXPERIENCE_END}}
 * - {{SKILLS_START}} ... {{SKILLS_END}}
 * - {{PROJECTS_START}} ... {{PROJECT_TITLE}}, {{PROJECT_LOCATION}}, {{PROJECT_TOOL1}}, {{PROJECT_TOOL2}}, {{PROJECT_TOOLX}}, {{PROJECT_DATES}}, {{PROJECT_BULLETS}} ... {{PROJECTS_END}}
 * - {{EDUCATION_START}} ... {{EDUCATION_INSTITUTE_NAME}}, {{EDUCATION_LOCATION}}, {{EDUCATION_DEGREE_NAME}}, {{EDUCATION_DATES}} ... {{EDUCATION_END}}
 */
export function mapResumeDataForDocx(resumeData: ResumeData): Record<string, any> {
  return {
    // Personal Info - maps to {{NAME}}, {{DESIGNATION_TITLE}}, etc.
    personalInfo: {
      name: resumeData.personalInfo?.name || '',
      title: resumeData.personalInfo?.title || '', // Maps to {{DESIGNATION_TITLE}}
      email: resumeData.personalInfo?.email || '',
      phone: resumeData.personalInfo?.phone || '',
      location: resumeData.personalInfo?.location || '',
      linkedin: resumeData.personalInfo?.linkedin || '', // Maps to {{LINKEDIN_URL}}
      website: resumeData.personalInfo?.website || '',
      github: resumeData.personalInfo?.github || '',
    },

    // Summary - maps to {{SUMMARY_START}} ... {{SUMMARY}} ... {{SUMMARY_END}}
    summary: resumeData.summary || '',

    // Work Experience - maps to {{EXPERIENCE_START}} ... {{EXPERIENCE_END}}
    workExperience: (resumeData.workExperience || []).map((exp) => ({
      company: exp.company || '', // Maps to {{EXP_COMPANY}}
      title: exp.title || '', // Maps to {{EXP_TITLE}}
      location: exp.location || '', // Maps to {{EXP_LOCATION}}
      years: exp.years || '', // Maps to {{EXP_DATES}}
      description: exp.description || [], // Maps to {{EXP_BULLETS}}
    })),

    // Education - maps to {{EDUCATION_START}} ... {{EDUCATION_END}}
    education: (resumeData.education || []).map((edu) => ({
      institution: edu.institution || '', // Maps to {{EDUCATION_INSTITUTE_NAME}}
      degree: edu.degree || '', // Maps to {{EDUCATION_DEGREE_NAME}}
      location: '', // Not in frontend data, add if needed
      years: edu.years || '', // Maps to {{EDUCATION_DATES}}
      description: edu.description || '',
    })),

    // Personal Projects - maps to {{PROJECTS_START}} ... {{PROJECTS_END}}
    personalProjects: (resumeData.personalProjects || []).map((proj) => ({
      name: proj.name || '', // Maps to {{PROJECT_TITLE}}
      role: proj.role || '', // Maps to {{PROJECT_TOOL1}}, {{PROJECT_TOOL2}}, {{PROJECT_TOOLX}} (comma-separated)
      location: '', // Maps to {{PROJECT_LOCATION}} - not in frontend data
      years: proj.years || '', // Maps to {{PROJECT_DATES}}
      github: proj.github || '',
      website: proj.website || '',
      description: proj.description || [], // Maps to {{PROJECT_BULLETS}}
    })),

    // Additional Info (Skills, Languages, etc.) - maps to {{SKILLS_START}} ... {{SKILLS_END}}
    additional: {
      technicalSkills: resumeData.additional?.technicalSkills || [],
      languages: resumeData.additional?.languages || [],
      certificationsTraining: resumeData.additional?.certificationsTraining || [],
      awards: resumeData.additional?.awards || [],
    },
  };
}

/**
 * Validate that required fields are present for DOCX generation.
 * Returns array of missing field warnings.
 */
export function validateDocxData(resumeData: ResumeData): string[] {
  const warnings: string[] = [];

  if (!resumeData.personalInfo?.name) {
    warnings.push('Name is required');
  }

  if (!resumeData.personalInfo?.email && !resumeData.personalInfo?.phone) {
    warnings.push('At least one contact method (email or phone) is recommended');
  }

  return warnings;
}
