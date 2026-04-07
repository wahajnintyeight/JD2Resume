'use client';

import { useEffect, useState } from 'react';
import {
  deleteResume,
  fetchResumeList,
  type ResumeListItem,
  unsetMasterResume,
} from '@/lib/api/resume';
import { Button } from '@/components/ui/button';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import SetMasterDialog from '@/components/dashboard/set-master-dialog';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Orbit from 'lucide-react/dist/esm/icons/orbit';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Binary from 'lucide-react/dist/esm/icons/binary';
import Waves from 'lucide-react/dist/esm/icons/waves';

interface ResumeManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeChanged?: () => void;
}

export default function ResumeManagerDialog({
  isOpen,
  onClose,
  onResumeChanged,
}: ResumeManagerDialogProps) {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSetMasterDialog, setShowSetMasterDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ id: string; name: string } | null>(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchResumeList(true);
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResumes();
    }
  }, [isOpen]);

  const handleSetAsMaster = (resume: ResumeListItem) => {
    setSelectedResume({
      id: resume.resume_id,
      name: resume.filename || resume.title || 'Resume',
    });
    setShowSetMasterDialog(true);
  };

  const handleRemoveMaster = async (resumeId: string) => {
    if (!confirm('Remove master status from this resume?')) return;

    try {
      await unsetMasterResume(resumeId);
      await loadResumes();
      onResumeChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove master status');
    }
  };

  const handleDeleteResume = async (resumeId: string, resumeName: string) => {
    if (!confirm(`Are you sure you want to delete "${resumeName}"? This action cannot be undone.`))
      return;

    try {
      await deleteResume(resumeId);
      await loadResumes();
      onResumeChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    loadResumes();
    onResumeChanged?.();
  };

  const getCategoryDisplay = (category: string | null | undefined) => {
    return category || 'Default';
  };

  const formatResumeDate = (resume: ResumeListItem) => {
    return new Date(resume.updated_at || resume.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const masterCount = resumes.filter((resume) => resume.is_master).length;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[rgba(3,7,18,0.82)] backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 pointer-events-none">
        <div
          className="pointer-events-auto relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border border-[#f7e8c4]/10 bg-[#070b12] text-[#f6f1de] shadow-[0_32px_120px_rgba(0,0,0,0.65)] sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]"
          style={
            {
              ['--rm-paper' as string]: '#f6f1de',
              ['--rm-ink' as string]: '#070b12',
              ['--rm-copper' as string]: '#f59e0b',
              ['--rm-teal' as string]: '#41d6c3',
              ['--rm-violet' as string]: '#907cff',
              ['--rm-grid' as string]: 'rgba(246, 241, 222, 0.08)',
            } as React.CSSProperties
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_87%_14%,rgba(65,214,195,0.18),transparent_26%),radial-gradient(circle_at_74%_80%,rgba(144,124,255,0.14),transparent_26%),linear-gradient(160deg,#05070b_0%,#07111b_48%,#030508_100%)]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(var(--rm-grid) 1px, transparent 1px), linear-gradient(90deg, var(--rm-grid) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
              maskImage:
                'radial-gradient(circle at center, rgba(0,0,0,1), rgba(0,0,0,0.18) 75%, transparent 100%)',
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.03),transparent_24%,transparent_76%,rgba(255,255,255,0.025))]" />
          <div className="absolute -left-12 top-24 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute right-[-3rem] top-[-2rem] h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="absolute bottom-[-3rem] right-20 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="border-b border-[#f7e8c4]/10 px-4 pb-5 pt-3 sm:px-8 sm:pb-7 sm:pt-7">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#f6f1de]/15 sm:hidden" />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ffd89c]">
                    <Orbit className="h-3.5 w-3.5" />
                    archive mode
                  </div>

                  <h2
                    className="mt-4 text-left text-3xl font-black uppercase leading-[0.92] tracking-[-0.08em] text-[#f8f2df] sm:text-5xl"
                    style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                  >
                    Resume
                    <span className="ml-2 inline-block text-[#41d6c3]">Archive</span>
                    <span className="block bg-[linear-gradient(90deg,#f6f1de_0%,#f59e0b_38%,#41d6c3_100%)] bg-clip-text text-transparent">
                      Control Deck
                    </span>
                  </h2>

                  <p className="mt-4 max-w-2xl text-left text-sm leading-6 text-[#d8d0ba] sm:text-base">
                    A cinematic library surface for the resumes you deploy, promote, and tailor.
                    Treat every version like a calibrated asset, not a loose file in a folder.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:gap-3">
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="h-11 rounded-[1.2rem] border border-[#41d6c3]/30 bg-[#41d6c3]/12 px-4 text-[#dffcf8] shadow-[0_10px_30px_rgba(65,214,195,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#41d6c3]/50 hover:bg-[#41d6c3]/20 hover:text-white"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resume
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-[1.2rem] border border-[#f7e8c4]/12 bg-white/[0.03] text-[#efe6cf] transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#b8ae94]">
                    stored resumes
                  </p>
                  <p
                    className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#fff6df]"
                    style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                  >
                    {resumes.length}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(65,214,195,0.08),rgba(255,255,255,0.02))] p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#b8ae94]">
                    master variants
                  </p>
                  <p
                    className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#dffcf8]"
                    style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                  >
                    {masterCount}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(144,124,255,0.08),rgba(255,255,255,0.02))] p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#b8ae94]">
                    library posture
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#f7f0db]">
                    {resumes.length > 0
                      ? 'Primed for tailoring runs'
                      : 'Awaiting first archival drop'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-7">
              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.8rem] border border-[#41d6c3]/15 bg-[linear-gradient(180deg,rgba(65,214,195,0.06),rgba(255,255,255,0.015))] px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-[#41d6c3]/20 bg-[#41d6c3]/10 shadow-[0_12px_40px_rgba(65,214,195,0.16)]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#bdf8f0]" />
                  </div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.32em] text-[#a79a7d]">
                    calibrating archive
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#f7f0db]">Loading resumes...</p>
                </div>
              ) : error ? (
                <div className="rounded-[1.8rem] border border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.1),rgba(255,255,255,0.015))] p-5 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-rose-200">
                    load failure
                  </p>
                  <p className="mt-3 text-sm leading-6 text-rose-100">{error}</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="overflow-hidden rounded-[1.9rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))]">
                  <div className="border-b border-[#f7e8c4]/10 px-6 py-6 sm:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#907cff]/20 bg-[#907cff]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ddd7ff]">
                      <Sparkles className="h-3.5 w-3.5" />
                      quiet bay
                    </div>
                  </div>

                  <div className="px-6 py-12 text-left sm:px-8 sm:py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-[#f7e8c4]/10 bg-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                      <FileText className="h-8 w-8 text-[#ffd89c]" />
                    </div>

                    <h3
                      className="mt-6 text-3xl font-black uppercase tracking-[-0.06em] text-[#fff6df] sm:text-4xl"
                      style={{
                        fontFamily: 'var(--font-playfair-display), "Times New Roman", serif',
                      }}
                    >
                      No resumes in orbit
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-[#d8d0ba] sm:text-base">
                      Start your archive with a first upload, then elevate the strongest versions
                      into masters for different career trajectories and tailoring intents.
                    </p>

                    <Button
                      onClick={() => setShowUploadDialog(true)}
                      className="mt-7 h-11 rounded-[1.2rem] border border-[#f59e0b]/25 bg-[#f59e0b]/12 px-5 text-[#fff1cf] hover:bg-[#f59e0b]/20"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Resume
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="grid gap-4 md:grid-cols-2">
                      {resumes.map((resume, index) => (
                        <article
                          key={resume.resume_id}
                          className="group relative overflow-hidden rounded-[1.75rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#41d6c3]/25 hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-6"
                          style={{ animationDelay: `${index * 55}ms` }}
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f7e8c4]/60 to-transparent" />
                          <div className="absolute right-[-1rem] top-[-1rem] h-28 w-28 rounded-full bg-[#41d6c3]/8 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute bottom-0 left-0 h-24 w-full bg-[linear-gradient(180deg,transparent,rgba(245,158,11,0.04))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          <div className="relative flex h-full flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-[#f7e8c4]/10 bg-black/20">
                                  <FileText className="h-5 w-5 text-[#ffd89c]" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#9c9279]">
                                    resume file
                                  </p>
                                  <h3
                                    className="mt-2 break-words text-left text-xl font-black uppercase tracking-[-0.05em] text-[#fff6df]"
                                    style={{
                                      fontFamily:
                                        'var(--font-playfair-display), "Times New Roman", serif',
                                    }}
                                  >
                                    {resume.title || resume.filename || 'Untitled Resume'}
                                  </h3>
                                </div>
                              </div>

                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#8f876f] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[#41d6c3]" />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {resume.is_master ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffe5b1]">
                                  <Crown className="h-3.5 w-3.5" />
                                  Master · {getCategoryDisplay(resume.master_category)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-[#f7e8c4]/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d0c7b1]">
                                  standard resume
                                </span>
                              )}
                            </div>

                            {resume.filename && (
                              <p className="mt-4 truncate text-left text-sm text-[#b8ae94]">
                                {resume.filename}
                              </p>
                            )}

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-[1.1rem] border border-[#f7e8c4]/10 bg-black/20 p-3.5">
                                <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#91876f]">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  updated
                                </p>
                                <p className="mt-2 text-sm font-semibold text-[#f6efdb]">
                                  {formatResumeDate(resume)}
                                </p>
                              </div>

                              <div className="rounded-[1.1rem] border border-[#f7e8c4]/10 bg-black/20 p-3.5">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-[#91876f]">
                                  status
                                </p>
                                <p className="mt-2 text-sm font-semibold text-[#f6efdb]">
                                  {resume.is_master ? 'Template-ready' : 'Library item'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 rounded-[1.15rem] border border-[#f7e8c4]/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05))] p-3.5">
                              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#92876f]">
                                {resume.is_master ? (
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#41d6c3]" />
                                ) : (
                                  <Binary className="h-3.5 w-3.5 text-[#907cff]" />
                                )}
                                role in system
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#dbd3bf]">
                                {resume.is_master
                                  ? 'This resume is eligible as a tailoring source and carries a stronger routing signal.'
                                  : 'Stored as a library variant and ready to be promoted when it becomes your best baseline.'}
                              </p>
                            </div>

                            <div className="mt-5 flex flex-col gap-2 sm:mt-6">
                              {resume.is_master ? (
                                <Button
                                  onClick={() => handleRemoveMaster(resume.resume_id)}
                                  className="h-11 rounded-[1.2rem] border border-rose-300/18 bg-rose-400/10 text-rose-100 hover:bg-rose-400/18"
                                >
                                  Remove Master
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleSetAsMaster(resume)}
                                  className="h-11 rounded-[1.2rem] border border-[#41d6c3]/25 bg-[#41d6c3]/10 text-[#dffcf8] hover:border-[#41d6c3]/40 hover:bg-[#41d6c3]/18 hover:text-white"
                                >
                                  <Crown className="mr-2 h-4 w-4" />
                                  Set as Master
                                </Button>
                              )}

                              <Button
                                onClick={() =>
                                  handleDeleteResume(
                                    resume.resume_id,
                                    resume.title || resume.filename || 'Resume'
                                  )
                                }
                                variant="outline"
                                className="h-11 rounded-[1.2rem] border border-[#f7e8c4]/10 bg-transparent text-[#efe6cf] hover:border-rose-300/20 hover:bg-rose-400/10 hover:text-rose-100"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Resume
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    <aside className="space-y-4">
                      <div className="overflow-hidden rounded-[1.75rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.015))] p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] border border-[#f7e8c4]/10 bg-black/20">
                            <Waves className="h-4.5 w-4.5 text-[#ffd89c]" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b8ae94]">
                              library guidance
                            </p>
                            <p
                              className="mt-1 text-lg font-bold text-[#f8f2df]"
                              style={{
                                fontFamily:
                                  'var(--font-playfair-display), "Times New Roman", serif',
                              }}
                            >
                              Master strategy
                            </p>
                          </div>
                        </div>

                        <p className="mt-5 text-sm leading-6 text-[#dbd3bf]">
                          Master resumes act as source templates during tailoring. Keep one for each
                          serious lane: platform engineering, product analytics, staff frontend, or
                          design systems.
                        </p>

                        <div className="mt-5 rounded-[1.15rem] border border-[#f7e8c4]/10 bg-black/20 p-4">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[#92876f]">
                            current state
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#f8f2df]">
                            {masterCount > 0
                              ? `${masterCount} master ${masterCount === 1 ? 'resume' : 'resumes'} configured`
                              : 'No master resume configured yet'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.75rem] border border-[#f7e8c4]/10 bg-[linear-gradient(180deg,rgba(144,124,255,0.08),rgba(255,255,255,0.012))] p-5 sm:p-6">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#b8ae94]">
                          quick note
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#dbd3bf]">
                          On mobile, this behaves like a dense field console instead of a plain
                          modal, keeping the archive focused, thumb-friendly, and atmospheric.
                        </p>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUploadDialog && (
        <ResumeUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {showSetMasterDialog && selectedResume && (
        <SetMasterDialog
          resumeId={selectedResume.id}
          resumeName={selectedResume.name}
          onClose={() => {
            setShowSetMasterDialog(false);
            setSelectedResume(null);
          }}
          onSuccess={() => {
            loadResumes();
            onResumeChanged?.();
          }}
        />
      )}
    </>
  );
}
