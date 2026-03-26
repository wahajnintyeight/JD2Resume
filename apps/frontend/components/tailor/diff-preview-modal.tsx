'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslations } from '@/lib/i18n';
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
    detailedChanges && detailedChanges.length > 0 &&
    detailedChanges.every((_, index) => changeDecisions[index] === 'accepted');

  const isSectionAccepted = (changes: { index: number }[]) =>
    changes.length > 0 && changes.every(({ index }) => changeDecisions[index] === 'accepted');

  if (!diffSummary || !detailedChanges) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="fixed inset-0 m-0 flex h-screen w-screen max-w-none flex-col overflow-hidden bg-black/40 p-0 outline-none backdrop-blur-sm gap-0">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] md:border-x">
            <DialogHeader className="border-b-2 border-black pb-4 bg-white px-4 sm:px-6 pt-4 sm:pt-6 text-left">
              <DialogTitle className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight">
                {t('tailor.missingDiffDialog.title')}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 p-6">
              <div className="border-2 border-black bg-white p-4 font-mono text-xs text-gray-700">
                {t('tailor.missingDiffDialog.description')}
              </div>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('tailor.missingDiffDialog.confirmLabel')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 p-4 border-t-2 border-black bg-white sm:px-6 py-4">
              <Button variant="outline" onClick={onClose} className="gap-2 w-full sm:w-auto">
                {t('common.cancel')}
              </Button>
              <Button variant="warning" onClick={() => onConfirm()} className="gap-2 w-full sm:w-auto">
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
      <DialogContent className="fixed inset-0 m-0 flex h-screen w-screen max-w-none flex-col overflow-hidden bg-black/40 p-0 outline-none backdrop-blur-sm gap-0">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] md:border-x">
          <DialogHeader className="shrink-0 border-b-2 border-black bg-white p-4 text-left sm:p-6 lg:p-8">
            <DialogTitle className="font-serif text-xl font-bold uppercase tracking-tight sm:text-2xl">
              {t('tailor.diffModal.title')}
            </DialogTitle>
            <p className="mt-2 font-mono text-[11px] text-gray-600 sm:text-xs">
              {'// '}
              {t('tailor.diffModal.subtitle')}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* Summary cards */}
            <div className="border-2 border-black bg-white p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1D4ED8]"></div>
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                    {t('tailor.diffModal.summary')}
                  </h3>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="success"
                  onClick={acceptAllChanges}
                  disabled={detailedChanges.length === 0 || allAccepted}
                  className="w-full sm:w-auto"
                >
                  {t('tailor.diffModal.acceptAll')}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label={t('tailor.diffModal.skillsAdded')} value={diffSummary.skills_added} variant="success" />
                <StatCard label={t('tailor.diffModal.skillsRemoved')} value={diffSummary.skills_removed} variant="warning" />
                <StatCard label={t('tailor.diffModal.certificationsAdded')} value={diffSummary.certifications_added} variant="info" />
                <StatCard label={t('tailor.diffModal.descriptionsModified')} value={diffSummary.descriptions_modified} variant="info" />
                <StatCard label={t('tailor.diffModal.titleChanged')} value={diffSummary.title_changed ? 1 : 0} variant={diffSummary.title_changed ? 'info' : 'success'} />
                <StatCard label={t('tailor.diffModal.highRiskChanges')} value={diffSummary.high_risk_changes} variant={diffSummary.high_risk_changes > 0 ? 'danger' : 'success'} />
              </div>

              {diffSummary.high_risk_changes > 0 && (
                <div className="mt-4 border-2 border-[#F97316] bg-[#FFF7ED] p-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-xs font-bold uppercase text-[#C2410C]">
                      {t('tailor.diffModal.warningTitle', { count: diffSummary.high_risk_changes })}
                    </p>
                    <p className="font-mono text-xs text-[#C2410C] mt-1">
                      {t('tailor.diffModal.warningMessage')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 border-2 border-red-600 bg-red-50 p-3 font-mono text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Detailed sections */}
            <div className="mt-4 space-y-4">
              {[
                { id: 'title', title: t('tailor.diffModal.titleChanges'), items: titleChanges },
                { id: 'summary', title: t('tailor.diffModal.summaryChanges'), items: summaryChanges },
                { id: 'skills', title: t('tailor.diffModal.skillChanges'), items: skillChanges },
                { id: 'experience', title: t('tailor.diffModal.experienceChanges'), items: experienceChanges },
                { id: 'descriptions', title: t('tailor.diffModal.descriptionChanges'), items: descChanges },
                { id: 'education', title: t('tailor.diffModal.educationChanges'), items: educationChanges },
                { id: 'project', title: t('tailor.diffModal.projectChanges'), items: projectChanges },
                { id: 'certifications', title: t('tailor.diffModal.certificationChanges'), items: certChanges },
              ].map(section => section.items.length > 0 && (
                <ChangeSection
                  key={section.id}
                  title={section.title}
                  count={section.items.length}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  onAcceptAll={() => acceptSectionChanges(section.items.map(i => i.index))}
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
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 p-4 border-t-2 border-black bg-white sm:px-6 lg:px-8 py-4">
            <Button variant="outline" onClick={onReject} className="gap-2 w-full sm:w-auto justify-center">
              <X className="w-4 h-4" />
              {t('tailor.diffModal.rejectButton')}
            </Button>
            <Button 
              onClick={() => onConfirm(changeDecisions)}
              disabled={isSaving}
              className="gap-2 bg-[#15803D] hover:bg-[#166534] w-full sm:w-auto justify-center"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
    success: 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]',
    warning: 'border-[#F97316] bg-[#FFF7ED] text-[#F97316]',
    danger: 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]',
    info: 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]',
  };
  return (
    <div className={`border-2 p-3 ${colors[variant]}`}>
      <div className="font-mono text-xl sm:text-2xl font-bold">{value}</div>
      <div className="font-mono text-[10px] sm:text-xs uppercase mt-1">{label}</div>
    </div>
  );
}

function ChangeSection({ title, count, isExpanded, onToggle, onAcceptAll, acceptLabel, isAccepted, children }: any) {
  return (
    <div className="border-2 border-black bg-white">
      <div className="flex flex-col sm:flex-row">
        <button onClick={onToggle} className="flex-1 flex items-center justify-between p-3 hover:bg-gray-50 text-left">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-mono text-sm font-bold uppercase">{title} ({count})</span>
          </div>
        </button>
        <div className="p-2 sm:border-l-2 border-black">
          <Button size="sm" variant="success" onClick={onAcceptAll} disabled={isAccepted} className="w-full">{acceptLabel}</Button>
        </div>
      </div>
      {isExpanded && <div className="border-t-2 border-black p-4 space-y-3">{children}</div>}
    </div>
  );
}

function ChangeItem({ change, decision, onDecisionChange, labels }: any) {
    const typeColors: Record<string, string> = {
      added: 'border-l-4 border-[#15803D] bg-[#F0FDF4]',
      removed: 'border-l-4 border-[#DC2626] bg-[#FEF2F2]',
      modified: 'border-l-4 border-[#1D4ED8] bg-[#EFF6FF]',
    };
    return (
      <div className={`border-2 border-black p-3 ${typeColors[change.change_type]}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {change.original_value && <div className="line-through text-red-600 text-sm mb-1">{change.original_value}</div>}
            <div className="text-gray-900 text-sm">{change.new_value}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t-2 border-black flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase">{labels.decision}:</span>
            <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${decision === 'accepted' ? 'bg-green-700 text-white' : decision === 'rejected' ? 'bg-red-700 text-white' : 'bg-gray-100'}`}>{labels[decision]}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={decision === 'accepted' ? 'success' : 'outline'} onClick={() => onDecisionChange('accepted')}>{labels.accept}</Button>
            <Button size="sm" variant={decision === 'rejected' ? 'destructive' : 'outline'} onClick={() => onDecisionChange('rejected')}>{labels.reject}</Button>
          </div>
        </div>
      </div>
    );
}
