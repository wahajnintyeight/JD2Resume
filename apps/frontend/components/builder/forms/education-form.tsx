'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Education } from '@/components/dashboard/resume-component';
import { Plus, Trash2, GraduationCap, Calendar, School, NotebookPen } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableListItem } from '../draggable-list-item';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const inputClassName =
  'h-11 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const textareaClassName =
  'min-h-[96px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const labelClassName =
  'mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]';

const fieldWrapperClassName = 'border border-black bg-[#F0F0E8] p-3';

export const EducationForm: React.FC<EducationFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(data, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    const newId = Math.max(...data.map((d) => d.id), 0) + 1;
    onChange([...data, { id: newId, institution: '', degree: '', years: '', description: '' }]);
  };

  const handleChange = (id: number, field: keyof Education, value: string) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="flex items-center justify-between border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
            academic record
          </p>
          <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">
            {t('builder.education')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('builder.forms.education.addSchool')}
        </Button>
      </div>

      <div className="p-4">
        {data.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {data.map((item, index) => (
                  <DraggableListItem key={item.id} id={item.id}>
                    <div className="border border-black bg-[#F0F0E8]">
                      <div className="flex items-center justify-between border-b border-black bg-white px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black bg-[#1D4ED8] font-mono text-[10px] font-bold text-white">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                            {item.institution || t('builder.forms.education.fields.institution')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 rounded-none border border-black bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                          onClick={() => onChange(data.filter((i) => i.id !== item.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                        <div className={fieldWrapperClassName}>
                          <Label className={labelClassName}>
                            <School className="h-3.5 w-3.5" />
                            {t('builder.forms.education.fields.institution')}
                          </Label>
                          <Input
                            value={item.institution}
                            onChange={(e) => handleChange(item.id, 'institution', e.target.value)}
                            placeholder="e.g. Stanford University"
                            className={inputClassName}
                          />
                        </div>

                        <div className={fieldWrapperClassName}>
                          <Label className={labelClassName}>
                            <GraduationCap className="h-3.5 w-3.5" />
                            {t('builder.forms.education.fields.degree')}
                          </Label>
                          <Input
                            value={item.degree}
                            onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                            placeholder="e.g. Bachelor of Science in CS"
                            className={inputClassName}
                          />
                        </div>

                        <div className={`${fieldWrapperClassName} sm:col-span-2`}>
                          <Label className={labelClassName}>
                            <Calendar className="h-3.5 w-3.5" />
                            {t('builder.genericItemForm.fields.years')}
                          </Label>
                          <Input
                            value={item.years}
                            onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                            placeholder="2018 — 2022"
                            className={inputClassName}
                          />
                        </div>

                        <div className={`${fieldWrapperClassName} sm:col-span-2`}>
                          <Label className={labelClassName}>
                            <NotebookPen className="h-3.5 w-3.5" />
                            {t('builder.forms.education.fields.descriptionOptional')}
                          </Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                            className={textareaClassName}
                            placeholder={t('builder.forms.education.placeholders.description')}
                          />
                        </div>
                      </div>
                    </div>
                  </DraggableListItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {data.length === 0 && (
          <div className="border-2 border-dashed border-black bg-[#F0F0E8] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-white text-black">
              <GraduationCap className="h-5 w-5" />
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
              empty
            </p>
            <p className="mt-2 text-sm font-semibold text-black">
              {t('builder.forms.education.addFirstSchool')}
            </p>
            <Button
              onClick={handleAdd}
              variant="ghost"
              className="mt-4 h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('builder.forms.education.addSchool')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
