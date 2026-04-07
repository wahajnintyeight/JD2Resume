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

  // Apply suggestions states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyPreview, setApplyPreview] = useState<ATSApplyPreviewResponse | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResults(null); // Clear previous results
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
      // Refresh the page to show updated resume
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700';
    if (score >= 75) return 'text-blue-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-700';
    if (score >= 75) return 'bg-blue-50 border-blue-700';
    if (score >= 60) return 'bg-yellow-50 border-yellow-700';
    return 'bg-red-50 border-red-700';
  };

  const getProbabilityDisplay = (probability: string) => {
    switch (probability) {
      case 'high':
        return { text: 'High', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-700' };
      case 'medium':
        return { text: 'Medium', icon: <Target className="w-4 h-4" />, color: 'text-yellow-700' };
      case 'low':
        return { text: 'Low', icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-700' };
      default:
        return { text: probability, icon: null, color: 'text-gray-700' };
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b-2 border-black bg-[#E5E5E0] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold uppercase text-black">
                  ATS Compatibility Scan
                </h2>
                <p className="mt-1 font-mono text-sm uppercase text-gray-600">
                  {'// '}Deep analysis of resume performance in automated screening
                </p>
              </div>
              <Button onClick={onClose} variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {!results && !loading && !error && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto border-2 border-black bg-blue-700 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_#000000]">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-serif text-2xl font-bold uppercase mb-3">Ready to Scan</h3>
                <p className="font-mono text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Analyze how well this resume will perform in Applicant Tracking Systems (ATS). Get
                  detailed scores and actionable recommendations.
                </p>

                {/* Job Description Input */}
                <div className="max-w-2xl mx-auto mb-6">
                  <label className="block font-mono text-xs font-bold uppercase text-left mb-2">
                    Job Description (Optional)
                  </label>
                  <Textarea
                    value={customJobDescription}
                    onChange={(e) => setCustomJobDescription(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Paste the job description here, or leave empty to use the original JD from tailoring..."
                  />
                  <p className="font-mono text-xs text-gray-500 text-left mt-2">
                    For tailored resumes, the original job description will be used if left empty.
                  </p>
                </div>

                <Button
                  onClick={handleScan}
                  size="lg"
                  className="font-mono uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5 mr-2" />
                      Start ATS Scan
                    </>
                  )}
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  {/* Animated scanning effect */}
                  <div className="w-24 h-24 border-1 rounded-sm border-blue-700 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-10 h-10 text-blue-700 animate-pulse" />
                  </div>
                </div>
                <p className="font-mono text-lg font-bold uppercase text-blue-700 mb-2 animate-pulse">
                  Analyzing Resume...
                </p>
                <p className="font-mono text-xs text-gray-500 max-w-md text-center">
                  Scanning keywords, experience alignment, technical skills, format compatibility,
                  and education requirements
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <div
                    className="w-2 h-2 bg-blue-700 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-700 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-700 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="border-2 border-red-600 bg-red-50 p-6 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-mono text-sm font-bold uppercase text-red-900 mb-2">
                      Scan Failed
                    </h4>
                    <p className="font-mono text-sm text-red-800 break-words">{error}</p>
                    <Button
                      onClick={handleScan}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-red-600 text-red-700"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                {/* Educational Banner */}
                <div className="border-2 border-blue-700 bg-blue-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-700 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-mono text-sm font-bold uppercase text-blue-900 mb-2">
                        How ATS Systems Actually Work
                      </h4>
                      <p className="font-mono text-xs text-blue-800 mb-2">
                        ATS is a search engine, not a grader. Recruiters search for EXACT keywords
                        (SQL, Python, Tableau) - not soft skills (leadership, communication).
                      </p>
                      <p className="font-mono text-xs text-blue-800">
                        This scan focuses on HARD SKILLS only and checks for exact matches, not
                        synonyms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description Section */}
                {results.job_description && (
                  <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
                    <button
                      onClick={() => setShowJobDescription(!showJobDescription)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-700" />
                        <h3 className="font-serif text-xl font-bold uppercase text-left">
                          Job Description
                        </h3>
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
                            className="font-mono text-xs uppercase"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {showJobDescription ? (
                          <ChevronUp className="w-5 h-5 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-700" />
                        )}
                      </div>
                    </button>
                    {showJobDescription && (
                      <div className="border-t-2 border-black p-4 bg-gray-50">
                        {editingJobDescription ? (
                          <div className="space-y-3">
                            <Textarea
                              value={customJobDescription}
                              onChange={(e) => setCustomJobDescription(e.target.value)}
                              className="min-h-[300px] font-mono text-sm"
                              placeholder="Paste the job description here..."
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleScan}
                                size="sm"
                                disabled={!customJobDescription.trim() || loading}
                                className="font-mono uppercase"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-1" />
                                    Scan with New JD
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                className="font-mono uppercase"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto">
                            <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-words">
                              {results.job_description}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Title Analysis - NEW */}
                {(results as any).title_analysis && (
                  <div
                    className={`border-2 p-4 shadow-[4px_4px_0px_0px_#000000] ${
                      (results as any).title_analysis.match_status === 'Exact'
                        ? 'border-green-700 bg-green-50'
                        : 'border-red-600 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {(results as any).title_analysis.match_status === 'Exact' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-1" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-mono text-sm font-bold uppercase mb-2">
                          🎯 Job Title Match Analysis
                        </h4>
                        <div className="space-y-2 font-mono text-sm">
                          <div>
                            <span className="text-gray-600">Job Description Title:</span>{' '}
                            <span className="font-bold">
                              {(results as any).title_analysis.jd_title}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Your Resume Title:</span>{' '}
                            <span className="font-bold">
                              {(results as any).title_analysis.resume_title}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Match Status:</span>{' '}
                            <span
                              className={`font-bold ${
                                (results as any).title_analysis.match_status === 'Exact'
                                  ? 'text-green-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {(results as any).title_analysis.match_status}
                            </span>
                          </div>
                          {(results as any).title_analysis.recommendation && (
                            <div className="mt-3 p-3 bg-white border border-black">
                              <span className="font-bold">💡 Recommendation:</span>{' '}
                              {(results as any).title_analysis.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hard Skills Analysis - NEW */}
                {(results as any).hard_skills_analysis && (
                  <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase mb-3">
                      🔍 Hard Skills Match Analysis
                    </h4>
                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                      <div className="border border-black p-3 bg-blue-50">
                        <div className="text-2xl font-bold text-blue-700">
                          {(results as any).hard_skills_analysis.total_keywords_searched}
                        </div>
                        <div className="font-mono text-xs text-gray-600">Keywords Searched</div>
                      </div>
                      <div className="border border-black p-3 bg-green-50">
                        <div className="text-2xl font-bold text-green-700">
                          {(results as any).hard_skills_analysis.exact_matches_found}
                        </div>
                        <div className="font-mono text-xs text-gray-600">Exact Matches Found</div>
                      </div>
                      <div className="border border-black p-3 bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-700">
                          {(results as any).hard_skills_analysis.match_rate}
                        </div>
                        <div className="font-mono text-xs text-gray-600">Match Rate</div>
                      </div>
                    </div>

                    {/* Synonym Traps - CRITICAL */}
                    {(results as any).hard_skills_analysis.synonym_traps?.length > 0 && (
                      <div className="border-2 border-orange-600 bg-orange-50 p-3 mt-3">
                        <h5 className="font-mono text-xs font-bold uppercase text-orange-900 mb-2">
                          ⚠️ Synonym Traps (ATS Won't Find These)
                        </h5>
                        <p className="font-mono text-xs text-orange-800 mb-2">
                          ATS systems search for EXACT keywords. Using similar words won't work:
                        </p>
                        <div className="space-y-2">
                          {(results as any).hard_skills_analysis.synonym_traps.map(
                            (trap: any, i: number) => (
                              <div key={i} className="bg-white border border-orange-600 p-2">
                                <div className="font-mono text-xs">
                                  <span className="text-red-600 line-through">
                                    {trap.resume_term}
                                  </span>
                                  {' → '}
                                  <span className="text-green-700 font-bold">{trap.jd_term}</span>
                                </div>
                                <div className="font-mono text-xs text-gray-600 mt-1">
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

                {/* Placement Audit - NEW */}
                {(results as any).placement_audit && (
                  <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase mb-3">
                      📍 Keyword Placement Analysis
                    </h4>
                    <p className="font-mono text-xs text-gray-600 mb-3">
                      Where you place keywords matters. ATS systems scan specific sections first.
                    </p>
                    <div className="space-y-3">
                      {/* Headline */}
                      <div className="border border-black p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold">Headline/Summary</span>
                          <span
                            className={`text-lg font-bold ${getScoreColor((results as any).placement_audit.headline_score)}`}
                          >
                            {(results as any).placement_audit.headline_score}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 border border-black mb-2">
                          <div
                            className={`h-full ${(results as any).placement_audit.headline_score >= 75 ? 'bg-green-700' : (results as any).placement_audit.headline_score >= 50 ? 'bg-yellow-700' : 'bg-red-700'}`}
                            style={{ width: `${(results as any).placement_audit.headline_score}%` }}
                          />
                        </div>
                        <p className="font-mono text-xs text-gray-600">
                          {(results as any).placement_audit.headline_feedback}
                        </p>
                      </div>

                      {/* Skills Section */}
                      <div className="border border-black p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold">Skills Section</span>
                          <span
                            className={`text-lg font-bold ${getScoreColor((results as any).placement_audit.skills_section_score)}`}
                          >
                            {(results as any).placement_audit.skills_section_score}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 border border-black mb-2">
                          <div
                            className={`h-full ${(results as any).placement_audit.skills_section_score >= 75 ? 'bg-green-700' : (results as any).placement_audit.skills_section_score >= 50 ? 'bg-yellow-700' : 'bg-red-700'}`}
                            style={{
                              width: `${(results as any).placement_audit.skills_section_score}%`,
                            }}
                          />
                        </div>
                        <p className="font-mono text-xs text-gray-600">
                          {(results as any).placement_audit.skills_section_feedback}
                        </p>
                      </div>

                      {/* Bullet Points */}
                      <div className="border border-black p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold">Experience Bullets</span>
                          <span
                            className={`text-lg font-bold ${getScoreColor((results as any).placement_audit.bullet_points_score)}`}
                          >
                            {(results as any).placement_audit.bullet_points_score}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 border border-black mb-2">
                          <div
                            className={`h-full ${(results as any).placement_audit.bullet_points_score >= 75 ? 'bg-green-700' : (results as any).placement_audit.bullet_points_score >= 50 ? 'bg-yellow-700' : 'bg-red-700'}`}
                            style={{
                              width: `${(results as any).placement_audit.bullet_points_score}%`,
                            }}
                          />
                        </div>
                        <p className="font-mono text-xs text-gray-600">
                          {(results as any).placement_audit.bullet_points_feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knockout Filters - NEW */}
                {(results as any).knockout_filters && (
                  <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase mb-3">
                      🚫 Knockout Filter Check
                    </h4>
                    <p className="font-mono text-xs text-gray-600 mb-3">
                      Binary requirements that automatically reject candidates
                    </p>
                    <div className="space-y-2">
                      {Object.entries((results as any).knockout_filters).map(
                        ([key, filter]: [string, any]) => (
                          <div
                            key={key}
                            className={`border p-3 ${
                              filter.status === 'PASS'
                                ? 'border-green-700 bg-green-50'
                                : 'border-red-600 bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold uppercase">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span
                                className={`font-mono text-xs font-bold ${
                                  filter.status === 'PASS' ? 'text-green-700' : 'text-red-600'
                                }`}
                              >
                                {filter.status}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-gray-600 mt-1">
                              Required: {filter.required} | Detected: {filter.detected}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Overall Score */}
                <div
                  className={`border-2 p-6 shadow-[6px_6px_0px_0px_#000000] ${getScoreBgColor(results.overall_score)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold uppercase">Overall Score</h3>
                      <p className="font-mono text-xs uppercase text-gray-600 mt-1">
                        Weighted average across all categories
                      </p>
                    </div>
                    <div className={`text-6xl font-bold ${getScoreColor(results.overall_score)}`}>
                      {results.overall_score}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold uppercase">Pass Probability:</span>
                    <span
                      className={`flex items-center gap-1 font-mono text-sm font-bold uppercase ${getProbabilityDisplay(results.pass_probability).color}`}
                    >
                      {getProbabilityDisplay(results.pass_probability).icon}
                      {getProbabilityDisplay(results.pass_probability).text}
                    </span>
                  </div>
                </div>

                {/* Category Scores */}
                <div>
                  <h3 className="font-serif text-xl font-bold uppercase mb-4">
                    Category Breakdown
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(results.category_scores).map(([key, category]) => (
                      <div
                        key={key}
                        className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-mono text-sm font-bold uppercase">
                            {key.replace(/_/g, ' ')}
                          </h4>
                          <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                            {category.score}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="h-2 bg-gray-200 border border-black">
                            <div
                              className={`h-full ${category.score >= 90 ? 'bg-green-700' : category.score >= 75 ? 'bg-blue-700' : category.score >= 60 ? 'bg-yellow-700' : 'bg-red-700'}`}
                              style={{ width: `${category.score}%` }}
                            />
                          </div>
                        </div>
                        <p className="font-mono text-xs text-gray-600">{category.details}</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">
                          Weight: {category.weight}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knockout Risks */}
                {results.knockout_risks.length > 0 && (
                  <div className="border-2 border-red-600 bg-red-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-mono text-sm font-bold uppercase text-red-900 mb-2">
                          ⚠️ Knockout Risks
                        </h4>
                        <ul className="space-y-1">
                          {results.knockout_risks.map((risk, i) => (
                            <li key={i} className="font-mono text-sm text-red-800">
                              • {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {results.strengths.length > 0 && (
                  <div className="border-2 border-green-700 bg-green-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-mono text-sm font-bold uppercase text-green-900 mb-2">
                          ✓ Strengths
                        </h4>
                        <ul className="space-y-1">
                          {results.strengths.map((strength, i) => (
                            <li key={i} className="font-mono text-sm text-green-800">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {results.weaknesses.length > 0 && (
                  <div className="border-2 border-yellow-700 bg-yellow-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-mono text-sm font-bold uppercase text-yellow-900 mb-2">
                          ⚠ Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {results.weaknesses.map((weakness, i) => (
                            <li key={i} className="font-mono text-sm text-yellow-800">
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {results.missing_keywords.length > 0 && (
                  <div className="border-2 border-red-600 bg-red-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase text-red-900 mb-2">
                      ❌ Missing Hard Skills & Keywords
                    </h4>
                    <p className="font-mono text-xs text-red-800 mb-3">
                      These exact technical skills from the job description are missing. Add them to
                      your Skills section.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.missing_keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="inline-block border-2 border-red-600 bg-white px-3 py-1 font-mono text-xs font-bold"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {results.recommendations.length > 0 && (
                  <div className="border-2 border-blue-700 bg-blue-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase text-blue-900 mb-2">
                      💡 Action Plan (Prioritized)
                    </h4>
                    <p className="font-mono text-xs text-blue-800 mb-3">
                      Follow these steps in order to maximize your ATS visibility
                    </p>
                    <ul className="space-y-2">
                      {results.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="font-mono text-sm text-blue-800 flex items-start gap-2"
                        >
                          <span className="font-bold shrink-0">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ATS Compatibility Tips */}
                {results.ats_compatibility.optimization_tips.length > 0 && (
                  <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
                    <h4 className="font-mono text-sm font-bold uppercase mb-3">
                      ATS Optimization Tips
                    </h4>
                    <ul className="space-y-1">
                      {results.ats_compatibility.optimization_tips.map((tip, i) => (
                        <li key={i} className="font-mono text-sm text-gray-700">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <Button
                    onClick={handleDownloadPdf}
                    variant="default"
                    className="font-mono uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Report as PDF
                      </>
                    )}
                  </Button>

                  {/* Apply Suggestions Button */}
                  <Button
                    onClick={handlePreviewApply}
                    variant="outline"
                    className="font-mono uppercase border-blue-700 text-blue-700 hover:bg-blue-50 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
                    disabled={loading || applyLoading}
                  >
                    {applyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply Suggestions
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleScan}
                    variant="outline"
                    className="font-mono uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
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

      {/* ATS Apply Preview Modal */}
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
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
