'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { type ResumeData } from '@/components/dashboard/resume-component';
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
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <RetroTabs
          tabs={[
            { id: 'resume', label: t('builder.previewTabs.resume') },
            { id: 'cover-letter', label: t('builder.previewTabs.coverLetter'), disabled: !coverLetter },
            { id: 'outreach', label: t('builder.previewTabs.outreach'), disabled: !outreachMessage },
            { id: 'jd-match', label: t('builder.previewTabs.jdMatch'), disabled: !jobDescription },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
        <div className="h-full overflow-y-auto p-4">
          {activeTab === 'resume' && (
            <div className="grid grid-cols-2 gap-4">
              <ResumeForm data={resumeData} onChange={handleUpdate} />
              <PaginatedPreview data={localizedResumeDataForPreview} settings={templateSettings} />
            </div>
          )}
          {activeTab === 'cover-letter' && (
            <div className="grid grid-cols-2 gap-4">
              <CoverLetterEditor value={coverLetter} onChange={setCoverLetter} />
              <CoverLetterPreview content={coverLetter} />
            </div>
          )}
          {activeTab === 'outreach' && (
            <div className="grid grid-cols-2 gap-4">
              <OutreachEditor value={outreachMessage} onChange={setOutreachMessage} />
              <OutreachPreview content={outreachMessage} />
            </div>
          )}
          {activeTab === 'jd-match' && (
            <JDComparisonView jobDescription={jobDescription} resumeData={resumeData} />
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="p-4 bg-[#F0F0E8] flex justify-between items-center font-mono text-xs text-blue-700 border-t border-black no-print">
        <span className="uppercase font-bold flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Resume Matcher"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          {t('builder.footer.moduleLabel')}
        </span>
      </div>
    </div>
  );
};

export const ResumeBuilder = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ResumeBuilderContent />
  </Suspense>
);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <RetroTabs
          tabs={[
            { id: 'resume', label: t('builder.previewTabs.resume') },
            { id: 'cover-letter', label: t('builder.previewTabs.coverLetter'), disabled: !coverLetter },
            { id: 'outreach', label: t('builder.previewTabs.outreach'), disabled: !outreachMessage },
            { id: 'jd-match', label: t('builder.previewTabs.jdMatch'), disabled: !jobDescription },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
        <div className="h-full overflow-y-auto p-4">
          {activeTab === 'resume' && (
            <div className="grid grid-cols-2 gap-4">
              <ResumeForm data={resumeData} onChange={handleUpdate} />
              <PaginatedPreview data={localizedResumeDataForPreview} settings={templateSettings} />
            </div>
          )}
          {activeTab === 'cover-letter' && (
            <div className="grid grid-cols-2 gap-4">
              <CoverLetterEditor value={coverLetter} onChange={setCoverLetter} />
              <CoverLetterPreview content={coverLetter} />
            </div>
          )}
          {activeTab === 'outreach' && (
            <div className="grid grid-cols-2 gap-4">
              <OutreachEditor value={outreachMessage} onChange={setOutreachMessage} />
              <OutreachPreview content={outreachMessage} />
            </div>
          )}
          {activeTab === 'jd-match' && (
            <JDComparisonView jobDescription={jobDescription} resumeData={resumeData} />
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="p-4 bg-[#F0F0E8] flex justify-between items-center font-mono text-xs text-blue-700 border-t border-black no-print">
        <span className="uppercase font-bold flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Resume Matcher"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          {t('builder.footer.moduleLabel')}
        </span>
      </div>
    </div>
  );
};

export const ResumeBuilder = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ResumeBuilderContent />
  </Suspense>
);
