"""Health check and status endpoints."""

from fastapi import APIRouter

from app.database import db
from app.llm import check_llm_health, get_llm_config
from app.schemas import HealthResponse, StatusResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    llm_status = await check_llm_health()

    return HealthResponse(
        status="healthy" if llm_status["healthy"] else "degraded",
        llm=llm_status,
    )


@router.get("/status", response_model=StatusResponse)
async def get_status() -> StatusResponse:
    """Get comprehensive application status.

    Returns:
        - LLM configuration status
        - Database connection status
        
    Note: This endpoint does not require authentication and returns
    global system status, not user-specific data.
    """
    config = get_llm_config()
    llm_status = await check_llm_health(config)
    
    # For multi-tenant setup, we don't check user-specific stats in health endpoint
    # Just return basic system health
    db_stats = {
        "total_resumes": 0,
        "total_jobs": 0,
        "total_improvements": 0,
        "has_master_resume": False,
        "master_resume_count": 0,
    }

    return StatusResponse(
        status="ready" if llm_status["healthy"] else "setup_required",
        llm_configured=bool(config.api_key) or config.provider == "ollama",
        llm_healthy=llm_status["healthy"],
        has_master_resume=False,  # Not applicable for multi-tenant
        database_stats=db_stats,
    )
