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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F0E8]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-700 mb-4" />
        <p className="font-mono text-sm font-bold uppercase text-blue-700">
          {t('resumeViewer.loading')}
        </p>
      </div>
    );
  }

  if (error || !resumeData) {
    const isProcessing = processingStatus === 'processing';
    const isFailed = processingStatus === 'failed';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F0E8] p-4">
        <div
          className={`border p-6 text-center max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] ${
            isProcessing
              ? 'bg-blue-50 border-blue-200'
              : isFailed
                ? 'bg-orange-50 border-orange-200'
                : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex justify-center mb-4">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
            ) : isFailed ? (
              <AlertCircle className="w-8 h-8 text-orange-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <p
            className={`font-bold mb-4 ${
              isProcessing ? 'text-blue-700' : isFailed ? 'text-orange-700' : 'text-red-700'
            }`}
          >
            {error || t('resumeViewer.resumeNotFound')}
          </p>
          <div className="flex flex-col gap-2">
            {isFailed && (
              <>
                <Button onClick={handleRetryProcessing} disabled={isRetrying}>
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    t('resumeViewer.retryProcessing')
                  )}
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  {t('resumeViewer.deleteAndStartOver')}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              {t('resumeViewer.returnToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-[#F0F0E8] font-sans">
      <div className="mx-auto w-full max-w-6xl flex-1 border-x-2 border-black bg-white p-6 md:p-12 lg:p-16 shadow-[20px_0px_60px_-15px_rgba(0,0,0,0.05)]">
        {/* Header Actions */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-100 rounded-none border-2 border-transparent hover:border-black transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nav.backToDashboard')}
          </Button>

          <div className="flex flex-wrap gap-3">
            {isMasterResume && (
              <Button 
                onClick={() => setShowEnrichmentModal(true)} 
                className="h-12 px-6 border-2 border-black bg-blue-700 text-white font-bold uppercase tracking-widest hover:bg-blue-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('resumeViewer.enhanceResume')}
              </Button>
            )}
            {!isMasterResume && (
              <Button 
                onClick={() => setShowATSScanDialog(true)} 
                variant="outline" 
                className="h-12 px-6 border-2 border-black bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Target className="w-4 h-4 mr-2" />
                ATS Scan
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="h-12 px-6 border-2 border-black bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('dashboard.editResume')}
            </Button>
            <Button 
              variant="default" 
              onClick={handleDownload}
              className="h-12 px-6 border-2 border-black bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('resumeViewer.downloadResume')}
            </Button>
          </div>
        </div>

        {/* Editable Title (tailored resumes only) */}
        {!isMasterResume && (
          <div className="mb-10 no-print flex justify-center">
            <div className="w-full max-w-2xl text-center">
              {isEditingTitle ? (
                <div className="relative group">
                  <input
                    type="text"
                    value={editingTitleValue}
                    onChange={(e) => setEditingTitleValue(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    maxLength={80}
                    placeholder={t('resumeViewer.titlePlaceholder')}
                    className="w-full font-serif text-3xl md:text-4xl font-black uppercase tracking-tight border-b-4 border-black bg-transparent outline-none py-2 text-center"
                  />
                  <div className="absolute -bottom-1 left-0 w-full h-1 bg-blue-600 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingTitleValue(resumeTitle || '');
                    setIsEditingTitle(true);
                  }}
                  className="group relative inline-flex items-center gap-4 px-6 py-2 transition-all"
                >
                  <h2
                    className={cn(
                      "font-serif text-3xl md:text-4xl font-black uppercase tracking-tight text-black border-b-4 border-transparent group-hover:border-black transition-all",
                      !resumeTitle && "text-gray-300 italic"
                    )}
                  >
                    {resumeTitle || t('resumeViewer.titlePlaceholder')}
                  </h2>
                  <Pencil
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      resumeTitle ? "opacity-0 group-hover:opacity-100 group-hover:scale-110" : "opacity-40"
                    )}
                  />
                  <div className="absolute -inset-2 border-2 border-black opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Resume Viewer */}
        <div className="flex justify-center pb-12">
          <div className="relative group">
            {/* Decorative Corner Accents */}
            <div className="absolute -top-4 -left-4 w-12 h-12 border-l-4 border-t-4 border-black pointer-events-none z-10" />
            <div className="absolute -top-4 -right-4 w-12 h-12 border-r-4 border-t-4 border-black pointer-events-none z-10" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-l-4 border-b-4 border-black pointer-events-none z-10" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-r-4 border-b-4 border-black pointer-events-none z-10" />
            
            <div className="resume-print w-full max-w-[210mm] border-1 rounded-sm border-black bg-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative transition-transform duration-500 group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] group-hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
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

        <div className="flex justify-center pt-8 no-print">
          <Button 
            variant="ghost" 
            onClick={() => setShowDeleteDialog(true)}
            className="font-mono text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 hover:text-red-700 rounded-none border-2 border-transparent hover:border-red-600 transition-all px-8 py-6"
          >
            {isMasterResume
              ? t('confirmations.deleteMasterResumeTitle')
              : t('dashboard.deleteResume')}
          </Button>
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
