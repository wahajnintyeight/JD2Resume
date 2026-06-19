'use client';

import React from 'react';
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
import {
  Briefcase,
  FolderKanban,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Check,
  Sparkles,
  Layers3,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { RegenerateItemInput } from '@/lib/api/enrichment';

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceItems: RegenerateItemInput[];
  projectItems: RegenerateItemInput[];
  skillsItem: RegenerateItemInput | null;
  selectedItems: RegenerateItemInput[];
  onSelectionChange: (items: RegenerateItemInput[]) => void;
  onContinue: () => void;
}

/**
 * RegenerateDialog Component
 *
 * First step of the regenerate wizard.
 * Allows user to select which resume items to regenerate.
 * Swiss International Style design.
 */
export const RegenerateDialog: React.FC<RegenerateDialogProps> = ({
  open,
  onOpenChange,
  experienceItems,
  projectItems,
  skillsItem,
  selectedItems,
  onSelectionChange,
  onContinue,
}) => {
  const { t } = useTranslations();
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['experience', 'projects', 'skills'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isSelected = (item: RegenerateItemInput) => {
    return selectedItems.some((s) => s.item_id === item.item_id);
  };

  const toggleItem = (item: RegenerateItemInput) => {
    if (isSelected(item)) {
      onSelectionChange(selectedItems.filter((s) => s.item_id !== item.item_id));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const hasItems = experienceItems.length > 0 || projectItems.length > 0 || skillsItem !== null;
  const totalAvailableItems = experienceItems.length + projectItems.length + (skillsItem ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-2 border-cyan-400/30 bg-transparent p-0 shadow-[0_32px_120px_rgba(2,6,23,0.72)] backdrop-blur-0 sm:max-w-[720px]">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.12),_transparent_34%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.95))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="relative">
            <DialogHeader className="border-b-2 border-cyan-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 backdrop-blur-md font-mono text-xs font-bold tracking-[0.3em] text-cyan-300">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    {t('builder.regenerate.selectDialog.title').toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-cyan-400/40 bg-slate-950/50 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-cyan-200 font-mono">
                    <Layers3 className="h-4 w-4 text-fuchsia-300" />
                    {selectedItems.length}/{totalAvailableItems}
                  </span>
                </div>

                <div className="space-y-3">
                  <DialogTitle className="max-w-2xl text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 sm:text-4xl [font-family:'Orbitron',system-ui,sans-serif]">
                    {t('builder.regenerate.selectDialog.title')}
                  </DialogTitle>
                  <DialogDescription className="max-w-2xl text-sm leading-6 text-cyan-100/70 sm:text-base font-mono">
                    {t('builder.regenerate.selectDialog.subtitle')}
                  </DialogDescription>
                </div>

                {hasItems && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border border-cyan-400/30 bg-slate-950/50 backdrop-blur-sm px-4 py-3">
                      <p className="text-xs font-bold tracking-[0.25em] text-cyan-400 font-mono">
                        {t('builder.regenerate.selectDialog.experience').toUpperCase()}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-cyan-100">
                        {experienceItems.length}
                      </p>
                    </div>
                    <div className="border border-fuchsia-400/30 bg-slate-950/50 backdrop-blur-sm px-4 py-3">
                      <p className="text-xs font-bold tracking-[0.25em] text-fuchsia-400 font-mono">
                        {t('builder.regenerate.selectDialog.projects').toUpperCase()}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-fuchsia-100">
                        {projectItems.length}
                      </p>
                    </div>
                    <div className="border border-amber-400/30 bg-slate-950/50 backdrop-blur-sm px-4 py-3">
                      <p className="text-xs font-bold tracking-[0.25em] text-amber-400 font-mono">
                        {t('builder.regenerate.selectDialog.skills').toUpperCase()}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-amber-100">{skillsItem ? 1 : 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="max-h-[58vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-[#0a0a0f]">
              {!hasItems && (
                <div className="border-2 border-dashed border-cyan-400/30 bg-slate-950/30 backdrop-blur-sm px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-cyan-400/40 bg-cyan-500/10">
                    <Sparkles className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-cyan-200 font-mono">
                    {t('builder.regenerate.selectDialog.noItemsAvailable')}
                  </div>
                </div>
              )}

              {experienceItems.length > 0 && (
                <SectionCard
                  sectionKey="experience"
                  title={t('builder.regenerate.selectDialog.experience')}
                  count={experienceItems.length}
                  expanded={expandedSections.has('experience')}
                  onToggle={() => toggleSection('experience')}
                  icon={Briefcase}
                  accent="cyan"
                >
                  {experienceItems.map((item) => (
                    <ItemRow
                      key={item.item_id}
                      item={item}
                      isSelected={isSelected(item)}
                      onToggle={() => toggleItem(item)}
                    />
                  ))}
                </SectionCard>
              )}

              {projectItems.length > 0 && (
                <SectionCard
                  sectionKey="projects"
                  title={t('builder.regenerate.selectDialog.projects')}
                  count={projectItems.length}
                  expanded={expandedSections.has('projects')}
                  onToggle={() => toggleSection('projects')}
                  icon={FolderKanban}
                  accent="fuchsia"
                >
                  {projectItems.map((item) => (
                    <ItemRow
                      key={item.item_id}
                      item={item}
                      isSelected={isSelected(item)}
                      onToggle={() => toggleItem(item)}
                    />
                  ))}
                </SectionCard>
              )}

              {skillsItem && (
                <SectionCard
                  sectionKey="skills"
                  title={t('builder.regenerate.selectDialog.skills')}
                  count={1}
                  expanded={expandedSections.has('skills')}
                  onToggle={() => toggleSection('skills')}
                  icon={Lightbulb}
                  accent="amber"
                >
                  <ItemRow
                    item={skillsItem}
                    isSelected={isSelected(skillsItem)}
                    onToggle={() => toggleItem(skillsItem)}
                  />
                </SectionCard>
              )}
            </div>

            <DialogFooter className="border-t-2 border-cyan-400/30 bg-slate-950/80 backdrop-blur-sm px-4 py-4 sm:px-5">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-cyan-300/70 sm:text-sm font-mono">
                  {selectedItems.length > 0 ? (
                    <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/30 px-3 py-1.5 text-emerald-200">
                      <Check className="h-4 w-4" />
                      {selectedItems.length} selected
                    </span>
                  ) : (
                    <span className="text-cyan-400/60">
                      {t('builder.regenerate.selectDialog.subtitle')}
                    </span>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="min-h-11 bg-slate-950/50 hover:bg-slate-900/70 text-cyan-300 hover:text-cyan-200 font-bold tracking-[0.15em] text-sm border border-cyan-400/40 hover:border-cyan-400 backdrop-blur-sm transition-all font-mono"
                    >
                      {t('common.cancel').toUpperCase()}
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={onContinue}
                    disabled={selectedItems.length === 0}
                    className="min-h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-[0.15em] text-sm border border-cyan-400/40 hover:border-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative z-10">
                      {t('builder.regenerate.selectDialog.continueButton').toUpperCase()}
                    </span>
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * SectionCard - Group of selectable items
 */
interface SectionCardProps {
  sectionKey: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'cyan' | 'fuchsia' | 'amber';
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  count,
  expanded,
  onToggle,
  icon: Icon,
  accent,
  children,
}) => {
  const accentClasses = {
    cyan: {
      shell: 'border-cyan-400/30 bg-slate-950/50',
      icon: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
      badge: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
      glow: 'from-cyan-400/30 via-cyan-400/10 to-transparent',
    },
    fuchsia: {
      shell: 'border-fuchsia-400/30 bg-slate-950/50',
      icon: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300',
      badge: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200',
      glow: 'from-fuchsia-400/30 via-fuchsia-400/10 to-transparent',
    },
    amber: {
      shell: 'border-amber-400/30 bg-slate-950/50',
      icon: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
      badge: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
      glow: 'from-amber-400/30 via-amber-400/10 to-transparent',
    },
  }[accent];

  return (
    <section className={cn('overflow-hidden border-2 backdrop-blur-sm', accentClasses.shell)}>
      <div className={cn('h-px w-full bg-gradient-to-r', accentClasses.glow)} />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center border-2',
              accentClasses.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-white uppercase">
                {title}
              </span>
              <span
                className={cn(
                  'border px-2.5 py-1 text-xs font-bold tracking-[0.2em] uppercase font-mono',
                  accentClasses.badge
                )}
              >
                {count}
              </span>
            </div>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/40 bg-slate-950/50 text-cyan-300">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t-2 border-white/10 bg-slate-950/30 p-2 sm:p-3">{children}</div>
      )}
    </section>
  );
};

/**
 * ItemRow - Individual selectable item row
 */
interface ItemRowProps {
  item: RegenerateItemInput;
  isSelected: boolean;
  onToggle: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, isSelected, onToggle }) => {
  const { t } = useTranslations();

  const contentCount = item.current_content.length;
  const itemCountKey =
    contentCount === 1
      ? 'builder.regenerate.selectDialog.itemCount.one'
      : 'builder.regenerate.selectDialog.itemCount.other';
  const itemCountLabel = t(itemCountKey).replace('{count}', String(contentCount));

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group w-full border-2 p-4 text-left transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-0',
        isSelected
          ? 'border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm'
          : 'border-cyan-400/20 bg-slate-950/30 hover:border-cyan-400/30 hover:bg-slate-950/50'
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-all',
            isSelected
              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
              : 'border-cyan-400/30 bg-slate-950/40 text-transparent group-hover:border-cyan-400/50'
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-cyan-100 sm:text-base font-mono">
                {item.title}
              </div>
              {item.subtitle && (
                <div className="mt-1 truncate text-xs text-cyan-300/60 sm:text-sm font-mono">
                  {item.subtitle}
                </div>
              )}
            </div>

            <div
              className={cn(
                'inline-flex w-fit shrink-0 border px-2.5 py-1 text-xs font-bold tracking-[0.15em] uppercase font-mono',
                isSelected
                  ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                  : 'border-cyan-400/20 bg-slate-950/50 text-cyan-400/60'
              )}
            >
              {itemCountLabel}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RegenerateDialog;
