import { ChangeDecision, ImprovedResult } from '@/components/common/resume_previewer_context';
import type { ResumeData } from '@/components/dashboard/resume-component';
import { type TemplateSettings } from '@/lib/types/template-settings';
import { type Locale } from '@/i18n/config';
import { API_BASE, apiPost, apiPatch, apiDelete, apiFetch } from './client';

// Matches backend schemas/models.py ResumeData
interface ProcessedResume {
  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
  };
  summary?: string;
  workExperience?: Array<{
    id: number;
    title?: string;
    company?: string;
    location?: string | null;
    years?: string;
    description?: string[];
  }>;
  education?: Array<{
    id: number;
    institution?: string;
    degree?: string;
    years?: string;
    description?: string | null;
  }>;
  personalProjects?: Array<{
    id: number;
    name?: string;
    role?: string;
    years?: string;
    github?: string | null;
    website?: string | null;
    description?: string[];
  }>;
  additional?: {
    technicalSkills?: string[];
    languages?: string[];
    certificationsTraining?: string[];
    awards?: string[];
  };
}

interface ResumeResponse {
  request_id: string;
  data: {
    resume_id: string;
    raw_resume: {
      id: number | null;
      content: string;
      content_type: string;
      created_at: string;
      processing_status: 'pending' | 'processing' | 'ready' | 'failed';
    };
    processed_resume: ProcessedResume | null;
    cover_letter?: string | null;
    outreach_message?: string | null;
    parent_id?: string | null; // For determining if resume is tailored
    title?: string | null;
  };
}

/** Response from resume upload endpoint */
export interface ResumeUploadResponse {
  message: string;
  request_id: string;
  resume_id: string;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  is_master: boolean;
}

interface ImproveResumeConfirmRequest {
  resume_id: string;
  job_id: string;
  improved_data: ResumeData;
  improvements: Array<{
    suggestion: string;
    lineNumber?: number | null;
  }>;
  change_decisions?: Record<number, ChangeDecision>;
}

function normalizeResumeId(resumeId: string): string {
  const normalized = resumeId.trim();
  if (!normalized) {
    throw new Error('Resume ID is required.');
  }
  return normalized;
}

export interface ResumeListItem {
  resume_id: string;
  filename: string | null;
  is_master: boolean;
  master_category?: string | null;
  parent_id: string | null;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
  title?: string | null;
  // Optional lightweight snippet of associated job description (populated client-side)
  jobSnippet?: string;
}

async function postImprove(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<ImprovedResult> {
  let response: Response;
  try {
    response = await apiPost(endpoint, payload);
  } catch (networkError) {
    console.error(`Network error during ${endpoint}:`, networkError);
    throw networkError;
  }

  const text = await response.text();
  if (!response.ok) {
    console.error('Improve failed response body:', text);
    throw new Error(`Improve failed with status ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as ImprovedResult;
  } catch (parseError) {
    console.error('Failed to parse improve response:', parseError, 'Raw response:', text);
    throw parseError;
  }
}

/** Uploads job descriptions and returns a job_id */
export async function uploadJobDescriptions(
  descriptions: string[],
  resumeId: string
): Promise<string> {
  const res = await apiPost('/jobs/upload', {
    job_descriptions: descriptions,
    resume_id: resumeId,
  });
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
  const data = await res.json();
  return data.job_id[0];
}

/** Improves the resume and returns the full preview object */
export async function improveResume(
  resumeId: string,
  jobId: string,
  promptId?: string
): Promise<ImprovedResult> {
  return postImprove('/resumes/improve', {
    resume_id: resumeId,
    job_id: jobId,
    prompt_id: promptId ?? null,
  });
}

/** Previews the resume improvement without saving */
export async function previewImproveResume(
  resumeId: string,
  jobId: string,
  promptId?: string
): Promise<ImprovedResult> {
  return postImprove('/resumes/improve/preview', {
    resume_id: resumeId,
    job_id: jobId,
    prompt_id: promptId ?? null,
  });
}

/** Confirms and saves a tailored resume */
export async function confirmImproveResume(
  payload: ImproveResumeConfirmRequest
): Promise<ImprovedResult> {
  return postImprove('/resumes/improve/confirm', payload as unknown as Record<string, unknown>);
}

/** Fetches a raw resume record for previewing the original upload */
export async function fetchResume(resumeId: string): Promise<ResumeResponse['data']> {
  const res = await apiFetch(`/resumes?resume_id=${encodeURIComponent(resumeId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load resume (status ${res.status}).`);
  }
  const payload = (await res.json()) as ResumeResponse;
  // Support both raw_resume content (initial) and processed_resume (if available)
  // The viewer/builder logic should prioritize processed data if present
  return payload.data;
}

export async function fetchResumeList(includeMaster = false): Promise<ResumeListItem[]> {
  const res = await apiFetch(`/resumes/list?include_master=${includeMaster ? 'true' : 'false'}`);
  if (!res.ok) {
    throw new Error(`Failed to load resumes list (status ${res.status}).`);
  }
  const payload = (await res.json()) as { data: ResumeListItem[] };
  return payload.data;
}

export async function updateResume(
  resumeId: string,
  resumeData: ProcessedResume
): Promise<ResumeResponse['data']> {
  const res = await apiPatch(`/resumes/${encodeURIComponent(resumeId)}`, resumeData);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update resume (status ${res.status}): ${text}`);
  }
  const payload = (await res.json()) as ResumeResponse;
  return payload.data;
}

export function getResumePdfUrl(
  resumeId: string,
  settings?: TemplateSettings,
  locale?: Locale
): string {
  const normalizedId = normalizeResumeId(resumeId);
  const params = new URLSearchParams();

  if (settings) {
    params.set('template', settings.template);
    params.set('pageSize', settings.pageSize);
    params.set('marginTop', String(settings.margins.top));
    params.set('marginBottom', String(settings.margins.bottom));
    params.set('marginLeft', String(settings.margins.left));
    params.set('marginRight', String(settings.margins.right));
    params.set('sectionSpacing', String(settings.spacing.section));
    params.set('itemSpacing', String(settings.spacing.item));
    params.set('lineHeight', String(settings.spacing.lineHeight));
    params.set('fontSize', String(settings.fontSize.base));
    params.set('headerScale', String(settings.fontSize.headerScale));
    params.set('headerFont', settings.fontSize.headerFont);
    params.set('bodyFont', settings.fontSize.bodyFont);
    params.set('compactMode', String(settings.compactMode));
    params.set('showContactIcons', String(settings.showContactIcons));
    params.set('accentColor', settings.accentColor);
  } else {
    params.set('template', 'swiss-single');
    params.set('pageSize', 'A4');
  }
  if (locale) {
    params.set('lang', locale);
  }

  return `${API_BASE}/resumes/${encodeURIComponent(normalizedId)}/pdf?${params.toString()}`;
}

export async function downloadResumePdf(
  resumeId: string,
  settings?: TemplateSettings,
  locale?: Locale
): Promise<{ blob: Blob; filename: string }> {
  const url = getResumePdfUrl(resumeId, settings, locale);
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download resume (status ${res.status}): ${text}`);
  }

  // Extract filename from Content-Disposition header
  let filename = `resume_${resumeId}.pdf`;
  const disposition = res.headers.get('Content-Disposition');
  console.log('Content-Disposition header:', disposition);
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    console.log('Filename match:', match);
    if (match && match[1]) {
      filename = match[1];
      console.log('Using filename from header:', filename);
    }
  } else {
    console.log('No Content-Disposition header found, using fallback');
  }

  return { blob: await res.blob(), filename };
}

/** Gets the URL for downloading resume as DOCX */
export function getResumeDocxUrl(resumeId: string): string {
  const normalizedId = normalizeResumeId(resumeId);
  return `${API_BASE}/resumes/${encodeURIComponent(normalizedId)}/docx`;
}

/** Downloads resume as DOCX */
export async function downloadResumeDocx(
  resumeId: string
): Promise<{ blob: Blob; filename: string }> {
  const url = getResumeDocxUrl(resumeId);
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download resume as DOCX (status ${res.status}): ${text}`);
  }

  // Extract filename from Content-Disposition header
  let filename = `resume_${resumeId}.docx`;
  const disposition = res.headers.get('Content-Disposition');
  console.log('DOCX Content-Disposition header:', disposition);
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    console.log('DOCX Filename match:', match);
    if (match && match[1]) {
      filename = match[1];
      console.log('Using DOCX filename from header:', filename);
    }
  } else {
    console.log('No Content-Disposition header found for DOCX, using fallback');
  }

  return { blob: await res.blob(), filename };
}

/** Saves resume PDF to backend outputs directory */
export async function saveResumePdf(
  resumeId: string,
  settings?: TemplateSettings,
  locale?: Locale
): Promise<{ filename: string; path: string }> {
  const normalizedId = normalizeResumeId(resumeId);

  // Build query params from settings
  const params = new URLSearchParams();
  if (settings) {
    params.append('template', settings.template);
    params.append('pageSize', settings.pageSize);
    params.append('marginTop', settings.margins.top.toString());
    params.append('marginBottom', settings.margins.bottom.toString());
    params.append('marginLeft', settings.margins.left.toString());
    params.append('marginRight', settings.margins.right.toString());
    params.append('sectionSpacing', settings.spacing.section.toString());
    params.append('itemSpacing', settings.spacing.item.toString());
    params.append('lineHeight', settings.spacing.lineHeight.toString());
    params.append('fontSize', settings.fontSize.base.toString());
    params.append('headerScale', settings.fontSize.headerScale.toString());
    params.append('headerFont', settings.fontSize.headerFont);
    params.append('bodyFont', settings.fontSize.bodyFont);
    params.append('compactMode', settings.compactMode.toString());
    params.append('showContactIcons', settings.showContactIcons.toString());
    params.append('accentColor', settings.accentColor);
  }
  if (locale) {
    params.append('lang', locale);
  }

  const url = `${API_BASE}/resumes/${encodeURIComponent(normalizedId)}/pdf/save?${params.toString()}`;
  const res = await apiPost(url, {});

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to save resume PDF (status ${res.status}): ${text}`);
  }

  const data = await res.json();
  return { filename: data.filename, path: data.path };
}

/** Deletes a resume by ID */
export async function deleteResume(resumeId: string): Promise<void> {
  const res = await apiDelete(`/resumes/${encodeURIComponent(resumeId)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete resume (status ${res.status}): ${text}`);
  }
}

/** Updates the cover letter for a resume */
export async function updateCoverLetter(resumeId: string, content: string): Promise<void> {
  const res = await apiPatch(`/resumes/${encodeURIComponent(resumeId)}/cover-letter`, { content });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update cover letter (status ${res.status}): ${text}`);
  }
}

/** Updates the outreach message for a resume */
export async function updateOutreachMessage(resumeId: string, content: string): Promise<void> {
  const res = await apiPatch(`/resumes/${encodeURIComponent(resumeId)}/outreach-message`, {
    content,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update outreach message (status ${res.status}): ${text}`);
  }
}

/** Renames a resume by updating its title */
export async function renameResume(resumeId: string, title: string): Promise<void> {
  const res = await apiPatch(`/resumes/${encodeURIComponent(resumeId)}/title`, { title });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to rename resume (status ${res.status}): ${text}`);
  }
}

/** Downloads cover letter as PDF */
export function getCoverLetterPdfUrl(
  resumeId: string,
  pageSize: 'A4' | 'LETTER' = 'A4',
  locale?: Locale
): string {
  const normalizedId = normalizeResumeId(resumeId);
  const params = new URLSearchParams({ pageSize });
  if (locale) {
    params.set('lang', locale);
  }
  return `${API_BASE}/resumes/${encodeURIComponent(normalizedId)}/cover-letter/pdf?${params.toString()}`;
}

export async function downloadCoverLetterPdf(
  resumeId: string,
  pageSize: 'A4' | 'LETTER' = 'A4',
  locale?: Locale
): Promise<Blob> {
  const url = getCoverLetterPdfUrl(resumeId, pageSize, locale);
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download cover letter (status ${res.status}): ${text}`);
  }
  return await res.blob();
}

/** Generates a cover letter on-demand for a tailored resume */
export async function generateCoverLetter(resumeId: string): Promise<string> {
  const res = await apiPost(`/resumes/${encodeURIComponent(resumeId)}/generate-cover-letter`, {});
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to generate cover letter (status ${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.content;
}

/** Generates an outreach message on-demand for a tailored resume */
export async function generateOutreachMessage(resumeId: string): Promise<string> {
  const res = await apiPost(`/resumes/${encodeURIComponent(resumeId)}/generate-outreach`, {});
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to generate outreach message (status ${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.content;
}

/** Retries AI processing for a failed resume */
export async function retryProcessing(resumeId: string): Promise<ResumeUploadResponse> {
  const res = await apiPost(`/resumes/${encodeURIComponent(resumeId)}/retry-processing`, {});
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to retry processing (status ${res.status}): ${text}`);
  }
  return res.json();
}

/** Fetches the job description used to tailor a resume */
export async function fetchJobDescription(
  resumeId: string
): Promise<{ job_id: string; content: string }> {
  const res = await apiFetch(`/resumes/${encodeURIComponent(resumeId)}/job-description`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch job description (status ${res.status}): ${text}`);
  }
  return res.json();
}

// ============================================================================
// Master Resume Management
// ============================================================================

export interface MasterResume {
  resume_id: string;
  master_category: string | null;
  filename: string | null;
  title: string | null;
  created_at: string;
  personal_info: {
    name?: string;
    title?: string;
    email?: string;
  };
}

export interface MasterResumesResponse {
  masters: MasterResume[];
  count: number;
}

/** List all master resumes with their categories */
export async function listMasterResumes(): Promise<MasterResumesResponse> {
  const res = await apiFetch('/resumes/masters');
  if (!res.ok) {
    throw new Error(`Failed to list master resumes (status ${res.status})`);
  }
  return res.json();
}

/** Get master resume for a specific category */
export async function getMasterResume(category?: string): Promise<any> {
  const url = category
    ? `/resumes/master?category=${encodeURIComponent(category)}`
    : '/resumes/master';
  const res = await apiFetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to get master resume (status ${res.status})`);
  }
  return res.json();
}

/** Set a resume as master for a specific category */
export async function setMasterResume(resumeId: string, category?: string): Promise<void> {
  const url = category
    ? `/resumes/${encodeURIComponent(resumeId)}/master?category=${encodeURIComponent(category)}`
    : `/resumes/${encodeURIComponent(resumeId)}/master`;
  const res = await apiFetch(url, { method: 'PUT' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to set master resume (status ${res.status}): ${text}`);
  }
}

/** Remove master status from a resume */
export async function unsetMasterResume(resumeId: string): Promise<void> {
  const res = await apiFetch(`/resumes/${encodeURIComponent(resumeId)}/master`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to unset master resume (status ${res.status}): ${text}`);
  }
}

/** ATS Scan Response */
export interface ATSScanResult {
  overall_score: number;
  overall_match_score?: number; // Backend alias
  pass_probability: 'high' | 'medium' | 'low';
  searchability_status?: string;

  // Title Analysis
  title_analysis?: {
    jd_title: string;
    resume_title: string;
    match_status: 'Exact' | 'Partial' | 'None';
    recommendation?: string;
  };

  // Hard Skills Analysis
  hard_skills_analysis?: {
    total_keywords_searched: number;
    exact_matches_found: number;
    match_rate: string;
    missing_exact_keywords: string[];
    synonym_traps?: Array<{
      jd_term: string;
      resume_term: string;
      advice: string;
    }>;
  };

  // Placement Audit
  placement_audit?: {
    headline_score: number;
    headline_feedback: string;
    skills_section_score: number;
    skills_section_feedback: string;
    bullet_points_score: number;
    bullet_points_feedback: string;
  };

  // Knockout Filters
  knockout_filters?: Record<
    string,
    {
      required: string;
      detected: string;
      status: 'PASS' | 'FAIL';
    }
  >;

  // Action Plan
  action_plan?: Array<{
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
  }>;

  category_scores: {
    keyword_match: {
      score: number;
      weight: number;
      details: string;
    };
    experience_alignment: {
      score: number;
      weight: number;
      details: string;
    };
    technical_skills: {
      score: number;
      weight: number;
      details: string;
    };
    format_structure: {
      score: number;
      weight: number;
      details: string;
    };
    education_certifications: {
      score: number;
      weight: number;
      details: string;
    };
  };
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  recommendations: string[];
  knockout_risks: string[];
  ats_compatibility: {
    format_issues: string[];
    parsing_risks: string[];
    optimization_tips: string[];
  };
  job_description?: string; // Optional job description for reference
}

/** Performs deep ATS scan of resume against job description */
export async function scanResumeATS(
  resumeId: string,
  jobDescription?: string
): Promise<ATSScanResult> {
  const payload: { resume_id: string; job_description?: string } = { resume_id: resumeId };
  if (jobDescription) {
    payload.job_description = jobDescription;
  }

  const res = await apiPost('/ats/scan', payload);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'ATS scan failed' }));
    throw new Error(error.detail || 'ATS scan failed');
  }
  return res.json();
}

/** Downloads ATS scan report as PDF */
export function getATSScanPdfUrl(resumeId: string, pageSize: 'A4' | 'LETTER' = 'A4'): string {
  const normalizedId = normalizeResumeId(resumeId);
  const params = new URLSearchParams({ pageSize });
  return `${API_BASE}/ats/scan/${encodeURIComponent(normalizedId)}/pdf?${params.toString()}`;
}

export async function downloadATSScanPdf(
  resumeId: string,
  pageSize: 'A4' | 'LETTER' = 'A4'
): Promise<{ blob: Blob; filename: string }> {
  const url = getATSScanPdfUrl(resumeId, pageSize);
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download ATS scan report (status ${res.status}): ${text}`);
  }

  let filename = `ATS_Report_${resumeId}.pdf`;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  return { blob: await res.blob(), filename };
}

// ============================================================================
// ATS Apply Suggestions API
// ============================================================================

export interface ATSFieldDiff {
  field_path: string;
  field_type: 'title' | 'skill' | 'description' | 'summary' | string;
  change_type: 'added' | 'removed' | 'modified';
  original_value?: string;
  new_value?: string;
  confidence: 'low' | 'medium' | 'high';
  context?: string;
}

export interface ATSDiffSummary {
  total_changes: number;
  skills_added: number;
  skills_replaced: number;
  descriptions_modified: number;
  title_changed: boolean;
  summary_changed: boolean;
  ats_specific_changes: boolean;
}

export interface ATSApplyPreviewResponse {
  diff_summary: ATSDiffSummary;
  detailed_changes: ATSFieldDiff[];
  modified_resume: ResumeData;
  original_resume: ResumeData;
}

export interface ATSApplyConfirmRequest {
  resume_id: string;
  modified_resume: ResumeData;
}

/** Preview ATS suggestions application to resume */
export async function previewATSApply(
  resumeId: string,
  atsResults: ATSScanResult
): Promise<ATSApplyPreviewResponse> {
  const res = await apiPost('/ats/apply/preview', {
    resume_id: resumeId,
    ats_results: atsResults,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to preview ATS changes' }));
    throw new Error(error.detail || 'Failed to preview ATS changes');
  }

  return res.json();
}

/** Confirm and apply ATS suggestions to resume */
export async function confirmATSApply(
  resumeId: string,
  modifiedResume: ResumeData
): Promise<{ message: string; resume_id: string }> {
  const res = await apiPost('/ats/apply/confirm', {
    resume_id: resumeId,
    modified_resume: modifiedResume,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to apply ATS suggestions' }));
    throw new Error(error.detail || 'Failed to apply ATS suggestions');
  }

  return res.json();
}
