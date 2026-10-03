"""Validate and persist agent-authored drafts; MCP never invokes an LLM provider."""

import hashlib
import json
from typing import Any, Literal
from urllib.parse import urlencode
from uuid import uuid4

from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.database import db
from app.pdf import render_resume_pdf
from app.routers.resume_builder import (
    _apply_change_decisions,
    _get_original_resume_data,
    _validate_confirm_payload,
)
from app.schemas import ResumeData, ResumeFieldDiff
from app.services.improver import calculate_resume_diff
from app.storage.s3 import (
    build_resume_s3_key,
    generate_presigned_get_url,
    upload_bytes_to_s3,
)
from app.utils.file_utils import generate_resume_filename


def resume_fingerprint(resume: dict[str, Any]) -> str:
    """Detect edits to the source between context retrieval and confirmation."""
    content = json.dumps(
        [resume.get("content"), resume.get("processed_data")],
        sort_keys=True,
        ensure_ascii=False,
        default=str,
    )
    return hashlib.sha256(content.encode()).hexdigest()


def load_preview(preview_id: str, user: dict[str, Any]) -> dict[str, Any]:
    job = db.get_job(preview_id, user["user_id"])
    if not job or not job.get("mcp_source_hash"):
        raise ValueError(
            "Tailoring context not found. Call get_tailoring_context first."
        )
    resume = db.get_resume(job["resume_id"], user["user_id"])
    if not resume or resume_fingerprint(resume) != job["mcp_source_hash"]:
        raise ValueError("Source resume changed. Get a new context before saving.")
    return job


async def get_context(
    resume_id: str,
    job_description: str,
    user: dict[str, Any],
) -> dict[str, Any]:
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume or resume.get("processing_status") != "ready":
        raise ValueError("Select a ready resume from list_my_resumes first.")
    if not 50 <= len(job_description.strip()) <= settings.max_jd_length:
        raise ValueError(
            f"Job description must contain 50-{settings.max_jd_length} characters."
        )
    original = ResumeData.model_validate(_get_original_resume_data(resume)).model_dump(
        mode="json"
    )
    job = db.create_job(job_description.strip(), resume_id, user["user_id"])
    revision = str(uuid4())
    db.update_job(
        job["job_id"],
        {
            "mcp_preview_revision": revision,
            "mcp_source_hash": resume_fingerprint(resume),
        },
        user["user_id"],
    )
    return {
        "preview_id": job["job_id"],
        "preview_revision": revision,
        "resume_id": resume_id,
        "original_resume": original,
        "job_description": job_description.strip(),
        "instructions": "You are the tailoring LLM. Author a complete improved_data draft from this source and JD. Preserve contact details and factual credentials. Never invent skills, tenure, metrics or work eligibility. Submit it to preview_tailor_resume, show edits and ask for suggestions or approval.",
    }


async def preview_tailoring(
    preview_id: str,
    preview_revision: str,
    improved_data: ResumeData,
    title: str,
    improvements: list[str],
    cover_letter: str | None,
    outreach_message: str | None,
    user: dict[str, Any],
) -> dict[str, Any]:
    """Validate a complete draft supplied by the calling assistant and calculate its diff."""
    job = load_preview(preview_id, user)
    if job.get("mcp_saved_resume_id"):
        raise ValueError(
            "This preview was already saved. Get a new context to revise it."
        )
    if job.get("mcp_preview_revision") != preview_revision:
        raise ValueError("Preview changed. Review the latest revision first.")
    original = _get_original_resume_data(
        db.get_resume(job["resume_id"], user["user_id"])
    )
    data = improved_data.model_dump(mode="json")
    _validate_confirm_payload(original, data)
    summary, changes = calculate_resume_diff(original, data)
    payload = {
        "resume_preview": data,
        "title": title,
        "improvements": [{"suggestion": item} for item in improvements],
        "cover_letter": cover_letter,
        "outreach_message": outreach_message,
        "diff_summary": summary.model_dump(mode="json"),
        "detailed_changes": [change.model_dump(mode="json") for change in changes],
        "warnings": [
            "Review the complete draft and any optional letters; the field diff may omit custom sections or section ordering."
        ],
    }
    revision = str(uuid4())
    if not db.claim_mcp_preview(preview_id, preview_revision, user["user_id"]):
        raise ValueError(
            "Preview changed or is being saved. Review the latest revision first."
        )
    db.update_job(
        preview_id,
        {
            "mcp_preview": payload,
            "mcp_preview_revision": revision,
            "mcp_busy": False,
        },
        user["user_id"],
    )
    return {"preview_id": preview_id, "preview_revision": revision, **payload}


async def confirm_tailoring(
    preview_id: str,
    preview_revision: str,
    approved: bool,
    rejected_change_indices: list[int],
    user: dict[str, Any],
) -> dict[str, Any]:
    if not approved:
        raise ValueError(
            "Ask the user to review and approve the current preview before saving."
        )
    job = load_preview(preview_id, user)
    if job.get("mcp_preview_revision") != preview_revision:
        raise ValueError(
            "Preview changed. Review and approve the latest revision first."
        )
    if job.get("mcp_saved_resume_id"):
        return {"resume_id": job["mcp_saved_resume_id"], "already_saved": True}
    if not job.get("mcp_preview"):
        raise ValueError("Submit and review a draft before saving.")
    payload = job["mcp_preview"]
    changes = [
        ResumeFieldDiff.model_validate(change) for change in payload["detailed_changes"]
    ]
    if any(index < 0 or index >= len(changes) for index in rejected_change_indices):
        raise ValueError("Rejected change index is outside the displayed preview.")
    source = db.get_resume(job["resume_id"], user["user_id"])
    original = _get_original_resume_data(source)
    decisions = {
        i: "rejected" if i in rejected_change_indices else "accepted"
        for i in range(len(changes))
    }
    final, warnings = _apply_change_decisions(
        original, payload["resume_preview"], changes, decisions
    )
    final = ResumeData.model_validate(final).model_dump(mode="json")
    _validate_confirm_payload(original, final)
    if not db.claim_mcp_preview(preview_id, preview_revision, user["user_id"]):
        raise ValueError(
            "Preview changed or is being saved. Retry after the current operation finishes."
        )
    # Keep the claim on uncertain writes to prevent duplicate saves on retries.
    saved = db.create_resume(
        content=json.dumps(final, ensure_ascii=False, indent=2),
        content_type="json",
        filename=f"tailored_{source.get('filename', 'resume')}",
        is_master=False,
        parent_id=job["resume_id"],
        processed_data=final,
        processing_status="ready",
        cover_letter=payload.get("cover_letter"),
        outreach_message=payload.get("outreach_message"),
        title=payload.get("title"),
        user_id=user["user_id"],
    )
    db.create_improvement(
        original_resume_id=job["resume_id"],
        tailored_resume_id=saved["resume_id"],
        job_id=preview_id,
        improvements=payload["improvements"],
        user_id=user["user_id"],
    )
    db.update_job(
        preview_id,
        {"mcp_saved_resume_id": saved["resume_id"], "mcp_busy": False},
        user["user_id"],
    )
    return {"resume_id": saved["resume_id"], "warnings": warnings}


async def export_pdfs(
    resume_id: str,
    token: str,
    user: dict[str, Any],
    template: Literal[
        "swiss-single", "swiss-two-column", "modern", "modern-two-column", "classic-ats"
    ],
    page_size: Literal["A4", "LETTER"],
    include_cover_letter: bool,
) -> dict[str, Any]:
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume or not resume.get("parent_id"):
        raise ValueError("Select a saved tailored resume before exporting PDFs.")
    exports = [
        (
            "resume",
            "resumes",
            ".resume-print",
            generate_resume_filename(resume["processed_data"], "pdf"),
        )
    ]
    if include_cover_letter:
        if not resume.get("cover_letter"):
            raise ValueError(
                "This resume has no cover letter. Export the resume alone."
            )
        exports.append(
            (
                "cover_letter",
                "cover-letter",
                ".cover-letter-print",
                f"cover_letter_{resume_id}.pdf",
            )
        )
    files = []
    for kind, route, selector, filename in exports:
        params = urlencode(
            {"template": template, "pageSize": page_size, "authToken": token}
        )
        url = f"{settings.frontend_base_url}/print/{route}/{resume_id}?{params}"
        pdf = await render_resume_pdf(url, page_size, selector=selector)
        key = build_resume_s3_key(
            user_id=user["user_id"], resume_id=resume_id, filename=filename
        )
        await run_in_threadpool(
            upload_bytes_to_s3, key=key, data=pdf, content_type="application/pdf"
        )
        db.update_resume(resume_id, {f"{kind}_pdf_s3_key": key}, user["user_id"])
        link = await run_in_threadpool(generate_presigned_get_url, key=key)
        files.append(
            {
                "kind": kind,
                "filename": filename,
                "download_url": link,
                "expires_in_seconds": settings.aws_s3_presign_ttl_seconds,
            }
        )
    return {"resume_id": resume_id, "files": files}
