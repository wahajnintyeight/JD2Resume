'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, List, ListOrdered } from 'lucide-react';
import type { SectionType } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (displayName: string, sectionType: SectionType) => void;
}

type SelectableSectionType = Exclude<SectionType, 'personalInfo'>;

export const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const { t } = useTranslations();
  const [displayName, setDisplayName] = useState('');
  const [sectionType, setSectionType] = useState<SelectableSectionType>('text');

  const handleSubmit = () => {
    if (displayName.trim()) {
      onAdd(displayName.trim(), sectionType);
      setDisplayName('');
      setSectionType('text');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && displayName.trim()) {
      handleSubmit();
    }
  };

  const sectionTypes: {
    type: SelectableSectionType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      type: 'text',
      label: t('builder.customSections.sectionTypes.textBlockLabel'),
      icon: <FileText className="h-5 w-5" />,
      description: t('builder.customSections.sectionTypes.textBlockDescription'),
    },
    {
      type: 'itemList',
      label: t('builder.customSections.sectionTypes.itemListLabel'),
      icon: <ListOrdered className="h-5 w-5" />,
      description: t('builder.customSections.sectionTypes.itemListDescription'),
    },
    {
      type: 'stringList',
      label: t('builder.customSections.sectionTypes.stringListLabel'),
      icon: <List className="h-5 w-5" />,
      description: t('builder.customSections.sectionTypes.stringListDescription'),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden border-2 border-black bg-[#F0F0E8] p-0 text-black shadow-[8px_8px_0px_0px_#000000] sm:max-w-[520px]">
          <DialogHeader className="border-b-2 border-black bg-white px-5 py-4">
            <DialogTitle className="font-serif text-xl font-black uppercase text-black">
              {t('builder.customSections.dialogTitle')}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-[#4B5563]">
              {t('builder.customSections.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <div className="border border-black bg-white p-4">
              <Label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                {t('builder.customSections.sectionNameLabel')}
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('builder.customSections.sectionNamePlaceholder')}
                className="h-11 rounded-none border-2 border-black bg-white px-3 text-sm font-sans text-black placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
                autoFocus
              />
            </div>

            <div className="border border-black bg-white p-4">
              <Label className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                {t('builder.customSections.sectionTypeLabel')}
              </Label>

              <div className="space-y-2">
                {sectionTypes.map((item) => {
                  const active = sectionType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSectionType(item.type)}
                      className={`flex w-full items-start gap-3 border-2 p-3 text-left transition-colors ${
                        active
                          ? 'border-[#1D4ED8] bg-[#F0F0E8]'
                          : 'border-black bg-white hover:bg-[#F0F0E8]'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center border border-black ${
                          active ? 'bg-[#1D4ED8] text-white' : 'bg-white text-black'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                            {item.label}
                          </span>
                          <div
                            className={`h-4 w-4 border-2 border-black ${
                              active ? 'bg-[#1D4ED8]' : 'bg-white'
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-[#4B5563]">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t-2 border-black bg-white px-5 py-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-none border-2 border-black bg-white px-4 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={!displayName.trim()}
              className="rounded-none border-2 border-black bg-[#1D4ED8] px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-40"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('builder.addSection')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface AddSectionButtonProps {
  onAdd: (displayName: string, sectionType: SectionType) => void;
}

export const AddSectionButton: React.FC<AddSectionButtonProps> = ({ onAdd }) => {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-12 w-full rounded-none border-2 border-dashed border-black bg-white font-mono text-xs font-bold uppercase text-black hover:bg-[#F0F0E8] hover:text-[#1D4ED8]"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('builder.customSections.addCustomSectionButton')}
      </Button>
      <AddSectionDialog open={open} onOpenChange={setOpen} onAdd={onAdd} />
    </>
  );
};
