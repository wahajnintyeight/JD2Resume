'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Experience } from '@/components/dashboard/resume-component';
import { Plus, Trash2 } from 'lucide-react';
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

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ data, onChange }) => {
  const { t } = useTranslations();

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler for drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array using arrayMove from @dnd-kit
    const reordered = arrayMove(data, oldIndex, newIndex);
    onChange(reordered);
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.experience.addJob')}
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 py-12 text-center shadow-sm">
          <p className="mb-4 font-mono text-sm text-slate-500">
            {t('builder.genericItemForm.noEntries', { label: t('resume.sections.experience') })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="rounded-lg border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-900 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.experience.addFirstJob')}
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={data.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-8">
              {data.map((item) => (
                <DraggableListItem key={item.id} id={item.id}>
                  <div className="group relative rounded-2xl bg-white p-6">
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
                          {t('builder.forms.experience.fields.jobTitle')}
                        </Label>
                        <Input
                          value={item.title || ''}
                          onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.jobTitle')}
                          className="rounded-lg border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                          {t('builder.forms.experience.fields.company')}
                        </Label>
                        <Input
                          value={item.company || ''}
                          onChange={(e) => handleChange(item.id, 'company', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.company')}
                          className="rounded-lg border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                          {t('builder.genericItemForm.fields.location')}
                        </Label>
                        <Input
                          value={item.location || ''}
                          onChange={(e) => handleChange(item.id, 'location', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.location')}
                          className="rounded-lg border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">
                          {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years || ''}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder={t('builder.forms.experience.placeholders.years')}
                          className="rounded-lg border-slate-200 bg-slate-50"
                        />
                      </div>
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
                          <Plus className="w-3 h-3 mr-1" />{' '}
                          {t('builder.genericItemForm.actions.addPoint')}
                        </Button>
                      </div>
                      {item.description?.map((desc, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Textarea
                            value={desc}
                            onChange={(e) => handleDescriptionChange(item.id, idx, e.target.value)}
                            placeholder={t('builder.forms.experience.placeholders.description')}
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
                </DraggableListItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
