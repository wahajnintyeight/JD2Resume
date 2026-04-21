'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  scanResumeATS,
  downloadATSScanPdf,
  previewATSApply,
  confirmATSApply,
  type ATSScanResult,
  type ATSApplyPreviewResponse,
} from '@/lib/api/resume';
import { ATSApplyPreviewModal } from './ats-apply-preview-modal';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';
import Target from 'lucide-react/dist/esm/icons/target';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Download from 'lucide-react/dist/esm/icons/download';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Save from 'lucide-react/dist/esm/icons/save';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';

interface ATSScanDialogProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ATSScanDialog({ resumeId, isOpen, onClose }: ATSScanDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ATSScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editingJobDescription, setEditingJobDescription] = useState(false);
  const [customJobDescription, setCustomJobDescription] = useState('');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyPreview, setApplyPreview] = useState<ATSApplyPreviewResponse | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const scanResults = await scanResumeATS(resumeId, customJobDescription || undefined);
      setResults(scanResults);
      setEditingJobDescription(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan resume');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJobDescription = () => {
    setCustomJobDescription(results?.job_description || '');
    setEditingJobDescription(true);
  };

  const handleCancelEdit = () => {
    setEditingJobDescription(false);
    setCustomJobDescription('');
  };

  const handlePreviewApply = async () => {
    if (!results) return;

    setApplyLoading(true);
    setApplyError(null);
    setShowApplyModal(true);

    try {
      const preview = await previewATSApply(resumeId, results);
      setApplyPreview(preview);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Failed to preview changes');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!applyPreview?.modified_resume) return;

    setApplyLoading(true);
    try {
      await confirmATSApply(resumeId, applyPreview.modified_resume);
      setShowApplyModal(false);
      onClose();
      router.refresh();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { blob, filename } = await downloadATSScanPdf(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getScoreTone = (score: number) => {
    if (score >= 90) {
      return {
        text: 'text-emerald-100',
        ring: 'ring-emerald-400/50',
        chip: 'bg-emerald-500/20 text-emerald-100 border border-emerald-300/30',
        panel: 'border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(5,10,24,0.85))]',
        fill: 'from-emerald-400 via-teal-300 to-cyan-300',
      };
    }
    if (score >= 75) {
      return {
        text: 'text-cyan-100',
        ring: 'ring-cyan-400/50',
        chip: 'bg-cyan-500/20 text-cyan-100 border border-cyan-300/30',
        panel: 'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(5,10,24,0.85))]',
        fill: 'from-cyan-400 via-sky-300 to-blue-300',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-100',
        ring: 'ring-amber-400/50',
        chip: 'bg-amber-500/20 text-amber-100 border border-amber-300/30',
        panel: 'border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(5,10,24,0.85))]',
        fill: 'from-amber-300 via-orange-300 to-yellow-200',
      };
    }
    return {
      text: 'text-rose-100',
      ring: 'ring-rose-400/50',
      chip: 'bg-rose-500/20 text-rose-100 border border-rose-300/30',
      panel: 'border-rose-300/30 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(5,10,24,0.85))]',
      fill: 'from-rose-400 via-red-300 to-orange-200',
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-200';
    if (score >= 75) return 'text-cyan-200';
    if (score >= 60) return 'text-amber-200';
    return 'text-rose-200';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.9))]';
    if (score >= 75) return 'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.9))]';
    if (score >= 60) return 'border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.9))]';
    return 'border-rose-300/30 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(15,23,42,0.9))]';
  };

  const getProbabilityDisplay = (probability: string) => {
    switch (probability) {
      case 'high':
        return {
          text: 'High',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-emerald-200',
          chip: 'border-emerald-300/30 bg-emerald-500/20',
        };
      case 'medium':
        return {
          text: 'Medium',
          icon: <Target className="h-4 w-4" />,
          color: 'text-amber-200',
          chip: 'border-amber-300/30 bg-amber-500/20',
        };
      case 'low':
        return {
          text: 'Low',
          icon: <TrendingDown className="h-4 w-4" />,
          color: 'text-rose-200',
          chip: 'border-rose-300/30 bg-rose-500/20',
        };
      default:
        return {
          text: probability,
          icon: null,
          color: 'text-slate-200',
          chip: 'border-white/10 bg-white/5',
        };
    }
  };

  const surfaceClass =
    'border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl';
  const mutedTextClass = 'text-[13px] leading-relaxed text-slate-300';
  const cardTitleClass =
    'font-["Fraunces",Georgia,serif] text-[1.15rem] font-semibold tracking-[0.02em] text-white';
  const sectionLabelClass =
    'text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/80';

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_28%),rgba(2,6,23,0.76)] backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 pointer-events-none">
        <div
          className="ats-scan-shell pointer-events-auto relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/15 bg-[#07111f] text-white shadow-[0_40px_120px_rgba(2,6,23,0.72)] animate-dialog-rise"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 opacity-90">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_25%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#07111f_0%,#091528_46%,#0d1831_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(circle_at_center,black,transparent_92%)]" />
            <div className="absolute -left-20 top-24 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-orange-400/10 blur-3xl" />
          </div>

          <div className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-5 md:px-8 md:py-7">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-100">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                  Precision ATS Lab
                </div>
                <h2 className='font-["Fraunces",Georgia,serif] text-3xl font-semibold leading-tight text-white md:text-4xl'>
                  ATS Compatibility Scan
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                  Deep-match your resume against automated screening logic with a vivid, structured
                  audit of keywords, placement, and knockout filters.
                </p>
              </div>

              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-y-auto px-5 py-5 md:px-8 md:py-7" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {!results && !loading && !error && (
              <div className="mx-auto max-w-3xl py-6">
                <div className="grid gap-6 ">
                  

                  <div className={`${surfaceClass} rounded-[28px] p-5 md:p-6`}>
                    <div className={sectionLabelClass}>Job Description</div>
                    <h4 className='mt-3 font-["Fraunces",Georgia,serif] text-2xl font-semibold text-white'>
                      Optional calibration input
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Paste a job description for a sharper ATS comparison. If empty, the original
                      tailored JD will be used when available.
                    </p>

                    <div className="mt-5">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Target job description
                      </label>
                      <Textarea
                        value={customJobDescription}
                        onChange={(e) => setCustomJobDescription(e.target.value)}
                        className="min-h-[220px] rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                        placeholder="Paste the job description here, or leave it empty to use the original JD from tailoring..."
                      />
                      <p className="mt-3 text-xs leading-6 text-slate-400">
                        Exact ATS matching favors specific technical phrases and titles over vague
                        paraphrases.
                      </p>
                    </div>

                    <Button
                      onClick={handleScan}
                      size="lg"
                      className="mt-6 w-full rounded-[18px] border border-cyan-200/20 bg-[linear-gradient(135deg,#22d3ee,#0ea5e9_52%,#fb923c)] px-5 py-6 font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_20px_50px_rgba(14,165,233,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(14,165,233,0.42)]"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-5 w-5" />
                          Start ATS Scan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[420px] flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-8">
                  <div className="h-28 w-28 rounded-full border border-cyan-300/20 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(34,211,238,0.05),rgba(34,211,238,0.95),rgba(251,146,60,0.75),rgba(34,211,238,0.05))] p-[1px] animate-spin-slow">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#08111f]">
                      <Target className="h-10 w-10 text-cyan-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" />
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
                  Scan in progress
                </div>
                <p className='mt-3 font-["Fraunces",Georgia,serif] text-3xl font-semibold text-white'>
                  Analyzing resume signal...
                </p>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
                  Evaluating keyword presence, experience alignment, title fit, technical skill
                  precision, formatting compatibility, and education requirements.
                </p>

                <div className="mt-8 flex items-center gap-2">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="h-2.5 w-10 rounded-full bg-[linear-gradient(90deg,#22d3ee,#fb923c)] opacity-80 animate-pulse"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className={`${surfaceClass} rounded-[26px] border border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.15),rgba(15,23,42,0.95))] p-6`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-500/15">
                    <AlertCircle className="h-6 w-6 text-rose-200" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/80">
                      Scan Error
                    </div>
                    <h4 className='mt-2 font-["Fraunces",Georgia,serif] text-2xl font-semibold text-white'>
                      The scan couldn’t complete
                    </h4>
                    <p className="mt-3 break-words text-sm leading-7 text-rose-100/90">{error}</p>
                    <Button
                      onClick={handleScan}
                      variant="outline"
                      size="sm"
                      className="mt-5 rounded-full border-rose-300/35 bg-white/5 text-rose-100 hover:bg-white/10"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                <div className={`${surfaceClass} rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.15),rgba(14,165,233,0.08),rgba(15,23,42,0.9))] p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-500/15">
                      <Target className="h-5 w-5 text-cyan-200" />
                    </div>
                    <div>
                      <div className={sectionLabelClass}>ATS Primer</div>
                      <h4 className={`${cardTitleClass} mt-2`}>How ATS systems actually work</h4>
                      <p className={`${mutedTextClass} mt-3`}>
                        ATS behaves more like a search engine than a human grader. Recruiters and
                        filters usually seek exact technical terms like SQL, Python, or Tableau
                        rather than soft-skill phrasing.
                      </p>
                      <p className={`${mutedTextClass} mt-2`}>
                        This audit prioritizes hard-skill specificity, title alignment, and exact
                        match visibility across the resume surface.
                      </p>
                    </div>
                  </div>
                </div>

                {results.job_description && (
                  <div className={`${surfaceClass} rounded-[24px] overflow-hidden`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowJobDescription(!showJobDescription)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setShowJobDescription(!showJobDescription);
                        }
                      }}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <FileText className="h-5 w-5 text-slate-200" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                            Source
                          </div>
                          <h3 className={`${cardTitleClass} mt-1`}>Job Description</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!editingJobDescription && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditJobDescription();
                            }}
                            variant="ghost"
                            size="sm"
                            className="rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {showJobDescription ? (
                          <ChevronUp className="h-5 w-5 text-slate-300" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                    </div>

                    {showJobDescription && (
                      <div className="border-t border-white/10 bg-slate-950/30 px-5 py-5">
                        {editingJobDescription ? (
                          <div className="space-y-3">
                            <Textarea
                              value={customJobDescription}
                              onChange={(e) => setCustomJobDescription(e.target.value)}
                              className="min-h-[300px] rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                              placeholder="Paste the job description here..."
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={handleScan}
                                size="sm"
                                disabled={!customJobDescription.trim() || loading}
                                className="rounded-full border border-cyan-200/20 bg-[linear-gradient(135deg,#22d3ee,#0ea5e9_52%,#fb923c)] font-semibold uppercase tracking-[0.18em] text-slate-950"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-1 h-4 w-4" />
                                    Scan with New JD
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                className="rounded-full border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto rounded-[20px] border border-white/10 bg-slate-950/50 p-4">
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-200">
                              {results.job_description}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(results as any).title_analysis && (
                  <div
                    className={`${surfaceClass} rounded-[24px] p-5 ${
                      (results as any).title_analysis.match_status === 'Exact'
                        ? 'border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.92))]'
                        : 'border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(15,23,42,0.92))]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          (results as any).title_analysis.match_status === 'Exact'
                            ? 'border-emerald-300/30 bg-emerald-500/15'
                            : 'border-rose-300/30 bg-rose-500/15'
                        }`}
                      >
                        {(results as any).title_analysis.match_status === 'Exact' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-rose-200" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className={sectionLabelClass}>Title Match</div>
                        <h4 className={`${cardTitleClass} mt-2`}>Job title alignment analysis</h4>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                              JD Title
                            </div>
                            <div className="mt-2 text-sm font-medium text-white">
                              {(results as any).title_analysis.jd_title}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                              Resume Title
                            </div>
                            <div className="mt-2 text-sm font-medium text-white">
                              {(results as any).title_analysis.resume_title}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                              Match Status
                            </div>
                            <div
                              className={`mt-2 text-sm font-semibold ${
                                (results as any).title_analysis.match_status === 'Exact'
                                  ? 'text-emerald-200'
                                  : 'text-rose-200'
                              }`}
                            >
                              {(results as any).title_analysis.match_status}
                            </div>
                          </div>
                        </div>

                        {(results as any).title_analysis.recommendation && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                            <span className="font-semibold text-white">Recommendation:</span>{' '}
                            {(results as any).title_analysis.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(results as any).hard_skills_analysis && (
                  <div className={`${surfaceClass} rounded-[24px] p-5`}>
                    <div className={sectionLabelClass}>Hard Skills</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Hard skills match analysis</h4>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                        <div className="text-3xl font-semibold text-cyan-100">
                          {(results as any).hard_skills_analysis.total_keywords_searched}
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
                          Keywords searched
                        </div>
                      </div>
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                        <div className="text-3xl font-semibold text-emerald-100">
                          {(results as any).hard_skills_analysis.exact_matches_found}
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100/70">
                          Exact matches found
                        </div>
                      </div>
                      <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                        <div className="text-3xl font-semibold text-amber-100">
                          {(results as any).hard_skills_analysis.match_rate}
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-amber-100/70">
                          Match rate
                        </div>
                      </div>
                    </div>

                    {(results as any).hard_skills_analysis.synonym_traps?.length > 0 && (
                      <div className="mt-5 rounded-[22px] border border-orange-300/25 bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(15,23,42,0.92))] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200/80">
                          Synonym Traps
                        </div>
                        <h5 className='mt-2 font-["Fraunces",Georgia,serif] text-xl font-semibold text-white'>
                          Terms ATS may not count as exact matches
                        </h5>
                        <p className="mt-2 text-sm leading-7 text-orange-100/85">
                          Similar language may still fail exact ATS keyword matching. Use the exact
                          term from the job description where truthful and relevant.
                        </p>

                        <div className="mt-4 space-y-3">
                          {(results as any).hard_skills_analysis.synonym_traps.map(
                            (trap: any, i: number) => (
                              <div
                                key={i}
                                className="rounded-2xl border border-orange-300/20 bg-black/20 p-4"
                              >
                                <div className="font-mono text-sm text-slate-100">
                                  <span className="text-rose-200 line-through">
                                    {trap.resume_term}
                                  </span>
                                  <span className="px-2 text-orange-200">→</span>
                                  <span className="font-semibold text-emerald-200">
                                    {trap.jd_term}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm leading-7 text-slate-300">
                                  {trap.advice}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(results as any).placement_audit && (
                  <div className={`${surfaceClass} rounded-[24px] p-5`}>
                    <div className={sectionLabelClass}>Keyword Placement</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Placement analysis</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Placement matters because ATS often parses prominent sections first.
                    </p>

                    <div className="mt-5 space-y-4">
                      {[
                        {
                          label: 'Headline / Summary',
                          score: (results as any).placement_audit.headline_score,
                          feedback: (results as any).placement_audit.headline_feedback,
                        },
                        {
                          label: 'Skills Section',
                          score: (results as any).placement_audit.skills_section_score,
                          feedback: (results as any).placement_audit.skills_section_feedback,
                        },
                        {
                          label: 'Experience Bullets',
                          score: (results as any).placement_audit.bullet_points_score,
                          feedback: (results as any).placement_audit.bullet_points_feedback,
                        },
                      ].map((item) => {
                        const tone = getScoreTone(item.score);
                        return (
                          <div
                            key={item.label}
                            className={`${tone.panel} rounded-[22px] border p-4 shadow-[0_12px_30px_rgba(2,6,23,0.22)]`}
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-white">{item.label}</span>
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}
                              >
                                {item.score}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${tone.fill}`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-300">{item.feedback}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(results as any).knockout_filters && (
                  <div className={`${surfaceClass} rounded-[24px] p-5`}>
                    <div className={sectionLabelClass}>Knockout Filters</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Binary requirement check</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      These are pass/fail conditions that may eliminate a candidate before deeper
                      review.
                    </p>

                    <div className="mt-4 space-y-3">
                      {Object.entries((results as any).knockout_filters).map(
                        ([key, filter]: [string, any]) => (
                          <div
                            key={key}
                            className={`rounded-2xl border p-4 ${
                              filter.status === 'PASS'
                                ? 'border-emerald-300/25 bg-emerald-500/10'
                                : 'border-rose-300/25 bg-rose-500/10'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                  filter.status === 'PASS'
                                    ? 'border border-emerald-300/30 bg-emerald-500/15 text-emerald-100'
                                    : 'border border-rose-300/30 bg-rose-500/15 text-rose-100'
                                }`}
                              >
                                {filter.status}
                              </span>
                            </div>
                            <div className="mt-2 text-sm leading-7 text-slate-300">
                              Required: {filter.required} <span className="px-2 text-slate-500">•</span>{' '}
                              Detected: {filter.detected}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className={`${surfaceClass} rounded-[28px] p-6 ${getScoreBgColor(results.overall_score)}`}>
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className={sectionLabelClass}>Overall Assessment</div>
                      <h3 className='mt-2 font-["Fraunces",Georgia,serif] text-3xl font-semibold text-white'>
                        Overall score
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        Weighted performance across ATS-critical categories.
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <div className={`text-6xl font-semibold tracking-tight ${getScoreColor(results.overall_score)}`}>
                        {results.overall_score}
                      </div>
                      <div
                        className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] ${getProbabilityDisplay(results.pass_probability).chip} ${getProbabilityDisplay(results.pass_probability).color}`}
                      >
                        {getProbabilityDisplay(results.pass_probability).icon}
                        Pass Probability: {getProbabilityDisplay(results.pass_probability).text}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={sectionLabelClass}>Breakdown</div>
                  <h3 className={`${cardTitleClass} mt-2`}>Category scores</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {Object.entries(results.category_scores).map(([key, category]) => {
                      const tone = getScoreTone(category.score);
                      return (
                        <div
                          key={key}
                          className={`${surfaceClass} ${tone.ring} rounded-[22px] p-5 ring-1`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                              {key.replace(/_/g, ' ')}
                            </h4>
                            <span className={`text-2xl font-semibold ${tone.text}`}>
                              {category.score}
                            </span>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${tone.fill}`}
                              style={{ width: `${category.score}%` }}
                            />
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-300">{category.details}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Weight: {category.weight}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {results.knockout_risks.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] border border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(15,23,42,0.95))] p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-500/15">
                        <AlertTriangle className="h-5 w-5 text-rose-200" />
                      </div>
                      <div className="flex-1">
                        <div className={sectionLabelClass}>Risks</div>
                        <h4 className={`${cardTitleClass} mt-2`}>Knockout risks</h4>
                        <ul className="mt-4 space-y-2">
                          {results.knockout_risks.map((risk, i) => (
                            <li key={i} className="text-sm leading-7 text-rose-100/90">
                              • {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {results.strengths.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.95))] p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-500/15">
                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      </div>
                      <div className="flex-1">
                        <div className={sectionLabelClass}>Strengths</div>
                        <h4 className={`${cardTitleClass} mt-2`}>What is already working</h4>
                        <ul className="mt-4 space-y-2">
                          {results.strengths.map((strength, i) => (
                            <li key={i} className="text-sm leading-7 text-emerald-100/90">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {results.weaknesses.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] border border-amber-300/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.95))] p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-500/15">
                        <AlertCircle className="h-5 w-5 text-amber-200" />
                      </div>
                      <div className="flex-1">
                        <div className={sectionLabelClass}>Weaknesses</div>
                        <h4 className={`${cardTitleClass} mt-2`}>Areas dragging visibility down</h4>
                        <ul className="mt-4 space-y-2">
                          {results.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm leading-7 text-amber-100/90">
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {results.missing_keywords.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] border border-rose-300/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(15,23,42,0.95))] p-5`}>
                    <div className={sectionLabelClass}>Missing Keywords</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Missing hard skills & exact phrases</h4>
                    <p className="mt-2 text-sm leading-7 text-rose-100/85">
                      These technical terms appear missing from your resume. Add them where accurate
                      and defensible, especially inside Skills, title, and impact bullets.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {results.missing_keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border border-rose-300/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-100"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {results.recommendations.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.95))] p-5`}>
                    <div className={sectionLabelClass}>Action Plan</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Prioritized improvements</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Follow these steps in sequence for the highest ATS impact.
                    </p>

                    <ul className="mt-4 space-y-3">
                      {results.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#fb923c)] text-xs font-bold text-slate-950">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-7 text-slate-100">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.ats_compatibility.optimization_tips.length > 0 && (
                  <div className={`${surfaceClass} rounded-[24px] p-5`}>
                    <div className={sectionLabelClass}>ATS Compatibility</div>
                    <h4 className={`${cardTitleClass} mt-2`}>Optimization tips</h4>
                    <ul className="mt-4 space-y-2">
                      {results.ats_compatibility.optimization_tips.map((tip, i) => (
                        <li key={i} className="text-sm leading-7 text-slate-300">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button
                    onClick={handleDownloadPdf}
                    variant="default"
                    className="rounded-full border border-cyan-200/20 bg-[linear-gradient(135deg,#22d3ee,#0ea5e9_52%,#fb923c)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_40px_rgba(14,165,233,0.3)] transition-all duration-300 hover:-translate-y-0.5"
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handlePreviewApply}
                    variant="outline"
                    className="rounded-full border-emerald-300/25 bg-emerald-500/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-500/15"
                    disabled={loading || applyLoading}
                  >
                    {applyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Apply Suggestions
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleScan}
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 hover:bg-white/10"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Run Scan Again
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ATSApplyPreviewModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onReject={() => setShowApplyModal(false)}
        onConfirm={handleConfirmApply}
        diffSummary={applyPreview?.diff_summary}
        detailedChanges={applyPreview?.detailed_changes}
        isLoading={applyLoading}
        errorMessage={applyError || undefined}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

        @keyframes dialog-rise {
          from {
            opacity: 0;
            transform: translateY(26px) scale(0.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-dialog-rise {
          animation: dialog-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .animate-spin-slow {
          animation: spin-slow 2.4s linear infinite;
        }

        .ats-scan-shell {
          scrollbar-width: thin;
          scrollbar-color: rgba(103, 232, 249, 0.45) rgba(255, 255, 255, 0.05);
        }

        .ats-scan-shell ::-webkit-scrollbar {
          width: 10px;
        }

        .ats-scan-shell ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
        }

        .ats-scan-shell ::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(34, 211, 238, 0.75), rgba(251, 146, 60, 0.75));
          border: 2px solid rgba(7, 17, 31, 0.8);
        }
      `}</style>
    </>
  );
}
