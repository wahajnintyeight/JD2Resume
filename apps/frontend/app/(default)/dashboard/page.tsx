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
import { LoadingAnimation } from '@/components/ui/loading-animation';

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
              'inline-flex items-center justify-center gap-2 border-2 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200',
              activeFilter === item.key
                ? 'border-black bg-black text-white'
                : 'border-black bg-white text-black hover:bg-black hover:text-white'
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                'border px-1.5 py-0.5 text-[10px] font-bold',
                activeFilter === item.key ? 'border-white bg-white text-black' : 'border-black bg-black text-white'
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative min-w-0 sm:w-[17rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resumes, companies, or roles"
          className="h-11 w-full border-2 border-black bg-white pl-10 pr-4 text-sm font-medium text-black outline-none transition-all placeholder:text-slate-500 focus:bg-yellow-100"
        />
      </div>
    </div>
  );

  if (authUser === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_10px,#fde68a_10px,#fde68a_20px)]">
        <div className="bg-white border-4 border-black p-12">
          <LoadingAnimation 
            message="Checking session..." 
            variant="sparkle" 
            size="lg" 
          />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_10px,#fde68a_10px,#fde68a_20px)] p-6">
        <Card className="w-full max-w-md border-4 border-black bg-white">
          <div className="space-y-6 p-8 text-center">
            <div className="space-y-2">
              <CardTitle className="font-sans text-3xl font-bold uppercase text-black">
                Sign in required
              </CardTitle>
              <CardDescription className="text-sm font-medium">{t('errors.unauthorized')}</CardDescription>
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
            <div className="flex flex-col gap-4 border-4 border-amber-600 bg-amber-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-amber-800 bg-amber-300 text-amber-900">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-sm font-bold uppercase text-amber-950">
                    {t('dashboard.llmNotConfiguredTitle')}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-amber-900">
                    {t('dashboard.llmNotConfiguredMessage')}
                  </p>
                </div>
              </div>
              <Link href="/settings" className="sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-amber-800 bg-white font-bold uppercase text-amber-900 hover:bg-amber-800 hover:text-white sm:w-auto"
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
                    className="min-h-[17rem] border-4 border-dashed border-amber-600 bg-amber-100"
                  >
                    <div className="flex h-full flex-col justify-between gap-8">
                      <div className="flex h-16 w-16 items-center justify-center border-2 border-amber-800 bg-amber-300 text-amber-900">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div className="space-y-3">
                        <CardTitle className="text-2xl font-bold uppercase text-amber-950">
                          {t('dashboard.setupRequiredTitle')}
                        </CardTitle>
                        <CardDescription className="max-w-xl font-medium text-amber-900">
                          {t('dashboard.setupRequiredMessage')}
                        </CardDescription>
                        <div className="inline-flex items-center gap-2 border-2 border-amber-800 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
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
                      className="min-h-[17rem] border-4 border-black bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 text-white"
                    >
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div className="flex h-18 w-18 items-center justify-center border-4 border-white bg-black">
                          <Plus className="h-9 w-9" />
                        </div>
                        <div className="space-y-3">
                          <CardTitle className="text-3xl font-bold uppercase leading-tight text-white">
                            {t('dashboard.initializeMasterResume')}
                          </CardTitle>
                          <CardDescription className="max-w-xl font-medium text-white">
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
                className="min-h-[17rem] border-4 border-black bg-white"
                onClick={() => router.push(`/resumes/${masterResumeId}`)}
              >
                <div className="flex h-full flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center border-4 border-black bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                        <span className="font-sans text-2xl font-black">M</span>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center border-2 border-sky-700 bg-sky-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-900">
                          Master resume
                        </div>
                        <CardTitle className="text-2xl font-bold">Primary resume library</CardTitle>
                        <CardDescription className="mt-2 max-w-xl font-medium">
                          Keep your baseline experience updated so new tailored resumes can be created quickly.
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="z-10 h-11 w-11 border-2 border-black bg-white hover:bg-black hover:text-white"
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
                          className="z-10 h-11 w-11 border-2 border-black bg-white hover:bg-black hover:text-white"
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
                          'inline-flex items-center gap-2 border-2 px-3 py-1.5 text-xs font-bold uppercase',
                          processingStatus === 'ready' && 'border-emerald-700 bg-emerald-200 text-emerald-900',
                          processingStatus === 'processing' && 'border-sky-700 bg-sky-200 text-sky-900',
                          processingStatus === 'failed' && 'border-rose-700 bg-rose-200 text-rose-900',
                          processingStatus === 'loading' && 'border-slate-700 bg-slate-200 text-slate-900'
                        )}
                      >
                        {masterStatus.icon}
                        <span>{masterStatus.text}</span>
                      </div>
                      <div className="text-sm font-bold text-black">
                        Ready master resumes unlock faster tailoring flows.
                      </div>
                    </div>

                    {processingStatus === 'failed' ? (
                      <div className="grid gap-2 sm:min-w-[18rem] sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-black font-bold uppercase"
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
                          className="border-2 border-rose-700 bg-rose-200 font-bold uppercase text-rose-900 hover:bg-rose-700 hover:text-white"
                          onClick={handleDeleteAndReupload}
                        >
                          {t('dashboard.deleteAndReupload')}
                        </Button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm font-bold uppercase text-black">
                        <span>Open workspace</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card className="min-h-[17rem] border-4 border-black bg-white">
              <div className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center border-2 border-violet-700 bg-violet-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-900">
                      Workspace stats
                    </div>
                    <CardTitle className="text-xl font-bold">Resume pipeline overview</CardTitle>
                    <CardDescription className="mt-2 font-medium">
                      Designed to stay usable even as your dashboard grows past 20 tailored resumes.
                    </CardDescription>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-black bg-cyan-100 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-900">Tailored</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-black">
                      {tailoredResumes.length}
                    </div>
                  </div>
                  <div className="border-2 border-black bg-green-100 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-green-900">Ready</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-black">
                      {counts.ready}
                    </div>
                  </div>
                  <div className="border-2 border-black bg-yellow-100 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-yellow-900">Processing</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-black">
                      {counts.processing + counts.pending}
                    </div>
                  </div>
                  <div className="border-2 border-black bg-red-100 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-red-900">Failed</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-black">
                      {counts.failed}
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-2 border-dashed border-black bg-slate-100 p-4 text-sm font-medium leading-6 text-black">
                  Search, filter, and compact cards make high-volume resume collections easier to scan on desktop and mobile.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {isTailorEnabled && (
          <Card
            variant="interactive"
            className="min-h-[15rem] border-4 border-black bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400"
            onClick={() => router.push('/tailor')}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex h-16 w-16 items-center justify-center border-4 border-white bg-black text-white">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold uppercase text-black">Create tailored resume</CardTitle>
                <CardDescription className="mt-2 font-medium text-black">
                  Start a new variation from your master resume with role-specific tailoring.
                </CardDescription>
              </div>
            </div>
          </Card>
        )}

        {!isTailorEnabled && (
          <Card className="min-h-[15rem] border-4 border-dashed border-black bg-slate-100">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex h-16 w-16 items-center justify-center border-2 border-slate-400 bg-slate-200 text-slate-600">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold uppercase text-slate-800">{t('dashboard.createResume')}</CardTitle>
                <CardDescription className="mt-2 font-medium">
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
            <Card className="border-4 border-black bg-white">
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center border-2 border-slate-400 bg-slate-200 text-slate-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold uppercase">
                    {searchQuery || activeFilter !== 'all'
                      ? 'No resumes match this view'
                      : 'No tailored resumes yet'}
                  </CardTitle>
                  <CardDescription className="max-w-md font-medium">
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
                    className="min-h-[15rem] border-4 border-black bg-white"
                    onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                  >
                    <div className="flex h-full flex-col gap-5">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-black"
                          style={{ backgroundColor: color.bg, color: color.fg }}
                        >
                          <span className="font-sans text-lg font-black">{getMonogram(title) || 'R'}</span>
                        </div>
                        <span
                          className={cn(
                            'border-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                            status === 'ready' && 'border-emerald-700 bg-emerald-200 text-emerald-900',
                            (status === 'processing' || status === 'pending') &&
                              'border-sky-700 bg-sky-200 text-sky-900',
                            status === 'failed' && 'border-rose-700 bg-rose-200 text-rose-900'
                          )}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <CardTitle className="text-lg font-bold leading-6">
                          <span className="block line-clamp-2">{title}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-3 min-h-[4.5rem] text-sm font-medium leading-6">
                          {resume.jobSnippet ||
                            resume.filename ||
                            'Role-specific resume version ready for review.'}
                        </CardDescription>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3 border-t-2 border-dashed border-black pt-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Updated
                          </div>
                          <div className="mt-1 text-sm font-bold text-black">
                            {formatDate(resume.updated_at || resume.created_at)}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm font-bold uppercase text-black">
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
