"""MongoDB repositories for multi-tenant data access."""

from app.repositories.resumes import ResumeRepository
from app.repositories.jds import JDRepository
from app.repositories.improvements import ImprovementRepository
from app.repositories.ats_scans import ATSScanRepository
from app.repositories.user_preferences import UserPreferencesRepository

__all__ = [
    "ResumeRepository",
    "JDRepository",
    "ImprovementRepository",
    "ATSScanRepository",
    "UserPreferencesRepository",
]
