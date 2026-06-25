'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ResumeData,
  PersonalInfo,
  SectionMeta,
  SectionType,
  CustomSection,
} from '@/components/dashboard/resume-component';
import { PersonalInfoForm } from './forms/personal-info-form';
import { SummaryForm } from './forms/summary-form';
import { ExperienceForm } from './forms/experience-form';
import { EducationForm } from './forms/education-form';
import { ProjectsForm } from './forms/projects-form';
import { AdditionalForm } from './forms/additional-form';
import { SectionHeader } from './section-header';
import { GenericTextForm } from './forms/generic-text-form';
import { GenericItemForm } from './forms/generic-item-form';
import { GenericListForm } from './forms/generic-list-form';
import { AddSectionButton } from './add-section-dialog';
import { DraggableSectionWrapper } from './draggable-section-wrapper';
import {
  getSectionMeta,
  getAllSections,
  createCustomSection,
  DEFAULT_SECTION_META,
} from '@/lib/utils/section-helpers';
import { useTranslations } from '@/lib/i18n';

interface ResumeFormProps {
  resumeData: ResumeData;
  onUpdate: (data: ResumeData) => void;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData, onUpdate }) => {
  const { t } = useTranslations();

  const allSections = getSectionMeta(resumeData);
  const sortedAllSections = getAllSections(resumeData);
  const sectionNav = sortedAllSections.map((section) => ({
    id: section.id,
    label: section.displayName,
    isHidden: !section.isVisible,
  }));

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(`resume-editor-section-${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSectionMetaUpdate = (sections: SectionMeta[]) => {
    onUpdate({
      ...resumeData,
      sectionMeta: sections,
    });
  };

  const handleAddSection = (displayName: string, sectionType: SectionType) => {
    const newSection = createCustomSection(allSections, displayName, sectionType);

    const currentMeta = resumeData.sectionMeta?.length
      ? resumeData.sectionMeta
      : DEFAULT_SECTION_META;

    const newCustomSection: CustomSection = {
      sectionType,
      text: sectionType === 'text' ? '' : undefined,
      items: sectionType === 'itemList' ? [] : undefined,
      strings: sectionType === 'stringList' ? [] : undefined,
    };

    onUpdate({
      ...resumeData,
      sectionMeta: [...currentMeta, newSection],
      customSections: {
        ...resumeData.customSections,
        [newSection.key]: newCustomSection,
      },
    });
  };

  const handleRename = (sectionId: string, newName: string) => {
    const updatedSections = allSections.map((s) =>
      s.id === sectionId ? { ...s, displayName: newName } : s
    );
    handleSectionMetaUpdate(updatedSections);
  };

  const handleDelete = (sectionId: string) => {
    const section = allSections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.isDefault) {
      handleToggleVisibility(sectionId);
    } else {
      const updatedSections = allSections.filter((s) => s.id !== sectionId);
      const updatedCustomSections = { ...resumeData.customSections };
      delete updatedCustomSections[section.key];

      onUpdate({
        ...resumeData,
        sectionMeta: updatedSections,
        customSections: updatedCustomSections,
      });
    }
  };

  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = allSections.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    handleSectionMetaUpdate(updatedSections);
  };

  const handleMoveUp = (sectionId: string) => {
    const sorted = [...allSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index <= 0 || sorted[index - 1].id === 'personalInfo') return;

    const current = sorted[index];
    const above = sorted[index - 1];
    const updatedSections = allSections.map((s) => {
      if (s.id === current.id) return { ...s, order: above.order };
      if (s.id === above.id) return { ...s, order: current.order };
      return s;
    });
    handleSectionMetaUpdate(updatedSections);
  };

  const handleMoveDown = (sectionId: string) => {
    const sorted = [...allSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index < 0 || index >= sorted.length - 1) return;

    const current = sorted[index];
    const below = sorted[index + 1];
    const updatedSections = allSections.map((s) => {
      if (s.id === current.id) return { ...s, order: below.order };
      if (s.id === below.id) return { ...s, order: current.order };
      return s;
    });
    handleSectionMetaUpdate(updatedSections);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const sorted = [...allSections].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    if (sorted[newIndex].id === 'personalInfo') return;

    const updatedSections = allSections.map((section) => {
      if (section.id === active.id) {
        return { ...section, order: sorted[newIndex].order };
      }
      if (oldIndex < newIndex) {
        if (section.order > sorted[oldIndex].order && section.order <= sorted[newIndex].order) {
          return { ...section, order: section.order - 1 };
        }
      } else {
        if (section.order >= sorted[newIndex].order && section.order < sorted[oldIndex].order) {
          return { ...section, order: section.order + 1 };
        }
      }
      return section;
    });

    handleSectionMetaUpdate(updatedSections);
  };

  const renderDefaultSection = (section: SectionMeta, isFirst: boolean, isLast: boolean) => {
    const isPersonalInfo = section.id === 'personalInfo';

    const renderContent = () => {
      switch (section.key) {
        case 'personalInfo':
          return (
            <PersonalInfoForm
              data={resumeData.personalInfo || ({} as PersonalInfo)}
              onChange={(data) => onUpdate({ ...resumeData, personalInfo: data })}
            />
          );

        case 'summary':
          return (
            <SummaryForm
              value={resumeData.summary || ''}
              onChange={(value) => onUpdate({ ...resumeData, summary: value })}
            />
          );

        case 'workExperience':
          return (
            <ExperienceForm
              data={resumeData.workExperience || []}
              onChange={(data) => onUpdate({ ...resumeData, workExperience: data })}
            />
          );

        case 'education':
          return (
            <EducationForm
              data={resumeData.education || []}
              onChange={(data) => onUpdate({ ...resumeData, education: data })}
            />
          );

        case 'personalProjects':
          return (
            <ProjectsForm
              data={resumeData.personalProjects || []}
              onChange={(data) => onUpdate({ ...resumeData, personalProjects: data })}
            />
          );

        case 'additional':
          return (
            <AdditionalForm
              data={
                resumeData.additional || {
                  technicalSkills: [],
                  languages: [],
                  certificationsTraining: [],
                  awards: [],
                }
              }
              onChange={(data) => onUpdate({ ...resumeData, additional: data })}
            />
          );

        default:
          return null;
      }
    };

    if (isPersonalInfo) {
      return renderContent();
    }

    return (
      <SectionHeader
        section={section}
        onRename={(name) => handleRename(section.id, name)}
        onDelete={() => handleDelete(section.id)}
        onMoveUp={() => handleMoveUp(section.id)}
        onMoveDown={() => handleMoveDown(section.id)}
        onToggleVisibility={() => handleToggleVisibility(section.id)}
        isFirst={isFirst}
        isLast={isLast}
        canDelete={true}
      >
        {renderContent()}
      </SectionHeader>
    );
  };

  const renderCustomSection = (section: SectionMeta, isFirst: boolean, isLast: boolean) => {
    const customSection = resumeData.customSections?.[section.key];

    const updateCustomSection = (updates: Partial<CustomSection>) => {
      onUpdate({
        ...resumeData,
        customSections: {
          ...resumeData.customSections,
          [section.key]: {
            ...customSection,
            sectionType: section.sectionType,
            ...updates,
          } as CustomSection,
        },
      });
    };

    const renderContent = () => {
      switch (section.sectionType) {
        case 'text':
          return (
            <GenericTextForm
              value={customSection?.text || ''}
              onChange={(value) => updateCustomSection({ text: value })}
              label={t('builder.customSections.contentLabel')}
              placeholder={t('builder.customSections.contentPlaceholder', {
                name: section.displayName,
              })}
            />
          );

        case 'itemList':
          return (
            <GenericItemForm
              items={customSection?.items || []}
              onChange={(items) => updateCustomSection({ items })}
              itemLabel={t('builder.customSections.entryLabel')}
              addLabel={t('builder.customSections.addEntryLabel')}
            />
          );

        case 'stringList':
          return (
            <GenericListForm
              items={customSection?.strings || []}
              onChange={(strings) => updateCustomSection({ strings })}
              label={t('builder.customSections.itemsLabel')}
              placeholder={t('builder.customSections.itemsPlaceholder')}
            />
          );

        default:
          return (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {t('builder.customSections.unknownSectionType', { type: section.sectionType })}
            </div>
          );
      }
    };

    return (
      <SectionHeader
        section={section}
        onRename={(name) => handleRename(section.id, name)}
        onDelete={() => handleDelete(section.id)}
        onMoveUp={() => handleMoveUp(section.id)}
        onMoveDown={() => handleMoveDown(section.id)}
        onToggleVisibility={() => handleToggleVisibility(section.id)}
        isFirst={isFirst}
        isLast={isLast}
        canDelete={true}
      >
        {renderContent()}
      </SectionHeader>
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedAllSections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div data-modern-editor className="grid gap-4 pb-20 lg:grid-cols-[9rem_minmax(0,1fr)]">
          <nav className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-2 shadow-[0_18px_44px_rgba(2,6,23,0.28)] backdrop-blur-xl lg:top-4 lg:mx-0 lg:block lg:h-fit lg:overflow-visible">
            {sectionNav.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="shrink-0 rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-50 lg:mb-2 lg:block lg:w-full"
              >
                <span className="block truncate">{section.label}</span>
                {section.isHidden && (
                  <span className="mt-1 block text-[9px] font-normal text-slate-500">Hidden</span>
                )}
              </button>
            ))}
          </nav>

          <div className="space-y-5">
            {sortedAllSections.map((section, index) => {
              const isFirst = index === 0 || section.id === 'personalInfo';
              const isLast = index === sortedAllSections.length - 1;
              const isPersonalInfo = section.id === 'personalInfo';

              const sectionContent = section.isDefault
                ? renderDefaultSection(section, isFirst, isLast)
                : renderCustomSection(section, isFirst, isLast);

              return (
                <div
                  key={section.id}
                  id={`resume-editor-section-${section.id}`}
                  className="scroll-mt-4"
                >
                  <DraggableSectionWrapper id={section.id} disabled={isPersonalInfo}>
                    <div className="relative">{sectionContent}</div>
                  </DraggableSectionWrapper>
                </div>
              );
            })}

            <div className="rounded-[1.5rem] border border-dashed border-cyan-300/20 bg-white/6 p-3">
              <AddSectionButton onAdd={handleAddSection} />
            </div>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};
