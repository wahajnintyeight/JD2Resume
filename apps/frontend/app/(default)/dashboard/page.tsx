'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { fetchAuthMe, type AuthUser } from '@/lib/api/auth';
import { API_BASE } from '@/lib/api/client';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useStatusCache } from '@/lib/context/status-cache';
import ResumeManagerDialog from '@/components/dashboard/resume-manager-dialog';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';

import {
  Loader2,
  RefreshCw,
  Plus,
  Settings,
  Search,
  FileText,
  Sparkles,
  ChevronRight,
  Fingerprint,
  Layers,
  ArrowUpRight,
  Activity,
  FolderKanban,
  Orbit,
  Crown,
  Radar,
  ShieldAlert,
  Workflow,
  Trash2,
} from 'lucide-react';

import {
  fetchResume,
  fetchResumeList,
  deleteResume,
  retryProcessing,
  fetchJobDescription,
  type ResumeListItem,
} from '@/lib/api/resume';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    processing: 'border-amber-400/20 bg-amber-400/10 text-amber-200 animate-pulse',
    pending: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
    failed: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    loading: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  };

  return (
    <div
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]',
        styles[status] || styles.pending
      )}
    >
      {status}
    </div>
  );
};

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'loading';
type ResumeFilter = 'all' | 'ready' | 'processing' | 'failed';

export default function DashboardPage() {
  const { t, locale } = useTranslations();
  const [authUser, setAuthUser] = useState<AuthUser | null | 'loading'>('loading');
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('loading');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resumePendingDelete, setResumePendingDelete] = useState<ResumeListItem | null>(null);
  const [tailoredResumes, setTailoredResumes] = useState<ResumeListItem[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showMasterManager, setShowMasterManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ResumeFilter>('all');
  const [isTailorNavigating, startTailorNavigation] = useTransition();
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

  useEffect(() => {
    if (isTailorEnabled) {
      router.prefetch('/tailor');
    }
  }, [isTailorEnabled, router]);

  const formatDate = (value: string) => {
    if (!value) return '--';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const checkResumeStatus = useCallback(async (resumeId: string) => {
    try {
      setProcessingStatus('loading');
      const data = await fetchResume(resumeId);
      setProcessingStatus((data.raw_resume?.processing_status as ProcessingStatus) || 'pending');
    } catch (err) {
      if ((err as any).message?.includes('404')) {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
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
    fetchAuthMe()
      .then((user) => !cancelled && setAuthUser(user))
      .catch(() => !cancelled && setAuthUser(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTailoredResumes = useCallback(async () => {
    try {
      const data = await fetchResumeList(true);
      const master = data.find((r) => r.is_master);
      const storedId = localStorage.getItem('master_resume_id');
      const resolvedId = master?.resume_id || storedId;

      if (resolvedId) {
        localStorage.setItem('master_resume_id', resolvedId);
        setMasterResumeId(resolvedId);
        if (master?.resume_id === resolvedId) {
          setProcessingStatus(master.processing_status as ProcessingStatus);
        } else {
          checkResumeStatus(resolvedId);
        }
      }

      const filtered = data.filter((r) => r.resume_id !== resolvedId);
      setTailoredResumes(filtered);
    } catch (err) {
      console.error(err);
    }
  }, [checkResumeStatus]);

  const hydrateJobSnippets = useCallback(async (resumes: ResumeListItem[]) => {
    const tailoredWithParent = resumes.filter(
      (r) => r.parent_id && jobSnippetCacheRef.current[r.resume_id] === undefined
    );
    if (tailoredWithParent.length === 0) return;

    const requestId = ++loadRequestIdRef.current;
    const jobSnippets: Record<string, string> = {};

    await Promise.all(
      tailoredWithParent.map(async (r) => {
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
        prev.map((r) => ({ ...r, jobSnippet: jobSnippets[r.resume_id] ?? r.jobSnippet ?? '' }))
      );
    }
  }, []);

  useEffect(() => {
    loadTailoredResumes();
  }, [loadTailoredResumes]);

  useEffect(() => {
    if (tailoredResumes.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      void hydrateJobSnippets(tailoredResumes);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [hydrateJobSnippets, tailoredResumes]);

  const handleNewTailoringRequest = () => {
    startTailorNavigation(() => {
      router.push('/tailor');
    });
  };

  const filteredResumes = useMemo(() => {
    return tailoredResumes.filter((r) => {
      const target = `${r.title || ''} ${(r as any).jobSnippet || ''}`.toLowerCase();
      const matchesSearch = target.includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || r.processing_status === activeFilter;
      return matchesSearch && matchesFilter;
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
        setProcessingStatus(result.processing_status as ProcessingStatus);
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

  const confirmDeleteTailoredResume = async () => {
    if (!resumePendingDelete) return;
    try {
      await deleteResume(resumePendingDelete.resume_id);
      decrementResumes();
      setResumePendingDelete(null);
      await loadTailoredResumes();
    } catch (err) {
      console.error('Failed to delete tailored resume:', err);
    }
  };

  const filterOptions: ResumeFilter[] = ['all', 'ready', 'processing', 'failed'];

  const statCards = [
    {
      label: 'tailored outputs',
      value: tailoredResumes.length,
      tone: 'text-cyan-100',
      icon: Workflow,
    },
    {
      label: 'ready to review',
      value: counts.ready,
      tone: 'text-emerald-200',
      icon: Sparkles,
    },
    {
      label: 'in progress',
      value: counts.processing + counts.pending,
      tone: 'text-amber-200',
      icon: Radar,
    },
    {
      label: 'needs attention',
      value: counts.failed,
      tone: 'text-rose-200',
      icon: ShieldAlert,
    },
  ];

  if (authUser === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b10] text-white">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl" />
          <LoadingAnimation message="Loading dashboard workspace..." variant="sparkle" size="lg" />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b10] p-6 text-white">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#07131a] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,rgba(9,21,29,0.98),rgba(4,10,15,1))]" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
              <Fingerprint className="h-6 w-6 text-cyan-100" />
            </div>
            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
              secure entry
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] text-white">
              Sign in to access your workspace
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Authenticate to manage your master resume, tailored outputs, and generation pipeline.
            </p>
            <a href={`${API_BASE}/auth/google/login`} className="mt-8 block">
              <Button className="h-12 w-full rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20">
                Sign in with Google
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b10] text-white selection:bg-cyan-300/20 selection:text-cyan-50">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.09),_transparent_24%),radial-gradient(circle_at_85%_10%,_rgba(168,85,247,0.08),_transparent_18%),linear-gradient(180deg,#08131a_0%,#050b10_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -left-10 top-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07131a]/90 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="absolute inset-0" />
          <div className="relative border-b border-white/10 px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                  <Orbit className="h-3.5 w-3.5" />
                  career command
                </div>

                <h1 className="mt-4 text-left text-4xl font-black uppercase tracking-[-0.07em] text-[#ecfeff] sm:text-6xl sm:leading-[0.92]">
                  Dashboard
                  <span className="block bg-gradient-to-r from-cyan-100 via-white to-violet-200 bg-clip-text text-transparent">
                    Resume Operations
                  </span>
                </h1>

                <p className="mt-4 max-w-3xl text-left text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                  A focused control room for your master resume, tailored outputs, and processing
                  flow. The tone stays professional while the interface carries enough atmosphere to
                  feel authored rather than assembled.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:min-w-[420px]">
                <div className="group relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-200" />
                  <input
                    placeholder="Search resumes or role snippets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-300/25 focus:bg-black/30"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1.5">
                  {filterOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={cn(
                        'rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition-all sm:px-4',
                        activeFilter === f
                          ? 'bg-cyan-300/10 text-cyan-100'
                          : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          {stat.label}
                        </p>
                        <p className={cn('mt-3 text-4xl font-black tracking-[-0.06em]', stat.tone)}>
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Icon className="h-4.5 w-4.5 text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative px-5 py-5 sm:px-8 sm:py-8">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px]">
              <section className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]">
                <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                      <Crown className="h-4.5 w-4.5 text-cyan-100" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        master resume
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-50">Primary source profile</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-6 sm:px-6 sm:py-7">
                  {!masterResumeId ? (
                    <div className="flex flex-col items-start text-left">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <Plus className="h-8 w-8 text-cyan-200" />
                      </div>
                      <h2 className="mt-6 text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                        No master resume configured
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                        Upload a strong base resume to anchor every tailored version. This becomes
                        the reference document for downstream generation.
                      </p>

                      <ResumeUploadDialog
                        open={isUploadDialogOpen}
                        onOpenChange={setIsUploadDialogOpen}
                        onUploadComplete={handleUploadComplete}
                        trigger={
                          <Button className="mt-7 h-11 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-5 text-cyan-50 hover:bg-cyan-300/20">
                            <UploadLike />
                            Upload Master Resume
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] border border-cyan-300/20 bg-[linear-gradient(135deg,#22d3ee22,#0f172a)] shadow-[0_20px_40px_rgba(34,211,238,0.16)]">
                        <Layers className="h-9 w-9 text-cyan-100" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status={processingStatus} />
                          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                            active workspace source
                          </span>
                        </div>

                        <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                          Primary intelligence matrix
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                          This resume powers tailoring workflows, content generation, and your
                          overall application stack. Keep it current, structured, and representative
                          of your strongest narrative.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button
                            onClick={() => router.push(`/resumes/${masterResumeId}`)}
                            className="h-11 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-5 text-cyan-50 hover:bg-cyan-300/20"
                          >
                            Open Workspace
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => setShowMasterManager(true)}
                            className="h-11 rounded-2xl border border-white/10 bg-transparent px-5 text-slate-100 hover:bg-white/10"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Library
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(true)}
                            className="h-11 rounded-2xl border border-rose-300/15 bg-rose-400/10 px-5 text-rose-100 hover:bg-rose-400/18"
                          >
                            Delete Master
                          </Button>

                          {processingStatus === 'failed' && (
                            <Button
                              variant="outline"
                              onClick={handleRetryProcessing}
                              disabled={isRetrying}
                              className="h-11 rounded-2xl border border-amber-300/15 bg-amber-400/10 px-5 text-amber-100 hover:bg-amber-400/18"
                            >
                              {isRetrying ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Retry Processing
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(34,211,238,0.06),rgba(255,255,255,0.015))] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                      <Activity className="h-4 w-4 text-cyan-200" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        system posture
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-50">Pipeline readiness</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        llm configuration
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        {statusLoading
                          ? 'Checking status...'
                          : isLlmConfigured
                            ? 'Configured and available'
                            : 'Configuration required'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        tailoring flow
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        {isTailorEnabled
                          ? 'Ready for new tailoring request'
                          : 'Waiting on master readiness'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-slate-300" />
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      workspace note
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    The layout is intentionally restrained: strong hierarchy, editorial alignment,
                    and atmospheric depth without leaning into over-styled “AI dashboard” clichés.
                  </p>
                </div>
              </aside>
            </div>

            <section className="mt-6 overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))]">
              <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    tailored resumes
                  </p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                    Generated iterations
                  </h3>
                </div>

                {isTailorEnabled && (
                  <Button
                    onClick={handleNewTailoringRequest}
                    disabled={isTailorNavigating}
                    className="h-11 rounded-2xl border border-cyan-300/15 bg-white/[0.04] px-5 text-cyan-100 hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
                  >
                    {isTailorNavigating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isTailorNavigating ? 'Opening...' : 'New Tailoring Request'}
                  </Button>
                )}
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                {filteredResumes.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <FileText className="h-7 w-7 text-slate-500" />
                    </div>
                    <p className="mt-5 text-lg font-semibold text-slate-100">
                      No resumes found in this view
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                      Adjust the search or filter, or generate a new tailored resume when the master
                      source is ready.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredResumes.map((resume, index) => (
                      <article
                        key={resume.resume_id}
                        onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                        className="group cursor-pointer overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_22px_50px_rgba(0,0,0,0.24)] sm:p-6"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                            <FileText className="h-5 w-5 text-cyan-200" />
                          </div>
                          <StatusBadge status={resume.processing_status || 'pending'} />
                        </div>

                        <h4 className="mt-5 line-clamp-2 text-xl font-black uppercase tracking-[-0.04em] text-white transition-colors group-hover:text-cyan-100">
                          {resume.title || 'Untitled Variation'}
                        </h4>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                          {(resume as any).jobSnippet ||
                            'Tailored output prepared for review and export.'}
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              updated
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-100">
                              {formatDate(resume.updated_at || resume.created_at)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              locale
                            </p>
                            <p className="mt-2 text-sm font-semibold uppercase text-slate-100">
                              {locale}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                            Open detail view
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumePendingDelete(resume);
                              }}
                              className="h-9 w-9 rounded-full border border-rose-300/15 bg-rose-400/8 text-rose-100 hover:border-rose-300/25 hover:bg-rose-400/18"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all group-hover:border-cyan-300/20 group-hover:bg-cyan-300/10">
                              <ChevronRight className="h-4 w-4 text-slate-200" />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete master resume?"
        description="This removes the current master resume and disconnects future tailoring from its source document."
        confirmLabel="Delete Master"
        onConfirm={confirmDeleteAndReupload}
        variant="danger"
      />

      <ConfirmDialog
        open={Boolean(resumePendingDelete)}
        onOpenChange={(open) => {
          if (!open) setResumePendingDelete(null);
        }}
        title="Delete tailored resume?"
        description={
          resumePendingDelete
            ? `Delete "${resumePendingDelete.title || 'Untitled Variation'}" from the dashboard library? This action cannot be undone.`
            : 'Delete this tailored resume from the dashboard library?'
        }
        confirmLabel="Delete Resume"
        onConfirm={confirmDeleteTailoredResume}
        variant="danger"
      />

      <ResumeManagerDialog
        isOpen={showMasterManager}
        onClose={() => setShowMasterManager(false)}
        onResumeChanged={loadTailoredResumes}
      />
    </div>
  );
}

function UploadLike() {
  return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-200/30">
      <Plus className="h-3 w-3" />
    </span>
  );
}
