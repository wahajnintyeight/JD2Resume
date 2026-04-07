'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/components/dashboard/resume-component';
import { Plus, Trash2, Github, Globe } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

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
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.projects.addProject')}
        </Button>
      </div>

      <div className="space-y-8">
        {data.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-2xl bg-white p-6"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 opacity-0 transition-opacity text-slate-400 hover:text-destructive hover:bg-destructive/10 group-hover:opacity-100"
              onClick={() => handleRemove(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  {t('builder.forms.projects.fields.projectName')}
                </Label>
                <Input
                  value={item.name || ''}
                  onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.projectName')}
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  {t('builder.forms.projects.fields.role')}
                </Label>
                <Input
                  value={item.role || ''}
                  onChange={(e) => handleChange(item.id, 'role', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.role')}
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  {t('builder.genericItemForm.fields.years')}{' '}
                  <span className="text-slate-400">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.years || ''}
                  onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.years')}
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  <Github className="w-3 h-3 inline mr-1" />
                  GitHub <span className="text-slate-400">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.github || ''}
                  onChange={(e) => handleChange(item.id, 'github', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.github')}
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {t('builder.forms.projects.fields.website')}{' '}
                  <span className="text-slate-400">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.website || ''}
                  onChange={(e) => handleChange(item.id, 'website', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.website')}
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-slate-50/60 p-4">
              <div className="flex justify-between items-center">
                <Label className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  {t('builder.genericItemForm.fields.descriptionPoints')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-8 rounded-lg text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>
              {item.description?.map((desc, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 rounded-xl bg-white p-3"
                >
                  <Textarea
                    value={desc}
                    onChange={(e) => handleDescriptionChange(item.id, idx, e.target.value)}
                    placeholder={t('builder.forms.projects.placeholders.description')}
                    className="flex-1 min-h-[80px] rounded-lg border-slate-200 bg-slate-50 resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDescription(item.id, idx)}
                    className="h-[80px] w-8 self-start rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center shadow-sm">
            <p className="mb-4 font-mono text-sm text-slate-500">
              {t('builder.genericItemForm.noEntries', { label: t('resume.sections.projects') })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.projects.addFirstProject')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};