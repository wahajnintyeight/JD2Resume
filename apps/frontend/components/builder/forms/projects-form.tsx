'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/components/dashboard/resume-component';
import {
  Plus,
  Trash2,
  Github,
  Globe,
  Rocket,
  CalendarRange,
  PenSquare,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

const inputClassName =
  'h-12 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 transition-all focus-visible:border-amber-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-amber-300/10';

const textareaClassName =
  'min-h-[88px] resize-none rounded-[1.15rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 transition-all focus-visible:border-amber-300/40 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-amber-300/10';

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  const handleAdd = () => {
    const newId = Math.max(...data.map((d) => d.id), 0) + 1;
    onChange([
      ...data,
      {
        id: newId,
        name: '',
        role: '',
        years: '',
        github: '',
        website: '',
        description: [''],
      },
    ]);
  };

  const handleRemove = (id: number) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const handleChange = (id: number, field: keyof Project, value: string | string[]) => {
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-11 rounded-full border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(249,115,22,0.14))] px-5 font-sans text-xs font-bold uppercase tracking-[0.24em] text-amber-100 transition-all hover:border-amber-300/35 hover:bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(249,115,22,0.18))]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('builder.forms.projects.addProject')}
        </Button>
      </div>

      <div className="space-y-6">
        {data.map((item, itemIndex) => (
          <section
            key={item.id}
            className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.56))] p-5 shadow-[0_22px_60px_rgba(2,6,23,0.3)] transition-all duration-300 hover:border-white/15 sm:p-6"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(244,114,182,0.12),transparent_18%),linear-gradient(135deg,transparent,rgba(59,130,246,0.06))]" />

            <div className="relative mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(244,114,182,0.14))] text-amber-100 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-amber-200/80">
                    launch dossier {String(itemIndex + 1).padStart(2, '0')}
                  </p>
                  <h4 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white">
                    {item.name || t('builder.forms.projects.fields.projectName')}
                  </h4>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-rose-300/15 bg-rose-300/10 text-rose-200 opacity-70 transition-all hover:bg-rose-300/20 hover:opacity-100"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <Rocket className="h-3.5 w-3.5 text-amber-200/80" />
                  {t('builder.forms.projects.fields.projectName')}
                </Label>
                <Input
                  value={item.name || ''}
                  onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.projectName')}
                  className={inputClassName}
                />
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-200/80" />
                  {t('builder.forms.projects.fields.role')}
                </Label>
                <Input
                  value={item.role || ''}
                  onChange={(e) => handleChange(item.id, 'role', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.role')}
                  className={inputClassName}
                />
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <CalendarRange className="h-3.5 w-3.5 text-cyan-200/80" />
                  {t('builder.genericItemForm.fields.years')}
                  <span className="text-slate-500">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.years || ''}
                  onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.years')}
                  className={inputClassName}
                />
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <Github className="h-3.5 w-3.5 text-slate-300/80" />
                  GitHub
                  <span className="text-slate-500">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.github || ''}
                  onChange={(e) => handleChange(item.id, 'github', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.github')}
                  className={inputClassName}
                />
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3 md:col-span-2">
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-emerald-200/80" />
                  {t('builder.forms.projects.fields.website')}
                  <span className="text-slate-500">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.website || ''}
                  onChange={(e) => handleChange(item.id, 'website', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.website')}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="relative mt-5 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    <PenSquare className="h-3.5 w-3.5 text-amber-200/80" />
                    {t('builder.genericItemForm.fields.descriptionPoints')}
                  </Label>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Write sharp, outcome-first proof points. Treat each bullet like a launch note.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-10 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-amber-100 transition-all hover:border-amber-300/35 hover:bg-amber-300/15"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>

              <div className="space-y-3">
                {item.description?.map((desc, idx) => (
                  <div
                    key={idx}
                    className="group/item flex gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-3 transition-all duration-300 hover:border-white/15"
                  >
                    <div className="flex w-9 shrink-0 items-start justify-center pt-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100">
                        {idx + 1}
                      </span>
                    </div>
                    <Textarea
                      value={desc}
                      onChange={(e) => handleDescriptionChange(item.id, idx, e.target.value)}
                      placeholder={t('builder.forms.projects.placeholders.description')}
                      className={`flex-1 ${textareaClassName}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDescription(item.id, idx)}
                      className="h-[88px] w-10 self-start rounded-[1rem] border border-transparent text-slate-500 transition-all hover:border-rose-300/15 hover:bg-rose-300/10 hover:text-rose-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {data.length === 0 && (
          <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-amber-300/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(15,23,42,0.46))] px-6 py-16 text-center shadow-[0_18px_50px_rgba(2,6,23,0.26)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.12),transparent_30%)]" />
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/5 text-amber-100">
              <Rocket className="h-7 w-7" />
            </div>
            <p className="relative font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">
              build log
            </p>
            <p className="relative mt-3 text-base font-semibold text-white">
              {t('builder.forms.projects.addFirstProject')}
            </p>
            <div className="relative mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdd}
                className="h-11 rounded-full border border-amber-300/20 bg-amber-300/10 px-5 font-sans text-xs font-bold uppercase tracking-[0.24em] text-amber-100 transition-all hover:border-amber-300/35 hover:bg-amber-300/15"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('builder.forms.projects.addProject')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
