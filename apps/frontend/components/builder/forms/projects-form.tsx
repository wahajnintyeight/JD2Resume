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
  'h-11 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const textareaClassName =
  'min-h-[88px] resize-none rounded-none border-2 border-black bg-white p-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]';

const labelClassName =
  'mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]';

const fieldWrapperClassName = 'border border-black bg-[#F0F0E8] p-3';

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
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <div className="flex items-center justify-between border-b-2 border-black bg-[#F0F0E8] px-4 py-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
            build log
          </p>
          <h3 className="mt-1 font-serif text-xl font-black uppercase text-black">
            {t('builder.projects')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('builder.forms.projects.addProject')}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {data.map((item, itemIndex) => (
          <div key={item.id} className="border border-black bg-[#F0F0E8]">
            <div className="flex items-center justify-between border-b border-black bg-white px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black bg-[#1D4ED8] font-mono text-[10px] font-bold text-white">
                  {String(itemIndex + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                  {item.name || t('builder.forms.projects.fields.projectName')}
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
                  <Rocket className="h-3.5 w-3.5" />
                  {t('builder.forms.projects.fields.projectName')}
                </Label>
                <Input
                  value={item.name || ''}
                  onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.projectName')}
                  className={inputClassName}
                />
              </div>

              <div className={fieldWrapperClassName}>
                <Label className={labelClassName}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('builder.forms.projects.fields.role')}
                </Label>
                <Input
                  value={item.role || ''}
                  onChange={(e) => handleChange(item.id, 'role', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.role')}
                  className={inputClassName}
                />
              </div>

              <div className={fieldWrapperClassName}>
                <Label className={labelClassName}>
                  <CalendarRange className="h-3.5 w-3.5" />
                  {t('builder.genericItemForm.fields.years')}
                  <span className="text-[#4B5563]">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.years || ''}
                  onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.years')}
                  className={inputClassName}
                />
              </div>

              <div className={fieldWrapperClassName}>
                <Label className={labelClassName}>
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                  <span className="text-[#4B5563]">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.github || ''}
                  onChange={(e) => handleChange(item.id, 'github', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.github')}
                  className={inputClassName}
                />
              </div>

              <div className={`${fieldWrapperClassName} sm:col-span-2`}>
                <Label className={labelClassName}>
                  <Globe className="h-3.5 w-3.5" />
                  {t('builder.forms.projects.fields.website')}
                  <span className="text-[#4B5563]">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.website || ''}
                  onChange={(e) => handleChange(item.id, 'website', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.website')}
                  className={inputClassName}
                />
              </div>
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
                      placeholder={t('builder.forms.projects.placeholders.description')}
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

        {data.length === 0 && (
          <div className="border-2 border-dashed border-black bg-[#F0F0E8] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-white text-black">
              <Rocket className="h-5 w-5" />
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
              empty
            </p>
            <p className="mt-2 text-sm font-semibold text-black">
              {t('builder.forms.projects.addFirstProject')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdd}
              className="mt-4 h-9 rounded-none border-2 border-black bg-[#15803D] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('builder.forms.projects.addProject')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
