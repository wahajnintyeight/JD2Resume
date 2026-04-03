'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { Loader2, ArrowLeft, AlertTriangle, Settings, Sparkles } from 'lucide-react';
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
    // Try to load last used master from localStorage
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
      // 1. Upload Job Description
      // The API expects an array of strings
      const jobId = await uploadJobDescriptions([description], resumeId);
      incrementJobs(); // Update cached counter

      // 2. Preview Resume
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

      // 3. Show diff preview modal
      setDiffConfirmError(null);
      setMissingDiffError(null);
      setPendingResult(result);
      setShowDiffModal(true);
    } catch (err) {
      console.error(err);
      // Check for common error patterns
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

  // User confirms changes
  const handleConfirmChanges = async (decisions?: Record<number, ChangeDecision>) => {
    // Guard against double-clicks - isLoading already tracks confirm in progress
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

  // User rejects changes
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

  return (
    <div className="flex h-full w-full flex-col bg-[#F0F0E8] font-sans">
      <div className="relative mx-auto w-full flex-1 border-x-2 border-black bg-white p-6 md:p-12 lg:p-16 shadow-[20px_0px_60px_-15px_rgba(0,0,0,0.05)]">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="absolute top-6 left-6 md:top-8 md:left-8 font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-100 rounded-none border-2 border-transparent hover:border-black transition-all" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="mb-12 mt-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 text-black">
            {t('tailor.heroTitle')}
          </h1>
          <div className="inline-block border-2 border-black bg-blue-700 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-mono text-xs md:text-sm text-white font-bold uppercase tracking-widest">
              {'// '}
              {t('tailor.pasteJobDescriptionBelow')}
            </p>
          </div>
        </div>

        {/* LLM Not Configured Warning */}
        {!statusLoading && !isLlmConfigured && (
          <div className="mb-10 border-1 rounded-sm border-black bg-amber-50 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border-2 border-black bg-amber-400 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm font-black uppercase tracking-tight text-black">
                  {t('tailor.setupRequiredTitle')}
                </p>
                <p className="font-mono text-xs text-amber-900 mt-2 font-bold leading-relaxed">
                  {t('tailor.noApiKeyMessage')}
                </p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 mt-4 text-black hover:text-blue-700 transition-colors group"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="font-mono text-xs font-black uppercase underline decoration-2 underline-offset-4">
                    {t('tailor.configureApiKey')}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Selectors */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-8 sticky top-8">
              <MasterResumeSelector
                selectedResumeId={masterResumeId}
                onSelect={(resumeId, category) => {
                  setMasterResumeId(resumeId);
                  setMasterCategory(category);
                  localStorage.setItem('last_used_master_resume_id', resumeId);
                }}
                label={t('tailor.selectMasterLabel') || "Select Master Resume"}
                required={true}
              />

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

              <div className="pt-4 hidden lg:block">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isLoading || statusLoading || !jobDescription.trim() || !isLlmConfigured}
                  className={cn(
                    "w-full h-20 border-2 border-black font-serif text-xl font-black uppercase tracking-widest transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                    isLoading || statusLoading || !jobDescription.trim() || !isLlmConfigured
                      ? "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{t('common.processing')}</span>
                    </div>
                  ) : statusLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{t('common.checking')}</span>
                    </div>
                  ) : !isLlmConfigured ? (
                    <span className="text-lg">{t('tailor.configureApiKeyFirst')}</span>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      <span>{t('tailor.generateTailored')}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Textarea */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative group">
              {/* Floating Label */}
              <div className="absolute -top-3 left-6 z-10">
                <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  Job Description
                </span>
              </div>
              
              {/* Decorative Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-black pointer-events-none" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-black pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-black pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-black pointer-events-none" />
              
              {/* Glow Effect on Focus */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600/20 via-transparent to-blue-600/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm" />
              
              <Textarea
                placeholder={t('tailor.jobDescriptionPlaceholder')}
                className={cn(
                  "min-h-[400px] lg:min-h-[500px] font-sans text-base leading-relaxed",
                  "bg-gradient-to-br from-white via-white to-gray-50/80",
                  "border-2 border-black",
                  "focus:border-blue-700 focus:ring-0 focus:outline-none",
                  "resize-none p-8 pt-10",
                  "rounded-xl",
                  "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                  "hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                  "focus:shadow-[4px_4px_0px_0px_rgba(29,78,216,1)]",
                  "transition-all duration-300 ease-out",
                  "placeholder:text-gray-400 placeholder:font-light placeholder:italic",
                  isLoading && "opacity-60 cursor-not-allowed"
                )}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={isLoading}
              />
              
              {/* Character Counter - Modernized */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                {/* Progress Bar */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        mounted && jobDescription.length > MAX_JD_LENGTH
                          ? "bg-red-500"
                          : mounted && jobDescription.length > JD_LENGTH_WARNING_THRESHOLD
                            ? "bg-amber-500"
                            : "bg-blue-600"
                      )}
                      style={{ width: `${Math.min((jobDescription.length / MAX_JD_LENGTH) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Counter Badge */}
                <div
                  className={cn(
                    "px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider rounded-lg border-2 transition-all duration-300",
                    mounted && jobDescription.length > MAX_JD_LENGTH
                      ? "bg-red-500 text-white border-red-600 animate-pulse"
                      : mounted && jobDescription.length > JD_LENGTH_WARNING_THRESHOLD
                        ? "bg-amber-500 text-black border-amber-600"
                        : "bg-black text-white border-black"
                  )}
                  suppressHydrationWarning
                >
                  {mounted ? jobDescription.length.toLocaleString() : 0}
                  <span className="text-white/60 ml-1">/ {MAX_JD_LENGTH.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Typing Indicator */}
              {jobDescription.length > 0 && jobDescription.length < 50 && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-gray-400">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Keep typing...</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-6 border-2 border-black bg-red-50 text-red-700 font-sans text-sm font-bold uppercase tracking-tight flex items-center gap-4 animate-in shake-1 duration-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                <div className="w-8 h-8 border-2 border-black bg-red-600 text-white flex items-center justify-center shrink-0 rounded-lg">!</div>
                <span>{error}</span>
              </div>
            )}

            <div className="lg:hidden">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isLoading || statusLoading || !jobDescription.trim() || !isLlmConfigured}
                className={cn(
                  "w-full h-20 border-2 border-black font-serif text-xl font-black uppercase tracking-widest transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                  isLoading || statusLoading || !jobDescription.trim() || !isLlmConfigured
                    ? "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{t('common.processing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <span>{t('tailor.generateTailored')}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Diff preview modal */}
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
