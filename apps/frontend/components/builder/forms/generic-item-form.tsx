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
  'h-11 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const textareaClassName =
  'min-h-[88px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const labelClassName =
  'mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]';

const fieldWrapperClassName = 'border border-black bg-[#F0F0E8] p-3';

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
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="flex items-center justify-between border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
            modular record
          </p>
          <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">
            {finalItemLabel}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {finalAddLabel}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {items.map((item, itemIndex) => (
          <div key={item.id} className="border border-black bg-[#F0F0E8]">
            <div className="flex items-center justify-between border-b border-black bg-white px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black bg-[#1D4ED8] font-mono text-[10px] font-bold text-white">
                  {String(itemIndex + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                  {item.title || finalItemLabel}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-none border border-black bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
              <div className={fieldWrapperClassName}>
                <Label className={labelClassName}>
                  <Type className="h-3.5 w-3.5" />
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
                <div className={fieldWrapperClassName}>
                  <Label className={labelClassName}>
                    <Building2 className="h-3.5 w-3.5" />
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
                <div className={fieldWrapperClassName}>
                  <Label className={labelClassName}>
                    <MapPin className="h-3.5 w-3.5" />
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
                <div className={fieldWrapperClassName}>
                  <Label className={labelClassName}>
                    <CalendarRange className="h-3.5 w-3.5" />
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

            <div className="border-t border-black p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Label className={labelClassName}>
                  <PenSquare className="h-3.5 w-3.5" />
                  {t('builder.genericItemForm.fields.descriptionPoints')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-8 rounded-none border border-black bg-white px-3 font-mono text-[10px] font-bold uppercase text-black hover:bg-[#1D4ED8] hover:text-white"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>

              <div className="space-y-2">
                {item.description?.map((desc, idx) => (
                  <div key={idx} className="flex gap-2 border border-black bg-white p-2">
                    <div className="flex w-6 shrink-0 items-start justify-center pt-2">
                      <span className="flex h-5 min-w-5 items-center justify-center border border-black bg-[#F0F0E8] px-1 font-mono text-[9px] font-bold text-black">
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
                      className="h-[88px] w-8 shrink-0 self-start rounded-none border border-black bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
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
          <div className="border-2 border-dashed border-black bg-[#F0F0E8] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-white text-black">
              <FileStack className="h-5 w-5" />
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
              empty
            </p>
            <p className="mt-2 text-sm font-semibold text-black">
              {t('builder.genericItemForm.noEntries', { label: finalItemLabel })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdd}
              className="mt-4 h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('builder.genericItemForm.addFirstItem', { label: finalItemLabel })}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
