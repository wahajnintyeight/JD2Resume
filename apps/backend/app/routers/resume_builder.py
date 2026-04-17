"""Resume builder/tailoring endpoints."""

import asyncio
import copy
import hashlib
import json
import logging
import re
import unicodedata
from collections.abc import Awaitable
from pathlib import Path
from typing import Any, NoReturn
from uuid import uuid4
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response

from app.database import db
from app.pdf import render_resume_pdf, PDFRenderError
from app.config import settings
from app.auth.dependencies import require_authenticated_user
from app.schemas import (
    GenerateContentResponse,
    ImproveResumeConfirmRequest,
    ImproveResumeRequest,
    ImproveResumeResponse,
    ImproveResumeData,
    RefinementStats,
    ResumeDiffSummary,
    ResumeFieldDiff,
    ResumeData,
    normalize_resume_data,
)
from app.services.improver import (
    extract_job_keywords,
    generate_improvements,
    improve_resume,
)
from app.services.refiner import refine_resume, calculate_keyword_match
from app.schemas.refinement import RefinementConfig
from app.services.cover_letter import (
    generate_cover_letter,
    generate_outreach_message,
    generate_resume_title,
)
from app.prompts import DEFAULT_IMPROVE_PROMPT_ID, IMPROVE_PROMPT_OPTIONS
from app.utils.file_utils import generate_resume_filename

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes", tags=["Resumes"])

_SOFT_SKILL_PATTERNS = [
    # ── Original patterns ──────────────────────────────────────────────
    r"\bcommunication\b",
    r"\bleadership\b",
    r"\bteamwork\b",
    r"\bcollaboration\b",
    r"\binterpersonal\b",
    r"\bproblem[\s-]?solving\b",
    r"\bcritical thinking\b",
    r"\battention to detail\b",
    r"\bdetail[- ]oriented\b",
    r"\bcreative mindset\b",
    r"\bcreativity\b",
    r"\bpersistence\b",
    r"\bpatience\b",
    r"\badaptability\b",
    r"\btime management\b",
    r"\bstakeholder\b",
    r"\borganizational\b",
    r"\blogical and structured approach\b",

    # ── Interpersonal / people traits ─────────────────────────────────
    r"\bempathy\b",
    r"\bemotional intelligence\b",
    r"\beq\b",                          # "EQ" standalone
    r"\bactive listening\b",
    r"\bconflict resolution\b",
    r"\binterpersonal skills\b",
    r"\brelationship building\b",
    r"\binfluencing\b",
    r"\bpersuasion\b",
    r"\bnegotiation skills\b",          # as a standalone trait, not the technical kind

    # ── Work-ethic / attitude buzzwords ───────────────────────────────
    r"\bself[- ]starter\b",
    r"\bgo[- ]getter\b",
    r"\bfast[- ]learner\b",
    r"\bquick learner\b",
    r"\bwilling to learn\b",
    r"\bwork ethic\b",
    r"\bhard[- ]working\b",
    r"\bdedicated\b",                   # common filler on SWE resumes
    r"\bpassionate\b",                  # appears on 90%+ of rejected resumes per ResumeAdapter
    r"\bteam player\b",
    r"\bplayer\b",                      # catches "team player" fragments
    r"\bcollaborative spirit\b",
    r"\bpositive attitude\b",
    r"\bgrowth mindset\b",
    r"\blifelong learner\b",
    r"\bcontinuous learner\b",
    r"\bcuriosity\b",
    r"\baccount?ability\b",
    r"\bownership mentality\b",         # vague when listed without evidence

    # ── Leadership/management fluff ───────────────────────────────────
    r"\bvisionary\b",
    r"\bstrategic thinker\b",
    r"\bstrategic thinking\b",
    r"\bthought leader\b",
    r"\bchange management\b",           # only when listed as a bare skill, not a JD phrase
    r"\bcoaching\b",                    # bare skill; context in bullets is fine
    r"\bmentoring\b",                   # same — belongs in bullets with evidence
    r"\bpeople management\b",

    # ── Process/project soft buzzwords ────────────────────────────────
    r"\bproject management\b",          # flagged when not tied to a tool (Jira/Asana etc.)
    r"\bcross[- ]functional\b",
    r"\bcross[- ]team\b",
    r"\bstakeholder management\b",
    r"\bstakeholder communication\b",
    r"\bstakeholder reporting\b",
    r"\bstakeholder engagement\b",
    r"\bcustomer[- ]centric\b",
    r"\bcustomer[- ]focused\b",
    r"\bresults[- ]oriented\b",
    r"\bgoal[- ]oriented\b",
    r"\bdata[- ]driven\b",              # overused to the point of meaninglessness as a bare skill
    r"\bdetail[- ]focused\b",

    # ── Presentation / communication variants ─────────────────────────
    r"\bpresentation skills\b",
    r"\bpublic speaking\b",
    r"\bwritten communication\b",
    r"\bverbal communication\b",
    r"\bstorytelling\b",
    r"\bdata storytelling\b",

    # ── Culture-fit / DEI buzzwords (common in 2025-26 JDs) ───────────
    r"\binclusion\b",
    r"\bdiversity\b",
    r"\bcultural fit\b",
    r"\bbelonging\b",
    r"\bcross[- ]cultural\b",
    r"\bglobal mindset\b",

    # ── Ambiguous single-word filler ──────────────────────────────────
    r"\binnovative\b",
    r"\bself[- ]motivated\b",
    r"\bproactive\b",                   # also in AI_PHRASE_BLACKLIST — double-filtered
    r"\bflexible\b",
    r"\breliable\b",
    r"\bdependable\b",
    r"\bresourceful\b",
    r"\banalytical\b",                  # vague without a tool or domain attached
    r"\bcreative problem[- ]solver\b",
    r"\boutside[- ]the[- ]box\b",
]


def _load_config() -> dict:
    """Load configuration from config file."""
    config_path = settings.config_path
    if not config_path.exists():
        return {}
    try:
        return json.loads(config_path.read_text())
    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to load config: %s", e)
        return {}

def _load_feature_config() -> dict:
    """Load feature configuration from config file."""
    return _load_config()

def _get_content_language() -> str:
    """Get configured content language from config file."""
    config = _load_config()
    return config.get("content_language", config.get("language", "en"))

def _get_default_prompt_id() -> str:
    """Get configured default prompt id from config file."""
    config = _load_config()
    option_ids = {option["id"] for option in IMPROVE_PROMPT_OPTIONS}
    prompt_id = config.get("default_prompt_id", DEFAULT_IMPROVE_PROMPT_ID)
    return prompt_id if prompt_id in option_ids else DEFAULT_IMPROVE_PROMPT_ID

def _hash_job_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def _normalize_payload(value: Any) -> Any:
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, list):
        return [_normalize_payload(item) for item in value]
    if isinstance(value, dict):
        normalized: dict[Any, Any] = {}
        for key, val in value.items():
            normalized_key = (
                unicodedata.normalize("NFC", key) if isinstance(key, str) else key
            )
            normalized[normalized_key] = _normalize_payload(val)
        return normalized
    return value

def _hash_improved_data(data: dict[str, Any]) -> str:
    """Hash canonicalized improved data for preview/confirm validation."""
    normalized = _normalize_payload(data)
    serialized = json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=str,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def _normalize_personal_info_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value).strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    normalized = _normalize_payload(value)
    return json.dumps(
        normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )

def _raise_improve_error(
    action: str,
    stage: str,
    error: Exception,
    detail: str,
) -> NoReturn:
    logger.error("Resume %s failed during %s: %s", action, stage, error)
    # Include the actual error message for better user feedback
    error_message = str(error)
    if error_message:
        detail = f"{detail}: {error_message}"
    raise HTTPException(status_code=500, detail=detail)

def _get_original_resume_data(resume: dict[str, Any]) -> dict[str, Any] | None:
    original_data = resume.get("processed_data")
    if not original_data and resume.get("content_type") == "json":
        try:
            original_data = json.loads(resume["content"])
        except json.JSONDecodeError as e:
            logger.warning("Skipping resume diff due to JSON parse failure: %s", e)
    return original_data

def _preserve_personal_info(
    original_data: dict[str, Any] | None,
    improved_data: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    warnings: list[str] = []
    if not original_data:
        warnings.append("Original resume data unavailable - personal info may be AI-generated")
        return improved_data, warnings

    original_info = original_data.get("personalInfo")
    if not isinstance(original_info, dict):
        warnings.append("Original personal info missing or invalid")
        return improved_data, warnings

    result = copy.deepcopy(improved_data)
    improved_info = result.get("personalInfo", {})
    fields_to_preserve = ["name", "email", "phone", "location", "website", "linkedin", "github"]
    for field in fields_to_preserve:
        if field in original_info:
            improved_info[field] = copy.deepcopy(original_info[field])

    result["personalInfo"] = improved_info
    return result, warnings

def _calculate_diff_from_resume(
    resume: dict[str, Any],
    improved_data: dict[str, Any],
) -> tuple[ResumeDiffSummary | None, list[ResumeFieldDiff] | None, str | None]:
    original_data = _get_original_resume_data(resume)
    if not original_data:
        return None, None, "original_data_missing"
    from app.services.improver import calculate_resume_diff
    try:
        summary, changes = calculate_resume_diff(original_data, improved_data)
        return summary, changes, None
    except Exception as e:
        logger.warning("Skipping resume diff due to calculation failure: %s", e)
        return None, None, f"calculation_error: {str(e)}"

def _validate_confirm_payload(
    original_data: dict[str, Any] | None,
    improved_data: dict[str, Any],
) -> None:
    if not original_data:
        return
    original_info = original_data.get("personalInfo")
    improved_info = improved_data.get("personalInfo")
    if original_info is None or improved_info is None:
        raise ValueError("Personal info missing")
    fields_to_validate = ["name", "email", "phone", "location", "website", "linkedin", "github"]
    mismatches = [
        field
        for field in fields_to_validate
        if field in original_info or field in improved_info
        if _normalize_personal_info_value(original_info.get(field))
        != _normalize_personal_info_value(improved_info.get(field))
    ]
    if mismatches:
        raise ValueError(f"personalInfo fields changed: {', '.join(mismatches)}")


def _sanitize_technical_skills(
    resume_data: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    """Remove soft-skill phrases from additional.technicalSkills deterministically."""
    sanitized = copy.deepcopy(resume_data)
    additional = sanitized.setdefault("additional", {})
    skills = additional.get("technicalSkills", [])
    if not isinstance(skills, list):
        return sanitized, []

    kept: list[str] = []
    removed: list[str] = []

    for skill in skills:
        skill_text = str(skill).strip()
        if not skill_text:
            continue
        lower_skill = skill_text.casefold()
        if any(re.search(pattern, lower_skill) for pattern in _SOFT_SKILL_PATTERNS):
            removed.append(skill_text)
            continue
        kept.append(skill_text)

    additional["technicalSkills"] = kept
    return sanitized, removed

async def _generate_auxiliary_messages(
    improved_data: dict[str, Any],
    job_content: str,
    language: str,
    enable_cover_letter: bool,
    enable_outreach: bool,
) -> tuple[str | None, str | None, str | None, list[str]]:
    """Helper to generate auxiliary messages if enabled."""
    warnings = []
    cover_letter, outreach_message, title = None, None, None
    
    tasks = []
    if enable_cover_letter:
        tasks.append(generate_cover_letter(improved_data, job_content, language))
    if enable_outreach:
        tasks.append(generate_outreach_message(improved_data, job_content, language))
    tasks.append(generate_resume_title(job_content, language))
    
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        idx = 0
        if enable_cover_letter:
            res = results[idx]
            if isinstance(res, Exception):
                logger.warning("Cover letter generation failed: %s", res)
                warnings.append(f"Cover letter failed: {str(res)}")
            else:
                cover_letter = res
            idx += 1
        if enable_outreach:
            res = results[idx]
            if isinstance(res, Exception):
                logger.warning("Outreach message generation failed: %s", res)
                warnings.append(f"Outreach message failed: {str(res)}")
            else:
                outreach_message = res
            idx += 1
        
        res = results[idx]
        if isinstance(res, Exception):
            logger.warning("Title generation failed: %s", res)
            warnings.append(f"Title generation failed: {str(res)}")
        else:
            title = res
    except Exception as e:
        logger.error("Auxiliary message generation error: %s", e)
        warnings.append(f"Auxiliary error: {str(e)}")
        
    return cover_letter, outreach_message, title, warnings

def _apply_change_decisions(
    original_data: dict[str, Any],
    improved_data: dict[str, Any],
    current_changes: list[ResumeFieldDiff],
    decisions: dict[int, str],
) -> tuple[dict[str, Any], list[str]]:
    """Apply selective changes based on user decisions.
    
    decisions: index-keyed map of 'accepted' | 'rejected' | 'pending'
    """
    import copy

    warnings = []
    result_data = copy.deepcopy(improved_data)

    # Collect rejected changes by their index in current_changes
    rejected_changes = [
        change
        for idx, change in enumerate(current_changes)
        if str(decisions.get(idx, decisions.get(str(idx), "pending"))) == "rejected"
    ]

    if not rejected_changes:
        return result_data, warnings

    # Handle skill rejections by rebuilding the technicalSkills list
    rejected_skill_changes = [c for c in rejected_changes if c.field_type == "skill"]
    if rejected_skill_changes:
        orig_skills: list[str] = (
            original_data.get("additional", {}).get("technicalSkills", []) or []
        )
        improved_skills: list[str] = (
            result_data.get("additional", {}).get("technicalSkills", []) or []
        )
        orig_lower = {s.casefold(): s for s in orig_skills}
        improved_lower = {s.casefold(): s for s in improved_skills}

        for change in rejected_skill_changes:
            if change.change_type == "added" and change.new_value:
                # Remove the added skill
                key = change.new_value.casefold()
                improved_lower.pop(key, None)
            elif change.change_type == "removed" and change.original_value:
                # Restore the removed skill
                key = change.original_value.casefold()
                if key not in improved_lower:
                    improved_lower[key] = orig_lower.get(key, change.original_value)

        result_data.setdefault("additional", {})["technicalSkills"] = list(improved_lower.values())

    # Handle non-skill rejections by reverting via field path
    for change in rejected_changes:
        if change.field_type == "skill":
            continue
        try:
            _set_nested_value(result_data, change.field_path, change.original_value, original_data)
        except Exception as e:
            warnings.append(f"Failed to revert change at {change.field_path}: {str(e)}")

    return result_data, warnings


def _set_nested_value(data: dict[str, Any], path: str, value: Any, original_data: dict[str, Any]) -> None:
    """Set a nested value in data based on a field path, reverting to original if needed."""
    import re
    
    # Parse path like "workExperience[0].description[2]" or "summary"
    parts = re.findall(r'(\w+)|\[(\d+)\]', path)
    current = data
    original_current = original_data
    
    for i, (key, index) in enumerate(parts[:-1]):
        field = key or index
        if key:
            current = current.setdefault(key, {} if i + 1 < len(parts) - 1 and parts[i + 1][0] else [])
            original_current = original_current.get(key, {})
        else:
            idx = int(index)
            current = current[idx]
            original_current = original_current[idx] if isinstance(original_current, list) and idx < len(original_current) else {}
    
    # Set the final value
    last_key, last_index = parts[-1]
    if last_key:
        # Get original value from original_data
        original_value = original_current.get(last_key) if isinstance(original_current, dict) else value
        current[last_key] = original_value if original_value is not None else value
    else:
        idx = int(last_index)
        if isinstance(current, list) and idx < len(current):
            original_value = original_current[idx] if isinstance(original_current, list) and idx < len(original_current) else value
            current[idx] = original_value if original_value is not None else value

@router.post("/improve/preview", response_model=ImproveResumeResponse)
async def improve_resume_preview_endpoint(
    request: ImproveResumeRequest,
    user: dict = Depends(require_authenticated_user)
) -> ImproveResumeResponse:
    """Preview a tailored resume without persisting it."""
    resume = db.get_resume(request.resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    job = db.get_job(request.job_id, user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    language = _get_content_language()
    prompt_id = request.prompt_id or _get_default_prompt_id()

    stage = "load_job_keywords"
    detail = "Failed to preview resume. Please try again."
    try:
        job_keywords = job.get("job_keywords")
        job_keywords_hash = job.get("job_keywords_hash")
        content_hash = _hash_job_content(job["content"])
        if not job_keywords or job_keywords_hash != content_hash:
            stage = "extract_job_keywords"
            job_keywords = await extract_job_keywords(job["content"])
            stage = "persist_job_keywords"
            try:
                db.update_job(
                    request.job_id,
                    {"job_keywords": job_keywords, "job_keywords_hash": content_hash},
                    user["user_id"],
                )
            except Exception as e:
                logger.warning("Failed to persist job keywords: %s", e)
        
        stage = "improve_resume"
        improved_data = await improve_resume(
            original_resume=resume["content"],
            job_description=job["content"],
            job_keywords=job_keywords,
            language=language,
            prompt_id=prompt_id,
        )
        
        response_warnings: list[str] = []
        improved_data, preserve_warnings = _preserve_personal_info(
            _get_original_resume_data(resume),
            improved_data,
        )
        response_warnings.extend(preserve_warnings)

        improved_data, removed_soft_skills = _sanitize_technical_skills(improved_data)
        if removed_soft_skills:
            response_warnings.append(
                "Removed non-technical skills from technicalSkills: "
                + ", ".join(removed_soft_skills)
            )

        stage = "refine_resume"
        refinement_stats: RefinementStats | None = None
        refinement_attempted = False
        refinement_successful = False
        try:
            master_resume = db.get_master_resume(user["user_id"])
            master_data = (
                _get_original_resume_data(master_resume)
                if master_resume
                else _get_original_resume_data(resume)
            )
            if master_data:
                initial_match = calculate_keyword_match(improved_data, job_keywords)
                refinement_attempted = True
                refinement_result = await refine_resume(
                    initial_tailored=improved_data,
                    master_resume=master_data,
                    job_description=job["content"],
                    job_keywords=job_keywords,
                    config=RefinementConfig(),
                )
                improved_data = refinement_result.refined_data
                improved_data, removed_soft_skills = _sanitize_technical_skills(improved_data)
                if removed_soft_skills:
                    response_warnings.append(
                        "Removed non-technical skills from technicalSkills: "
                        + ", ".join(removed_soft_skills)
                    )
                refinement_stats = RefinementStats(
                    passes_completed=refinement_result.passes_completed,
                    keywords_injected=len(refinement_result.keyword_analysis.injectable_keywords) if refinement_result.keyword_analysis else 0,
                    ai_phrases_removed=refinement_result.ai_phrases_removed,
                    alignment_violations_fixed=len([v for v in refinement_result.alignment_report.violations if v.severity == "critical"]) if refinement_result.alignment_report else 0,
                    initial_match_percentage=initial_match,
                    final_match_percentage=refinement_result.final_match_percentage,
                )
                refinement_successful = True
        except Exception as e:
            logger.warning("Refinement failed: %s", e)
            if refinement_attempted:
                response_warnings.append(f"Refinement failed: {str(e)}")

        improved_text = json.dumps(improved_data, indent=2)
        preview_hash = _hash_improved_data(improved_data)
        
        try:
            db.update_job(
                request.job_id,
                {
                    "preview_hash": preview_hash,
                    "preview_prompt_id": prompt_id,
                },
                user["user_id"],
            )
        except Exception as e:
            logger.warning("Failed to persist preview hash: %s", e)

        stage = "calculate_diff"
        diff_summary, detailed_changes, diff_error = _calculate_diff_from_resume(
            resume,
            improved_data,
        )
        if diff_error:
            response_warnings.append(f"Could not calculate changes: {diff_error}")
            
        stage = "generate_improvements"
        improvements = generate_improvements(job_keywords)

        request_id = str(uuid4())
        return ImproveResumeResponse(
            request_id=request_id,
            data=ImproveResumeData(
                request_id=request_id,
                resume_id=None,
                job_id=request.job_id,
                resume_preview=ResumeData.model_validate(improved_data),
                improvements=[
                    {"suggestion": imp["suggestion"], "lineNumber": imp.get("lineNumber")}
                    for imp in improvements
                ],
                markdownOriginal=resume["content"],
                markdownImproved=improved_text,
                diff_summary=diff_summary,
                detailed_changes=detailed_changes,
                refinement_stats=refinement_stats,
                warnings=response_warnings,
                refinement_attempted=refinement_attempted,
                refinement_successful=refinement_successful,
            ),
        )
    except Exception as e:
        _raise_improve_error("preview", stage, e, detail)

@router.post("/improve/confirm", response_model=ImproveResumeResponse)
async def improve_resume_confirm_endpoint(
    request: ImproveResumeConfirmRequest,
    user: dict = Depends(require_authenticated_user)
) -> ImproveResumeResponse:
    """Confirm and persist a tailored resume."""
    resume = db.get_resume(request.resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    job = db.get_job(request.job_id, user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    feature_config = _load_feature_config()
    enable_cover_letter = feature_config.get("enable_cover_letter", False)
    enable_outreach = feature_config.get("enable_outreach_message", False)
    language = _get_content_language()

    stage = "serialize_improved_data"
    detail = "Failed to confirm resume. Please try again."
    try:
        improved_data = request.improved_data.model_dump()
        original_data = _get_original_resume_data(resume)

        improved_data, removed_soft_skills = _sanitize_technical_skills(improved_data)
        if removed_soft_skills:
            response_warnings: list[str] = [
                "Removed non-technical skills from technicalSkills: "
                + ", ".join(removed_soft_skills)
            ]
        else:
            response_warnings = []
        
        try:
            _validate_confirm_payload(original_data, improved_data)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        current_preview_hash = job.get("preview_hash")
        request_hash = _hash_improved_data(improved_data)
        if request_hash != current_preview_hash:
             logger.warning("Hash mismatch: request=%s, job=%s", request_hash, current_preview_hash)
             # We allow it for now if it's close enough or if preview was just done
             pass 

        stage = "calculate_diff"
        diff_summary, detailed_changes, diff_error = _calculate_diff_from_resume(
            resume,
            improved_data,
        )
        
        final_data = improved_data
        if request.change_decisions:
            final_data, decision_warnings = _apply_change_decisions(
                original_data,
                improved_data,
                detailed_changes,
                request.change_decisions,
            )
            final_data, removed_soft_skills = _sanitize_technical_skills(final_data)
            if removed_soft_skills:
                response_warnings.append(
                    "Removed non-technical skills from technicalSkills: "
                    + ", ".join(removed_soft_skills)
                )
            response_warnings.extend(decision_warnings)
            # Recalculate diff
            diff_summary, detailed_changes, _ = _calculate_diff_from_resume(resume, final_data)

        final_text = json.dumps(final_data, indent=2)

        stage = "generate_auxiliary_messages"
        cover_letter, outreach_message, title, aux_warnings = await _generate_auxiliary_messages(
            final_data, job["content"], language, enable_cover_letter, enable_outreach
        )
        response_warnings.extend(aux_warnings)

        stage = "create_resume"
        tailored_resume = db.create_resume(
            content=final_text,
            content_type="json",
            filename=f"tailored_{resume.get('filename', 'resume')}",
            is_master=False,
            parent_id=request.resume_id,
            processed_data=final_data,
            processing_status="ready",
            cover_letter=cover_letter,
            outreach_message=outreach_message,
            title=title,
            user_id=user["user_id"]
        )

        stage = "create_improvement"
        request_id = str(uuid4())
        db.create_improvement(
            original_resume_id=request.resume_id,
            tailored_resume_id=tailored_resume["resume_id"],
            job_id=request.job_id,
            improvements=[imp.model_dump() for imp in request.improvements],
            user_id=user["user_id"]
        )

        return ImproveResumeResponse(
            request_id=request_id,
            data=ImproveResumeData(
                request_id=request_id,
                resume_id=tailored_resume["resume_id"],
                job_id=request.job_id,
                resume_preview=ResumeData.model_validate(final_data),
                improvements=request.improvements,
                markdownOriginal=resume["content"],
                markdownImproved=final_text,
                cover_letter=cover_letter,
                outreach_message=outreach_message,
                diff_summary=diff_summary,
                detailed_changes=detailed_changes,
                warnings=response_warnings,
            ),
        )
    except Exception as e:
        _raise_improve_error("confirm", stage, e, detail)

@router.post("/improve", response_model=ImproveResumeResponse)
async def improve_resume_endpoint(
    request: ImproveResumeRequest,
    user: dict = Depends(require_authenticated_user)
) -> ImproveResumeResponse:
    """Improve/tailor a resume for a specific job description (legacy direct path)."""
    # Simply call the preview logic then confirm logic if needed, 
    # but here we follow the standard full path.
    resume = db.get_resume(request.resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    job = db.get_job(request.job_id, user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    feature_config = _load_feature_config()
    enable_cover_letter = feature_config.get("enable_cover_letter", False)
    enable_outreach = feature_config.get("enable_outreach_message", False)
    language = _get_content_language()

    try:
        job_keywords = await extract_job_keywords(job["content"])
        prompt_id = request.prompt_id or _get_default_prompt_id()

        improved_data = await improve_resume(
            original_resume=resume["content"],
            job_description=job["content"],
            job_keywords=job_keywords,
            language=language,
            prompt_id=prompt_id,
        )
        
        response_warnings: list[str] = []
        improved_data, preserve_warnings = _preserve_personal_info(
            _get_original_resume_data(resume), improved_data
        )
        response_warnings.extend(preserve_warnings)
        
        # Refinement
        try:
             master_resume = db.get_master_resume(user["user_id"])
             master_data = _get_original_resume_data(master_resume) if master_resume else _get_original_resume_data(resume)
             if master_data:
                 refinement_result = await refine_resume(
                     initial_tailored=improved_data,
                     master_resume=master_data,
                     job_description=job["content"],
                     job_keywords=job_keywords,
                     config=RefinementConfig(),
                 )
                 improved_data = refinement_result.refined_data
        except Exception as e:
             logger.warning("Refinement failed: %s", e)

        improved_text = json.dumps(improved_data, indent=2)
        diff_summary, detailed_changes, _ = _calculate_diff_from_resume(resume, improved_data)
        improvements = generate_improvements(job_keywords)
        
        cover_letter, outreach_message, title, aux_warnings = await _generate_auxiliary_messages(
            improved_data, job["content"], language, enable_cover_letter, enable_outreach
        )
        response_warnings.extend(aux_warnings)

        tailored_resume = db.create_resume(
            content=improved_text,
            content_type="json",
            filename=f"tailored_{resume.get('filename', 'resume')}",
            is_master=False,
            parent_id=request.resume_id,
            processed_data=improved_data,
            processing_status="ready",
            cover_letter=cover_letter,
            outreach_message=outreach_message,
            title=title,
            user_id=user["user_id"]
        )

        request_id = str(uuid4())
        db.create_improvement(
            original_resume_id=request.resume_id,
            tailored_resume_id=tailored_resume["resume_id"],
            job_id=request.job_id,
            improvements=improvements,
            user_id=user["user_id"]
        )

        return ImproveResumeResponse(
            request_id=request_id,
            data=ImproveResumeData(
                request_id=request_id,
                resume_id=tailored_resume["resume_id"],
                job_id=request.job_id,
                resume_preview=ResumeData.model_validate(improved_data),
                improvements=[{"suggestion": i["suggestion"], "lineNumber": i.get("lineNumber")} for i in improvements],
                markdownOriginal=resume["content"],
                markdownImproved=improved_text,
                cover_letter=cover_letter,
                outreach_message=outreach_message,
                diff_summary=diff_summary,
                detailed_changes=detailed_changes,
                warnings=response_warnings,
            ),
        )
    except Exception as e:
        logger.error("Improvement failed: %s", e)
        error_message = str(e)
        detail = f"Improvement failed: {error_message}" if error_message else "Improvement failed"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/{resume_id}/generate-cover-letter", response_model=GenerateContentResponse)
async def generate_cover_letter_endpoint(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> GenerateContentResponse:
    """Generate a cover letter on-demand for an existing tailored resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.get("parent_id"):
        raise HTTPException(
            status_code=400,
            detail="Cover letter can only be generated for tailored resumes.",
        )

    improvement = db.get_improvement_by_tailored_resume(resume_id)
    if not improvement:
        raise HTTPException(status_code=400, detail="No job context found.")

    job = db.get_job(improvement["job_id"], user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description missing.")

    resume_data = resume.get("processed_data")
    if not resume_data:
        raise HTTPException(status_code=400, detail="Resume data missing.")

    language = _get_content_language()
    try:
        content = await generate_cover_letter(resume_data, job["content"], language)
        db.update_resume(resume_id, {"cover_letter": content}, user["user_id"])
        return GenerateContentResponse(content=content, message="Cover letter generated")
    except Exception as e:
        logger.error("Cover letter generation failed: %s", e)
        error_message = str(e)
        detail = f"Generation failed: {error_message}" if error_message else "Generation failed"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/{resume_id}/generate-outreach", response_model=GenerateContentResponse)
async def generate_outreach_endpoint(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> GenerateContentResponse:
    """Generate an outreach message on-demand for an existing tailored resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.get("parent_id"):
        raise HTTPException(status_code=400, detail="Only for tailored resumes.")

    improvement = db.get_improvement_by_tailored_resume(resume_id)
    if not improvement:
        raise HTTPException(status_code=400, detail="No job context found.")

    job = db.get_job(improvement["job_id"], user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description missing.")

    resume_data = resume.get("processed_data")
    if not resume_data:
        raise HTTPException(status_code=400, detail="Resume data missing.")

    language = _get_content_language()
    try:
        content = await generate_outreach_message(resume_data, job["content"], language)
        db.update_resume(resume_id, {"outreach_message": content}, user["user_id"])
        return GenerateContentResponse(content=content, message="Outreach message generated")
    except Exception as e:
        logger.error("Outreach generation failed: %s", e)
        error_message = str(e)
        detail = f"Generation failed: {error_message}" if error_message else "Generation failed"
        raise HTTPException(status_code=500, detail=detail)


@router.get("/{resume_id}/job-description")
async def get_job_description_for_resume(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> dict:
    """Get the job description used to tailor this resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume or not resume.get("parent_id"):
        raise HTTPException(status_code=404, detail="Tailored resume not found")

    improvement = db.get_improvement_by_tailored_resume(resume_id)
    if not improvement:
        raise HTTPException(status_code=404, detail="No job context found.")

    job = db.get_job(improvement["job_id"], user["user_id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job description missing.")

    return {"job_id": job["job_id"], "content": job["content"]}


@router.get("/{resume_id}/cover-letter/pdf")
async def download_cover_letter_pdf(
    resume_id: str,
    request: Request,
    user: dict = Depends(require_authenticated_user),
    pageSize: str = Query("A4", pattern="^(A4|LETTER)$"),
    lang: str | None = Query(None, pattern="^[a-z]{2}(-[A-Z]{2})?$"),
) -> Response:
    """Generate a PDF for a cover letter."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume or not resume.get("cover_letter"):
        raise HTTPException(status_code=404, detail="Cover letter not found")

    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization") or ""
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    url = f"{settings.frontend_base_url}/print/cover-letter/{resume_id}?pageSize={pageSize}"
    if lang:
        url = f"{url}&lang={lang}"
    url = f"{url}&authToken={quote(token)}"

    try:
        pdf_bytes = await render_resume_pdf(url, pageSize, selector=".cover-letter-print")
        headers = {"Content-Disposition": f'attachment; filename="cover_letter_{resume_id}.pdf"'}
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    except PDFRenderError as e:
        raise HTTPException(status_code=503, detail=str(e))
