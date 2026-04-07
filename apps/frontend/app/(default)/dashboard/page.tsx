'use client';

import { SwissGrid } from '@/components/home/swiss-grid';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import ResumeManagerDialog from '@/components/dashboard/resume-manager-dialog';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { fetchAuthMe, type AuthUser } from '@/lib/api/auth';
import { API_BASE } from '@/lib/api/client';

import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Settings from 'lucide-react/dist/esm/icons/settings';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Search from 'lucide-react/dist/esm/icons/search';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

import {
  fetchResume,
  fetchResumeList,
  deleteResume,
  retryProcessing,
  fetchJobDescription,
  type ResumeListItem,
} from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'loading';
type ResumeFilter = 'all' | 'ready' | 'processing' | 'failed';

export default function DashboardPage() {
  const { t, locale } = useTranslations();
  const [authUser, setAuthUser] = useState<AuthUser | null | 'loading'>('loading');
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('loading');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tailoredResumes, setTailoredResumes] = useState<ResumeListItem[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showMasterManager, setShowMasterManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ResumeFilter>('all');
  const router = useRouter();

  const {
    status: systemStatus,
    isLoading: statusLoading,
    incrementResumes,
    decrementResumes,
    setHasMasterResume,
  } = useStatusCache();

  const loadRequestIdRef = useRef(0);
  const jobSnippetCacheRef = useRef<Record<string, string>>({});

  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;
  const isTailorEnabled =
    Boolean(masterResumeId) && processingStatus === 'ready' && isLlmConfigured;

  const formatDate = (value: string) => {
    if (!value) return t('common.unknown');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('common.unknown');

    const dateLocale =
      locale === 'es' ? 'es-ES' : locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US';

    return date.toLocaleDateString(dateLocale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const checkResumeStatus = useCallback(async (resumeId: string) => {
    try {
      setProcessingStatus('loading');
      const data = await fetchResume(resumeId);
      const status = data.raw_resume?.processing_status || 'pending';
      setProcessingStatus(status as ProcessingStatus);
    } catch (err: unknown) {
      console.error('Failed to check resume status:', err);
      if (err instanceof Error && err.message.includes('404')) {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
        return;
      }
      setProcessingStatus('failed');
    }
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('master_resume_id');
    if (storedId) {
      setMasterResumeId(storedId);
      checkResumeStatus(storedId);
    }
  }, [checkResumeStatus]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const user = await fetchAuthMe();
        if (!cancelled) setAuthUser(user);
      } catch {
        if (!cancelled) setAuthUser(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTailoredResumes = useCallback(async () => {
    try {
      const data = await fetchResumeList(true);
      const masterFromList = data.find((r) => r.is_master);
      const storedId = localStorage.getItem('master_resume_id');
      const resolvedMasterId = masterFromList?.resume_id || storedId;

      if (resolvedMasterId) {
        localStorage.setItem('master_resume_id', resolvedMasterId);
        setMasterResumeId(resolvedMasterId);
        checkResumeStatus(resolvedMasterId);
      } else {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
      }

      const filtered = data.filter((r) => r.resume_id !== resolvedMasterId);
      setTailoredResumes(filtered);

      const tailoredWithParent = filtered.filter((r) => r.parent_id);
      const requestId = ++loadRequestIdRef.current;
      const jobSnippets: Record<string, string> = {};

      await Promise.all(
        tailoredWithParent.map(async (r) => {
          if (jobSnippetCacheRef.current[r.resume_id]) {
            jobSnippets[r.resume_id] = jobSnippetCacheRef.current[r.resume_id];
            return;
          }
          try {
            const jd = await fetchJobDescription(r.resume_id);
            const snippet = (jd?.content || '').slice(0, 110);
            jobSnippetCacheRef.current[r.resume_id] = snippet;
            jobSnippets[r.resume_id] = snippet;
          } catch {
            jobSnippetCacheRef.current[r.resume_id] = '';
            jobSnippets[r.resume_id] = '';
          }
        })
      );

      if (requestId === loadRequestIdRef.current) {
        setTailoredResumes((prev) =>
          prev.map((r) => ({ ...r, jobSnippet: jobSnippets[r.resume_id] || '' }))
        );
      }
    } catch (err) {
      console.error('Failed to load tailored resumes:', err);
    }
  }, [checkResumeStatus]);

  useEffect(() => {
    loadTailoredResumes();
  }, [loadTailoredResumes]);

  useEffect(() => {
    const handleFocus = () => {
      loadTailoredResumes();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTailoredResumes]);

  const handleUploadComplete = (resumeId: string) => {
    localStorage.setItem('master_resume_id', resumeId);
    setMasterResumeId(resumeId);
    checkResumeStatus(resumeId);
    incrementResumes();
    setHasMasterResume(true);
  };

  const handleRetryProcessing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!masterResumeId) return;
    setIsRetrying(true);
    try {
      const result = await retryProcessing(masterResumeId);
      if (result.processing_status === 'ready') {
        setProcessingStatus('ready');
      } else if (
        result.processing_status === 'processing' ||
        result.processing_status === 'pending'
      ) {
        setProcessingStatus(result.processing_status);
      } else {
        setProcessingStatus('failed');
      }
    } catch (err) {
      console.error('Retry processing failed:', err);
      setProcessingStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeleteAndReupload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDeleteAndReupload = async () => {
    if (!masterResumeId) return;
    try {
      await deleteResume(masterResumeId);
      decrementResumes();
      setHasMasterResume(false);
      localStorage.removeItem('master_resume_id');
      setMasterResumeId(null);
      setProcessingStatus('loading');
      setIsUploadDialogOpen(true);
      await loadTailoredResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const getStatusDisplay = () => {
    switch (processingStatus) {
      case 'loading':
        return {
          text: t('dashboard.status.checking'),
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          tone: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-600 border-slate-200/80',
        };
      case 'processing':
        return {
          text: t('dashboard.status.processing'),
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          tone: 'text-sky-700',
          badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
        };
      case 'ready':
        return {
          text: t('dashboard.status.ready'),
          icon: null,
          tone: 'text-emerald-700',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        };
      case 'failed':
        return {
          text: t('dashboard.status.failed'),
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          tone: 'text-rose-700',
          badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
        };
      default:
        return {
          text: t('dashboard.status.pending'),
          icon: null,
          tone: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-600 border-slate-200/80',
        };
    }
  };

  const getMonogram = (title: string): string => {
    const words = title.split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w));
    return words
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  };

  const cardPalette = [
    { bg: '#2563EB', fg: '#FFFFFF' },
    { bg: '#0F766E', fg: '#FFFFFF' },
    { bg: '#7C3AED', fg: '#FFFFFF' },
    { bg: '#15803D', fg: '#FFFFFF' },
    { bg: '#B45309', fg: '#FFFFFF' },
    { bg: '#DB2777', fg: '#FFFFFF' },
    { bg: '#4338CA', fg: '#FFFFFF' },
    { bg: '#111827', fg: '#FFFFFF' },
  ];

  const hashTitle = (title: string): number => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const loginUrl = `${API_BASE}/auth/google/login`;
  const masterStatus = getStatusDisplay();

  const filteredResumes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tailoredResumes.filter((resume) => {
      const title = (resume.title || resume.jobSnippet || resume.filename || '').toLowerCase();
      const status = (resume.processing_status || '').toLowerCase();

      const matchesQuery =
        !query ||
        title.includes(query) ||
        (resume.filename || '').toLowerCase().includes(query) ||
        (resume.jobSnippet || '').toLowerCase().includes(query);

      const matchesFilter = activeFilter === 'all' || status === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [tailoredResumes, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    return tailoredResumes.reduce(
      (acc, resume) => {
        const status = (resume.processing_status || 'pending') as keyof typeof acc;
        if (status in acc) acc[status] += 1;
        return acc;
      },
      { ready: 0, processing: 0, failed: 0, pending: 0 }
    );
  }, [tailoredResumes]);

  const dashboardHeaderActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {([
          { key: 'all', label: 'All', count: tailoredResumes.length },
          { key: 'ready', label: 'Ready', count: counts.ready },
          { key: 'processing', label: 'Processing', count: counts.processing + counts.pending },
          { key: 'failed', label: 'Failed', count: counts.failed },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveFilter(item.key as ResumeFilter)}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-[1.05rem] border px-3 py-2 text-xs font-semibold transition-all duration-300',
              activeFilter === item.key
                ? 'border-transparent bg-[linear-gradient(135deg,#2563eb,#4f46e5,#8b5cf6)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.2)]'
                : 'border-white/80 bg-white/72 text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.05)] hover:bg-white hover:text-slate-950'
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px]',
                activeFilter === item.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative min-w-0 sm:w-[17rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resumes, companies, or roles"
          className="h-11 w-full rounded-[1.1rem] border border-white/80 bg-white/78 pl-10 pr-4 text-sm text-slate-700 shadow-[0_10px_26px_rgba(15,23,42,0.06)] outline-none transition-all placeholder:text-slate-400 focus:border-primary/20 focus:bg-white"
        />
      </div>
    </div>
  );

  if (authUser === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="font-sans text-sm text-slate-500">Checking session...</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-[1.8rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="space-y-6 p-8 text-center">
            <div className="space-y-2">
              <CardTitle className="font-sans text-3xl font-bold text-primary">
                Sign in required
              </CardTitle>
              <CardDescription className="text-sm">{t('errors.unauthorized')}</CardDescription>
            </div>
            <a href={loginUrl} className="block">
              <Button className="w-full">Sign in with Google</Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <SwissGrid
        title={t('nav.dashboard')}
        description="Manage your master resume and tailored variations in one place, with faster scanning and mobile-friendly organization."
        headerContent={dashboardHeaderActions}
        contentClassName="pb-8"
        gridClassName="gap-4 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {masterResumeId && !isLlmConfigured && !statusLoading && (
          <div className="xl:col-span-3 2xl:col-span-4">
            <div className="flex flex-col gap-4 rounded-[1.6rem] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,255,255,0.82))] p-4 shadow-[0_16px_40px_rgba(245,158,11,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-amber-100 text-amber-600 shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-amber-950">
                    {t('dashboard.llmNotConfiguredTitle')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800/80">
                    {t('dashboard.llmNotConfiguredMessage')}
                  </p>
                </div>
              </div>
              <Link href="/settings" className="sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-[1rem] border-amber-200 text-amber-800 hover:bg-white sm:w-auto"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            {!masterResumeId ? (
              !isLlmConfigured && !statusLoading ? (
                <Link href="/settings" className="block">
                  <Card
                    variant="interactive"
                    className="min-h-[17rem] rounded-[1.8rem] border-dashed border-amber-200/80 bg-amber-50/55"
                  >
                    <div className="flex h-full flex-col justify-between gap-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-amber-100 text-amber-700 shadow-sm">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div className="space-y-3">
                        <CardTitle className="text-2xl text-amber-950">
                          {t('dashboard.setupRequiredTitle')}
                        </CardTitle>
                        <CardDescription className="max-w-xl text-amber-800/80">
                          {t('dashboard.setupRequiredMessage')}
                        </CardDescription>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          <Settings className="h-3.5 w-3.5" />
                          {t('nav.goToSettings')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : (
                <ResumeUploadDialog
                  open={isUploadDialogOpen}
                  onOpenChange={setIsUploadDialogOpen}
                  onUploadComplete={handleUploadComplete}
                  trigger={
                    <Card
                      variant="interactive"
                      className="min-h-[17rem] rounded-[1.9rem] bg-[linear-gradient(135deg,rgba(37,99,235,0.96),rgba(99,102,241,0.92),rgba(168,85,247,0.88))] text-white shadow-[0_26px_60px_rgba(79,70,229,0.24)]"
                    >
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div className="flex h-18 w-18 items-center justify-center rounded-[1.5rem] border border-white/20 bg-white/12 backdrop-blur-sm">
                          <Plus className="h-9 w-9" />
                        </div>
                        <div className="space-y-3">
                          <CardTitle className="text-3xl leading-tight text-white">
                            {t('dashboard.initializeMasterResume')}
                          </CardTitle>
                          <CardDescription className="max-w-xl text-white/75">
                            {t('dashboard.initializeSequence')}
                          </CardDescription>
                        </div>
                      </div>
                    </Card>
                  }
                />
              )
            ) : (
              <Card
                variant="interactive"
                className="min-h-[17rem] rounded-[1.9rem]"
                onClick={() => router.push(`/resumes/${masterResumeId}`)}
              >
                <div className="flex h-full flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.45rem] bg-[linear-gradient(135deg,#2563eb,#4f46e5,#8b5cf6)] text-white shadow-[0_20px_40px_rgba(79,70,229,0.22)]">
                        <span className="font-sans text-2xl font-bold">M</span>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                          Master resume
                        </div>
                        <CardTitle className="text-2xl">Primary resume library</CardTitle>
                        <CardDescription className="mt-2 max-w-xl">
                          Keep your baseline experience updated so new tailored resumes can be created quickly.
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="z-10 h-11 w-11 rounded-[1.05rem]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMasterManager(true);
                        }}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                      {processingStatus === 'failed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="z-10 h-11 w-11 rounded-[1.05rem]"
                          onClick={handleRetryProcessing}
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                          masterStatus.badge
                        )}
                      >
                        {masterStatus.icon}
                        <span>{masterStatus.text}</span>
                      </div>
                      <div className={cn('text-sm font-medium', masterStatus.tone)}>
                        Ready master resumes unlock faster tailoring flows.
                      </div>
                    </div>

                    {processingStatus === 'failed' ? (
                      <div className="grid gap-2 sm:min-w-[18rem] sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-[1rem]"
                          onClick={handleRetryProcessing}
                          disabled={isRetrying}
                        >
                          {isRetrying
                            ? t('dashboard.retryingProcessing')
                            : t('dashboard.retryProcessing')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-[1rem] border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={handleDeleteAndReupload}
                        >
                          {t('dashboard.deleteAndReupload')}
                        </Button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <span>Open workspace</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card className="min-h-[17rem] rounded-[1.9rem]">
              <div className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">
                      Workspace stats
                    </div>
                    <CardTitle className="text-xl">Resume pipeline overview</CardTitle>
                    <CardDescription className="mt-2">
                      Designed to stay usable even as your dashboard grows past 20 tailored resumes.
                    </CardDescription>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#4f46e5,#8b5cf6)] text-white shadow-[0_14px_28px_rgba(79,70,229,0.2)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.2rem] border border-white/75 bg-white/76 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Tailored</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {tailoredResumes.length}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/75 bg-white/76 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Ready</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {counts.ready}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/75 bg-white/76 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Processing</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {counts.processing + counts.pending}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/75 bg-white/76 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Failed</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {counts.failed}
                    </div>
                  </div>
                </div>

                <div className="mt-auto rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-500">
                  Search, filter, and compact cards make high-volume resume collections easier to scan on desktop and mobile.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {isTailorEnabled && (
          <Card
            variant="interactive"
            className="min-h-[15rem] rounded-[1.8rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,247,255,0.92))]"
            onClick={() => router.push('/tailor')}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#2563eb,#4f46e5,#8b5cf6)] text-white shadow-[0_18px_36px_rgba(79,70,229,0.22)]">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create tailored resume</CardTitle>
                <CardDescription className="mt-2">
                  Start a new variation from your master resume with role-specific tailoring.
                </CardDescription>
              </div>
            </div>
          </Card>
        )}

        {!isTailorEnabled && (
          <Card className="min-h-[15rem] rounded-[1.8rem] border-dashed">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-slate-100 text-slate-500">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-800">{t('dashboard.createResume')}</CardTitle>
                <CardDescription className="mt-2">
                  Upload and finish processing your master resume before creating tailored versions.
                </CardDescription>
              </div>
            </div>
          </Card>
        )}

        <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Tailored resumes
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {filteredResumes.length} showing{searchQuery ? ` for “${searchQuery}”` : ''} from {tailoredResumes.length} total resumes.
              </p>
            </div>
          </div>

          {filteredResumes.length === 0 ? (
            <Card className="rounded-[1.8rem]">
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-slate-100 text-slate-500">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">
                    {searchQuery || activeFilter !== 'all'
                      ? 'No resumes match this view'
                      : 'No tailored resumes yet'}
                  </CardTitle>
                  <CardDescription className="max-w-md">
                    {searchQuery || activeFilter !== 'all'
                      ? 'Try another search term or switch filters to see more resumes.'
                      : 'Once you tailor resumes, they will appear here in a compact, scroll-friendly layout.'}
                  </CardDescription>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredResumes.map((resume) => {
                const title =
                  resume.title ||
                  resume.jobSnippet ||
                  resume.filename ||
                  t('dashboard.tailoredResume');
                const color = cardPalette[hashTitle(title) % cardPalette.length];
                const status = (resume.processing_status || 'pending').toLowerCase();

                return (
                  <Card
                    key={resume.resume_id}
                    variant="interactive"
                    className="min-h-[15rem] rounded-[1.7rem]"
                    onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                  >
                    <div className="flex h-full flex-col gap-5">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] shadow-[0_16px_32px_rgba(15,23,42,0.14)]"
                          style={{ backgroundColor: color.bg, color: color.fg }}
                        >
                          <span className="font-sans text-lg font-bold">{getMonogram(title) || 'R'}</span>
                        </div>
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                            status === 'ready' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                            (status === 'processing' || status === 'pending') &&
                              'border-sky-200 bg-sky-50 text-sky-700',
                            status === 'failed' && 'border-rose-200 bg-rose-50 text-rose-700'
                          )}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <CardTitle className="text-lg leading-6">
                          <span className="block line-clamp-2">{title}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-3 min-h-[4.5rem] text-sm leading-6">
                          {resume.jobSnippet ||
                            resume.filename ||
                            'Role-specific resume version ready for review.'}
                        </CardDescription>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Updated
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-600">
                            {formatDate(resume.updated_at || resume.created_at)}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          Open
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('confirmations.deleteMasterResumeTitle')}
          description={t('confirmations.deleteMasterResumeDescription')}
          confirmLabel={t('dashboard.deleteAndReupload')}
          cancelLabel={t('confirmations.keepResumeCancelLabel')}
          onConfirm={confirmDeleteAndReupload}
          variant="danger"
        />
      </SwissGrid>

      <ResumeManagerDialog
        isOpen={showMasterManager}
        onClose={() => setShowMasterManager(false)}
        onResumeChanged={() => {
          loadTailoredResumes();
        }}
      />
    </div>
  );
}
