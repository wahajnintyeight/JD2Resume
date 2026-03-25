"""Improvement repository for MongoDB operations."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.repositories.base import get_collection


class ImprovementRepository:
    """Repository for improvement operations."""

    def __init__(self):
        self.collection = get_collection("improvements")

    async def create(
        self,
        user_id: str,
        original_resume_id: str,
        tailored_resume_id: str,
        job_id: str,
        improvements: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Create an improvement record."""
        request_id = str(uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "request_id": request_id,
            "user_id": user_id,
            "original_resume_id": original_resume_id,
            "tailored_resume_id": tailored_resume_id,
            "job_id": job_id,
            "improvements": improvements,
            "created_at": now,
        }

        await self.collection.insert_one(doc)
        return doc

    async def get_by_tailored_resume(
        self, tailored_resume_id: str, user_id: str
    ) -> dict[str, Any] | None:
        """Get improvement record by tailored resume ID for specific user."""
        return await self.collection.find_one({
            "tailored_resume_id": tailored_resume_id,
            "user_id": user_id
        })

    async def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """List all improvements for a user."""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)
