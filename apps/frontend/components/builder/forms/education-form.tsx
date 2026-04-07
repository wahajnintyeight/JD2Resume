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
  'h-12 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 transition-all focus-visible:border-cyan-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

const textareaClassName =
  'min-h-[110px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 transition-all focus-visible:border-cyan-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

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
    <div className="space-y-6">
      {data.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={data.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {data.map((item, index) => (
                <DraggableListItem key={item.id} id={item.id}>
                  <div className="group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.76),rgba(15,23,42,0.54))] p-5 shadow-[0_20px_50px_rgba(2,6,23,0.28)] transition-all duration-300 hover:border-white/15 sm:p-6">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.10),transparent_18%)]" />

                    <div className="relative mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(96,165,250,0.18),rgba(34,211,238,0.12))] text-cyan-100">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">
                            academic chapter {String(index + 1).padStart(2, '0')}
                          </p>
                          <h4 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white">
                            {item.institution || t('builder.forms.education.fields.institution')}
                          </h4>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(data.filter((i) => i.id !== item.id))}
                        className="h-10 w-10 rounded-full border border-rose-300/15 bg-rose-300/10 text-rose-200 opacity-70 transition-all hover:bg-rose-300/20 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3">
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <School className="h-3.5 w-3.5 text-cyan-200/80" />
                          {t('builder.forms.education.fields.institution')}
                        </Label>
                        <Input
                          value={item.institution}
                          onChange={(e) => handleChange(item.id, 'institution', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3">
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <GraduationCap className="h-3.5 w-3.5 text-fuchsia-200/80" />
                          {t('builder.forms.education.fields.degree')}
                        </Label>
                        <Input
                          value={item.degree}
                          onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor of Science in CS"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3 md:col-span-2">
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-amber-200/80" />
                          {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder="2018 — 2022"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3 md:col-span-2">
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <NotebookPen className="h-3.5 w-3.5 text-emerald-200/80" />
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

      {data.length === 0 ? (
        <button
          onClick={handleAdd}
          className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-cyan-300/25 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(15,23,42,0.48))] px-6 py-16 text-center transition-all hover:border-cyan-300/40 hover:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.58))]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.10),transparent_28%)]" />
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/5 text-cyan-100 transition-all group-hover:scale-105 group-hover:bg-cyan-300/10">
            <Plus className="h-7 w-7" />
          </div>
          <p className="relative font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">
            education archive
          </p>
          <p className="relative mt-3 text-base font-semibold text-white">
            {t('builder.forms.education.addFirstSchool')}
          </p>
        </button>
      ) : (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleAdd}
            variant="ghost"
            className="h-12 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-6 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/15"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('builder.forms.education.addSchool')}
          </Button>
        </div>
      )}
    </div>
  );
};
