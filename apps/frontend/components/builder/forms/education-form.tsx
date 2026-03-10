'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Education } from '@/components/dashboard/resume-component';
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

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ data, onChange }) => {
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
        institution: '',
        degree: '',
        years: '',
        description: '',
      },
    ]);
  };

  const handleRemove = (id: number) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const handleChange = (id: number, field: keyof Education, value: string) => {
    onChange(
      data.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
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
          className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.education.addSchool')}
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/20 rounded-lg">
          <p className="text-sm text-white/40 mb-4">
            {t('builder.genericItemForm.noEntries', { label: t('resume.sections.education') })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.education.addFirstSchool')}
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
                  <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {t('builder.forms.education.fields.institution')}
                        </Label>
                        <Input
                          value={item.institution || ''}
                          onChange={(e) => handleChange(item.id, 'institution', e.target.value)}
                          placeholder={t('builder.forms.education.placeholders.institution')}
                          className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {t('builder.forms.education.fields.degree')}
                        </Label>
                        <Input
                          value={item.degree || ''}
                          onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                          placeholder={t('builder.forms.education.placeholders.degree')}
                          className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {t('builder.genericItemForm.fields.years')}
                        </Label>
                        <Input
                          value={item.years || ''}
                          onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                          placeholder={t('builder.forms.education.placeholders.years')}
                          className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {t('builder.forms.education.fields.descriptionOptional')}
                      </Label>
                      <Textarea
                        value={item.description || ''}
                        onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                        className="min-h-[60px] text-white text-sm bg-white/[0.02] border-white/10 placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                        placeholder={t('builder.forms.education.placeholders.description')}
                      />
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
