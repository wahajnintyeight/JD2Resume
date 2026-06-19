'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldAlert,
  Wand2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type {
  ChangeDecision,
  ResumeDiffSummary,
  ResumeFieldDiff,
} from '@/components/common/resume_previewer_context';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  onConfirm: (decisions?: Record<number, ChangeDecision>) => void;
  diffSummary?: ResumeDiffSummary;
  detailedChanges?: ResumeFieldDiff[];
  errorMessage?: string;
  isSaving?: boolean;
}

export function DiffPreviewModal({
  isOpen,
  onClose,
  onReject,
  onConfirm,
  diffSummary,
  detailedChanges,
  errorMessage,
  isSaving = false,
}: DiffPreviewModalProps) {
  const { t } = useTranslations();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['title', 'summary', 'skills', 'descriptions', 'experience'])
  );
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [changeDecisions, setChangeDecisions] = useState<Record<number, ChangeDecision>>({});

  useEffect(() => {
    if (!detailedChanges || detailedChanges.length === 0) {
      setChangeDecisions({});
      return;
    }
    const nextDecisions: Record<number, ChangeDecision> = {};
    detailedChanges.forEach((_, index) => {
      nextDecisions[index] = 'pending';
    });
    setChangeDecisions(nextDecisions);
  }, [detailedChanges, isOpen]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateDecision = (index: number, decision: ChangeDecision) => {
    setChangeDecisions((prev) => {
      const current = prev[index] ?? 'pending';
      const nextDecision = current === decision ? 'pending' : decision;
      return { ...prev, [index]: nextDecision };
    });
  };

  const decisionLabels = {
    decision: t('tailor.diffModal.decisionLabel'),
    accept: t('tailor.diffModal.acceptChange'),
    reject: t('tailor.diffModal.rejectChange'),
    accepted: t('tailor.diffModal.decisionAccepted'),
    rejected: t('tailor.diffModal.decisionRejected'),
    pending: t('tailor.diffModal.decisionPending'),
  };

  const acceptAllChanges = () => {
    setChangeDecisions((prev) => {
      const next = { ...prev };
      detailedChanges?.forEach((_, index) => {
        next[index] = 'accepted';
      });
      return next;
    });
  };

  const acceptSectionChanges = (indices: number[]) => {
    setChangeDecisions((prev) => {
      const next = { ...prev };
      indices.forEach((index) => {
        next[index] = 'accepted';
      });
      return next;
    });
  };

  const allAccepted =
    detailedChanges &&
    detailedChanges.length > 0 &&
    detailedChanges.every((_, index) => changeDecisions[index] === 'accepted');

  const isSectionAccepted = (changes: { index: number }[]) =>
    changes.length > 0 && changes.every(({ index }) => changeDecisions[index] === 'accepted');

  if (!diffSummary || !detailedChanges) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="fixed inset-0 m-0 flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden border-0 bg-slate-950/70 p-0 outline-none backdrop-blur-xl">
          <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden bg-slate-950 text-slate-100 md:border-x md:border-white/10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_24%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.14),transparent_30%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            </div>

            <DialogHeader className="relative border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 text-left">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-2 text-amber-200">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl leading-tight text-white">
                    {t('tailor.missingDiffDialog.title')}
                  </DialogTitle>
                  <p className="mt-1 max-w-2xl text-xs text-slate-400">
                    {t('tailor.missingDiffDialog.description')}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="relative flex-1 p-4 sm:p-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('tailor.missingDiffDialog.confirmLabel')}
                    </p>
                    <p className="text-xs text-slate-300">
                      {t('tailor.missingDiffDialog.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-stretch gap-3 border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-6 sm:py-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-9 w-full rounded-xl border-white/15 bg-white/5 text-xs text-slate-100 hover:border-white/25 hover:bg-white/10 sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="warning"
                onClick={() => onConfirm()}
                className="h-9 w-full rounded-xl border border-amber-300/25 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-xs text-slate-950 sm:w-auto"
              >
                {t('tailor.missingDiffDialog.confirmLabel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const indexedChanges = detailedChanges.map((change, index) => ({ change, index }));
  const titleChanges = indexedChanges.filter((c) => c.change.field_type === 'title');
  const summaryChanges = indexedChanges.filter((c) => c.change.field_type === 'summary');
  const skillChanges = indexedChanges.filter((c) => c.change.field_type === 'skill');
  const descChanges = indexedChanges.filter((c) => c.change.field_type === 'description');
  const certChanges = indexedChanges.filter((c) => c.change.field_type === 'certification');
  const experienceChanges = indexedChanges.filter((c) => c.change.field_type === 'experience');
  const educationChanges = indexedChanges.filter((c) => c.change.field_type === 'education');
  const projectChanges = indexedChanges.filter((c) => c.change.field_type === 'project');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed inset-0 m-0 flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden border-0 bg-slate-950/70 p-0 outline-none backdrop-blur-xl">
        <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden bg-slate-950 text-slate-100 md:border-x md:border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.1),transparent_26%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.08),transparent_34%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/25 to-transparent" />
          </div>

          <DialogHeader className="relative shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
                    <Sparkles className="h-3 w-3" />
                    {t('tailor.diffModal.summary')}
                  </div>
                  <div>
                    <DialogTitle className="font-serif text-lg leading-tight text-white sm:text-xl">
                      {t('tailor.diffModal.title')}
                    </DialogTitle>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t('tailor.diffModal.subtitle')}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="success"
                  onClick={acceptAllChanges}
                  disabled={detailedChanges.length === 0 || allAccepted}
                  className="h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-3 text-xs text-emerald-300 hover:bg-emerald-500/25 sm:w-auto"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {t('tailor.diffModal.acceptAll')}
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                <button
                  onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left transition hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300">
                      {isStatsExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="block font-serif text-xs font-semibold text-white">
                        Change Summary
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500">
                        Statistics
                      </span>
                    </div>
                  </div>
                </button>
                {isStatsExpanded && (
                  <div className="border-t border-white/5 p-2.5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <StatCard
                        label={t('tailor.diffModal.skillsAdded')}
                        value={diffSummary.skills_added}
                        variant="success"
                      />
                      <StatCard
                        label={t('tailor.diffModal.skillsRemoved')}
                        value={diffSummary.skills_removed}
                        variant="warning"
                      />
                      <StatCard
                        label={t('tailor.diffModal.certificationsAdded')}
                        value={diffSummary.certifications_added}
                        variant="info"
                      />
                      <StatCard
                        label={t('tailor.diffModal.descriptionsModified')}
                        value={diffSummary.descriptions_modified}
                        variant="info"
                      />
                      <StatCard
                        label={t('tailor.diffModal.titleChanged')}
                        value={diffSummary.title_changed ? 1 : 0}
                        variant={diffSummary.title_changed ? 'info' : 'success'}
                      />
                      <StatCard
                        label={t('tailor.diffModal.highRiskChanges')}
                        value={diffSummary.high_risk_changes}
                        variant={diffSummary.high_risk_changes > 0 ? 'danger' : 'success'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {diffSummary.high_risk_changes > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-300 shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                        {t('tailor.diffModal.warningTitle', {
                          count: diffSummary.high_risk_changes,
                        })}
                      </p>
                      <p className="text-xs text-amber-100/80 leading-normal mt-0.5">
                        {t('tailor.diffModal.warningMessage')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">
                  {errorMessage}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="relative flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="space-y-3">
              {[
                {
                  id: 'title',
                  title: t('tailor.diffModal.titleChanges'),
                  items: titleChanges,
                  isGrid: true,
                },
                {
                  id: 'summary',
                  title: t('tailor.diffModal.summaryChanges'),
                  items: summaryChanges,
                  isGrid: false,
                },
                {
                  id: 'skills',
                  title: t('tailor.diffModal.skillChanges'),
                  items: skillChanges,
                  isGrid: true,
                },
                {
                  id: 'experience',
                  title: t('tailor.diffModal.experienceChanges'),
                  items: experienceChanges,
                  isGrid: false,
                },
                {
                  id: 'descriptions',
                  title: t('tailor.diffModal.descriptionChanges'),
                  items: descChanges,
                  isGrid: false,
                },
                {
                  id: 'education',
                  title: t('tailor.diffModal.educationChanges'),
                  items: educationChanges,
                  isGrid: false,
                },
                {
                  id: 'project',
                  title: t('tailor.diffModal.projectChanges'),
                  items: projectChanges,
                  isGrid: false,
                },
                {
                  id: 'certifications',
                  title: t('tailor.diffModal.certificationChanges'),
                  items: certChanges,
                  isGrid: true,
                },
              ].map(
                (section) =>
                  section.items.length > 0 && (
                    <ChangeSection
                      key={section.id}
                      title={section.title}
                      count={section.items.length}
                      isExpanded={expandedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      onAcceptAll={() => acceptSectionChanges(section.items.map((i) => i.index))}
                      acceptLabel={t('tailor.diffModal.acceptSection')}
                      isAccepted={isSectionAccepted(section.items)}
                      isGrid={section.isGrid}
                    >
                      {section.items.map(({ change, index }) => (
                        <ChangeItem
                          key={index}
                          change={change}
                          decision={changeDecisions[index] ?? 'pending'}
                          onDecisionChange={(d: ChangeDecision) => updateDecision(index, d)}
                          labels={decisionLabels}
                        />
                      ))}
                    </ChangeSection>
                  )
              )}
            </div>
          </div>

          <div className="relative flex shrink-0 flex-col items-stretch gap-3 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-xl sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <Button
              variant="outline"
              onClick={onReject}
              className="h-9 w-full justify-center gap-1.5 rounded-lg border-white/10 bg-white/5 text-xs text-slate-100 hover:border-white/20 hover:bg-white/10 sm:w-auto"
            >
              <X className="h-3.5 w-3.5" />
              {t('tailor.diffModal.rejectButton')}
            </Button>
            <Button
              onClick={() => onConfirm(changeDecisions)}
              disabled={isSaving}
              className="h-9 w-full justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 text-xs text-slate-950 sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {t('tailor.diffModal.confirmButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant: string }) {
  const colors: Record<string, string> = {
    success: 'border-emerald-500/15 bg-emerald-500/5 text-emerald-300',
    warning: 'border-amber-500/15 bg-amber-500/5 text-amber-300',
    danger: 'border-red-500/15 bg-red-500/5 text-red-300',
    info: 'border-cyan-500/15 bg-cyan-500/5 text-cyan-300',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-2 px-2.5 shadow-sm backdrop-blur-sm transition-all hover:bg-white/[0.02]',
        colors[variant]
      )}
    >
      <div className="text-base font-bold tracking-tight sm:text-lg">{value}</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider opacity-80 sm:text-[9px]">
        {label}
      </div>
    </div>
  );
}

function ChangeSection({
  title,
  count,
  isExpanded,
  onToggle,
  onAcceptAll,
  acceptLabel,
  isAccepted,
  isGrid,
  children,
}: any) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-2 border-b border-white/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center justify-between rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300">
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </div>
            <div>
              <span className="block font-serif text-[14px] font-medium text-white">{title}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">
                {count} items
              </span>
            </div>
          </div>
        </button>
        <Button
          size="sm"
          variant="success"
          onClick={onAcceptAll}
          disabled={isAccepted}
          className="h-7 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs text-emerald-300 hover:bg-emerald-500/20 sm:w-auto"
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          {acceptLabel}
        </Button>
      </div>
      {isExpanded && (
        <div
          className={cn(
            'p-3 sm:p-4',
            isGrid
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
              : 'grid grid-cols-1 xl:grid-cols-2 gap-4'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ChangeItem({ change, decision, onDecisionChange, labels }: any) {
  const isShortField = ['skill', 'certification', 'title'].includes(change.field_type);

  const typeStyles: Record<string, string> = {
    added:
      'border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent',
    removed:
      'border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] via-transparent to-transparent',
    modified:
      'border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-transparent',
  };

  const boxPadding = isShortField ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:border-white/15',
        typeStyles[change.change_type]
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider',
              change.change_type === 'added' &&
                'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
              change.change_type === 'removed' && 'border-rose-500/30 bg-rose-500/15 text-rose-300',
              change.change_type === 'modified' && 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
            )}
          >
            {change.change_type}
          </div>
          <div className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-fuchsia-300">
            <span className="inline-flex items-center gap-1">
              <Wand2 className="h-2.5 w-2.5" />
              {change.field_type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => onDecisionChange('accepted')}
            className={cn(
              'h-[26px] rounded-lg text-[10px] px-2 font-medium transition-all duration-200',
              decision === 'accepted'
                ? 'bg-emerald-500 text-white shadow-sm border-transparent hover:bg-emerald-600'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            )}
          >
            {labels.accept}
          </Button>
          <Button
            size="sm"
            onClick={() => onDecisionChange('rejected')}
            className={cn(
              'h-[26px] rounded-lg text-[10px] px-2 font-medium transition-all duration-200',
              decision === 'rejected'
                ? 'bg-red-500 text-white shadow-sm border-transparent hover:bg-red-600'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            )}
          >
            {labels.reject}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'p-2.5',
          isShortField
            ? 'grid grid-cols-[1fr_auto_1fr] items-center gap-2'
            : 'grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2.5'
        )}
      >
        <div
          className={cn(
            'rounded-lg border text-red-200/80',
            change.original_value
              ? 'border-red-500/10 bg-red-500/[0.03]'
              : 'border-white/5 bg-white/[0.01]',
            boxPadding
          )}
        >
          {change.original_value ? (
            <div
              className={cn(
                'leading-relaxed line-through break-words',
                isShortField ? 'text-xs font-mono font-medium' : 'text-[13px]'
              )}
            >
              {change.original_value}
            </div>
          ) : (
            <div className="text-xs italic text-slate-600">—</div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-cyan-400">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        <div
          className={cn(
            'rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04]',
            boxPadding
          )}
        >
          <div
            className={cn(
              'leading-relaxed text-slate-100 break-words',
              isShortField ? 'text-xs font-mono font-medium' : 'text-[13px]'
            )}
          >
            {change.new_value}
          </div>
        </div>
      </div>
    </div>
  );
}
