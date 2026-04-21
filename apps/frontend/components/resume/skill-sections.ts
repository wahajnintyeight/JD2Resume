import type { ResumeData } from '@/components/dashboard/resume-component';

export interface SkillSectionEntry {
  key: string;
  label: string;
  skills: string[];
}

function formatSkillSectionLabel(key: string): string {
  const withSpaces = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!withSpaces) {
    return 'Skills';
  }

  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getAdditionalSkillSections(
  additional?: ResumeData['additional']
): SkillSectionEntry[] {
  if (!additional?.skillSections) {
    return [];
  }

  return Object.entries(additional.skillSections)
    .map(([key, values]) => ({
      key,
      label: formatSkillSectionLabel(key),
      skills: (values ?? []).map((value) => value.trim()).filter(Boolean),
    }))
    .filter((section) => section.skills.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}
