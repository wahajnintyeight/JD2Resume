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
import {
  ArrowLeft,
  Edit,
  Download,
  Loader2,
  AlertCircle,
  Sparkles,
  Pencil,
  Target,
  Orbit,
  ShieldCheck,
  ScanSearch,
  FileStack,
  WandSparkles,
} from 'lucide-react';
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

        const status = (data.raw_resume?.processing_status || 'pending') as ProcessingStatus;
        setProcessingStatus(status);
        setResumeTitle(data.title ?? null);

        if (data.processed_resume) {
          setResumeData(data.processed_resume as ResumeData);
          setError(null);
        } else if (status === 'failed') {
          setError(t('resumeViewer.errors.processingFailed'));
        } else if (status === 'processing') {
          setError(t('resumeViewer.errors.stillProcessing'));
        } else if (data.raw_resume?.content) {
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

  const pageTheme = {
    ['--rv-paper' as string]: '#efe4c8',
    ['--rv-ink' as string]: '#071019',
    ['--rv-copper' as string]: '#f59e0b',
    ['--rv-cyan' as string]: '#62e8d7',
    ['--rv-red' as string]: '#ff6b6b',
    ['--rv-grid' as string]: 'rgba(239, 228, 200, 0.08)',
  } as React.CSSProperties;

  if (loading) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050913]"
        style={pageTheme}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(98,232,215,0.14),transparent_25%),linear-gradient(180deg,#04070d_0%,#091421_100%)]" />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(var(--rv-grid) 1px, transparent 1px), linear-gradient(90deg, var(--rv-grid) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative rounded-[2rem] border border-[#efe4c8]/12 bg-[rgba(5,9,19,0.76)] px-8 py-7 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#62e8d7]" />
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-[#e9dcc0]">
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
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050913] p-4"
        style={pageTheme}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(98,232,215,0.14),transparent_25%),linear-gradient(180deg,#04070d_0%,#091421_100%)]" />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(var(--rv-grid) 1px, transparent 1px), linear-gradient(90deg, var(--rv-grid) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div
          className={cn(
            'relative w-full max-w-xl rounded-[2rem] border bg-[rgba(7,16,25,0.86)] px-6 py-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-8',
            isProcessing
              ? 'border-[#62e8d7]/20'
              : isFailed
                ? 'border-[#f59e0b]/25'
                : 'border-[#ff6b6b]/25'
          )}
        >
          <div className="mb-4 flex justify-center">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-[1.25rem] border',
                isProcessing
                  ? 'border-[#62e8d7]/20 bg-[#62e8d7]/10 text-[#62e8d7]'
                  : isFailed
                    ? 'border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#ffd089]'
                    : 'border-[#ff6b6b]/20 bg-[#ff6b6b]/10 text-[#ff9f9f]'
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
                ? 'text-[#dafaf5]'
                : isFailed
                  ? 'text-[#ffe3b6]'
                  : 'text-[#ffd1d1]'
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
                  className="h-11 rounded-[1.2rem] border border-[#62e8d7]/20 bg-[#62e8d7]/10 text-[#ddfdf8] hover:bg-[#62e8d7]/18"
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
                  className="h-11 rounded-[1.2rem]"
                >
                  {t('resumeViewer.deleteAndStartOver')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="h-11 rounded-[1.2rem] border-[#efe4c8]/15 bg-white/5 text-[#efe4c8] hover:bg-white/10"
            >
              {t('resumeViewer.returnToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full w-full flex-col overflow-hidden bg-[#050913]" style={pageTheme}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(98,232,215,0.14),transparent_25%),radial-gradient(circle_at_68%_75%,rgba(255,107,107,0.08),transparent_18%),linear-gradient(180deg,#04070d_0%,#091421_100%)]" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(var(--rv-grid) 1px, transparent 1px), linear-gradient(90deg, var(--rv-grid) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute left-[-4rem] top-16 h-72 w-72 rounded-full bg-[#f59e0b]/10 blur-3xl" />
      <div className="absolute right-[-6rem] top-10 h-80 w-80 rounded-full bg-[#62e8d7]/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#ff6b6b]/8 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-1 flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#efe4c8]/10 bg-[rgba(7,16,25,0.78)] shadow-[0_32px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.04),transparent_20%,transparent_75%,rgba(255,255,255,0.03))]" />
          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start no-print">
              <div className="space-y-5">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="h-10 rounded-full border border-[#efe4c8]/12 bg-white/[0.03] px-4 text-sm font-medium text-[#e9dcc0] hover:bg-white/[0.08] hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('nav.backToDashboard')}
                </Button>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd89c]">
                      {isMasterResume ? <Sparkles className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                      <span>{isMasterResume ? t('resumeViewer.enhanceResume') : 'Tailored resume'}</span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-[#62e8d7]/18 bg-[#62e8d7]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#dffcf8]">
                      <Orbit className="h-3.5 w-3.5" />
                      Viewer deck
                    </div>
                  </div>

                  {!isMasterResume && (
                    <div className="w-full max-w-4xl">
                      {isEditingTitle ? (
                        <div className="rounded-[1.6rem] border border-[#efe4c8]/12 bg-white/[0.04] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            maxLength={80}
                            placeholder={t('resumeViewer.titlePlaceholder')}
                            className="w-full bg-transparent text-left text-3xl font-black uppercase tracking-[-0.07em] text-[#f6ebd2] outline-none md:text-5xl"
                            style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTitleValue(resumeTitle || '');
                            setIsEditingTitle(true);
                          }}
                          className="group inline-flex max-w-full items-center gap-3 rounded-[1.5rem] border border-transparent px-1 py-1 text-left transition-all hover:border-[#efe4c8]/12"
                        >
                          <h2
                            className={cn(
                              'truncate text-3xl font-black uppercase tracking-[-0.07em] text-[#f6ebd2] md:text-5xl',
                              !resumeTitle && 'italic text-[#8f846e]'
                            )}
                            style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                          >
                            {resumeTitle || t('resumeViewer.titlePlaceholder')}
                          </h2>
                          <Pencil
                            className={cn(
                              'h-5 w-5 shrink-0 text-[#9c9076] transition-all duration-300',
                              resumeTitle ? 'opacity-0 group-hover:opacity-100 group-hover:text-[#e9dcc0]' : 'opacity-50'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  )}

                  {isMasterResume && (
                    <div className="max-w-4xl">
                      <h2
                        className="text-3xl font-black uppercase tracking-[-0.07em] text-[#f6ebd2] md:text-5xl"
                        style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                      >
                        Master Resume
                        <span className="block bg-[linear-gradient(90deg,#f6ebd2_0%,#f59e0b_38%,#62e8d7_100%)] bg-clip-text text-transparent">
                          Calibration Deck
                        </span>
                      </h2>
                    </div>
                  )}

                  <p className="max-w-3xl text-sm leading-7 text-[#cabfa7] sm:text-base">
                    Inspect, refine, and export this resume from a focused command surface with a
                    print-stage presentation rather than a standard document page.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[390px]">
                {isMasterResume ? (
                  <Button
                    onClick={() => setShowEnrichmentModal(true)}
                    className="h-12 rounded-[1.2rem] border border-[#f59e0b]/20 bg-[#f59e0b]/12 px-5 text-sm font-semibold text-[#fff1cf] hover:bg-[#f59e0b]/20"
                  >
                    <WandSparkles className="mr-2 h-4 w-4" />
                    {t('resumeViewer.enhanceResume')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowATSScanDialog(true)}
                    variant="outline"
                    className="h-12 rounded-[1.2rem] border-[#62e8d7]/20 bg-[#62e8d7]/10 px-5 text-sm font-semibold text-[#ddfdf8] hover:bg-[#62e8d7]/18"
                  >
                    <ScanSearch className="mr-2 h-4 w-4" />
                    ATS Scan
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="h-12 rounded-[1.2rem] border-[#efe4c8]/12 bg-white/[0.03] px-5 text-sm font-semibold text-[#e9dcc0] hover:bg-white/[0.08]"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('dashboard.editResume')}
                </Button>

                <Button
                  variant="default"
                  onClick={handleDownload}
                  className="h-12 rounded-[1.2rem] border border-[#62e8d7]/20 bg-[#62e8d7]/12 px-5 text-sm font-semibold text-[#ddfdf8] hover:bg-[#62e8d7]/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('resumeViewer.downloadResume')}
                </Button>

                <div className="rounded-[1.2rem] border border-[#efe4c8]/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#968b74]">status</p>
                  <p className="mt-1 text-sm font-semibold text-[#f6ebd2]">
                    {isMasterResume ? 'Source template' : 'Tailored output'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] no-print">
              <div className="rounded-[1.7rem] border border-[#efe4c8]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#f59e0b]/18 bg-[#f59e0b]/10 text-[#ffd89c]">
                    <FileStack className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#968b74]">
                      document stage
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#dacfb7]">
                      This preview is framed as a print plate. Use edit for structure changes,
                      scan for ATS posture, and export when the composition is ready.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-[#efe4c8]/10 bg-[linear-gradient(180deg,rgba(98,232,215,0.08),rgba(255,255,255,0.015))] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#62e8d7]/18 bg-[#62e8d7]/10 text-[#ddfdf8]">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#968b74]">
                      control note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#dacfb7]">
                      {isMasterResume
                        ? 'Master resumes shape future tailoring runs and benefit most from enrichment.'
                        : 'Tailored resumes should be scanned and exported once the role alignment looks sharp.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pb-6">
              <div className="relative w-full max-w-[245mm] rounded-[2rem] border border-[#efe4c8]/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-4 lg:p-5">
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#efe4c8]/60 to-transparent" />
                <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-[#f59e0b]/10 blur-3xl" />
                <div className="absolute -right-8 bottom-10 h-32 w-32 rounded-full bg-[#62e8d7]/10 blur-3xl" />

                <div className="resume-print relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.28)] ring-1 ring-[#d9d3c3]">
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
                className="rounded-full border border-[#ff6b6b]/15 bg-[#ff6b6b]/8 px-6 py-2 text-sm font-medium text-[#ffb7b7] hover:bg-[#ff6b6b]/12 hover:text-[#ffd3d3]"
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

      {isMasterResume && (
        <EnrichmentModal
          resumeId={resumeId}
          isOpen={showEnrichmentModal}
          onClose={() => setShowEnrichmentModal(false)}
          onComplete={handleEnrichmentComplete}
        />
      )}

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
