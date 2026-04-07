'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Experience } from '@/components/dashboard/resume-component';
import {
  Plus,
  Trash2,
  BriefcaseBusiness,
  Building2,
  MapPin,
  CalendarRange,
  ListTree,
  Sparkles,
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

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const inputClassName =
  'h-13 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

const textareaClassName =
  'min-h-[84px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    onChange(arrayMove(data, oldIndex, newIndex));
  };

  const handleAdd = () => {
    const newId = Math.max(...data.map((d) => d.id), 0) + 1;
    onChange([
      ...data,
      {
        id: newId,
        title: '',
        company: '',
        location: '',
        years: '',
        description: [''],
      },
    ]);
  };

  const handleRemove = (id: number) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const handleChange = (id: number, field: keyof Experience, value: string | string[]) => {
    onChange(
      data.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDescriptionChange = (id: number, index: number, value: string) => {
    onChange(
      data.map((item) => {
        if (item.id === id) {
          const newDesc = [...(item.description || [])];
          newDesc[index] = value;
          return { ...item, description: newDesc };
        }
        return item;
      })
    );
  };

  const handleAddDescription = (id: number) => {
    onChange(
      data.map((item) => {
        if (item.id === id) {
          return { ...item, description: [...(item.description || []), ''] };
        }
        return item;
      })
    );
  };

  const handleRemoveDescription = (id: number, index: number) => {
    onChange(
      data.map((item) => {
        if (item.id === id) {
          const newDesc = [...(item.description || [])];
          newDesc.splice(index, 1);
          return { ...item, description: newDesc };
        }
        return item;
      })
    );
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.38)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_25%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.12),transparent_22%)]" />

      <div className="relative mb-7 flex flex-col gap-6 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(96,165,250,0.14))] text-cyan-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <span className="font-serif text-2xl font-black uppercase">X</span>
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              work history
            </p>
            <h3 className="mt-2 font-serif text-3xl font-black uppercase tracking-[0.08em] text-white">
              {t('builder.experience')}
            </h3>
          </div>
        </div>

        <div className="max-w-sm rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            execution proof
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Capture roles as compact proof points with clear scope, context, and measurable
            outcomes.
          </p>
        </div>
      </div>

      <div className="relative mb-5 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-11 rounded-full border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(14,165,233,0.14))] px-5 font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.24),rgba(14,165,233,0.2))]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('builder.forms.experience.addJob')}
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="relative overflow-hidden rounded-[1.85rem] border border-dashed border-cyan-300/20 bg-white/[0.03] px-6 py-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(125,211,252,0.1),transparent_30%)]" />
          <div className="relative mx-auto mb-5 flex h-15 w-15 items-center justify-center rounded-[1.45rem] border border-white/10 bg-white/5 text-cyan-100">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <p className="relative font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">
            work ledger
          </p>
          <p className="relative mt-3 text-base font-semibold text-white">
            {t('builder.forms.experience.addFirstJob')}
          </p>
          <div className="relative mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdd}
              className="h-11 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/15"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('builder.forms.experience.addJob')}
            </Button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={data.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {data.map((item, itemIndex) => (
                <DraggableListItem key={item.id} id={item.id}>
                  <section className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055]">
                    <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 via-sky-300/25 to-indigo-400/10" />

                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(96,165,250,0.12))] text-cyan-100">
                          <BriefcaseBusiness className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">
                            experience thread {String(itemIndex + 1).padStart(2, '0')}
                          </p>
                          <h4 className="mt-1 truncate font-serif text-xl font-black uppercase tracking-[0.06em] text-white">
                            {item.title || t('builder.forms.experience.fields.jobTitle')}
                          </h4>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {item.company || t('builder.forms.experience.fields.company')}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-rose-300/15 bg-rose-300/10 text-rose-200 opacity-80 transition-all hover:bg-rose-300/20 hover:opacity-100"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 to-sky-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.forms.experience.fields.jobTitle')}
                        </Label>
                        <Input
                          value={item.title || ''}
                          onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.jobTitle')}
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-blue-300/35 to-indigo-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.forms.experience.fields.company')}
                        </Label>
                        <Input
                          value={item.company || ''}
                          onChange={(e) => handleChange(item.id, 'company', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.company')}
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-emerald-300/35 to-teal-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.genericItemForm.fields.location')}
                        </Label>
                        <Input
                          value={item.location || ''}
                          onChange={(e) => handleChange(item.id, 'location', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.location')}
                          className={inputClassName}
                        />
                      </div>

                      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-amber-300/35 to-orange-400/10" />
                        <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                          <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
                          {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years || ''}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.years')}
                          className={inputClassName}
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                      <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-fuchsia-300/35 via-cyan-300/20 to-violet-400/10" />

                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <Label className="flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                            <ListTree className="h-3.5 w-3.5 text-slate-500" />
                            {t('builder.genericItemForm.fields.descriptionPoints')}
                          </Label>
                          <p className="mt-1.5 px-1 text-xs leading-5 text-slate-400">
                            Keep bullets compact and impact-first.
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddDescription(item.id)}
                          className="h-9 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/15"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          {t('builder.genericItemForm.actions.addPoint')}
                        </Button>
                      </div>

                      <div className="space-y-2.5">
                        {item.description?.map((desc, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2.5 rounded-[1.25rem] border border-white/10 bg-slate-950/30 p-2.5 transition-all duration-300 hover:border-white/15"
                          >
                            <div className="flex w-7 shrink-0 items-start justify-center pt-2">
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                                {idx + 1}
                              </span>
                            </div>
                            <Textarea
                              value={desc}
                              onChange={(e) =>
                                handleDescriptionChange(item.id, idx, e.target.value)
                              }
                              placeholder={t('builder.forms.experience.placeholders.description')}
                              className={`flex-1 ${textareaClassName}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDescription(item.id, idx)}
                              className="h-[84px] w-9 self-start rounded-[1rem] border border-transparent text-slate-500 transition-all hover:border-rose-300/15 hover:bg-rose-300/10 hover:text-rose-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-200/60" />
                        strong verbs, measurable wins, low clutter
                      </div>
                    </div>
                  </section>
                </DraggableListItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
};