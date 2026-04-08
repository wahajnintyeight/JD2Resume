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

            <DialogHeader className="relative border-b border-white/10 px-4 pb-5 pt-5 text-left sm:px-6 sm:pb-6 sm:pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-2.5 text-amber-200 shadow-[0_10px_30px_rgba(245,158,11,0.12)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-2xl leading-tight text-white sm:text-3xl">
                    {t('tailor.missingDiffDialog.title')}
                  </DialogTitle>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                    {t('tailor.missingDiffDialog.description')}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="relative flex-1 p-4 sm:p-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-2 text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      {t('tailor.missingDiffDialog.confirmLabel')}
                    </p>
                    <p className="text-sm leading-6 text-slate-200">
                      {t('tailor.missingDiffDialog.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-stretch gap-3 border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-11 w-full rounded-2xl border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10 sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="warning"
                onClick={() => onConfirm()}
                className="h-11 w-full rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-slate-950 shadow-[0_12px_35px_rgba(245,158,11,0.22)] sm:w-auto"
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.12),transparent_34%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/25 to-transparent" />
          </div>

          <DialogHeader className="relative shrink-0 border-b border-white/10 px-4 pb-5 pt-5 text-left sm:px-6 sm:pb-6 sm:pt-6 lg:px-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('tailor.diffModal.summary')}
                  </div>
                  <div>
                    <DialogTitle className="font-serif text-2xl leading-tight text-white sm:text-3xl">
                      {t('tailor.diffModal.title')}
                    </DialogTitle>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
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
                  className="h-11 w-full rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 text-emerald-100 hover:bg-emerald-400/20 sm:w-auto"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('tailor.diffModal.acceptAll')}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
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

              {diffSummary.high_risk_changes > 0 && (
                <div className="rounded-[24px] border border-amber-400/25 bg-gradient-to-br from-amber-400/12 via-amber-300/8 to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-amber-300/25 bg-amber-300/12 p-2 text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100">
                        {t('tailor.diffModal.warningTitle', { count: diffSummary.high_risk_changes })}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-50/90">
                        {t('tailor.diffModal.warningMessage')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-[22px] border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {errorMessage}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="relative flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="space-y-4">
              {[
                { id: 'title', title: t('tailor.diffModal.titleChanges'), items: titleChanges },
                {
                  id: 'summary',
                  title: t('tailor.diffModal.summaryChanges'),
                  items: summaryChanges,
                },
                { id: 'skills', title: t('tailor.diffModal.skillChanges'), items: skillChanges },
                {
                  id: 'experience',
                  title: t('tailor.diffModal.experienceChanges'),
                  items: experienceChanges,
                },
                {
                  id: 'descriptions',
                  title: t('tailor.diffModal.descriptionChanges'),
                  items: descChanges,
                },
                {
                  id: 'education',
                  title: t('tailor.diffModal.educationChanges'),
                  items: educationChanges,
                },
                {
                  id: 'project',
                  title: t('tailor.diffModal.projectChanges'),
                  items: projectChanges,
                },
                {
                  id: 'certifications',
                  title: t('tailor.diffModal.certificationChanges'),
                  items: certChanges,
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

          <div className="relative flex shrink-0 flex-col items-stretch gap-3 border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <Button
              variant="outline"
              onClick={onReject}
              className="h-11 w-full justify-center gap-2 rounded-2xl border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10 sm:w-auto"
            >
              <X className="h-4 w-4" />
              {t('tailor.diffModal.rejectButton')}
            </Button>
            <Button
              onClick={() => onConfirm(changeDecisions)}
              disabled={isSaving}
              className="h-11 w-full justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 text-slate-950 shadow-[0_12px_35px_rgba(34,211,238,0.28)] hover:shadow-[0_16px_45px_rgba(34,211,238,0.38)] sm:w-auto"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
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
    success:
      'border-emerald-400/20 bg-gradient-to-br from-emerald-400/14 via-emerald-400/8 to-transparent text-emerald-100',
    warning:
      'border-amber-400/20 bg-gradient-to-br from-amber-400/14 via-amber-400/8 to-transparent text-amber-100',
    danger:
      'border-red-400/20 bg-gradient-to-br from-red-400/14 via-red-400/8 to-transparent text-red-100',
    info: 'border-cyan-400/20 bg-gradient-to-br from-cyan-400/14 via-cyan-400/8 to-transparent text-cyan-100',
  };

  return (
    <div
      className={cn(
        'rounded-[22px] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-4',
        colors[variant]
      )}
    >
      <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-current/80 sm:text-[11px]">
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
  children,
}: any) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 border-b border-white/8 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center justify-between rounded-2xl px-1 py-1 text-left transition hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <div>
              <span className="block font-serif text-lg text-white">{title}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{count}</span>
            </div>
          </div>
        </button>
        <Button
          size="sm"
          variant="success"
          onClick={onAcceptAll}
          disabled={isAccepted}
          className="h-10 w-full rounded-2xl border border-emerald-300/20 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20 sm:w-auto"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {acceptLabel}
        </Button>
      </div>
      {isExpanded && <div className="space-y-3 p-3 sm:p-4">{children}</div>}
    </div>
  );
}

function ChangeItem({ change, decision, onDecisionChange, labels }: any) {
  const typeStyles: Record<string, string> = {
    added: 'border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-transparent',
    removed: 'border-red-400/20 bg-gradient-to-br from-red-400/[0.08] via-transparent to-transparent',
    modified: 'border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-transparent',
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border shadow-[0_12px_40px_rgba(2,6,23,0.25)]',
        typeStyles[change.change_type]
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
            {change.change_type}
          </div>
          <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-100">
            <span className="inline-flex items-center gap-1">
              <Wand2 className="h-3 w-3" />
              {change.field_type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{labels.decision}</span>
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
              decision === 'accepted' && 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
              decision === 'rejected' && 'border-red-300/25 bg-red-400/15 text-red-100',
              decision === 'pending' && 'border-white/10 bg-white/5 text-slate-300'
            )}
          >
            {labels[decision]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-[20px] border border-red-400/15 bg-red-400/[0.05] p-4">
          {change.original_value ? (
            <div className="text-sm leading-6 text-red-100/90 line-through">{change.original_value}</div>
          ) : (
            <div className="text-sm italic leading-6 text-slate-500">—</div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-[20px] border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
          <div className="text-sm leading-6 text-slate-100">{change.new_value}</div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-white/8 px-4 py-3 sm:flex-row sm:items-center">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{labels.decision}</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            variant={decision === 'accepted' ? 'success' : 'outline'}
            onClick={() => onDecisionChange('accepted')}
            className={cn(
              'rounded-2xl',
              decision !== 'accepted' && 'border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
            )}
          >
            {labels.accept}
          </Button>
          <Button
            size="sm"
            variant={decision === 'rejected' ? 'destructive' : 'outline'}
            onClick={() => onDecisionChange('rejected')}
            className={cn(
              'rounded-2xl',
              decision !== 'rejected' && 'border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
            )}
          >
            {labels.reject}
          </Button>
        </div>
      </div>
    </div>
  );
}