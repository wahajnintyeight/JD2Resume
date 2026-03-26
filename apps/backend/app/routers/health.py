"""Health check and status endpoints."""

from fastapi import APIRouter, Depends

from app.database import db
from app.auth.dependencies import require_authenticated_user
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
async def get_status(user: dict = Depends(require_authenticated_user)) -> StatusResponse:
    """Get comprehensive application status including user-specific statistics.

    Returns:
        - LLM configuration status
        - Database connection status
        - User-specific resume/job/improvement counts
    """
    config = get_llm_config()
    llm_status = await check_llm_health(config)
    
    # Fetch real stats from MongoDB for the current user
    db_stats = db.get_stats(user_id=user["user_id"])

    return StatusResponse(
        status="ready" if llm_status["healthy"] else "setup_required",
        llm_configured=bool(config.api_key) or config.provider == "ollama",
        llm_healthy=llm_status["healthy"],
        has_master_resume=db_stats.get("has_master_resume", False),
        database_stats=db_stats,
    )
