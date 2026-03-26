import logging
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response

from app.database import db
from app.pdf import render_resume_pdf, PDFRenderError
from app.config import settings
from app.services.docx_generator import generate_resume_docx
from app.auth.dependencies import require_authenticated_user
from app.storage.s3 import build_resume_s3_key, upload_bytes_to_s3
from urllib.parse import quote

logger = logging.getLogger(__name__)
from app.schemas import (
    ResumeData,
    ResumeFetchData,
    ResumeFetchResponse,
    ResumeListResponse,
    ResumeSummary,
    ResumeUploadResponse,
    RawResume,
    UpdateCoverLetterRequest,
    UpdateOutreachMessageRequest,
    UpdateTitleRequest,
    normalize_resume_data,
)
from app.services.parser import parse_document, parse_resume_to_json
from app.utils.file_utils import generate_resume_filename


# Endpoints for tailoring, cover letters, and outreach were migrated to resume_builder.py

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 4 * 1024 * 1024  # 4MB


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user: dict = Depends(require_authenticated_user)
) -> ResumeUploadResponse:
    """Upload and process a resume file (PDF/DOCX).

    Converts the file to Markdown and stores it in the database.
    Optionally parses to structured JSON if LLM is configured.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: PDF, DOC, DOCX",
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Convert to markdown
    try:
        markdown_content = await parse_document(content, file.filename or "resume.pdf")
    except Exception as e:
        logger.error(f"Document parsing failed: {e}")
        raise HTTPException(
            status_code=422,
            detail="Failed to parse document. Please ensure it's a valid PDF or DOCX file.",
        )

    # Store in database first with "processing" status (atomic master assignment)
    resume = await db.create_resume_atomic_master(
        content=markdown_content,
        content_type="md",
        filename=file.filename,
        processed_data=None,
        processing_status="processing",
        user_id=user["user_id"],
    )

    # Upload the original resume file to S3 and store only the object key in Mongo.
    # This keeps the DB small and avoids persisting presigned URLs.
    try:
        user_id = user["user_id"]
        original_filename = file.filename or f"{resume['resume_id']}.resume"
        s3_key = build_resume_s3_key(
            user_id=user_id,
            resume_id=resume["resume_id"],
            filename=original_filename,
        )
        upload_bytes_to_s3(
            key=s3_key,
            data=content,
            content_type=file.content_type,
        )
        db.update_resume(resume["resume_id"], {"s3_key": s3_key}, user["user_id"])
    except Exception as e:
        # Don't fail the whole upload if S3 is temporarily unavailable.
        logger.error("Failed to upload resume to S3: %s", e)

    # Try to parse to structured JSON (optional, may fail if LLM not configured)
    try:
        processed_data = await parse_resume_to_json(markdown_content)
        db.update_resume(
            resume["resume_id"],
            {
                "processed_data": processed_data,
                "processing_status": "ready",
            },
            user["user_id"],
        )
        resume["processed_data"] = processed_data
        resume["processing_status"] = "ready"
    except Exception as e:
        # LLM parsing failed, update status to failed
        logger.warning(f"Resume parsing to JSON failed for {file.filename}: {e}")
        db.update_resume(resume["resume_id"], {"processing_status": "failed"}, user["user_id"])
        resume["processing_status"] = "failed"

    # Return accurate status to client (API-001 fix)
    return ResumeUploadResponse(
        message=(
            f"File {file.filename} uploaded successfully"
            if resume["processing_status"] == "ready"
            else f"File {file.filename} uploaded but parsing failed"
        ),
        request_id=str(uuid4()),
        resume_id=resume["resume_id"],
        processing_status=resume["processing_status"],
        is_master=resume.get("is_master", False),
    )


@router.get("", response_model=ResumeFetchResponse)
async def get_resume(
    resume_id: str = Query(...),
    user: dict = Depends(require_authenticated_user)
) -> ResumeFetchResponse:
    """Fetch resume details by ID.

    Returns both raw markdown and structured data (if available),
    plus cover letter and outreach message if they exist.
    Applies lazy migration for section metadata if needed.
    """
    resume = db.get_resume(resume_id, user["user_id"])

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get processing status (default to "pending" for old records)
    processing_status = resume.get("processing_status", "pending")

    # Build response
    raw_resume = RawResume(
        id=None,  # TinyDB doesn't have numeric IDs like SQL
        content=resume["content"],
        content_type=resume["content_type"],
        created_at=resume["created_at"],
        processing_status=processing_status,
    )

    # Get processed data if available (no more on-demand parsing)
    processed_data = resume.get("processed_data")

    # Apply lazy migration - add section metadata to old resumes
    if processed_data:
        processed_data = normalize_resume_data(processed_data)

    processed_resume = (
        ResumeData.model_validate(processed_data) if processed_data else None
    )

    return ResumeFetchResponse(
        request_id=str(uuid4()),
        data=ResumeFetchData(
            resume_id=resume_id,
            raw_resume=raw_resume,
            processed_resume=processed_resume,
            cover_letter=resume.get("cover_letter"),
            outreach_message=resume.get("outreach_message"),
            parent_id=resume.get("parent_id"),
            title=resume.get("title"),
        ),
    )


@router.get("/list", response_model=ResumeListResponse)
async def list_resumes(
    include_master: bool = Query(False),
    user: dict = Depends(require_authenticated_user)
) -> ResumeListResponse:
    """List resumes, optionally including the master resume."""
    resumes = db.list_resumes(user["user_id"])
    if not include_master:
        resumes = [resume for resume in resumes if not resume.get("is_master", False)]

    resumes.sort(key=lambda item: item.get("updated_at", ""), reverse=True)

    summaries = [
        ResumeSummary(
            resume_id=resume["resume_id"],
            filename=resume.get("filename"),
            is_master=resume.get("is_master", False),
            master_category=resume.get("master_category"),
            parent_id=resume.get("parent_id"),
            processing_status=resume.get("processing_status", "pending"),
            created_at=resume.get("created_at", ""),
            updated_at=resume.get("updated_at", ""),
            title=resume.get("title"),
        )
        for resume in resumes
    ]

    return ResumeListResponse(request_id=str(uuid4()), data=summaries)




@router.patch("/{resume_id}", response_model=ResumeFetchResponse)
async def update_resume_endpoint(
    resume_id: str,
    resume_data: ResumeData,
    user: dict = Depends(require_authenticated_user)
) -> ResumeFetchResponse:
    """Update a resume with new structured data."""
    existing = db.get_resume(resume_id, user["user_id"])
    if not existing:
        raise HTTPException(status_code=404, detail="Resume not found")

    updated_data = resume_data.model_dump()
    updated_content = json.dumps(updated_data, indent=2)

    updated = db.update_resume(
        resume_id,
        {
            "content": updated_content,
            "content_type": "json",
            "processed_data": updated_data,
            "processing_status": "ready",
        },
    )

    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update resume")

    raw_resume = RawResume(
        id=None,
        content=updated["content"],
        content_type=updated["content_type"],
        created_at=updated["created_at"],
        processing_status=updated.get("processing_status", "pending"),
    )

    processed_resume = (
        ResumeData.model_validate(updated.get("processed_data"))
        if updated.get("processed_data")
        else None
    )

    return ResumeFetchResponse(
        request_id=str(uuid4()),
        data=ResumeFetchData(
            resume_id=resume_id,
            raw_resume=raw_resume,
            processed_resume=processed_resume,
        ),
    )


@router.get("/{resume_id}/pdf")
async def download_resume_pdf(
    resume_id: str,
    request: Request,
    user: dict = Depends(require_authenticated_user),
    template: str = Query("swiss-single"),
    pageSize: str = Query("A4", pattern="^(A4|LETTER)$"),
    marginTop: int = Query(10, ge=5, le=25),
    marginBottom: int = Query(10, ge=5, le=25),
    marginLeft: int = Query(10, ge=5, le=25),
    marginRight: int = Query(10, ge=5, le=25),
    sectionSpacing: int = Query(3, ge=1, le=5),
    itemSpacing: int = Query(2, ge=1, le=5),
    lineHeight: int = Query(3, ge=1, le=5),
    fontSize: int = Query(3, ge=1, le=5),
    headerScale: int = Query(3, ge=1, le=5),
    headerFont: str = Query("serif", pattern="^(serif|sans-serif|mono)$"),
    bodyFont: str = Query("sans-serif", pattern="^(serif|sans-serif|mono)$"),
    compactMode: bool = Query(False),
    showContactIcons: bool = Query(False),
    accentColor: str = Query("blue", pattern="^(blue|green|orange|red)$"),
    lang: str | None = Query(None, pattern="^[a-z]{2}(-[A-Z]{2})?$"),
) -> Response:
    """Generate a PDF for a resume using headless Chromium.

    Accepts template settings for customization:
    - template: swiss-single, swiss-two-column, modern, modern-two-column, or classic-ats
    - pageSize: A4 or LETTER
    - marginTop/Bottom/Left/Right: page margins in mm (5-25)
    - sectionSpacing: gap between sections (1-5)
    - itemSpacing: gap between items (1-5)
    - lineHeight: text line height (1-5)
    - fontSize: base font size (1-5)
    - headerScale: header size scale (1-5)
    - headerFont: serif, sans-serif, or mono
    - bodyFont: serif, sans-serif, or mono
    - compactMode: enable tighter spacing
    - showContactIcons: show icons in contact info
    - lang: locale used for print page translations
    """
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Build print URL with all settings
    params = (
        f"template={template}"
        f"&pageSize={pageSize}"
        f"&marginTop={marginTop}"
        f"&marginBottom={marginBottom}"
        f"&marginLeft={marginLeft}"
        f"&marginRight={marginRight}"
        f"&sectionSpacing={sectionSpacing}"
        f"&itemSpacing={itemSpacing}"
        f"&lineHeight={lineHeight}"
        f"&fontSize={fontSize}"
        f"&headerScale={headerScale}"
        f"&headerFont={headerFont}"
        f"&bodyFont={bodyFont}"
        f"&compactMode={str(compactMode).lower()}"
        f"&showContactIcons={str(showContactIcons).lower()}"
        f"&accentColor={accentColor}"
    )
    if lang:
        params = f"{params}&lang={lang}"

    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization") or ""
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    params = f"{params}&authToken={quote(token)}"
    url = f"{settings.frontend_base_url}/print/resumes/{resume_id}?{params}"

    # Use the exact margins provided; compact mode only affects spacing.
    pdf_margins = {
        "top": marginTop,
        "right": marginRight,
        "bottom": marginBottom,
        "left": marginLeft,
    }

    # Render PDF with margins applied to every page
    try:
        pdf_bytes = await render_resume_pdf(url, pageSize, margins=pdf_margins)
    except PDFRenderError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Get the processed resume data for filename generation
    resume_data = resume.get("processed_data", {})
    if not resume_data:
        # Try to parse from content if no processed data
        raw_content = resume.get("content", "")
        if raw_content:
            try:
                resume_data = json.loads(raw_content)
            except json.JSONDecodeError:
                resume_data = {}
    
    # Debug: log what we're getting
    logger.debug(f"Resume data for filename: {resume_data.get('personalInfo', {})}")
    
    # Generate filename
    filename = generate_resume_filename(resume_data, "pdf")
    logger.info(f"Generated filename: {filename}")
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.post("/{resume_id}/pdf/save")
async def save_resume_pdf(
    resume_id: str,
    request: Request,
    user: dict = Depends(require_authenticated_user),
    template: str = Query("swiss-single"),
    pageSize: str = Query("A4", pattern="^(A4|LETTER)$"),
    marginTop: int = Query(10, ge=5, le=25),
    marginBottom: int = Query(10, ge=5, le=25),
    marginLeft: int = Query(10, ge=5, le=25),
    marginRight: int = Query(10, ge=5, le=25),
    sectionSpacing: int = Query(3, ge=1, le=5),
    itemSpacing: int = Query(2, ge=1, le=5),
    lineHeight: int = Query(3, ge=1, le=5),
    fontSize: int = Query(3, ge=1, le=5),
    headerScale: int = Query(3, ge=1, le=5),
    headerFont: str = Query("serif", pattern="^(serif|sans-serif|mono)$"),
    bodyFont: str = Query("sans-serif", pattern="^(serif|sans-serif|mono)$"),
    compactMode: bool = Query(False),
    showContactIcons: bool = Query(False),
    accentColor: str = Query("blue", pattern="^(blue|green|orange|red)$"),
    lang: str | None = Query(None, pattern="^[a-z]{2}(-[A-Z]{2})?$"),
) -> dict[str, str]:
    """Save a PDF for a resume to the outputs directory.

    Accepts the same template settings as the download endpoint.
    Saves the PDF to the backend's outputs directory and returns the file path.
    """
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Build print URL with all settings
    params = (
        f"template={template}"
        f"&pageSize={pageSize}"
        f"&marginTop={marginTop}"
        f"&marginBottom={marginBottom}"
        f"&marginLeft={marginLeft}"
        f"&marginRight={marginRight}"
        f"&sectionSpacing={sectionSpacing}"
        f"&itemSpacing={itemSpacing}"
        f"&lineHeight={lineHeight}"
        f"&fontSize={fontSize}"
        f"&headerScale={headerScale}"
        f"&headerFont={headerFont}"
        f"&bodyFont={bodyFont}"
        f"&compactMode={str(compactMode).lower()}"
        f"&showContactIcons={str(showContactIcons).lower()}"
        f"&accentColor={accentColor}"
    )
    if lang:
        params = f"{params}&lang={lang}"

    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization") or ""
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    params = f"{params}&authToken={quote(token)}"
    url = f"{settings.frontend_base_url}/print/resumes/{resume_id}?{params}"

    # Use the exact margins provided
    pdf_margins = {
        "top": marginTop,
        "right": marginRight,
        "bottom": marginBottom,
        "left": marginLeft,
    }

    # Render PDF
    try:
        pdf_bytes = await render_resume_pdf(url, pageSize, margins=pdf_margins)
    except PDFRenderError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Get the processed resume data for filename generation
    resume_data = resume.get("processed_data", {})
    if not resume_data:
        raw_content = resume.get("content", "")
        if raw_content:
            try:
                resume_data = json.loads(raw_content)
            except json.JSONDecodeError:
                resume_data = {}
    
    # Generate filename
    filename = generate_resume_filename(resume_data, "pdf")
    
    # Create outputs directory if it doesn't exist
    outputs_dir = Path("outputs")
    outputs_dir.mkdir(exist_ok=True)
    
    # Save PDF to outputs directory
    output_path = outputs_dir / filename
    output_path.write_bytes(pdf_bytes)
    
    logger.info(f"Saved resume PDF to: {output_path.absolute()}")
    
    return {
        "message": "Resume PDF saved successfully",
        "filename": filename,
        "path": str(output_path.absolute())
    }


@router.get("/{resume_id}/docx")
async def download_resume_docx(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> Response:
    """Generate a DOCX file for a resume.
    
    Returns an editable Microsoft Word document (.docx) containing
    the resume data. Users can download and edit this file directly.
    """
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get the processed resume data
    resume_data = resume.get("processed_data", {})
    if not resume_data:
        # Try to parse from content if no processed data
        raw_content = resume.get("raw_resume", {}).get("content", "")
        if raw_content:
            try:
                resume_data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400, 
                    detail="Resume data is not in a format that can be converted to DOCX"
                )
        else:
            raise HTTPException(status_code=404, detail="Resume data not available")
    
    try:
        docx_bytes = generate_resume_docx(resume_data)
    except Exception as e:
        logger.error(f"Failed to generate DOCX for resume {resume_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate Word document")
    
    # Generate filename
    filename = generate_resume_filename(resume_data, "docx")
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    
    return Response(
        content=docx_bytes, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> dict:
    """Delete a resume by ID."""
    if not db.delete_resume(resume_id, user["user_id"]):
        raise HTTPException(status_code=404, detail="Resume not found")

    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/retry-processing", response_model=ResumeUploadResponse)
async def retry_processing(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> ResumeUploadResponse:
    """Retry AI processing for a failed resume.

    Re-runs parse_resume_to_json() on the stored markdown content.
    Only works for resumes with processing_status == "failed".
    """
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.get("processing_status") != "failed":
        raise HTTPException(
            status_code=400,
            detail="Only resumes with 'failed' processing status can be retried.",
        )

    markdown_content = resume.get("content", "")
    if not markdown_content:
        raise HTTPException(
            status_code=400,
            detail="Resume has no stored content to re-process.",
        )

    try:
        processed_data = await parse_resume_to_json(markdown_content)
        db.update_resume(
            resume_id,
            {
                "processed_data": processed_data,
                "processing_status": "ready",
            },
        )
        return ResumeUploadResponse(
            message="Resume processing succeeded on retry",
            request_id=str(uuid4()),
            resume_id=resume_id,
            processing_status="ready",
            is_master=resume.get("is_master", False),
        )
    except Exception as e:
        logger.warning(f"Retry processing failed for resume {resume_id}: {e}")
        db.update_resume(resume_id, {"processing_status": "failed"})
        return ResumeUploadResponse(
            message="Retry processing failed",
            request_id=str(uuid4()),
            resume_id=resume_id,
            processing_status="failed",
            is_master=resume.get("is_master", False),
        )


@router.patch("/{resume_id}/cover-letter")
async def update_cover_letter(
    resume_id: str,
    request: UpdateCoverLetterRequest,
    user: dict = Depends(require_authenticated_user)
) -> dict:
    """Update the cover letter for a resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.update_resume(resume_id, {"cover_letter": request.content})
    return {"message": "Cover letter updated successfully"}


@router.patch("/{resume_id}/outreach-message")
async def update_outreach_message(
    resume_id: str,
    request: UpdateOutreachMessageRequest,
    user: dict = Depends(require_authenticated_user)
) -> dict:
    """Update the outreach message for a resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.update_resume(resume_id, {"outreach_message": request.content})
    return {"message": "Outreach message updated successfully"}


@router.patch("/{resume_id}/title")
async def update_title(
    resume_id: str,
    request: UpdateTitleRequest,
    user: dict = Depends(require_authenticated_user)
) -> dict:
    """Update the title for a resume."""
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    title = request.title.strip()[:80]
    db.update_resume(resume_id, {"title": title})
    return {"message": "Title updated successfully"}



# ============================================================================
# Master Resume Management Endpoints
# ============================================================================

@router.get("/masters")
async def list_master_resumes(
    user: dict = Depends(require_authenticated_user)
) -> dict[str, Any]:
    """List all master resumes with their categories.
    
    Returns:
        Dictionary with list of master resumes, each containing:
        - resume_id: Resume ID
        - master_category: Category name (None for default master)
        - filename: Original filename
        - title: Resume title
        - created_at: Creation timestamp
        - processed_data: Resume data (personalInfo for display)
    """
    masters = db.list_master_resumes(user["user_id"])
    
    # Format response with relevant fields
    formatted_masters = []
    for master in masters:
        formatted_masters.append({
            "resume_id": master.get("resume_id"),
            "master_category": master.get("master_category"),
            "filename": master.get("filename"),
            "title": master.get("title"),
            "created_at": master.get("created_at"),
            "personal_info": master.get("processed_data", {}).get("personalInfo", {}),
        })
    
    return {
        "masters": formatted_masters,
        "count": len(formatted_masters),
    }


@router.put("/{resume_id}/master")
async def set_resume_as_master(
    resume_id: str,
    category: str | None = Query(None, description="Master category name (e.g., 'Software Engineer', 'Data Scientist'). Leave empty for default master."),
    user: dict = Depends(require_authenticated_user)
) -> dict[str, Any]:
    """Set a resume as master for a specific category.
    
    Args:
        resume_id: Resume ID to set as master
        category: Optional category name. If not provided, sets as default master.
    
    Returns:
        Success message with category info
    
    Note:
        This will unset any existing master for the same category.
    """
    # Validate resume exists
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Validate category name if provided
    if category:
        category = category.strip()
        if len(category) > 50:
            raise HTTPException(status_code=400, detail="Category name too long (max 50 characters)")
        if not category:
            category = None
    
    # Set as master
    success = db.set_master_resume(resume_id, category, user["user_id"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to set master resume")
    
    category_display = category if category else "Default"
    return {
        "message": f"Resume set as master for category: {category_display}",
        "resume_id": resume_id,
        "master_category": category,
    }


@router.delete("/{resume_id}/master")
async def unset_resume_as_master(
    resume_id: str,
    user: dict = Depends(require_authenticated_user)
) -> dict[str, Any]:
    """Remove master status from a resume.
    
    Args:
        resume_id: Resume ID to unset as master
    
    Returns:
        Success message
    """
    # Validate resume exists and is a master
    resume = db.get_resume(resume_id, user["user_id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if not resume.get("is_master"):
        raise HTTPException(status_code=400, detail="Resume is not a master")
    
    # Unset master status
    category = resume.get("master_category")
    success = db.unset_master_resume(category, user["user_id"])
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to unset master resume")
    
    return {
        "message": "Master status removed",
        "resume_id": resume_id,
    }


@router.get("/master")
async def get_master_resume(
    category: str | None = Query(None, description="Master category name. Leave empty for default master."),
    user: dict = Depends(require_authenticated_user)
) -> dict[str, Any]:
    """Get the master resume for a specific category.
    
    Args:
        category: Optional category name. If not provided, returns default master.
    
    Returns:
        Master resume data or 404 if not found
    """
    master = db.get_master_resume(category, user["user_id"])
    
    if not master:
        category_display = category if category else "default"
        raise HTTPException(
            status_code=404,
            detail=f"No master resume found for category: {category_display}"
        )
    
    return {
        "resume_id": master.get("resume_id"),
        "master_category": master.get("master_category"),
        "filename": master.get("filename"),
        "title": master.get("title"),
        "created_at": master.get("created_at"),
        "processed_data": master.get("processed_data"),
    }
