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
  Orbit,
  Bot,
  ScanSearch,
  ShieldCheck,
  PanelTop,
  Radar,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { DiffPreviewModal } from '@/components/tailor/diff-preview-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MasterResumeSelector from '@/components/dashboard/master-resume-selector';

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
    <div
      className="min-h-full w-full bg-[#071018] text-[#f3ead7]"
      style={
        {
          ['--tailor-paper' as string]: '#f3ead7',
          ['--tailor-ink' as string]: '#071018',
          ['--tailor-copper' as string]: '#f59e0b',
          ['--tailor-mint' as string]: '#6ee7d8',
          ['--tailor-rose' as string]: '#fb7185',
          ['--tailor-grid' as string]: 'rgba(243, 234, 215, 0.08)',
        } as React.CSSProperties
      }
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.18),transparent_24%),radial-gradient(circle_at_87%_14%,rgba(110,231,216,0.14),transparent_26%),radial-gradient(circle_at_72%_75%,rgba(251,113,133,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#09141d_55%,#05070d_100%)]" />
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--tailor-grid) 1px, transparent 1px), linear-gradient(90deg, var(--tailor-grid) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />
      <div className="fixed left-[-5rem] top-24 -z-10 h-72 w-72 rounded-full bg-[#f59e0b]/10 blur-3xl" />
      <div className="fixed right-[-4rem] top-12 -z-10 h-80 w-80 rounded-full bg-[#6ee7d8]/10 blur-3xl" />

      <div className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="h-10 rounded-full border border-[#f3ead7]/12 bg-white/[0.04] px-4 text-sm font-medium text-[#eadfc7] shadow-sm backdrop-blur-sm hover:bg-white/[0.08] hover:text-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          <div className="hidden items-center gap-2 rounded-full border border-[#6ee7d8]/20 bg-[#6ee7d8]/10 px-3 py-1.5 text-xs font-medium text-[#dffcf8] shadow-sm backdrop-blur-sm sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-[#6ee7d8]" />
            <span>{t('tailor.pasteJobDescriptionBelow')}</span>
          </div>
        </div>

        <Card className="overflow-hidden border-[#f3ead7]/10 bg-[rgba(7,16,24,0.82)] shadow-[0_28px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04),transparent_20%,transparent_76%,rgba(255,255,255,0.03))]" />
          <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffd89c]">
                    <Wand2 className="h-3.5 w-3.5" />
                    tailoring bay
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#6ee7d8]/20 bg-[#6ee7d8]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dffcf8]">
                    <Orbit className="h-3.5 w-3.5" />
                    guided generation
                  </div>
                </div>

                <div className="space-y-3">
                  <CardTitle
                    className="text-3xl font-black uppercase tracking-[-0.08em] text-[#f7efdd] sm:text-5xl"
                    style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                  >
                    Tailor a resume
                    <span className="block bg-[linear-gradient(90deg,#f7efdd_0%,#f59e0b_34%,#6ee7d8_100%)] bg-clip-text text-transparent">
                      for the target role
                    </span>
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-7 text-[#cabfa8] sm:text-[15px]">
                    Paste the job description, choose the right source resume, and generate a
                    reviewable draft with clearer sections and discussion-friendly structure.
                  </CardDescription>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[460px]">
                <div className="rounded-[1.35rem] border border-[#f3ead7]/10 bg-white/[0.03] px-4 py-3 shadow-sm">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9a9079]">
                    source resume
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#f7efdd]">
                    {masterResumeId ? 'Selected' : 'Required'}
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-[#f3ead7]/10 bg-white/[0.03] px-4 py-3 shadow-sm">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9a9079]">
                    prompt mode
                  </div>
                  <div className="mt-1 text-sm font-semibold capitalize text-[#f7efdd]">
                    {selectedPromptId}
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-[#f3ead7]/10 bg-white/[0.03] px-4 py-3 shadow-sm">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9a9079]">
                    discussion flow
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#f7efdd]">Sectioned</div>
                </div>
              </div>
            </div>

            {!statusLoading && !isLlmConfigured && (
              <div className="rounded-[1.6rem] border border-[#f59e0b]/20 bg-[linear-gradient(90deg,rgba(245,158,11,0.12),rgba(255,255,255,0.03))] p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#ffd89c]">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#fff2d3]">
                      {t('tailor.setupRequiredTitle')}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#e3d8bf]">
                      {t('tailor.noApiKeyMessage')}
                    </p>
                    <Link
                      href="/settings"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#ffd89c] transition hover:text-[#fff2d3]"
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
              <Card className="border-[#f3ead7]/10 bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-5">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#6ee7d8]/18 bg-[#6ee7d8]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#dffcf8]">
                      <PanelTop className="h-3.5 w-3.5" />
                      control panel
                    </div>
                    <CardTitle
                      className="text-2xl font-black uppercase tracking-[-0.06em] text-[#f7efdd]"
                      style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                    >
                      Source and strategy
                    </CardTitle>
                    <CardDescription className="text-sm leading-6 text-[#cabfa8]">
                      Keep the setup readable: first pick the source resume, then choose the
                      prompt style that best matches the role.
                    </CardDescription>
                  </div>

                  <div className="rounded-[1.35rem] border border-[#f3ead7]/10 bg-white/[0.03] p-3">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9079]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#6ee7d8]" />
                      resume source
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
                  </div>

                  <div className="rounded-[1.35rem] border border-[#f3ead7]/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9079]">
                      <Bot className="h-3.5 w-3.5 text-[#f59e0b]" />
                      prompt strategy
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
                    <div className="rounded-[1.2rem] border border-[#6ee7d8]/18 bg-[#6ee7d8]/10 px-3 py-3 text-sm text-[#dffcf8]">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#9feee3]">
                        category
                      </span>
                      <div className="mt-1 font-medium">{masterCategory}</div>
                    </div>
                  )}

                  <div className="grid gap-3 rounded-[1.35rem] border border-[#f3ead7]/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#ffd89c]">
                        <Radar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#b29d73]">
                          workflow
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#e5d8bb]">
                          A clearer layout for discussing changes: setup on the left, role brief on
                          the right, preview decisions after generation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <Button
                      size="lg"
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className={cn(
                        'h-12 w-full rounded-[1.25rem] text-sm font-semibold shadow-sm transition-all',
                        isGenerateDisabled
                          ? 'cursor-not-allowed bg-white/10 text-[#9b9078] shadow-none'
                          : 'border border-[#6ee7d8]/20 bg-[#6ee7d8]/12 text-[#ddfdf8] hover:bg-[#6ee7d8]/20'
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
            <Card className="border-[#f3ead7]/10 bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-5 lg:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/18 bg-[#f59e0b]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffd89c]">
                    <FileText className="h-3.5 w-3.5" />
                    target role brief
                  </div>
                  <CardTitle
                    className="mt-3 text-2xl font-black uppercase tracking-[-0.06em] text-[#f7efdd]"
                    style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                  >
                    Job description
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm leading-6 text-[#cabfa8]">
                    Paste the role details here. The input area is intentionally separated so the
                    brief can be reviewed and discussed before generation.
                  </CardDescription>
                </div>

                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm',
                    currentLength > MAX_JD_LENGTH
                      ? 'border-[#fb7185]/20 bg-[#fb7185]/10 text-[#ffd0d8]'
                      : currentLength > JD_LENGTH_WARNING_THRESHOLD
                        ? 'border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#ffd89c]'
                        : 'border-[#f3ead7]/12 bg-white/[0.03] text-[#d8ccb4]'
                  )}
                  suppressHydrationWarning
                >
                  <span>{currentLength.toLocaleString()}</span>
                  <span className="text-[#968b74]">/ {MAX_JD_LENGTH.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.6rem] border border-[#f3ead7]/10 bg-[rgba(255,255,255,0.03)] shadow-inner">
                  <Textarea
                    placeholder={t('tailor.jobDescriptionPlaceholder')}
                    className={cn(
                      'min-h-[360px] resize-none border-0 bg-transparent px-4 py-4 text-[15px] leading-7 text-[#efe6d3] shadow-none focus-visible:ring-0 sm:px-5 sm:py-5 lg:min-h-[460px]',
                      'placeholder:text-[#8f846f]',
                      isLoading && 'cursor-not-allowed opacity-60'
                    )}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          currentLength > MAX_JD_LENGTH
                            ? 'bg-[#fb7185]'
                            : currentLength > JD_LENGTH_WARNING_THRESHOLD
                              ? 'bg-[#f59e0b]'
                              : 'bg-[#6ee7d8]'
                        )}
                        style={{ width: `${lengthProgress}%` }}
                      />
                    </div>

                    {jobDescription.length > 0 && jobDescription.length < 50 && (
                      <div className="flex items-center gap-2 text-xs text-[#a99d85]">
                        <span>Keep typing...</span>
                        <span className="flex gap-1">
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8f846f]"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8f846f]"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8f846f]"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[1.25rem] border border-[#f3ead7]/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a9079]">
                        section clarity
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#f7efdd]">
                        Separate brief and controls
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-[#f3ead7]/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a9079]">
                        output intent
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#f7efdd]">
                        Easier review in diff modal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:hidden">
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className={cn(
                      'h-11 w-full rounded-[1.2rem] px-5 text-sm font-semibold shadow-sm transition-all sm:w-auto',
                      isGenerateDisabled
                        ? 'cursor-not-allowed bg-white/10 text-[#9b9078] shadow-none'
                        : 'border border-[#6ee7d8]/20 bg-[#6ee7d8]/12 text-[#ddfdf8] hover:bg-[#6ee7d8]/20'
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
                        <ScanSearch className="h-4 w-4" />
                        <span>{t('tailor.generateTailored')}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {error && (
              <Card className="border-[#fb7185]/20 bg-[#fb7185]/10 p-4 shadow-[0_18px_50px_-36px_rgba(251,113,133,0.45)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#fb7185]/20 bg-[#fb7185]/12 text-[#ffd1d8]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#fff0f3]">Error</p>
                    <p className="mt-1 text-sm text-[#ffd1d8]">{error}</p>
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
