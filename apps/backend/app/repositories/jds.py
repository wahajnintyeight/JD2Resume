"""Job description repository for MongoDB operations."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.repositories.base import get_collection


class JDRepository:
    """Repository for job description operations."""

    def __init__(self):
        self.collection = get_collection("jds")

    async def create(self, user_id: str, content: str, resume_id: str | None = None) -> dict[str, Any]:
        """Create a new job description."""
        job_id = str(uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "job_id": job_id,
            "user_id": user_id,
            "content": content,
            "resume_id": resume_id,
            "created_at": now,
        }

        await self.collection.insert_one(doc)
        return doc

    async def get_by_id(self, job_id: str, user_id: str) -> dict[str, Any] | None:
        """Get job description by ID for specific user."""
        return await self.collection.find_one({"job_id": job_id, "user_id": user_id})

    async def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """List all job descriptions for a user."""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)

    async def update(self, job_id: str, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update job description by ID for specific user."""
        result = await self.collection.find_one_and_update(
            {"job_id": job_id, "user_id": user_id},
            {"$set": updates},
            return_document=True,
        )
        return result

    async def delete(self, job_id: str, user_id: str) -> bool:
        """Delete job description by ID for specific user."""
        result = await self.collection.delete_one({"job_id": job_id, "user_id": user_id})
        return result.deleted_count > 0
