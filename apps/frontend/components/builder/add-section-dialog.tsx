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

/**
 * AddSectionDialog Component
 *
 * Dialog for creating new custom sections.
 * Allows user to enter a name and select a section type.
 */
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
        <DialogContent className="add-section-dialog-shell overflow-hidden border border-white/15 bg-[#07111f] p-0 text-white shadow-[0_40px_120px_rgba(2,6,23,0.72)] sm:max-w-[560px]">
          <div className="pointer-events-none absolute inset-0 opacity-95">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_24%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#07111f_0%,#091528_48%,#0d1831_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(circle_at_center,black,transparent_95%)]" />
            <div className="absolute -left-12 top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />
          </div>

          <DialogHeader className="relative border-b border-white/10 px-6 pb-5 pt-6 md:px-7">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              Builder Module
            </div>
            <DialogTitle className='font-["Fraunces",Georgia,serif] text-2xl font-semibold tracking-[0.01em] text-white md:text-[2rem]'>
              {t('builder.customSections.dialogTitle')}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-md text-sm leading-7 text-slate-300">
              {t('builder.customSections.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="relative space-y-6 px-6 py-6 md:px-7">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                Naming
              </div>
              <Label className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {t('builder.customSections.sectionNameLabel')}
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('builder.customSections.sectionNamePlaceholder')}
                className="mt-3 h-12 rounded-[18px] border border-white/10 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                autoFocus
              />
              <p className="mt-3 text-xs leading-6 text-slate-400">
                Give your section a clear label so it reads naturally in the resume flow.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                Structure
              </div>
              <Label className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {t('builder.customSections.sectionTypeLabel')}
              </Label>

              <div className="mt-4 space-y-3">
                {sectionTypes.map((item, index) => {
                  const active = sectionType === item.type;

                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSectionType(item.type)}
                      className={`group relative w-full overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-300 ${
                        active
                          ? 'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(14,165,233,0.08),rgba(15,23,42,0.95))] shadow-[0_18px_40px_rgba(14,165,233,0.18)]'
                          : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]'
                      }`}
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#22d3ee,#fb923c)] opacity-0 transition-opacity duration-300 group-hover:opacity-70 group-focus:opacity-70 group-active:opacity-100" />
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition-all duration-300 ${
                            active
                              ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100'
                              : 'border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {item.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-white">{item.label}</div>
                            <div
                              className={`h-5 w-5 rounded-full border transition-all duration-300 ${
                                active
                                  ? 'border-cyan-200/40 bg-[radial-gradient(circle,#22d3ee_25%,#fb923c_78%)] shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                                  : 'border-white/20 bg-transparent'
                              }`}
                            />
                          </div>
                          <div className="mt-1 text-sm leading-6 text-slate-300">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="relative flex-row justify-end gap-3 border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-4 md:px-7">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
              >
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={!displayName.trim()}
              className="rounded-full border border-cyan-200/20 bg-[linear-gradient(135deg,#22d3ee,#0ea5e9_52%,#fb923c)] px-5 font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_40px_rgba(14,165,233,0.3)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('builder.addSection')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

        .add-section-dialog-shell {
          animation: add-section-dialog-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes add-section-dialog-rise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </>
  );
};

/**
 * AddSectionButton Component
 *
 * Button that triggers the AddSectionDialog.
 */
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
        className="group relative w-full overflow-hidden rounded-[22px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(14,165,233,0.06),rgba(249,115,22,0.08))] py-6 text-slate-100 shadow-[0_18px_40px_rgba(2,6,23,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(14,165,233,0.1),rgba(249,115,22,0.14))] hover:shadow-[0_24px_50px_rgba(14,165,233,0.18)]"
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative flex items-center justify-center">
          <Plus className="mr-2 h-5 w-5" />
          <span className="font-medium tracking-[0.03em]">
            {t('builder.customSections.addCustomSectionButton')}
          </span>
        </span>
      </Button>
      <AddSectionDialog open={open} onOpenChange={setOpen} onAdd={onAdd} />
    </>
  );
};
