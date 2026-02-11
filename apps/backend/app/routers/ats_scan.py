"""ATS Scan API endpoints."""

import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from app.database import db
from app.services.ats_scanner import scan_resume_ats
from app.services.ats_applier import apply_ats_suggestions, calculate_ats_diff
from app.pdf import render_resume_pdf
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ats", tags=["ATS Scan"])


class ATSScanRequest(BaseModel):
    """Request model for ATS scan."""
    resume_id: str = Field(..., description="Resume ID to scan")
    job_description: str | None = Field(None, description="Optional job description override")


class ATSScanResponse(BaseModel):
    """Response model for ATS scan results."""
    overall_score: int
    pass_probability: str
    category_scores: dict
    strengths: list[str] = []  # Make optional with default
    weaknesses: list[str] = []  # Make optional with default
    missing_keywords: list[str] = []  # Make optional with default
    recommendations: list[str] = []  # Make optional with default
    knockout_risks: list[str] = []  # Make optional with default
    ats_compatibility: dict = {}  # Make optional with default
    job_description: str | None = None  # Include job description for reference


class ATSApplyPreviewRequest(BaseModel):
    """Request model for previewing ATS suggestions application."""
    resume_id: str = Field(..., description="Resume ID to apply suggestions to")
    ats_results: dict = Field(..., description="ATS scan results containing suggestions")


class ATSApplyPreviewResponse(BaseModel):
    """Response model for ATS apply preview."""
    diff_summary: dict
    detailed_changes: list[dict]
    modified_resume: dict
    original_resume: dict


class ATSApplyConfirmRequest(BaseModel):
    """Request model for confirming ATS suggestions application."""
    resume_id: str = Field(..., description="Resume ID to apply suggestions to")
    modified_resume: dict = Field(..., description="Modified resume data with ATS suggestions applied")


@router.post("/scan", response_model=ATSScanResponse)
async def scan_resume(request: ATSScanRequest):
    """
    Perform deep ATS scan of a resume against its job description.
    
    Analyzes keyword match, experience alignment, technical skills coverage,
    format compatibility, and provides actionable recommendations.
    """
    try:
        # Get resume data
        resume = db.get_resume(request.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Determine job description source
        job_description = None
        
        if request.job_description:
            # Use provided job description
            job_description = request.job_description
        else:
            # Get improvement record to find the job_id
            improvement = db.get_improvement_by_tailored_resume(request.resume_id)
            if not improvement:
                raise HTTPException(
                    status_code=400,
                    detail="No job description found for this resume. Please provide a job description or use a tailored resume."
                )
            
            # Get the job description from database
            job = db.get_job(improvement["job_id"])
            if not job:
                raise HTTPException(
                    status_code=404,
                    detail="Job description not found"
                )
            job_description = job["content"]
        
        # Get parsed resume data
        parsed_data = resume.get("processed_data")
        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet"
            )
        
        # Perform ATS scan
        scan_results = await scan_resume_ats(
            resume_data=parsed_data,
            job_description=job_description
        )
        
        # Ensure all required fields exist with defaults
        scan_results.setdefault("strengths", [])
        scan_results.setdefault("weaknesses", [])
        scan_results.setdefault("missing_keywords", [])
        scan_results.setdefault("recommendations", [])
        scan_results.setdefault("knockout_risks", [])
        scan_results.setdefault("ats_compatibility", {
            "format_issues": [],
            "parsing_risks": [],
            "optimization_tips": []
        })
        
        # Add job description to response for user reference
        scan_results["job_description"] = job_description
        
        # Save scan results to database for PDF generation
        db.save_ats_scan(request.resume_id, scan_results)
        
        return scan_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS scan failed: {e}")
        raise HTTPException(status_code=500, detail=f"ATS scan failed: {str(e)}")


@router.get("/scan/{resume_id}/cached", response_model=ATSScanResponse)
async def get_cached_ats_scan(resume_id: str):
    """
    Get cached ATS scan results for PDF generation.
    
    This endpoint retrieves previously scanned results without re-running the analysis.
    """
    try:
        # Get cached scan results
        scan_results = db.get_ats_scan(resume_id)
        
        if not scan_results:
            raise HTTPException(
                status_code=404,
                detail="No cached ATS scan found. Please run a scan first."
            )
        
        return scan_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve cached ATS scan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scan results: {str(e)}")


@router.get("/scan/{resume_id}/pdf")
async def download_ats_scan_pdf(
    resume_id: str,
    page_size: str = "A4"
):
    """
    Download ATS scan report as PDF.
    
    Renders the ATS scan results page to PDF format.
    """
    try:
        # Verify resume exists and has scan data
        resume = db.get_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        improvement = db.get_improvement_by_tailored_resume(resume_id)
        if not improvement:
            raise HTTPException(
                status_code=400,
                detail="No job description found for this resume. ATS scan is only available for tailored resumes."
            )
        
        # Construct frontend URL for the ATS scan report print view
        frontend_url = f"{settings.frontend_base_url}/print/ats-scan/{resume_id}"
        
        # Render to PDF
        pdf_bytes = await render_resume_pdf(
            url=frontend_url,
            page_size=page_size,
            selector=".ats-report-print",  # CSS selector for the print view
            margins={"top": 10, "right": 10, "bottom": 10, "left": 10}
        )
        
        # Get resume title for filename
        title = resume.get("title", "resume")
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"ATS_Report_{safe_title}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS scan PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/apply/preview", response_model=ATSApplyPreviewResponse)
async def preview_ats_apply(request: ATSApplyPreviewRequest):
    """
    Preview ATS suggestions application to a resume.
    
    Applies ATS scan suggestions to the resume and returns a diff showing
    what changes would be made (title updates, skills additions, synonym fixes).
    """
    try:
        # Get resume data
        resume = db.get_resume(request.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        parsed_data = resume.get("processed_data")
        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet"
            )
        
        # Apply ATS suggestions
        modified_resume = apply_ats_suggestions(
            resume_data=parsed_data,
            ats_results=request.ats_results
        )
        
        # Calculate diff
        diff_summary, detailed_changes = calculate_ats_diff(
            original=parsed_data,
            modified=modified_resume
        )
        
        return ATSApplyPreviewResponse(
            diff_summary=diff_summary,
            detailed_changes=detailed_changes,
            modified_resume=modified_resume,
            original_resume=parsed_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS apply preview failed: {e}")
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {str(e)}")


@router.post("/apply/confirm")
async def confirm_ats_apply(request: ATSApplyConfirmRequest):
    """
    Confirm and apply ATS suggestions to a resume.
    
    Updates the resume with the ATS-suggested changes and saves it to the database.
    """
    try:
        # Get original resume
        resume = db.get_resume(request.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Update the resume with modified data
        db.update_resume(request.resume_id, {"processed_data": request.modified_resume})
        
        logger.info(f"Successfully applied ATS suggestions to resume {request.resume_id}")
        
        return {"message": "ATS suggestions applied successfully", "resume_id": request.resume_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS apply confirmation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply suggestions: {str(e)}")
