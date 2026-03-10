'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
          className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.projects.addProject')}
        </Button>
      </div>

      <div className="space-y-8">
        {data.map((item) => (
          <div key={item.id} className="p-6 border border-white/10 bg-white/[0.02] rounded-lg relative group">
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
                  {t('builder.forms.projects.fields.projectName')}
                </Label>
                <Input
                  value={item.name || ''}
                  onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.projectName')}
                  className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {t('builder.forms.projects.fields.role')}
                </Label>
                <Input
                  value={item.role || ''}
                  onChange={(e) => handleChange(item.id, 'role', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.role')}
                  className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {t('builder.genericItemForm.fields.years')}{' '}
                  <span className="text-white/30">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.years || ''}
                  onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.years')}
                  className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <Github className="w-3 h-3 inline mr-1" />
                  GitHub <span className="text-white/30">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.github || ''}
                  onChange={(e) => handleChange(item.id, 'github', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.github')}
                  className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {t('builder.forms.projects.fields.website')}{' '}
                  <span className="text-white/30">({t('common.optional')})</span>
                </Label>
                <Input
                  value={item.website || ''}
                  onChange={(e) => handleChange(item.id, 'website', e.target.value)}
                  placeholder={t('builder.forms.projects.placeholders.website')}
                  className="bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {t('builder.genericItemForm.fields.descriptionPoints')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-6 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t('builder.genericItemForm.actions.addPoint')}
                </Button>
              </div>
              {item.description?.map((desc, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1">
                    <RichTextEditor
                      value={desc}
                      onChange={(html) => handleDescriptionChange(item.id, idx, html)}
                      placeholder={t('builder.forms.projects.placeholders.description')}
                      minHeight="60px"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDescription(item.id, idx)}
                    className="h-[60px] w-8 text-white/40 hover:text-red-400 self-end"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/20 rounded-lg">
            <p className="text-sm text-white/40 mb-4">
              {t('builder.genericItemForm.noEntries', { label: t('resume.sections.projects') })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('builder.forms.projects.addFirstProject')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
