'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  FileStack,
  Type,
  Building2,
  MapPin,
  CalendarRange,
  PenSquare,
} from 'lucide-react';
import type { CustomSectionItem } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';

interface GenericItemFormProps {
  items: CustomSectionItem[];
  onChange: (items: CustomSectionItem[]) => void;
  itemLabel?: string;
  addLabel?: string;
  showSubtitle?: boolean;
  showLocation?: boolean;
  showYears?: boolean;
  titlePlaceholder?: string;
  subtitlePlaceholder?: string;
  locationPlaceholder?: string;
  yearsPlaceholder?: string;
  descriptionPlaceholder?: string;
}

const inputClassName =
  'h-13 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

const textareaClassName =
  'min-h-[88px] resize-none rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:border-cyan-300/45 focus-visible:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-300/10';

/**
 * Generic Item Form Component
 *
 * Used for ITEM_LIST type sections (like Experience, Education, Projects).
 * Renders a list of items with configurable fields.
 */
export const GenericItemForm: React.FC<GenericItemFormProps> = ({
  items,
  onChange,
  itemLabel,
  addLabel,
  showSubtitle = true,
  showLocation = true,
  showYears = true,
  titlePlaceholder,
  subtitlePlaceholder,
  locationPlaceholder,
  yearsPlaceholder,
  descriptionPlaceholder,
}) => {
  const { t } = useTranslations();

  const finalItemLabel = itemLabel ?? t('builder.genericItemForm.itemLabel');
  const finalAddLabel =
    addLabel ?? t('builder.genericItemForm.addItemLabel', { label: finalItemLabel });

  const finalTitlePlaceholder = titlePlaceholder ?? t('builder.genericItemForm.placeholders.title');
  const finalSubtitlePlaceholder =
    subtitlePlaceholder ?? t('builder.genericItemForm.placeholders.organization');
  const finalLocationPlaceholder =
    locationPlaceholder ?? t('builder.genericItemForm.placeholders.location');
  const finalYearsPlaceholder = yearsPlaceholder ?? t('builder.genericItemForm.placeholders.years');
  const finalDescriptionPlaceholder =
    descriptionPlaceholder ?? t('builder.genericItemForm.placeholders.description');

  const handleAdd = () => {
    const newId = Math.max(...items.map((d) => d.id), 0) + 1;
    onChange([
      ...items,
      {
        id: newId,
        title: '',
        subtitle: '',
        location: '',
        years: '',
        description: [''],
      },
    ]);
  };

  const handleRemove = (id: number) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleChange = (id: number, field: keyof CustomSectionItem, value: string | string[]) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDescriptionChange = (id: number, index: number, value: string) => {
    onChange(
      items.map((item) => {
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
      items.map((item) => {
        if (item.id === id) {
          return { ...item, description: [...(item.description || []), ''] };
        }
        return item;
      })
    );
  };

  const handleRemoveDescription = (id: number, index: number) => {
    onChange(
      items.map((item) => {
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_22%)]" />

      <div className="relative mb-6 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(34,211,238,0.14))] text-amber-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
            <FileStack className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
              modular record
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">
              {finalItemLabel}
            </h3>
          </div>
        </div>

        <div className="w-full shrink-0 lg:max-w-sm rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            structured signals
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Keep each entry concise, evidence-rich, and easy to scan for role fit.
          </p>
        </div>
      </div>

      <div className="relative mb-5 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-11 rounded-full border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(14,165,233,0.12))] px-5 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(14,165,233,0.16))]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {finalAddLabel}
        </Button>
      </div>

      <div className="relative space-y-5">
        {items.map((item, itemIndex) => (
          <div
            key={item.id}
            className="group rounded-[1.8rem] border border-white/10 bg-white/[0.035] p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.055] sm:p-5"
          >
            <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 via-sky-300/20 to-amber-300/10" />

            <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(251,191,36,0.12))] text-cyan-100">
                  <Type className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    entry {String(itemIndex + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {item.title || finalItemLabel}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-rose-300/15 bg-rose-300/10 text-rose-200 opacity-80 transition-all hover:bg-rose-300/20 hover:opacity-100"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-amber-300/35 to-orange-400/10" />
                <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  <Type className="h-3.5 w-3.5 text-amber-200/80" />
                  {t('builder.genericItemForm.fields.title')}
                </Label>
                <Input
                  value={item.title || ''}
                  onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                  placeholder={finalTitlePlaceholder}
                  className={inputClassName}
                />
              </div>

              {showSubtitle && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-fuchsia-300/35 to-violet-400/10" />
                  <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-fuchsia-200/80" />
                    {t('builder.genericItemForm.fields.organization')}
                  </Label>
                  <Input
                    value={item.subtitle || ''}
                    onChange={(e) => handleChange(item.id, 'subtitle', e.target.value)}
                    placeholder={finalSubtitlePlaceholder}
                    className={inputClassName}
                  />
                </div>
              )}

              {showLocation && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-rose-300/35 to-pink-400/10" />
                  <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-rose-200/80" />
                    {t('builder.genericItemForm.fields.location')}
                  </Label>
                  <Input
                    value={item.location || ''}
                    onChange={(e) => handleChange(item.id, 'location', e.target.value)}
                    placeholder={finalLocationPlaceholder}
                    className={inputClassName}
                  />
                </div>
              )}

              {showYears && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-cyan-300/35 to-sky-400/10" />
                  <Label className="mb-3 flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    <CalendarRange className="h-3.5 w-3.5 text-cyan-200/80" />
                    {t('builder.genericItemForm.fields.years')}
                  </Label>
                  <Input
                    value={item.years || ''}
                    onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                    placeholder={finalYearsPlaceholder}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-emerald-300/35 to-teal-400/10" />
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2 px-1 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    <PenSquare className="h-3.5 w-3.5 text-emerald-200/80" />
                    {t('builder.genericItemForm.fields.descriptionPoints')}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-10 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100 transition-all hover:border-emerald-300/35 hover:bg-emerald-300/15"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>

              <div className="space-y-3">
                {item.description?.map((desc, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-3 transition-all duration-300 hover:border-white/15"
                  >
                    <div className="flex w-9 shrink-0 items-start justify-center pt-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                        {idx + 1}
                      </span>
                    </div>
                    <Textarea
                      value={desc}
                      onChange={(e) => handleDescriptionChange(item.id, idx, e.target.value)}
                      placeholder={finalDescriptionPlaceholder}
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
          </div>
        ))}

        {items.length === 0 && (
          <div className="relative overflow-hidden rounded-[1.8rem] border border-dashed border-cyan-300/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(15,23,42,0.46))] px-6 py-14 text-center shadow-[0_18px_50px_rgba(2,6,23,0.26)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.12),transparent_30%)]" />
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/5 text-cyan-100">
              <FileStack className="h-7 w-7" />
            </div>
            <p className="relative font-sans text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">
              catalog awaits
            </p>
            <p className="relative mt-3 text-base font-semibold text-white">
              {t('builder.genericItemForm.noEntries', { label: finalItemLabel })}
            </p>
            <div className="relative mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdd}
                className="h-11 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/15"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('builder.genericItemForm.addFirstItem', { label: finalItemLabel })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
