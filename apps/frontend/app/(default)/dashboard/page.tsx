'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { fetchAuthMe, type AuthUser } from '@/lib/api/auth';
import { API_BASE } from '@/lib/api/client';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card } from '@/components/ui/card';
import { useStatusCache } from '@/lib/context/status-cache';
import ResumeManagerDialog from '@/components/dashboard/resume-manager-dialog';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';

import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
  AlertTriangle,
  Search,
  FileText,
  Sparkles,
  ChevronRight,
  Fingerprint,
  Layers,
  ArrowUpRight,
  Activity,
  Filter,
} from 'lucide-react';

import {
  fetchResume,
  fetchResumeList,
  deleteResume,
  retryProcessing,
  fetchJobDescription,
  type ResumeListItem,
} from '@/lib/api/resume';

// --- Styled Components & Sub-components ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    processing:
      'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  return (
    <div
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-tighter border',
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
        checkResumeStatus(resolvedId);
      }

      const filtered = data.filter((r) => r.resume_id !== resolvedId);
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
      console.error(err);
    }
  }, [checkResumeStatus]);

  useEffect(() => {
    loadTailoredResumes();
  }, [loadTailoredResumes]);

  const filteredResumes = useMemo(() => {
    return tailoredResumes.filter((r) => {
      const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  if (authUser === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#050505]">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full animate-pulse" />
          <LoadingAnimation message="Synchronizing Data Hub..." variant="sparkle" size="lg" />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#050505] p-6 font-sans">
        <div className="w-full max-w-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] p-8 rounded-2xl shadow-2xl">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mb-6 flex items-center justify-center">
            <Fingerprint className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Access Restricted
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
            Please authenticate to access your professional pipeline.
          </p>
          <a href={`${API_BASE}/auth/google/login`} className="block">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-none h-12 text-base">
              Sign in with Google
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-700 dark:text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 dark:bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-12">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-[0.2em]">
              <Activity className="w-4 h-4" />
              <span>Professional Engine v3.0</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-none italic">
              Dashboard<span className="text-indigo-600">.</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
              <input
                placeholder="Search index..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-3 w-64 focus:w-80 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/5 hidden md:block" />

            <div className="flex bg-white dark:bg-[#0A0A0A] p-1 rounded-xl border border-slate-200 dark:border-white/5">
              {(['all', 'ready', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all',
                    activeFilter === f
                      ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Master Resume Command Center */}
          <section className="col-span-12 lg:col-span-8">
            <div className="group relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl opacity-10 dark:opacity-20 group-hover:opacity-15 dark:group-hover:opacity-40 transition-opacity blur-[2px]" />
              <div className="relative bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl p-8 overflow-hidden shadow-sm dark:shadow-none">
                {!masterResumeId ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-6 flex items-center justify-center">
                      <Plus className="text-indigo-600 dark:text-indigo-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 italic">
                      No Base Matrix Found
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8">
                      Establish your master record to enable high-speed tailoring and AI synthesis.
                    </p>
                    <ResumeUploadDialog
                      open={isUploadDialogOpen}
                      onOpenChange={setIsUploadDialogOpen}
                      onUploadComplete={handleUploadComplete}
                      trigger={
                        <Button className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 px-8 h-12 rounded-full font-bold">
                          Upload Master Document
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
                      <Layers className="text-white w-10 h-10" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={processingStatus} />
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                          Master Library Item
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white italic">
                        Primary Intelligence Matrix
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                        This is your source of truth. All tailored variations branch from the data
                        structures defined within this master document.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-4">
                        <Button
                          onClick={() => router.push(`/resumes/${masterResumeId}`)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 h-11"
                        >
                          Open Workspace
                          <ArrowUpRight className="ml-2 w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowMasterManager(true)}
                          className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white h-11 px-5 rounded-xl"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configuration
                        </Button>
                        {processingStatus === 'failed' && (
                          <Button
                            variant="outline"
                            onClick={handleRetryProcessing}
                            disabled={isRetrying}
                            className="border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 h-11 px-5 rounded-xl"
                          >
                            {isRetrying ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Retry Processing
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent -mr-32 -mt-32" />
              </div>
            </div>
          </section>

          {/* Quick Stats Sidebar */}
          <aside className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            {[
              {
                label: 'Total Syncs',
                val: tailoredResumes.length,
                color: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                label: 'System Ready',
                val: counts.ready,
                color: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: 'Synthesizing',
                val: counts.processing + counts.pending,
                color: 'text-amber-600 dark:text-amber-400',
              },
              {
                label: 'Anomalies',
                val: counts.failed,
                color: 'text-rose-600 dark:text-rose-400',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 p-6 rounded-2xl hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none"
              >
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter mb-2">
                  {stat.label}
                </div>
                <div className={cn('text-4xl font-bold italic', stat.color)}>{stat.val}</div>
              </div>
            ))}
          </aside>

          {/* Tailored Resumes List */}
          <section className="col-span-12 mt-12">
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-white/5 pb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Sparkles className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                Tailored Iterations
              </h3>
              {isTailorEnabled && (
                <Button
                  onClick={() => router.push('/tailor')}
                  className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full h-10 px-6 font-bold text-xs uppercase"
                >
                  New Tailoring Request
                </Button>
              )}
            </div>

            {filteredResumes.length === 0 ? (
              <div className="bg-white dark:bg-[#0A0A0A] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl py-24 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-slate-400 dark:text-slate-600 w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">
                  No iterations found in current view.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredResumes.map((resume) => (
                  <div
                    key={resume.resume_id}
                    onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                    className="group cursor-pointer bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#0D0D0D] transition-all hover:translate-y-[-4px] shadow-sm dark:shadow-none"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <StatusBadge status={resume.processing_status || 'pending'} />
                    </div>

                    <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-2 line-clamp-1 italic group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {resume.title || 'Untitled Variation'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                      {(resume as any).jobSnippet ||
                        'Standard tailored output for professional review.'}
                    </p>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-600">
                          Updated
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {formatDate(resume.updated_at || resume.created_at)}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronRight className="w-4 h-4 text-slate-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Purge Master Matrix?"
        description="This action will disconnect all tailored iterations from their parent data source."
        confirmLabel="Confirm Purge"
        onConfirm={confirmDeleteAndReupload}
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
