'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { type ResumeData } from '@/components/dashboard/resume-component';
import { cn } from '@/lib/utils';
import { ResumeForm } from './resume-form';
import { FormattingControls } from './formatting-controls';
import { CoverLetterEditor } from './cover-letter-editor';
import { OutreachEditor } from './outreach-editor';
import { CoverLetterPreview } from './cover-letter-preview';
import { OutreachPreview } from './outreach-preview';
import { GeneratePrompt } from './generate-prompt';
import { Button } from '@/components/ui/button';
import { RetroTabs } from '@/components/ui/retro-tabs';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ui/confirm-dialog';
import {
  Download,
  Save,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Loader2,
  FileText,
  HardDrive,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useResumePreview } from '@/components/common/resume_previewer_context';
import { PaginatedPreview } from '@/components/preview';
import {
  downloadResumePdf,
  downloadResumeDocx,
  downloadCoverLetterPdf,
  saveResumePdf,
  getResumePdfUrl,
  getCoverLetterPdfUrl,
  fetchResume,
  updateResume,
  updateCoverLetter,
  updateOutreachMessage,
  generateCoverLetter,
  generateOutreachMessage,
  fetchJobDescription,
} from '@/lib/api/resume';
import { JDComparisonView } from './jd-comparison-view';
import { RegenerateWizard } from './regenerate-wizard';
import { useRegenerateWizard } from '@/hooks/use-regenerate-wizard';
import { useTranslations } from '@/lib/i18n';
import { type TemplateSettings, DEFAULT_TEMPLATE_SETTINGS } from '@/lib/types/template-settings';
import { withLocalizedDefaultSections } from '@/lib/utils/section-helpers';
import { useLanguage } from '@/lib/context/language-context';
import { downloadBlobAsFile, openUrlInNewTab, sanitizeFilename } from '@/lib/utils/download';
import type { RegenerateItemInput } from '@/lib/api/enrichment';

type TabId = 'resume' | 'cover-letter' | 'outreach' | 'jd-match';

const STORAGE_KEY = 'resume_builder_draft';
const SETTINGS_STORAGE_KEY = 'resume_builder_settings';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const buildInitialData = (t: Translate): ResumeData => ({
  personalInfo: {
    name: t('builder.personalInfoForm.placeholders.name'),
    title: t('builder.personalInfoForm.placeholders.title'),
    email: t('builder.personalInfoForm.placeholders.email'),
    phone: t('builder.personalInfoForm.placeholders.phone'),
    location: t('builder.personalInfoForm.placeholders.location'),
    website: t('builder.personalInfoForm.placeholders.website'),
    linkedin: t('builder.personalInfoForm.placeholders.linkedin'),
    github: t('builder.personalInfoForm.placeholders.github'),
  },
  summary: t('builder.placeholders.summary'),
  workExperience: [],
  education: [],
  personalProjects: [],
  additional: {
    technicalSkills: [],
    languages: [],
    certificationsTraining: [],
    awards: [],
  },
});

const ResumeBuilderContent = () => {
  const { t } = useTranslations();
  const { uiLanguage, contentLanguage } = useLanguage();
  const [notificationDialog, setNotificationDialog] = useState<{
    title: string;
    description: string;
    variant: NonNullable<ConfirmDialogProps['variant']>;
  } | null>(null);

  const showNotification = useCallback(
    (
      description: string,
      variant: NonNullable<ConfirmDialogProps['variant']> = 'default',
      title?: string
    ) => {
      const fallbackTitle = variant === 'success' ? t('common.success') : t('common.error');
      setNotificationDialog({
        title: title ?? fallbackTitle,
        description,
        variant,
      });
    },
    [t]
  );

  const initialData = useMemo(() => buildInitialData(t), [t]);
  const [resumeData, setResumeData] = useState<ResumeData>(() => initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<ResumeData>(() => initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [templateSettings, setTemplateSettings] =
    useState<TemplateSettings>(DEFAULT_TEMPLATE_SETTINGS);
  const { improvedData } = useResumePreview();
  const improvedPreview = improvedData?.data?.resume_preview;
  const improvedCoverLetter = improvedData?.data?.cover_letter;
  const improvedOutreach = improvedData?.data?.outreach_message;
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get('id');

  useEffect(() => {
    if (resumeId || hasUnsavedChanges || improvedPreview) {
      return;
    }
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      return;
    }
    setResumeData(initialData);
    setLastSavedData(initialData);
  }, [initialData, resumeId, hasUnsavedChanges, improvedPreview]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('resume');

  // Cover letter & outreach state
  const [coverLetter, setCoverLetter] = useState('');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [isCoverLetterSaving, setIsCoverLetterSaving] = useState(false);
  const [isOutreachSaving, setIsOutreachSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);

  // On-demand generation state
  const [isTailoredResume, setIsTailoredResume] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState<
    'cover-letter' | 'outreach' | null
  >(null);

  // JD comparison state
  const [jobDescription, setJobDescription] = useState<string | null>(null);

  // Fullscreen preview state
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(true);

  // AI Regenerate wizard
  const regenerateWizard = useRegenerateWizard({
    resumeId: resumeId || '',
    outputLanguage: contentLanguage,
    onSuccess: async () => {
      // Reload resume data after applying changes
      if (!resumeId) {
        return;
      }

      try {
        const data = await fetchResume(resumeId);
        // Update resume title for downloads
        setResumeTitle(data.title ?? null);
        if (data.processed_resume) {
          setResumeData(data.processed_resume as ResumeData);
          setLastSavedData(data.processed_resume as ResumeData);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to reload resume after applying regenerated changes:', error);
        showNotification(t('builder.alerts.reloadFailed'), 'danger');
        throw error;
      }
    },
    onError: (errorMessage) => {
      console.error('Error during regeneration or applying regenerated changes:', errorMessage);

      if (/network|fetch/i.test(errorMessage) || errorMessage.includes('Failed to fetch')) {
        showNotification(t('builder.regenerate.errors.networkError'), 'danger');
        return;
      }

      if (/resume content changed|uniquely matched|please regenerate/i.test(errorMessage)) {
        showNotification(t('builder.regenerate.errors.resumeChanged'), 'danger');
        return;
      }

      if (/generate/i.test(errorMessage)) {
        showNotification(t('builder.regenerate.errors.generationFailed'), 'danger');
        return;
      }

      showNotification(t('builder.regenerate.errors.applyFailed'), 'danger');
    },
  });

  // Build regenerate items from resume data
  const experienceItemsForRegenerate: RegenerateItemInput[] = useMemo(() => {
    return (resumeData.workExperience || []).map((exp, idx) => ({
      item_id: `exp_${idx}`,
      item_type: 'experience' as const,
      title: exp.title ?? '',
      subtitle: exp.company || undefined,
      current_content: Array.isArray(exp.description) ? exp.description : [],
    }));
  }, [resumeData.workExperience]);

  const projectItemsForRegenerate: RegenerateItemInput[] = useMemo(() => {
    return (resumeData.personalProjects || []).map((proj, idx) => ({
      item_id: `proj_${idx}`,
      item_type: 'project' as const,
      title: proj.name ?? '',
      subtitle: proj.role || undefined,
      current_content: Array.isArray(proj.description) ? proj.description : [],
    }));
  }, [resumeData.personalProjects]);

  const skillsItemForRegenerate: RegenerateItemInput | null = useMemo(() => {
    const skills = resumeData.additional?.technicalSkills;
    if (skills && skills.length > 0) {
      return {
        item_id: 'skills',
        item_type: 'skills' as const,
        title: t('builder.regenerate.selectDialog.skills'),
        current_content: skills,
      };
    }
    return null;
  }, [resumeData.additional?.technicalSkills, t]);

  const localizedResumeDataForPreview = useMemo(
    () => withLocalizedDefaultSections(resumeData, t),
    [resumeData, t]
  );

  // Load template settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setTemplateSettings({
          ...DEFAULT_TEMPLATE_SETTINGS,
          ...parsed,
          margins: { ...DEFAULT_TEMPLATE_SETTINGS.margins, ...parsed.margins },
          spacing: { ...DEFAULT_TEMPLATE_SETTINGS.spacing, ...parsed.spacing },
          fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, ...parsed.fontSize },
        });
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Save template settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(templateSettings));
  }, [templateSettings]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle body scroll locking in fullscreen
  useEffect(() => {
    if (isFullscreenPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreenPreview]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncMobilePanelState = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileEditorOpen(true);
      }
    };

    syncMobilePanelState();
    window.addEventListener('resize', syncMobilePanelState);
    return () => window.removeEventListener('resize', syncMobilePanelState);
  }, []);

  useEffect(() => {
    if (!isFullscreenPreview) return;
    setIsMobileEditorOpen(false);
  }, [isFullscreenPreview]);

  useEffect(() => {
    const loadResumeData = async () => {
      setLoadingState('loading');

      // Priority 1: Fetch from API if ID is in URL (most reliable)
      if (resumeId) {
        try {
          const data = await fetchResume(resumeId);
          // Track if this is a tailored resume (has parent_id)
          setIsTailoredResume(Boolean(data.parent_id));
          // Store resume title for downloads
          setResumeTitle(data.title ?? null);
          // Load cover letter and outreach message if available
          if (data.cover_letter) {
            setCoverLetter(data.cover_letter);
          }
          if (data.outreach_message) {
            setOutreachMessage(data.outreach_message);
          }
          // Prefer processed_resume if available
          if (data.processed_resume) {
            setResumeData(data.processed_resume as ResumeData);
            setLastSavedData(data.processed_resume as ResumeData);
            setLoadingState('loaded');
            return;
          }
          // Fallback to parsing raw content
          if (data.raw_resume?.content) {
            try {
              const parsed = JSON.parse(data.raw_resume.content);
              setResumeData(parsed);
              setLastSavedData(parsed);
              setLoadingState('loaded');
              return;
            } catch {
              // Raw content is markdown, not JSON
            }
          }
        } catch (err) {
          console.error('Failed to load resume from API:', err);
        }
      }

      // Priority 2: Improved Data from Context (Tailor Flow)
      if (improvedPreview) {
        setResumeData(improvedPreview);
        setLastSavedData(improvedPreview);
        // Also load cover letter and outreach if present
        if (improvedCoverLetter) {
          setCoverLetter(improvedCoverLetter);
        }
        if (improvedOutreach) {
          setOutreachMessage(improvedOutreach);
        }
        // Persist to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(improvedPreview));
        setLoadingState('loaded');
        return;
      }

      // Priority 3: Restore from localStorage (browser refresh recovery)
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setResumeData(parsed);
          setLastSavedData(parsed);
          setHasUnsavedChanges(true); // Mark as unsaved since it's a draft
          setLoadingState('loaded');
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Fallback: Use initial data
      setLoadingState('loaded');
    };

    loadResumeData();
  }, [improvedPreview, improvedCoverLetter, improvedOutreach, resumeId]);

  // Fetch job description when we have a tailored resume
  useEffect(() => {
    let cancelled = false;

    const loadJobDescription = async () => {
      if (isTailoredResume && resumeId) {
        try {
          const data = await fetchJobDescription(resumeId);
          if (!cancelled) {
            setJobDescription(data.content);
          }
        } catch (err) {
          // JD might not be available for older resumes
          if (!cancelled) {
            console.warn('Could not fetch job description:', err);
            setJobDescription(null);
          }
        }
      } else {
        // Clear job description when switching to non-tailored resume
        setJobDescription(null);
      }
    };

    loadJobDescription();
    return () => {
      cancelled = true;
    };
  }, [isTailoredResume, resumeId]);

  const handleUpdate = useCallback((newData: ResumeData) => {
    setResumeData(newData);
    setHasUnsavedChanges(true);
    // Auto-save draft to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const handleSettingsChange = useCallback((newSettings: TemplateSettings) => {
    setTemplateSettings(newSettings);
  }, []);

  const handleSave = async () => {
    if (!resumeId) {
      showNotification(t('builder.alerts.saveNotAvailable'), 'warning');
      return;
    }
    try {
      setIsSaving(true);
      const updated = await updateResume(resumeId, resumeData);
      const nextData = (updated.processed_resume || resumeData) as ResumeData;
      setResumeData(nextData);
      setLastSavedData(nextData);
      setHasUnsavedChanges(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch (error) {
      console.error('Failed to save resume:', error);
      showNotification(t('builder.alerts.saveFailed'), 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setResumeData(lastSavedData);
    setHasUnsavedChanges(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lastSavedData));
  };

  const handleDownload = async () => {
    if (!resumeId) {
      showNotification(t('builder.alerts.downloadNotAvailable'), 'warning');
      return;
    }
    try {
      setIsDownloading(true);
      const { blob, filename } = await downloadResumePdf(resumeId, templateSettings, uiLanguage);
      downloadBlobAsFile(blob, filename);
      showNotification(t('builder.alerts.downloadSuccess'), 'success');
    } catch (error) {
      console.error('Failed to download resume:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const fallbackUrl = getResumePdfUrl(resumeId, templateSettings, uiLanguage);
        const didOpen = openUrlInNewTab(fallbackUrl);
        if (!didOpen) {
          showNotification(t('common.popupBlocked', { url: fallbackUrl }), 'warning');
        }
        return;
      }
      let errorMessage = t('builder.alerts.downloadFailed');
      if (error instanceof Error && error.message) {
        errorMessage = `${t('builder.alerts.downloadFailed')}: ${error.message}`;
      }
      showNotification(errorMessage, 'danger');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!resumeId) {
      showNotification(t('builder.alerts.downloadNotAvailable'), 'warning');
      return;
    }
    try {
      setIsDownloadingDocx(true);
      const { blob, filename } = await downloadResumeDocx(resumeId);
      downloadBlobAsFile(blob, filename);
      showNotification('Word document downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to download resume as DOCX:', error);
      let errorMessage = 'Failed to download Word document';
      if (error instanceof Error && error.message) {
        errorMessage = `Failed to download Word document: ${error.message}`;
      }
      showNotification(errorMessage, 'danger');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleSavePdf = async () => {
    if (!resumeId) {
      showNotification(t('builder.alerts.downloadNotAvailable'), 'warning');
      return;
    }
    try {
      setIsSavingPdf(true);
      const { filename, path } = await saveResumePdf(resumeId, templateSettings, uiLanguage);
      showNotification(`PDF saved to: ${filename}`, 'success');
      console.log('PDF saved to:', path);
    } catch (error) {
      console.error('Failed to save resume PDF:', error);
      let errorMessage = 'Failed to save PDF to outputs directory';
      if (error instanceof Error && error.message) {
        errorMessage = `Failed to save PDF: ${error.message}`;
      }
      showNotification(errorMessage, 'danger');
    } finally {
      setIsSavingPdf(false);
    }
  };

  // Cover letter handlers
  const handleSaveCoverLetter = async () => {
    if (!resumeId) return;
    try {
      setIsCoverLetterSaving(true);
      await updateCoverLetter(resumeId, coverLetter);
      showNotification(t('builder.alerts.coverLetterSaveSuccess'), 'success');
    } catch (error) {
      console.error('Failed to save cover letter:', error);
      showNotification(t('builder.alerts.coverLetterSaveFailed'), 'danger');
    } finally {
      setIsCoverLetterSaving(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (!resumeId) {
      showNotification(t('builder.alerts.coverLetterDownloadRequiresResume'), 'warning');
      return;
    }
    if (!coverLetter) {
      showNotification(t('builder.alerts.coverLetterMissing'), 'warning');
      return;
    }
    try {
      setIsDownloading(true);
      const blob = await downloadCoverLetterPdf(resumeId, templateSettings.pageSize, uiLanguage);
      const filename = sanitizeFilename(resumeTitle, resumeId, 'cover-letter');
      downloadBlobAsFile(blob, filename);
    } catch (error) {
      console.error('Failed to download cover letter:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const fallbackUrl = getCoverLetterPdfUrl(resumeId, templateSettings.pageSize, uiLanguage);
        const didOpen = openUrlInNewTab(fallbackUrl);
        if (!didOpen) {
          showNotification(t('common.popupBlocked', { url: fallbackUrl }), 'warning');
        }
        return;
      }
      const errorMessage = error instanceof Error ? error.message : t('common.unknown');
      showNotification(
        t('builder.alerts.coverLetterDownloadFailed', { error: errorMessage }),
        'danger'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Outreach handlers
  const handleSaveOutreach = async () => {
    if (!resumeId) return;
    try {
      setIsOutreachSaving(true);
      await updateOutreachMessage(resumeId, outreachMessage);
      showNotification(t('builder.alerts.outreachSaveSuccess'), 'success');
    } catch (error) {
      console.error('Failed to save outreach message:', error);
      showNotification(t('builder.alerts.outreachSaveFailed'), 'danger');
    } finally {
      setIsOutreachSaving(false);
    }
  };

  const handleCopyOutreach = async () => {
    try {
      await navigator.clipboard.writeText(outreachMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // On-demand generation handlers
  const doGenerateCoverLetter = async () => {
    if (!resumeId) return;
    setIsGeneratingCoverLetter(true);
    setShowRegenerateDialog(null);
    try {
      const content = await generateCoverLetter(resumeId);
      setCoverLetter(content);
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(
        t('builder.alerts.coverLetterGenerateFailed', { error: errorMessage }),
        'danger'
      );
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleGenerateCoverLetter = () => {
    if (!resumeId) return;
    // If content exists, show confirmation dialog
    if (coverLetter) {
      setShowRegenerateDialog('cover-letter');
      return;
    }
    doGenerateCoverLetter();
  };

  const doGenerateOutreach = async () => {
    if (!resumeId) return;
    setIsGeneratingOutreach(true);
    setShowRegenerateDialog(null);
    try {
      const content = await generateOutreachMessage(resumeId);
      setOutreachMessage(content);
    } catch (error) {
      console.error('Failed to generate outreach message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(
        t('builder.alerts.outreachGenerateFailed', { error: errorMessage }),
        'danger'
      );
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleGenerateOutreach = () => {
    if (!resumeId) return;
    // If content exists, show confirmation dialog
    if (outreachMessage) {
      setShowRegenerateDialog('outreach');
      return;
    }
    doGenerateOutreach();
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#08111f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_26%),radial-gradient(circle_at_78%_14%,_rgba(56,189,248,0.16),_transparent_24%),linear-gradient(135deg,_#08111f_0%,_#0f172a_38%,_#172554_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-y-0 left-[42%] w-px bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent blur-sm" />
      </div>

      <header className="relative z-30 border-b border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="h-11 min-w-11 rounded-full border border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-slate-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100 sm:px-4 sm:text-xs sm:tracking-[0.28em]"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('nav.backToDashboard')}</span>
              </Button>

              
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {hasUnsavedChanges ? (
                <span className="flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
                  {t('builder.unsavedDraft')}
                </span>
              ) : (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200">
                  archive synced
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {hasUnsavedChanges ? (
                <span className="flex shrink-0 items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
                  {t('builder.unsavedDraft')}
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
                  archive synced
                </span>
              )}
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">
                {activeTab === 'resume' ? 'resume board' : activeTab.replace('-', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                variant={isMobileEditorOpen ? 'outline' : 'ghost'}
                onClick={() => {
                  setIsMobileEditorOpen(true);
                  setIsFullscreenPreview(false);
                }}
                className="h-11 rounded-2xl border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100"
              >
                Editor
              </Button>
              <Button
                variant={!isMobileEditorOpen ? 'outline' : 'ghost'}
                onClick={() => setIsMobileEditorOpen(false)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100"
              >
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="h-11 rounded-2xl border-cyan-300/30 bg-cyan-300/10 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100 disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">{t('common.save')}</span>
              </Button>
              <Button
                variant="default"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-11 rounded-2xl border border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.92),rgba(249,115,22,0.92))] px-3 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.22)]"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="ml-2">{t('common.download')}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasUnsavedChanges}
                className="h-11 rounded-2xl border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 disabled:opacity-40"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200"
              >
                {isFullscreenPreview ? (
                  <Minimize2 className="mr-2 h-4 w-4" />
                ) : (
                  <Maximize2 className="mr-2 h-4 w-4" />
                )}
                Focus
              </Button>
            </div>
          </div>

          <div className="hidden flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:flex">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasUnsavedChanges}
                className="h-11 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.24em] text-slate-200 transition-all hover:bg-white/10 disabled:opacity-40"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="h-11 rounded-full border-cyan-300/30 bg-cyan-300/10 px-5 font-sans text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 transition-all hover:border-cyan-300/50 hover:bg-cyan-300/15 disabled:opacity-40"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t('common.save')}
              </Button>

              <Button
                variant="default"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-11 rounded-full border border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.92),rgba(249,115,22,0.92))] px-5 font-sans text-xs font-black uppercase tracking-[0.24em] text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.22)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(249,115,22,0.28)]"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('common.download')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 overflow-hidden">
        <div
          className={cn(
            'h-full flex-col border-r border-white/10 bg-slate-950/45 backdrop-blur-xl transition-all duration-500',
            isFullscreenPreview
              ? 'hidden'
              : isMobileEditorOpen
                ? 'flex w-full lg:w-[520px] xl:w-[620px]'
                : 'hidden lg:flex lg:w-[520px] xl:w-[620px]'
          )}
        >
          <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
                  composition deck
                </p>
                <h2 className="mt-2 font-serif text-xl font-black uppercase tracking-[0.08em] text-white sm:text-2xl">
                  {resumeId ? t('builder.editMode') : t('builder.createAndPreview')}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-300 lg:hidden">
                  Edit section-by-section with touch-friendly spacing and keep the preview one tap
                  away.
                </p>
              </div>
              
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 sm:px-4 sm:py-6 lg:px-6 xl:px-8">
            <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.62))] p-3 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:rounded-[2rem] sm:p-6">
              <ResumeForm resumeData={resumeData} onUpdate={handleUpdate} />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative flex flex-1 flex-col overflow-hidden',
            !isMobileEditorOpen && !isFullscreenPreview ? 'flex' : ''
          )}
        >
          <div className="border-b border-white/10 bg-slate-950/35 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                    review theater
                  </span>
                  <span className="h-px w-16 bg-gradient-to-r from-fuchsia-300/60 to-transparent" />
                </div>
                <RetroTabs
                  tabs={[
                    { id: 'resume', label: t('builder.previewTabs.resume') },
                    {
                      id: 'cover-letter',
                      label: t('builder.previewTabs.coverLetter'),
                      disabled: !coverLetter,
                    },
                    {
                      id: 'outreach',
                      label: t('builder.previewTabs.outreach'),
                      disabled: !outreachMessage,
                    },
                    {
                      id: 'jd-match',
                      label: t('builder.previewTabs.jdMatch'),
                      disabled: !jobDescription,
                    },
                  ]}
                  activeTab={activeTab}
                  onTabChange={(id) => setActiveTab(id as TabId)}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-1.5 sm:rounded-full"
                />
              </div>

              <div className="hidden flex-wrap items-center gap-2 sm:flex">
                <Button
                  variant="outline"
                  onClick={handleDownloadDocx}
                  disabled={!resumeId || isDownloadingDocx}
                  className="h-11 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.22em] text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  {isDownloadingDocx ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  DOCX
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSavePdf}
                  disabled={!resumeId || isSavingPdf}
                  className="h-11 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.22em] text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  {isSavingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <HardDrive className="mr-2 h-4 w-4" />
                  )}
                  Archive PDF
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                  className="h-11 w-11 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  {isFullscreenPreview ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:hidden">
                <Button
                  variant="outline"
                  onClick={handleDownloadDocx}
                  disabled={!resumeId || isDownloadingDocx}
                  className="h-10 rounded-2xl border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200 disabled:opacity-40"
                >
                  {isDownloadingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span className="ml-2">DOCX</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSavePdf}
                  disabled={!resumeId || isSavingPdf}
                  className="h-10 rounded-2xl border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200 disabled:opacity-40"
                >
                  {isSavingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                  <span className="ml-2">PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                  className="h-10 rounded-2xl border border-white/10 bg-white/5 px-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200"
                >
                  {isFullscreenPreview ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span className="ml-2">Focus</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.5),rgba(15,23,42,0.28))] p-2 shadow-[0_30px_80px_rgba(2,6,23,0.4)] sm:rounded-[2rem] sm:p-4">
              <div
                className={cn(
                  'flex-1 transition-all duration-500 transform',
                  activeTab === 'resume' ? 'scale-100 opacity-100' : 'scale-95 opacity-0 hidden'
                )}
              >
                <FormattingControls settings={templateSettings} onChange={handleSettingsChange} />
                <div className="mx-auto overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-2 mt-4">
                  <PaginatedPreview
                    resumeData={localizedResumeDataForPreview}
                    settings={templateSettings}
                    isFullscreen={isFullscreenPreview}
                  />
                </div>
              </div>

              {activeTab === 'cover-letter' && coverLetter && (
                <div className="animate-in fade-in zoom-in-95 duration-300 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                        generated correspondence
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white">
                        Cover Letter
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerateCoverLetter}
                        disabled={!resumeId || isGeneratingCoverLetter}
                        className="h-10 rounded-full border-fuchsia-300/25 bg-fuchsia-300/10 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-100"
                      >
                        {isGeneratingCoverLetter ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSaveCoverLetter}
                        disabled={!resumeId || isCoverLetterSaving}
                        className="h-10 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-slate-100"
                      >
                        {isCoverLetterSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadCoverLetter}
                        disabled={!resumeId || isDownloading}
                        className="h-10 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-slate-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <CoverLetterPreview
                    content={coverLetter}
                    personalInfo={resumeData.personalInfo ?? {}}
                    pageSize={templateSettings.pageSize}
                  />
                </div>
              )}

              {activeTab === 'outreach' && outreachMessage && (
                <div className="animate-in fade-in zoom-in-95 duration-300 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                        contact draft
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white">
                        Outreach
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerateOutreach}
                        disabled={!resumeId || isGeneratingOutreach}
                        className="h-10 rounded-full border-fuchsia-300/25 bg-fuchsia-300/10 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-100"
                      >
                        {isGeneratingOutreach ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSaveOutreach}
                        disabled={!resumeId || isOutreachSaving}
                        className="h-10 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-slate-100"
                      >
                        {isOutreachSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyOutreach}
                        disabled={!outreachMessage}
                        className="h-10 rounded-full border-white/10 bg-white/5 px-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-slate-100"
                      >
                        {isCopied ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <OutreachPreview content={outreachMessage} />
                </div>
              )}

              {activeTab === 'jd-match' && jobDescription && (
                <div className="animate-in fade-in zoom-in-95 duration-300 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="mb-4">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                      role alignment
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white">
                      JD Match
                    </h3>
                  </div>
                  <JDComparisonView resumeData={resumeData} jobDescription={jobDescription} />
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:gap-3">
            <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 font-sans text-[9px] font-bold uppercase tracking-[0.26em] text-slate-300 shadow-[0_10px_30px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:px-4 sm:text-[10px] sm:tracking-[0.3em]">
              AI polish
            </div>
            <Button
              size="lg"
              className="pointer-events-auto h-14 w-14 rounded-full border border-fuchsia-300/30 bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.95),rgba(168,85,247,0.95)_55%,rgba(30,41,59,0.95)_100%)] p-0 text-white shadow-[0_24px_60px_rgba(168,85,247,0.42)] transition-all hover:scale-110 active:scale-95 sm:h-16 sm:w-16"
              onClick={() => regenerateWizard.startRegenerate()}
              disabled={!resumeId}
            >
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-white/10 bg-slate-950/80 px-3 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isMobileEditorOpen ? 'outline' : 'ghost'}
                onClick={() => {
                  setIsMobileEditorOpen(true);
                  setIsFullscreenPreview(false);
                }}
                className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-slate-100"
              >
                Edit Resume
              </Button>
              <Button
                variant={!isMobileEditorOpen ? 'outline' : 'ghost'}
                onClick={() => setIsMobileEditorOpen(false)}
                className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-slate-100"
              >
                Preview Mode
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Regenerate Confirmation Dialog */}
      <ConfirmDialog
        open={showRegenerateDialog !== null}
        onOpenChange={(open) => !open && setShowRegenerateDialog(null)}
        title={t('builder.regenerateDialog.title', {
          title:
            showRegenerateDialog === 'cover-letter' ? t('coverLetter.title') : t('outreach.title'),
        })}
        description={t('builder.regenerateDialog.description', {
          title:
            showRegenerateDialog === 'cover-letter' ? t('coverLetter.title') : t('outreach.title'),
        })}
        confirmLabel={
          showRegenerateDialog === 'cover-letter'
            ? t('coverLetter.regenerate')
            : t('outreach.regenerate')
        }
        cancelLabel={t('common.cancel')}
        variant="warning"
        onConfirm={
          showRegenerateDialog === 'cover-letter' ? doGenerateCoverLetter : doGenerateOutreach
        }
      />

      {/* Notification Dialog (replaces native alert()) */}
      <ConfirmDialog
        open={notificationDialog !== null}
        onOpenChange={(open) => !open && setNotificationDialog(null)}
        title={notificationDialog?.title ?? ''}
        description={notificationDialog?.description ?? ''}
        confirmLabel={t('common.ok')}
        showCancelButton={false}
        variant={notificationDialog?.variant ?? 'default'}
        onConfirm={() => setNotificationDialog(null)}
      />

      {/* AI Regenerate Wizard */}
      <RegenerateWizard
        step={regenerateWizard.step}
        onStepChange={regenerateWizard.setStep}
        experienceItems={experienceItemsForRegenerate}
        projectItems={projectItemsForRegenerate}
        skillsItem={skillsItemForRegenerate}
        selectedItems={regenerateWizard.selectedItems}
        onSelectionChange={regenerateWizard.setSelectedItems}
        instruction={regenerateWizard.instruction}
        onInstructionChange={regenerateWizard.setInstruction}
        regeneratedItems={regenerateWizard.regeneratedItems}
        regenerateErrors={regenerateWizard.regenerateErrors}
        isGenerating={regenerateWizard.isGenerating}
        isApplying={regenerateWizard.isApplying}
        error={regenerateWizard.error}
        onGenerate={regenerateWizard.generate}
        onAccept={regenerateWizard.acceptChanges}
        onReject={regenerateWizard.rejectAndRegenerate}
        onClose={regenerateWizard.reset}
      />
    </div>
  );
};

export const ResumeBuilder = () => {
  const { t } = useTranslations();
  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <ResumeBuilderContent />
    </Suspense>
  );
};
