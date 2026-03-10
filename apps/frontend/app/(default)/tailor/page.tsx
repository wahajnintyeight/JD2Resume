'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { useResumePreview } from '@/components/common/resume_previewer_context';
import type { ImprovedResult } from '@/components/common/resume_previewer_context';
import type { ResumeData } from '@/components/dashboard/resume-component';
import {
  uploadJobDescriptions,
  previewImproveResume,
  confirmImproveResume,
} from '@/lib/api/resume';
import { fetchPromptConfig, type PromptOption } from '@/lib/api/config';
import { useStatusCache } from '@/lib/context/status-cache';
import { useTranslations } from '@/lib/i18n';
import { DiffPreviewModal } from '@/components/tailor/diff-preview-modal';
import MasterResumeSelector from '@/components/dashboard/master-resume-selector';

// LLM-012: Job description length limits from env (must match backend)
const MAX_JD_LENGTH = parseInt(process.env.NEXT_PUBLIC_MAX_JD_LENGTH || '3000', 10);
const JD_LENGTH_WARNING_THRESHOLD = Math.floor(MAX_JD_LENGTH * 0.75);

export default function TailorPage() {
  const { t } = useTranslations();
  const [jobDescription, setJobDescription]   = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [masterResumeId, setMasterResumeId]   = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [masterCategory, setMasterCategory]   = useState<string | null>(null);
  const [promptOptions, setPromptOptions]     = useState<PromptOption[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('keywords');
  const [promptLoading, setPromptLoading]     = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const hasUserSelectedPrompt                 = useRef(false);
  const missingDiffConfirmInFlight            = useRef(false);

  // Diff / dialog state
  const [showDiffModal, setShowDiffModal]               = useState(false);
  const [pendingResult, setPendingResult]               = useState<ImprovedResult | null>(null);
  const [diffConfirmError, setDiffConfirmError]         = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showMissingDiffDialog, setShowMissingDiffDialog] = useState(false);
  const [missingDiffResult, setMissingDiffResult]       = useState<ImprovedResult | null>(null);
  const [missingDiffError, setMissingDiffError]         = useState<string | null>(null);

  const router = useRouter();
  const { setImprovedData } = useResumePreview();
  const { status: systemStatus, isLoading: statusLoading, incrementJobs, incrementImprovements, incrementResumes } = useStatusCache();

  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('last_used_master_resume_id');
    if (storedId) setMasterResumeId(storedId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
        if (!cancelled) setPromptLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const buildConfirmPayload = (result: ImprovedResult) => {
    if (!masterResumeId) throw new Error('Master resume ID is missing.');
    const resumePreview = result.data.resume_preview;
    if (!resumePreview || typeof resumePreview !== 'object' || Array.isArray(resumePreview))
      throw new Error('Resume preview data is invalid.');
    const previewRecord = resumePreview as unknown as Record<string, unknown>;
    if (!previewRecord.personalInfo || typeof previewRecord.personalInfo !== 'object' || Array.isArray(previewRecord.personalInfo))
      throw new Error('Resume preview data is invalid.');
    return {
      resume_id:    masterResumeId,
      job_id:       result.data.job_id,
      improved_data: resumePreview as ResumeData,
      improvements: result.data.improvements?.map((item) => ({
        suggestion:  item.suggestion,
        lineNumber:  typeof item.lineNumber === 'number' ? item.lineNumber : null,
      })) ?? [],
    };
  };

  const confirmAndNavigate = async (result: ImprovedResult) => {
    const confirmed = await confirmImproveResume(buildConfirmPayload(result));
    incrementImprovements();
    incrementResumes();
    setImprovedData(confirmed);
    const newResumeId = confirmed?.data?.resume_id;
    router.push(newResumeId ? `/resumes/${newResumeId}` : '/builder');
  };

  const getGenerateValidationError = (trimmed: string) => {
    if (!trimmed) return null;
    if (trimmed.length < 50)              return t('tailor.errors.jobDescriptionTooShort');
    if (trimmed.length > MAX_JD_LENGTH)   return t('tailor.errors.jobDescriptionTooLong');
    return null;
  };

  const runGenerate = async (resumeId: string, description: string) => {
    try {
      const jobId = await uploadJobDescriptions([description], resumeId);
      incrementJobs();
      const result = await previewImproveResume(resumeId, jobId, selectedPromptId);

      if (!result?.data?.diff_summary || !result?.data?.detailed_changes) {
        setDiffConfirmError(null); setPendingResult(null); setShowDiffModal(false);
        setMissingDiffError(null); setMissingDiffResult(result); setShowMissingDiffDialog(true);
        return;
      }

      setDiffConfirmError(null); setMissingDiffError(null);
      setPendingResult(result); setShowDiffModal(true);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unauthorized') || msg.includes('401'))
        setError(t('tailor.errors.apiKeyError'));
      else if (msg.toLowerCase().includes('rate limit') || msg.includes('429'))
        setError(t('tailor.errors.rateLimit'));
      else
        setError(t('tailor.errors.failedToPreview'));
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed || !masterResumeId) return;
    const validationError = getGenerateValidationError(trimmed);
    if (validationError) { setError(validationError); return; }
    setIsLoading(true); setError(null);
    try { await runGenerate(masterResumeId, trimmed); }
    finally { setIsLoading(false); }
  };

  const handleConfirmChanges = async () => {
    if (!pendingResult || isLoading) return;
    setIsLoading(true); setError(null); setDiffConfirmError(null);
    try {
      await confirmAndNavigate(pendingResult);
      setShowDiffModal(false); setPendingResult(null);
    } catch (err) {
      console.error(err);
      const msg = t('tailor.errors.failedToConfirm');
      setError(msg); setDiffConfirmError(msg);
    } finally { setIsLoading(false); }
  };

  const handleRejectChanges = () => {
    setShowDiffModal(false); setPendingResult(null); setDiffConfirmError(null);
    setShowRegenerateDialog(true);
  };

  const handleCloseDiffModal = () => {
    setShowDiffModal(false); setPendingResult(null); setDiffConfirmError(null);
  };

  const handleCloseMissingDiffDialog = () => {
    setShowMissingDiffDialog(false); setMissingDiffResult(null); setMissingDiffError(null);
    missingDiffConfirmInFlight.current = false;
  };

  const handleMissingDiffConfirm = async () => {
    if (!missingDiffResult || isLoading || missingDiffConfirmInFlight.current) return;
    missingDiffConfirmInFlight.current = true;
    setIsLoading(true); setError(null); setMissingDiffError(null);
    try {
      await confirmAndNavigate(missingDiffResult);
      handleCloseMissingDiffDialog();
    } catch (err) {
      console.error(err);
      const msg = t('tailor.errors.failedToConfirm');
      setError(msg); setMissingDiffError(msg);
    } finally {
      missingDiffConfirmInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleRegenerateConfirm = async () => {
    setShowRegenerateDialog(false);
    handleGenerate();
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-10 md:py-16">

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          AI Resume Tailoring
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          {t('tailor.heroTitle')}
        </h1>
        <p className="text-white/50 text-base max-w-lg leading-relaxed">
          {t('tailor.pasteJobDescriptionBelow')}
        </p>
      </motion.div>

      {/* LLM not configured warning */}
      {!statusLoading && !isLlmConfigured && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-300 mb-1">{t('tailor.setupRequiredTitle')}</p>
                <p className="text-xs text-amber-400/80 mb-3">{t('tailor.noApiKeyMessage')}</p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-xs font-semibold"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {t('tailor.configureApiKey')}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="space-y-8">

          {/* Step 1: Master resume selector */}
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4 mb-2 block">
              1. {t('tailor.promptLabel') ? 'Select Resume' : 'Select Resume'}
            </label>
            <MasterResumeSelector
              selectedResumeId={masterResumeId}
              onSelect={(resumeId, category) => {
                setMasterResumeId(resumeId);
                setMasterCategory(category);
                localStorage.setItem('last_used_master_resume_id', resumeId);
              }}
              label="Select Master Resume to Tailor"
              required={true}
            />
          </div>

          {/* Step 2: Tailoring intensity / strategy */}
          <Dropdown
            options={
              promptOptions.length > 0
                ? promptOptions.map((opt) => ({
                    id: opt.id,
                    label: t(`tailor.promptOptions.${opt.id}.label`),
                    description: t(`tailor.promptOptions.${opt.id}.description`),
                  }))
                : [
                    { id: 'nudge',    label: t('tailor.promptOptions.nudge.label'),    description: t('tailor.promptOptions.nudge.description') },
                    { id: 'keywords', label: t('tailor.promptOptions.keywords.label'), description: t('tailor.promptOptions.keywords.description') },
                    { id: 'full',     label: t('tailor.promptOptions.full.label'),     description: t('tailor.promptOptions.full.description') },
                  ]
            }
            value={selectedPromptId}
            onChange={(value) => {
              hasUserSelectedPrompt.current = true;
              setSelectedPromptId(value);
            }}
            label={`2. ${t('tailor.promptLabel')}`}
            description={t('tailor.promptDescription')}
            disabled={isLoading || promptLoading}
          />

          {/* Step 3: Job description textarea */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                3. Job Description
              </label>
              {/* Character counter — reads NEXT_PUBLIC_MAX_JD_LENGTH from .env */}
              <span
                className={cn(
                  'text-[10px] font-mono uppercase tracking-widest transition-colors',
                  mounted && jobDescription.length > MAX_JD_LENGTH
                    ? 'text-red-400 font-bold'
                    : mounted && jobDescription.length > JD_LENGTH_WARNING_THRESHOLD
                      ? 'text-amber-400'
                      : 'text-white/25'
                )}
                suppressHydrationWarning
              >
                {jobDescription.length} / {MAX_JD_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder={t('tailor.jobDescriptionPlaceholder')}
              className="min-h-[320px] text-sm leading-relaxed"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              disabled={isLoading}
            />
          </div>

          {/* Inline error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isLoading || statusLoading || !jobDescription.trim() || !masterResumeId || !isLlmConfigured}
            className="w-full h-14 text-base shadow-xl shadow-indigo-500/20"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{t('common.processing')}</>
            ) : statusLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{t('common.checking')}</>
            ) : !isLlmConfigured ? (
              t('tailor.configureApiKeyFirst')
            ) : (
              <><Sparkles className="w-5 h-5" />{t('tailor.generateTailored')}</>
            )}
          </Button>
        </Card>
      </motion.div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
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
        onOpenChange={(open) => { if (!open) handleCloseMissingDiffDialog(); }}
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

      {/* AI processing overlay */}
      <AnimatePresence>
        {isLoading && !showDiffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-28 h-28 mb-10 relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="w-full h-full border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
              <Sparkles className="w-9 h-9 text-indigo-400 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Tailoring Your Resume</h2>
            <p className="text-white/40 max-w-xs mx-auto leading-relaxed">
              Our AI is analyzing the job description and aligning your skills for maximum impact.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
