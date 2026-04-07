'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> {finalAddLabel}
        </Button>
      </div>

      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.id} className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={() => handleRemove(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                  {t('builder.genericItemForm.fields.title')}
                </Label>
                <Input
                  value={item.title || ''}
                  onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                  placeholder={finalTitlePlaceholder}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm"
                />
              </div>
              {showSubtitle && (
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                    {t('builder.genericItemForm.fields.organization')}
                  </Label>
                  <Input
                    value={item.subtitle || ''}
                    onChange={(e) => handleChange(item.id, 'subtitle', e.target.value)}
                    placeholder={finalSubtitlePlaceholder}
                    className="rounded-lg border border-slate-200 bg-white shadow-sm"
                  />
                </div>
              )}
              {showLocation && (
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                    {t('builder.genericItemForm.fields.location')}
                  </Label>
                  <Input
                    value={item.location || ''}
                    onChange={(e) => handleChange(item.id, 'location', e.target.value)}
                    placeholder={finalLocationPlaceholder}
                    className="rounded-lg border border-slate-200 bg-white shadow-sm"
                  />
                </div>
              )}
              {showYears && (
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                    {t('builder.genericItemForm.fields.years')}
                  </Label>
                  <Input
                    value={item.years || ''}
                    onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                    placeholder={finalYearsPlaceholder}
                    className="rounded-lg border border-slate-200 bg-white shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                  {t('builder.genericItemForm.fields.descriptionPoints')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-6 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>
              {item.description?.map((desc, idx) => (
                <div key={idx} className="flex gap-2">
                  <Textarea
                    value={desc}
                    onChange={(e) => handleDescriptionChange(item.id, idx, e.target.value)}
                    placeholder={finalDescriptionPlaceholder}
                    className="flex-1 min-h-[80px] rounded-lg border-slate-200 bg-slate-50 resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDescription(item.id, idx)}
                    className="h-[80px] w-8 text-muted-foreground hover:text-destructive self-start"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 py-12 text-center shadow-sm">
            <p className="mb-4 font-mono text-sm text-slate-500">
              {t('builder.genericItemForm.noEntries', { label: finalItemLabel })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="rounded-lg border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-900 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />{' '}
              {t('builder.genericItemForm.addFirstItem', { label: finalItemLabel })}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
