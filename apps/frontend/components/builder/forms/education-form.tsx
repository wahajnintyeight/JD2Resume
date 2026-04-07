'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Education } from '@/components/dashboard/resume-component';
import { Plus, Trash2, GraduationCap, Calendar, School } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

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
    onChange([
      ...data,
      { id: newId, institution: '', degree: '', years: '', description: '' },
    ]);
  };

  const handleChange = (id: number, field: keyof Education, value: string) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-8">
      {data.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-12">
              {data.map((item) => (
                <DraggableListItem key={item.id} id={item.id}>
                  <div className="group relative">
                    <div className="absolute -left-12 top-2 flex flex-col gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(data.filter((i) => i.id !== item.id))}
                        className="h-8 w-8 rounded-full bg-white text-rose-500 shadow-md hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          <School className="h-3 w-3" /> {t('builder.forms.education.fields.institution')}
                        </Label>
                        <Input
                          value={item.institution}
                          onChange={(e) => handleChange(item.id, 'institution', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="h-12 border-none bg-slate-50 px-4 text-base ring-offset-transparent transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          <GraduationCap className="h-3 w-3" /> {t('builder.forms.education.fields.degree')}
                        </Label>
                        <Input
                          value={item.degree}
                          onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor of Science in CS"
                          className="h-12 border-none bg-slate-50 px-4 text-base ring-offset-transparent transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          <Calendar className="h-3 w-3" /> {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder="2018 — 2022"
                          className="h-12 border-none bg-slate-50 px-4 text-base ring-offset-transparent transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          {t('builder.forms.education.fields.descriptionOptional')}
                        </Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                          className="min-h-[100px] resize-none border-none bg-slate-50 p-4 text-base ring-offset-transparent transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20"
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

      {data.length === 0 ? (
        <button
          onClick={handleAdd}
          className="group flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white py-16 transition-all hover:border-indigo-300 hover:bg-indigo-50/30"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
            <Plus className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600">
            {t('builder.forms.education.addFirstSchool')}
          </p>
        </button>
      ) : (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleAdd}
            variant="ghost"
            className="h-12 gap-2 rounded-2xl bg-white px-6 font-semibold text-indigo-600 shadow-sm border border-slate-100 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" /> {t('builder.forms.education.addSchool')}
          </Button>
        </div>
      )}
    </div>
  );
};