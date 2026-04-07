'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Resume, { ResumeData } from '@/components/dashboard/resume-component';
import {
  fetchResume,
  downloadResumePdf,
  getResumePdfUrl,
  deleteResume,
  retryProcessing,
  renameResume,
} from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';
import { ArrowLeft, Edit, Download, Loader2, AlertCircle, Sparkles, Pencil, Target } from 'lucide-react';
import { EnrichmentModal } from '@/components/enrichment/enrichment-modal';
import ATSScanDialog from '@/components/resume/ats-scan-dialog';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { withLocalizedDefaultSections } from '@/lib/utils/section-helpers';
import { useLanguage } from '@/lib/context/language-context';
import { downloadBlobAsFile, openUrlInNewTab, sanitizeFilename } from '@/lib/utils/download';

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export default function ResumeViewerPage() {
  const { t } = useTranslations();
  const { uiLanguage } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { decrementResumes, setHasMasterResume } = useStatusCache();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isMasterResume, setIsMasterResume] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
  const [showDownloadSuccessDialog, setShowDownloadSuccessDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [showATSScanDialog, setShowATSScanDialog] = useState(false);

  const resumeId = params?.id as string;

  const localizedResumeData = useMemo(() => {
    if (!resumeData) return null;
    return withLocalizedDefaultSections(resumeData, t);
  }, [resumeData, t]);

  useEffect(() => {
    if (!resumeId) return;

    const loadResume = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchResume(resumeId);

        // Get processing status
        const status = (data.raw_resume?.processing_status || 'pending') as ProcessingStatus;
        setProcessingStatus(status);

        // Capture title for editable display (always set to clear stale state)
        setResumeTitle(data.title ?? null);

        // Prioritize processed_resume if available (structured JSON)
        if (data.processed_resume) {
          setResumeData(data.processed_resume as ResumeData);
          setError(null);
        } else if (status === 'failed') {
          setError(t('resumeViewer.errors.processingFailed'));
        } else if (status === 'processing') {
          setError(t('resumeViewer.errors.stillProcessing'));
        } else if (data.raw_resume?.content) {
          // Try to parse raw_resume content as JSON (for tailored resumes stored as JSON)
          try {
            const parsed = JSON.parse(data.raw_resume.content);
            setResumeData(parsed as ResumeData);
          } catch {
            setError(t('resumeViewer.errors.notProcessedYet'));
          }
        } else {
          setError(t('resumeViewer.errors.noDataAvailable'));
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
        setError(t('resumeViewer.errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    loadResume();
    setIsMasterResume(localStorage.getItem('master_resume_id') === resumeId);
  }, [resumeId, t]);

  const handleRetryProcessing = async () => {
    if (!resumeId) return;
    setIsRetrying(true);
    try {
      const result = await retryProcessing(resumeId);
      if (result.processing_status === 'ready') {
        // Reload the page to show the processed resume
        window.location.reload();
      } else {
        setError(t('resumeViewer.errors.processingFailed'));
      }
    } catch (err) {
      console.error('Retry processing failed:', err);
      setError(t('resumeViewer.errors.processingFailed'));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleEdit = () => {
    router.push(`/builder?id=${resumeId}`);
  };

  const handleTitleSave = async () => {
    const trimmed = editingTitleValue.trim();
    if (!trimmed || trimmed === resumeTitle) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await renameResume(resumeId, trimmed);
      setResumeTitle(trimmed);
    } catch (err) {
      console.error('Failed to rename resume:', err);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  // Reload resume data after enrichment
  const reloadResumeData = async () => {
    try {
      const data = await fetchResume(resumeId);
      if (data.processed_resume) {
        setResumeData(data.processed_resume as ResumeData);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to reload resume:', err);
    }
  };

  const handleEnrichmentComplete = () => {
    setShowEnrichmentModal(false);
    reloadResumeData();
  };

  const handleDownload = async () => {
    try {
      const { blob, filename } = await downloadResumePdf(resumeId, undefined, uiLanguage);
      downloadBlobAsFile(blob, filename);
      setShowDownloadSuccessDialog(true);
    } catch (err) {
      console.error('Failed to download resume:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        const fallbackUrl = getResumePdfUrl(resumeId, undefined, uiLanguage);
        const didOpen = openUrlInNewTab(fallbackUrl);
        if (!didOpen) {
          alert(t('common.popupBlocked', { url: fallbackUrl }));
        }
        return;
      }
    }
  };

  const handleDeleteResume = async () => {
    try {
      setDeleteError(null);
      await deleteResume(resumeId);
      // Update cached counters
      decrementResumes();
      if (isMasterResume) {
        localStorage.removeItem('master_resume_id');
        setHasMasterResume(false);
      }
      setShowDeleteDialog(false);
      setShowDeleteSuccessDialog(true);
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setDeleteError(t('resumeViewer.errors.failedToDelete'));
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteSuccessConfirm = () => {
    setShowDeleteSuccessDialog(false);
    router.push('/dashboard');
  };

  const handleDownloadSuccessConfirm = () => {
    setShowDownloadSuccessDialog(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-7 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="text-center text-sm font-semibold tracking-[0.18em] text-slate-600">
            {t('resumeViewer.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    const isProcessing = processingStatus === 'processing';
    const isFailed = processingStatus === 'failed';

    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] p-4">
        <div
          className={cn(
            'w-full max-w-lg rounded-[2rem] border px-6 py-7 text-center shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-8',
            isProcessing
              ? 'border-blue-200/70 bg-white/85'
              : isFailed
                ? 'border-orange-200/70 bg-white/85'
                : 'border-red-200/70 bg-white/85'
          )}
        >
          <div className="mb-4 flex justify-center">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl',
                isProcessing
                  ? 'bg-blue-50 text-blue-600'
                  : isFailed
                    ? 'bg-orange-50 text-orange-500'
                    : 'bg-red-50 text-red-500'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <AlertCircle className="h-8 w-8" />
              )}
            </div>
          </div>
          <p
            className={cn(
              'mb-6 text-base font-semibold leading-7',
              isProcessing
                ? 'text-blue-700'
                : isFailed
                  ? 'text-orange-700'
                  : 'text-red-700'
            )}
          >
            {error || t('resumeViewer.resumeNotFound')}
          </p>
          <div className="flex flex-col gap-3">
            {isFailed && (
              <>
                <Button
                  onClick={handleRetryProcessing}
                  disabled={isRetrying}
                  className="h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    t('resumeViewer.retryProcessing')
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-11 rounded-2xl"
                >
                  {t('resumeViewer.deleteAndStartOver')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-50"
            >
              {t('resumeViewer.returnToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] font-sans">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%)]" />
          <div className="relative p-5 sm:p-6 lg:p-8">
            {/* Header Actions */}
            <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between no-print">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="h-10 rounded-full border border-white/80 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('nav.backToDashboard')}
                </Button>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {!isMasterResume ? <Target className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>{isMasterResume ? t('resumeViewer.enhanceResume') : 'Tailored resume'}</span>
                  </div>

                  {!isMasterResume && (
                    <div className="w-full max-w-3xl">
                      {isEditingTitle ? (
                        <div className="rounded-[1.5rem] border border-blue-200/70 bg-white/90 px-5 py-4 shadow-sm">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            maxLength={80}
                            placeholder={t('resumeViewer.titlePlaceholder')}
                            className="w-full bg-transparent text-center font-serif text-3xl font-semibold tracking-tight text-slate-900 outline-none md:text-4xl"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTitleValue(resumeTitle || '');
                            setIsEditingTitle(true);
                          }}
                          className="group inline-flex max-w-full items-center gap-3 rounded-[1.5rem] border border-transparent px-1 py-1 text-left transition-all hover:border-white/70"
                        >
                          <h2
                            className={cn(
                              'truncate font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl',
                              !resumeTitle && 'italic text-slate-300'
                            )}
                          >
                            {resumeTitle || t('resumeViewer.titlePlaceholder')}
                          </h2>
                          <Pencil
                            className={cn(
                              'h-5 w-5 shrink-0 text-slate-400 transition-all duration-300',
                              resumeTitle ? 'opacity-0 group-hover:opacity-100 group-hover:text-slate-600' : 'opacity-50'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isMasterResume && (
                  <Button
                    onClick={() => setShowEnrichmentModal(true)}
                    className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('resumeViewer.enhanceResume')}
                  </Button>
                )}
                {!isMasterResume && (
                  <Button
                    onClick={() => setShowATSScanDialog(true)}
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200 bg-white/90 px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    ATS Scan
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="h-11 rounded-2xl border-slate-200 bg-white/90 px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('dashboard.editResume')}
                </Button>
                <Button
                  variant="default"
                  onClick={handleDownload}
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('resumeViewer.downloadResume')}
                </Button>
              </div>
            </div>

            {/* Resume Viewer */}
            <div className="flex justify-center pb-6">
              <div className="relative w-full max-w-[230mm] rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.96))] p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:p-4 lg:p-5">
                <div className="resume-print relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70">
                  <Resume
                    resumeData={localizedResumeData || resumeData}
                    additionalSectionLabels={{
                      technicalSkills: t('resume.additionalLabels.technicalSkills'),
                      languages: t('resume.additionalLabels.languages'),
                      certifications: t('resume.additionalLabels.certifications'),
                      awards: t('resume.additionalLabels.awards'),
                    }}
                    sectionHeadings={{
                      summary: t('resume.sections.summary'),
                      experience: t('resume.sections.experience'),
                      education: t('resume.sections.education'),
                      projects: t('resume.sections.projects'),
                      certifications: t('resume.sections.certifications'),
                      skills: t('resume.sections.skillsOnly'),
                      languages: t('resume.sections.languages'),
                      awards: t('resume.sections.awards'),
                      links: t('resume.sections.links'),
                    }}
                    fallbackLabels={{ name: t('resume.defaults.name') }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2 no-print">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-full px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {isMasterResume
                  ? t('confirmations.deleteMasterResumeTitle')
                  : t('dashboard.deleteResume')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={
          isMasterResume ? t('confirmations.deleteMasterResumeTitle') : t('dashboard.deleteResume')
        }
        description={
          isMasterResume
            ? t('confirmations.deleteMasterResumeDescription')
            : t('confirmations.deleteResumeFromSystemDescription')
        }
        confirmLabel={t('confirmations.deleteResumeConfirmLabel')}
        cancelLabel={t('confirmations.keepResumeCancelLabel')}
        onConfirm={handleDeleteResume}
        variant="danger"
      />

      <ConfirmDialog
        open={showDeleteSuccessDialog}
        onOpenChange={setShowDeleteSuccessDialog}
        title={t('resumeViewer.deletedTitle')}
        description={
          isMasterResume
            ? t('resumeViewer.deletedDescriptionMaster')
            : t('resumeViewer.deletedDescriptionRegular')
        }
        confirmLabel={t('resumeViewer.returnToDashboard')}
        onConfirm={handleDeleteSuccessConfirm}
        variant="success"
        showCancelButton={false}
      />

      <ConfirmDialog
        open={showDownloadSuccessDialog}
        onOpenChange={setShowDownloadSuccessDialog}
        title={t('common.success')}
        description={t('builder.alerts.downloadSuccess')}
        confirmLabel={t('common.ok')}
        onConfirm={handleDownloadSuccessConfirm}
        variant="success"
        showCancelButton={false}
      />

      {deleteError && (
        <ConfirmDialog
          open={!!deleteError}
          onOpenChange={() => setDeleteError(null)}
          title={t('resumeViewer.deleteFailedTitle')}
          description={deleteError}
          confirmLabel={t('common.ok')}
          onConfirm={() => setDeleteError(null)}
          variant="danger"
          showCancelButton={false}
        />
      )}

      {/* Enrichment Modal - Only for master resume */}
      {isMasterResume && (
        <EnrichmentModal
          resumeId={resumeId}
          isOpen={showEnrichmentModal}
          onClose={() => setShowEnrichmentModal(false)}
          onComplete={handleEnrichmentComplete}
        />
      )}

      {/* ATS Scan Dialog - Only for tailored resumes */}
      {!isMasterResume && (
        <ATSScanDialog
          resumeId={resumeId}
          isOpen={showATSScanDialog}
          onClose={() => setShowATSScanDialog(false)}
        />
      )}
    </div>
  );
}
