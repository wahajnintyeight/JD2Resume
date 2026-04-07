'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Education } from '@/components/dashboard/resume-component';
import {
  Plus,
  Trash2,
  GraduationCap,
  Calendar,
  School,
  NotebookPen,
  LibraryBig,
} from 'lucide-react';
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
  'h-13 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

const textareaClassName =
  'min-h-[96px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

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
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.38)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(196,181,253,0.12),transparent_22%)]" />

      <div className="relative mb-7 flex flex-col gap-6 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(96,165,250,0.2),rgba(34,211,238,0.14))] text-cyan-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <span className="font-serif text-2xl font-black uppercase">E</span>
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              academic record
            </p>
            <h3 className="mt-2 font-serif text-3xl font-black uppercase tracking-[0.08em] text-white">
              {t('builder.education')}
            </h3>
          </div>
        </div>

        <div className="max-w-sm rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            study signal
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Surface the programs, timelines, and standout context that strengthen your narrative at
            a glance.
          </p>
        </div>
      </div>

      {data.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={data.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="relative space-y-4">
              {data.map((item, index) => (
                <DraggableListItem key={item.id} id={item.id}>
                  <div className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055]">
                    <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 via-sky-300/25 to-violet-400/10" />

                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/10 bg-[linear-gradient(135deg,rgba(96,165,250,0.16),rgba(34,211,238,0.12))] text-cyan-100">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">
                            academic thread {String(index + 1).padStart(2, '0')}
                          </p>
                          <h4 className="mt-1 truncate font-serif text-xl font-black uppercase tracking-[0.06em] text-white">
                            {item.institution || t('builder.forms.education.fields.institution')}
                          </h4>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {item.degree || t('builder.forms.education.fields.degree')}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(data.filter((i) => i.id !== item.id))}
                        className="h-9 w-9 rounded-full border border-rose-300/15 bg-rose-300/10 text-rose-200 opacity-80 transition-all hover:bg-rose-300/20 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 to-sky-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <School className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.forms.education.fields.institution')}
                        </Label>
                        <Input
                          value={item.institution}
                          onChange={(e) => handleChange(item.id, 'institution', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-fuchsia-300/35 to-violet-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.forms.education.fields.degree')}
                        </Label>
                        <Input
                          value={item.degree}
                          onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor of Science in CS"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3 md:col-span-2">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-amber-300/35 to-orange-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder="2018 — 2022"
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3 md:col-span-2">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-emerald-300/35 to-teal-400/10" />
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <Label className="flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                            <NotebookPen className="h-3.5 w-3.5 text-slate-500" />
                            {t('builder.forms.education.fields.descriptionOptional')}
                          </Label>
                          <div className="hidden items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:flex">
                            <LibraryBig className="h-3.5 w-3.5 text-cyan-200/60" />
                            keep highlights tight
                          </div>
                        </div>
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
          className="group relative mt-1 flex w-full flex-col items-center justify-center overflow-hidden rounded-[1.85rem] border border-dashed border-cyan-300/25 bg-white/[0.03] px-6 py-12 text-center transition-all hover:border-cyan-300/40 hover:bg-white/[0.05]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(96,165,250,0.1),transparent_28%)]" />
          <div className="relative mb-5 flex h-15 w-15 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 text-cyan-100 transition-all group-hover:scale-105 group-hover:bg-cyan-300/10">
            <Plus className="h-6 w-6" />
          </div>
          <p className="relative font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">
            education archive
          </p>
          <p className="relative mt-3 text-base font-semibold text-white">
            {t('builder.forms.education.addFirstSchool')}
          </p>
        </button>
      ) : (
        <div className="relative flex justify-center pt-5">
          <Button
            onClick={handleAdd}
            variant="ghost"
            className="h-11 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/15"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('builder.forms.education.addSchool')}
          </Button>
        </div>
      )}
    </section>
  );
};