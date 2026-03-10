'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslations } from '@/lib/i18n';
import type {
  ResumeDiffSummary,
  ResumeFieldDiff,
} from '@/components/common/resume_previewer_context';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  onConfirm: () => void;
  diffSummary?: ResumeDiffSummary;
  detailedChanges?: ResumeFieldDiff[];
  errorMessage?: string;
  isSaving?: boolean;
}

type ChangeDecision = 'accepted' | 'rejected' | 'pending';

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

  if (!diffSummary || !detailedChanges) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 bg-[#F0F0E8] border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
          <DialogHeader className="border-b-2 border-black pb-4 bg-white -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 text-left">
            <DialogTitle className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight">
              {t('tailor.missingDiffDialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 border-2 border-black bg-white p-4 font-mono text-xs text-gray-700">
            {t('tailor.missingDiffDialog.description')}
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('tailor.missingDiffDialog.confirmLabel')}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 pt-4 border-t-2 border-black bg-white -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4">
            <Button variant="outline" onClick={onClose} className="gap-2 w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button variant="warning" onClick={onConfirm} className="gap-2 w-full sm:w-auto">
              {t('tailor.missingDiffDialog.confirmLabel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

  const indexedChanges = detailedChanges.map((change, index) => ({ change, index }));

  // Group changes by type
  const titleChanges = indexedChanges.filter((c) => c.change.field_type === 'title');
  const summaryChanges = indexedChanges.filter((c) => c.change.field_type === 'summary');
  const skillChanges = indexedChanges.filter((c) => c.change.field_type === 'skill');
  const descChanges = indexedChanges.filter((c) => c.change.field_type === 'description');
  const certChanges = indexedChanges.filter((c) => c.change.field_type === 'certification');
  const experienceChanges = indexedChanges.filter((c) => c.change.field_type === 'experience');
  const educationChanges = indexedChanges.filter((c) => c.change.field_type === 'education');
  const projectChanges = indexedChanges.filter((c) => c.change.field_type === 'project');

  const acceptAllChanges = () => {
    setChangeDecisions((prev) => {
      const next = { ...prev };
      detailedChanges.forEach((_, index) => {
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
    detailedChanges.length > 0 &&
    detailedChanges.every((_, index) => changeDecisions[index] === 'accepted');

  const isSectionAccepted = (changes: { index: number }[]) =>
    changes.length > 0 && changes.every(({ index }) => changeDecisions[index] === 'accepted');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 bg-[#F0F0E8] border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
        <DialogHeader className="border-b-2 border-black pb-4 bg-white -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 text-left">
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight">
            {t('tailor.diffModal.title')}
          </DialogTitle>
          <p className="font-mono text-[11px] sm:text-xs text-gray-600 mt-2">
            {'// '}
            {t('tailor.diffModal.subtitle')}
          </p>
        </DialogHeader>

        {/* Summary cards */}
        <div className="border-2 border-black bg-white p-3 sm:p-4 mt-4">
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
              className="w-full sm:w-auto justify-center"
            >
              {t('tailor.diffModal.acceptAll')}
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 sm:pb-0">
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.skillsAdded')}
                value={diffSummary.skills_added}
                variant="success"
              />
            </div>
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.skillsRemoved')}
                value={diffSummary.skills_removed}
                variant="warning"
              />
            </div>
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.certificationsAdded')}
                value={diffSummary.certifications_added}
                variant="info"
              />
            </div>
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.descriptionsModified')}
                value={diffSummary.descriptions_modified}
                variant="info"
              />
            </div>
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.titleChanged')}
                value={diffSummary.title_changed ? 1 : 0}
                variant={diffSummary.title_changed ? 'info' : 'success'}
              />
            </div>
            <div className="min-w-[140px] sm:min-w-0">
              <StatCard
                label={t('tailor.diffModal.highRiskChanges')}
                value={diffSummary.high_risk_changes}
                variant={diffSummary.high_risk_changes > 0 ? 'danger' : 'success'}
              />
            </div>
          </div>

          {diffSummary.high_risk_changes > 0 && (
            <div className="mt-4 border-2 border-[#F97316] bg-[#FFF7ED] p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-xs font-bold uppercase text-[#C2410C]">
                  {t('tailor.diffModal.warningTitle', {
                    count: diffSummary.high_risk_changes,
                  })}
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

        {/* Detailed changes list */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 space-y-3 sm:space-y-4">
          {/* Title changes */}
          {titleChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.titleChanges')}
              count={titleChanges.length}
              isExpanded={expandedSections.has('title')}
              onToggle={() => toggleSection('title')}
              onAcceptAll={() => acceptSectionChanges(titleChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(titleChanges)}
            >
              {titleChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Summary changes */}
          {summaryChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.summaryChanges')}
              count={summaryChanges.length}
              isExpanded={expandedSections.has('summary')}
              onToggle={() => toggleSection('summary')}
              onAcceptAll={() => acceptSectionChanges(summaryChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(summaryChanges)}
            >
              {summaryChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Skill changes */}
          {skillChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.skillChanges')}
              count={skillChanges.length}
              isExpanded={expandedSections.has('skills')}
              onToggle={() => toggleSection('skills')}
              onAcceptAll={() => acceptSectionChanges(skillChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(skillChanges)}
            >
              {skillChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Experience changes */}
          {experienceChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.experienceChanges')}
              count={experienceChanges.length}
              isExpanded={expandedSections.has('experience')}
              onToggle={() => toggleSection('experience')}
              onAcceptAll={() =>
                acceptSectionChanges(experienceChanges.map((item) => item.index))
              }
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(experienceChanges)}
            >
              {experienceChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Description changes */}
          {descChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.descriptionChanges')}
              count={descChanges.length}
              isExpanded={expandedSections.has('descriptions')}
              onToggle={() => toggleSection('descriptions')}
              onAcceptAll={() => acceptSectionChanges(descChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(descChanges)}
            >
              {descChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Education changes */}
          {educationChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.educationChanges')}
              count={educationChanges.length}
              isExpanded={expandedSections.has('education')}
              onToggle={() => toggleSection('education')}
              onAcceptAll={() => acceptSectionChanges(educationChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(educationChanges)}
            >
              {educationChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Project changes */}
          {projectChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.projectChanges')}
              count={projectChanges.length}
              isExpanded={expandedSections.has('project')}
              onToggle={() => toggleSection('project')}
              onAcceptAll={() => acceptSectionChanges(projectChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(projectChanges)}
            >
              {projectChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}

          {/* Certification changes */}
          {certChanges.length > 0 && (
            <ChangeSection
              title={t('tailor.diffModal.certificationChanges')}
              count={certChanges.length}
              isExpanded={expandedSections.has('certifications')}
              onToggle={() => toggleSection('certifications')}
              onAcceptAll={() => acceptSectionChanges(certChanges.map((item) => item.index))}
              acceptLabel={t('tailor.diffModal.acceptSection')}
              isAccepted={isSectionAccepted(certChanges)}
            >
              {certChanges.map(({ change, index }, idx) => {
                return (
                  <ChangeItem
                    key={`${change.field_path}-${idx}`}
                    change={change}
                    decision={changeDecisions[index] ?? 'pending'}
                    onDecisionChange={(decision) => updateDecision(index, decision)}
                    labels={decisionLabels}
                  />
                );
              })}
            </ChangeSection>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 pt-4 border-t-2 border-black bg-white -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4">
          <Button variant="outline" onClick={onReject} className="gap-2 w-full sm:w-auto justify-center">
            <X className="w-4 h-4" />
            {t('tailor.diffModal.rejectButton')}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSaving}
            className="gap-2 bg-[#15803D] hover:bg-[#166534] w-full sm:w-auto justify-center"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {t('tailor.diffModal.confirmButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component: stat card
interface StatCardProps {
  label: string;
  value: number;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, variant }: StatCardProps) {
  const colors = {
    success: 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]',
    warning: 'border-[#F97316] bg-[#FFF7ED] text-[#F97316]',
    danger: 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]',
    info: 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]',
  };

  return (
    <div className={`border-2 p-3 ${colors[variant]}`}>
      <div className="font-mono text-xl sm:text-2xl font-bold">{value}</div>
      <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

// Helper component: collapsible change section
interface ChangeSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAcceptAll: () => void;
  acceptLabel: string;
  isAccepted: boolean;
  children: React.ReactNode;
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
}: ChangeSectionProps) {
  return (
    <div className="border-2 border-black bg-white">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <button
          onClick={onToggle}
          className="w-full sm:flex-1 flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-mono text-sm font-bold uppercase tracking-wider">
              {title} ({count})
            </span>
          </div>
        </button>
        <div className="border-t-2 sm:border-t-0 sm:border-l-2 border-black p-2 sm:p-3 bg-white">
          <Button
            type="button"
            size="sm"
            variant="success"
            onClick={onAcceptAll}
            disabled={isAccepted}
            className="w-full justify-center"
          >
            {acceptLabel}
          </Button>
        </div>
      </div>

      {isExpanded && <div className="border-t-2 border-black p-4 space-y-3">{children}</div>}
    </div>
  );
}

// Helper component: change item
interface ChangeItemProps {
  change: ResumeFieldDiff;
  decision: ChangeDecision;
  onDecisionChange: (decision: ChangeDecision) => void;
  labels: {
    decision: string;
    accept: string;
    reject: string;
    accepted: string;
    rejected: string;
    pending: string;
  };
}

function ChangeItem({ change, decision, onDecisionChange, labels }: ChangeItemProps) {
  const typeColors = {
    added: 'border-l-4 border-[#15803D] bg-[#F0FDF4]',
    removed: 'border-l-4 border-[#DC2626] bg-[#FEF2F2]',
    modified: 'border-l-4 border-[#1D4ED8] bg-[#EFF6FF]',
  };

  const typeLabels = {
    added: '+',
    removed: '-',
    modified: '~',
  };

  const decisionStyles = {
    accepted: 'bg-[#15803D] text-white',
    rejected: 'bg-[#DC2626] text-white',
    pending: 'bg-[#F0F0E8] text-black',
  };

  const decisionText = {
    accepted: labels.accepted,
    rejected: labels.rejected,
    pending: labels.pending,
  }[decision];

  return (
    <div
      className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000000] ${typeColors[change.change_type]}`}
    >
      <div className="flex items-start gap-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-500">
          {typeLabels[change.change_type]}
        </span>
        <div className="flex-1 min-w-0">
          {change.original_value && (
            <div className="line-through text-[#DC2626] font-mono text-sm mb-1 break-words">
              {change.original_value}
            </div>
          )}
          {change.new_value && (
            <div className="text-gray-900 font-mono text-sm break-words">{change.new_value}</div>
          )}
        </div>
        {change.change_type === 'added' && change.confidence === 'high' && (
          <AlertTriangle className="w-4 h-4 text-[#F97316] shrink-0" />
        )}
      </div>
      <div className="mt-3 border-t-2 border-black pt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-600">
            {labels.decision}
          </span>
          <span
            className={`border-2 border-black px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider ${decisionStyles[decision]}`}
          >
            {decisionText}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={decision === 'accepted' ? 'success' : 'outline'}
            onClick={() => onDecisionChange('accepted')}
            aria-pressed={decision === 'accepted'}
            className="w-full sm:w-auto justify-center"
          >
            {labels.accept}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={decision === 'rejected' ? 'destructive' : 'outline'}
            onClick={() => onDecisionChange('rejected')}
            aria-pressed={decision === 'rejected'}
            className="w-full sm:w-auto justify-center"
          >
            {labels.reject}
          </Button>
        </div>
      </div>
    </div>
  );
}
