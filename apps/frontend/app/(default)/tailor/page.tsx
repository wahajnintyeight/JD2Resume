'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useResumePreview } from '@/components/common/resume_previewer_context';
import type {
  ChangeDecision,
  ImprovedResult,
} from '@/components/common/resume_previewer_context';
import type { ResumeData } from '@/components/dashboard/resume-component';
import {
  uploadJobDescriptions,
  previewImproveResume,
  confirmImproveResume,
} from '@/lib/api/resume';
import { fetchPromptConfig, type PromptOption } from '@/lib/api/config';
import { Dropdown } from '@/components/ui/dropdown';
import { useStatusCache } from '@/lib/context/status-cache';
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Settings,
  Sparkles,
  FileText,
  Wand2,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { DiffPreviewModal } from '@/components/tailor/diff-preview-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MasterResumeSelector from '@/components/dashboard/master-resume-selector';

// LLM-012: Job description length limits (from env, must match backend)
const MAX_JD_LENGTH = parseInt(process.env.NEXT_PUBLIC_MAX_JD_LENGTH || '3000', 10);
const JD_LENGTH_WARNING_THRESHOLD = Math.floor(MAX_JD_LENGTH * 0.75);

export default function TailorPage() {
  const { t } = useTranslations();
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [masterCategory, setMasterCategory] = useState<string | null>(null);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('keywords');
  const [promptLoading, setPromptLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasUserSelectedPrompt = useRef(false);
  const missingDiffConfirmInFlight = useRef(false);

  // Diff preview modal state
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<ImprovedResult | null>(null);
  const [diffConfirmError, setDiffConfirmError] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showMissingDiffDialog, setShowMissingDiffDialog] = useState(false);
  const [missingDiffResult, setMissingDiffResult] = useState<ImprovedResult | null>(null);
  const [missingDiffError, setMissingDiffError] = useState<string | null>(null);

  const router = useRouter();
  const { setImprovedData } = useResumePreview();
  const {
    status: systemStatus,
    isLoading: statusLoading,
    incrementJobs,
    incrementImprovements,
    incrementResumes,
  } = useStatusCache();

  // Check if LLM is configured
  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;

  useEffect(() => {
    const storedId = localStorage.getItem('last_used_master_resume_id');
    if (storedId) {
      setMasterResumeId(storedId);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPromptConfig = async () => {
      setPromptLoading(true);
      try {
        const config = await fetchPromptConfig();
        if (!cancelled) {
          setPromptOptions(config.prompt_options || []);
          if (!hasUserSelectedPrompt.current) {
            setSelectedPromptId(config.default_prompt_id || 'keywords');
          }
        }
      } catch (err) {
        console.error('Failed to load prompt config', err);
      } finally {
        if (!cancelled) {
          setPromptLoading(false);
        }
      }
    };

    loadPromptConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const buildConfirmPayload = (
    result: ImprovedResult,
    decisions?: Record<number, ChangeDecision>
  ) => {
    if (!masterResumeId) {
      throw new Error('Master resume ID is missing.');
    }
    const resumePreview = result.data.resume_preview;
    if (!resumePreview || typeof resumePreview !== 'object' || Array.isArray(resumePreview)) {
      throw new Error('Resume preview data is invalid.');
    }
    const previewRecord = resumePreview as unknown as Record<string, unknown>;
    if (
      !previewRecord.personalInfo ||
      typeof previewRecord.personalInfo !== 'object' ||
      Array.isArray(previewRecord.personalInfo)
    ) {
      throw new Error('Resume preview data is invalid.');
    }
    return {
      resume_id: masterResumeId,
      job_id: result.data.job_id,
      improved_data: resumePreview as ResumeData,
      improvements:
        result.data.improvements?.map((item) => ({
          suggestion: item.suggestion,
          lineNumber: typeof item.lineNumber === 'number' ? item.lineNumber : null,
        })) ?? [],
      change_decisions: decisions,
    };
  };

  const confirmAndNavigate = async (
    result: ImprovedResult,
    decisions?: Record<number, ChangeDecision>
  ) => {
    const confirmed = await confirmImproveResume(buildConfirmPayload(result, decisions));
    incrementImprovements();
    incrementResumes();
    setImprovedData(confirmed);

    const newResumeId = confirmed?.data?.resume_id;
    if (newResumeId) {
      router.push(`/resumes/${newResumeId}`);
    } else {
      router.push('/builder');
    }
  };

  const getGenerateValidationError = (trimmedDescription: string) => {
    if (!trimmedDescription) return null;
    if (trimmedDescription.length < 50) {
      return t('tailor.errors.jobDescriptionTooShort');
    }
    if (trimmedDescription.length > MAX_JD_LENGTH) {
      return t('tailor.errors.jobDescriptionTooLong');
    }
    return null;
  };

  const runGenerate = async (resumeId: string, description: string) => {
    try {
      const jobId = await uploadJobDescriptions([description], resumeId);
      incrementJobs();

      const result = await previewImproveResume(resumeId, jobId, selectedPromptId);

      if (!result?.data?.diff_summary || !result?.data?.detailed_changes) {
        console.warn('Diff data missing for tailor preview; requesting user confirmation.');
        setDiffConfirmError(null);
        setPendingResult(null);
        setShowDiffModal(false);
        setMissingDiffError(null);
        setMissingDiffResult(result);
        setShowMissingDiffDialog(true);
        return;
      }

      setDiffConfirmError(null);
      setMissingDiffError(null);
      setPendingResult(result);
      setShowDiffModal(true);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.toLowerCase().includes('api key') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.includes('401')
      ) {
        setError(t('tailor.errors.apiKeyError'));
      } else if (
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.includes('429')
      ) {
        setError(t('tailor.errors.rateLimit'));
      } else {
        setError(t('tailor.errors.failedToPreview'));
      }
    }
  };

  const handleGenerate = async () => {
    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription || !masterResumeId) return;
    const validationError = getGenerateValidationError(trimmedDescription);
    if (validationError) {
      setError(validationError);
      return;
    }
    const resumeId = masterResumeId;
    setIsLoading(true);
    setError(null);
    try {
      await runGenerate(resumeId, trimmedDescription);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmChanges = async (decisions?: Record<number, ChangeDecision>) => {
    if (!pendingResult || isLoading) return;

    setIsLoading(true);
    setError(null);
    setDiffConfirmError(null);

    try {
      await confirmAndNavigate(pendingResult, decisions);
      setShowDiffModal(false);
      setPendingResult(null);
    } catch (err) {
      console.error(err);
      const errorMessage = t('tailor.errors.failedToConfirm');
      setError(errorMessage);
      setDiffConfirmError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectChanges = () => {
    setShowDiffModal(false);
    setPendingResult(null);
    setDiffConfirmError(null);
    setShowRegenerateDialog(true);
  };

  const handleCloseDiffModal = () => {
    setShowDiffModal(false);
    setPendingResult(null);
    setDiffConfirmError(null);
  };

  const handleCloseMissingDiffDialog = () => {
    setShowMissingDiffDialog(false);
    setMissingDiffResult(null);
    setMissingDiffError(null);
    missingDiffConfirmInFlight.current = false;
  };

  const handleMissingDiffConfirm = async () => {
    if (!missingDiffResult || isLoading || missingDiffConfirmInFlight.current) return;
    missingDiffConfirmInFlight.current = true;
    setIsLoading(true);
    setError(null);
    setMissingDiffError(null);
    try {
      await confirmAndNavigate(missingDiffResult);
      handleCloseMissingDiffDialog();
    } catch (err) {
      console.error(err);
      const errorMessage = t('tailor.errors.failedToConfirm');
      setError(errorMessage);
      setMissingDiffError(errorMessage);
    } finally {
      missingDiffConfirmInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleRegenerateConfirm = async () => {
    setShowRegenerateDialog(false);
    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription || !masterResumeId) return;
    const validationError = getGenerateValidationError(trimmedDescription);
    if (validationError) {
      setError(validationError);
      return;
    }
    const resumeId = masterResumeId;
    setIsLoading(true);
    setError(null);
    try {
      await runGenerate(resumeId, trimmedDescription);
    } finally {
      setIsLoading(false);
    }
  };

  const isGenerateDisabled =
    isLoading || statusLoading || !jobDescription.trim() || !isLlmConfigured;
  const currentLength = mounted ? jobDescription.length : 0;
  const lengthProgress = Math.min((currentLength / MAX_JD_LENGTH) * 100, 100);

  return (
    <div className="min-h-full w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <div className="mx-auto flex w-full  flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="h-10 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>{t('tailor.pasteJobDescriptionBelow')}</span>
          </div>
        </div>

        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%)]" />
          <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                  <Wand2 className="h-3.5 w-3.5" />
                  {t('tailor.pasteJobDescriptionBelow')}
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {t('tailor.heroTitle')}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {t('tailor.promptDescription')}
                  </CardDescription>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-auto">
                <div className="rounded-2xl border border-white/75 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    {t('tailor.selectMasterLabel')}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {masterResumeId ? 'Selected' : 'Required'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/75 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    {t('tailor.promptLabel')}
                  </div>
                  <div className="mt-1 text-sm font-semibold capitalize text-slate-900">
                    {selectedPromptId}
                  </div>
                </div>
              </div>
            </div>

            {!statusLoading && !isLlmConfigured && (
              <div className="rounded-[1.5rem] border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200/80">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {t('tailor.setupRequiredTitle')}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {t('tailor.noApiKeyMessage')}
                    </p>
                    <Link
                      href="/settings"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-700 transition hover:text-amber-800"
                    >
                      <Settings className="h-4 w-4" />
                      <span>{t('tailor.configureApiKey')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <Card
                variant="interactive"
                className="border-white/80 bg-white/85 p-4 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)] sm:p-5"
              >
                <div className="space-y-5">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                      {t('tailor.selectMasterLabel')}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      {t('tailor.promptDescription')}
                    </CardDescription>
                  </div>

                  <MasterResumeSelector
                    selectedResumeId={masterResumeId}
                    onSelect={(resumeId, category) => {
                      setMasterResumeId(resumeId);
                      setMasterCategory(category);
                      localStorage.setItem('last_used_master_resume_id', resumeId);
                    }}
                    label={t('tailor.selectMasterLabel') || 'Select Master Resume'}
                    required={true}
                  />

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <FileText className="h-3.5 w-3.5" />
                      {t('tailor.promptLabel')}
                    </div>
                    <Dropdown
                      options={
                        promptOptions.length > 0
                          ? promptOptions.map((opt) => ({
                              id: opt.id,
                              label: t(`tailor.promptOptions.${opt.id}.label`),
                              description: t(`tailor.promptOptions.${opt.id}.description`),
                            }))
                          : [
                              {
                                id: 'keywords',
                                label: t('tailor.promptOptions.keywords.label'),
                                description: t('tailor.promptOptions.keywords.description'),
                              },
                              {
                                id: 'full',
                                label: t('tailor.promptOptions.full.label'),
                                description: t('tailor.promptOptions.full.description'),
                              },
                            ]
                      }
                      value={selectedPromptId}
                      onChange={(value) => {
                        hasUserSelectedPrompt.current = true;
                        setSelectedPromptId(value);
                      }}
                      label={t('tailor.promptLabel')}
                      description={t('tailor.promptDescription')}
                      disabled={isLoading || promptLoading}
                    />
                  </div>

                  {masterCategory && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
                      <span className="font-medium">{masterCategory}</span>
                    </div>
                  )}

                  <div className="hidden lg:block">
                    <Button
                      size="lg"
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className={cn(
                        'h-12 w-full rounded-2xl text-sm font-semibold shadow-sm transition-all',
                        isGenerateDisabled
                          ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('common.processing')}</span>
                        </div>
                      ) : statusLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('common.checking')}</span>
                        </div>
                      ) : !isLlmConfigured ? (
                        <span>{t('tailor.configureApiKeyFirst')}</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>{t('tailor.generateTailored')}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <Card className="border-white/80 bg-white/85 p-4 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)] sm:p-5 lg:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                    Job description
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-slate-600">
                    {t('tailor.jobDescriptionPlaceholder')}
                  </CardDescription>
                </div>

                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm',
                    currentLength > MAX_JD_LENGTH
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : currentLength > JD_LENGTH_WARNING_THRESHOLD
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  )}
                  suppressHydrationWarning
                >
                  <span>{currentLength.toLocaleString()}</span>
                  <span className="text-slate-400">/ {MAX_JD_LENGTH.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-inner shadow-slate-100/60">
                  <Textarea
                    placeholder={t('tailor.jobDescriptionPlaceholder')}
                    className={cn(
                      'min-h-[360px] resize-none border-0 bg-transparent px-4 py-4 text-[15px] leading-7 text-slate-700 shadow-none focus-visible:ring-0 sm:px-5 sm:py-5 lg:min-h-[460px]',
                      'placeholder:text-slate-400',
                      isLoading && 'cursor-not-allowed opacity-60'
                    )}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="order-2 space-y-2 sm:order-1 sm:flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          currentLength > MAX_JD_LENGTH
                            ? 'bg-red-500'
                            : currentLength > JD_LENGTH_WARNING_THRESHOLD
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                        )}
                        style={{ width: `${lengthProgress}%` }}
                      />
                    </div>

                    {jobDescription.length > 0 && jobDescription.length < 50 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Keep typing...</span>
                        <span className="flex gap-1">
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="order-1 lg:hidden">
                    <Button
                      size="lg"
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className={cn(
                        'h-11 w-full rounded-2xl px-5 text-sm font-semibold shadow-sm transition-all sm:w-auto',
                        isGenerateDisabled
                          ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('common.processing')}</span>
                        </div>
                      ) : statusLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('common.checking')}</span>
                        </div>
                      ) : !isLlmConfigured ? (
                        <span>{t('tailor.configureApiKeyFirst')}</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>{t('tailor.generateTailored')}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {error && (
              <Card className="border-red-200/80 bg-red-50/90 p-4 shadow-[0_18px_50px_-36px_rgba(220,38,38,0.45)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-200">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900">Error</p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showDiffModal && pendingResult && (
        <DiffPreviewModal
          isOpen={showDiffModal}
          onClose={handleCloseDiffModal}
          onReject={handleRejectChanges}
          onConfirm={handleConfirmChanges}
          diffSummary={pendingResult?.data?.diff_summary}
          detailedChanges={pendingResult?.data?.detailed_changes}
          errorMessage={diffConfirmError ?? undefined}
          isSaving={isLoading}
        />
      )}

      <ConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title={t('tailor.regenerateDialog.title')}
        description={t('tailor.regenerateDialog.description')}
        confirmLabel={t('tailor.regenerateDialog.confirmLabel')}
        cancelLabel={t('common.cancel')}
        variant="warning"
        onConfirm={handleRegenerateConfirm}
      />

      <ConfirmDialog
        open={showMissingDiffDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseMissingDiffDialog();
          }
        }}
        title={t('tailor.missingDiffDialog.title')}
        description={t('tailor.missingDiffDialog.description')}
        confirmLabel={t('tailor.missingDiffDialog.confirmLabel')}
        cancelLabel={t('common.cancel')}
        variant="warning"
        closeOnConfirm={false}
        onConfirm={handleMissingDiffConfirm}
        onCancel={handleCloseMissingDiffDialog}
        confirmDisabled={isLoading || !missingDiffResult}
        errorMessage={missingDiffError ?? undefined}
      />
    </div>
  );
}