"""Resume repository for MongoDB operations."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.repositories.base import get_collection


class ResumeRepository:
    """Repository for resume operations."""

    def __init__(self):
        self.collection = get_collection("resumes")

    async def create(
        self,
        user_id: str,
        content: str,
        content_type: str = "md",
        filename: str | None = None,
        s3_path: str | None = None,
        is_active: bool = False,
        parent_id: str | None = None,
        processed_data: dict[str, Any] | None = None,
        processing_status: str = "pending",
        cover_letter: str | None = None,
        outreach_message: str | None = None,
        title: str | None = None,
    ) -> dict[str, Any]:
        """Create a new resume."""
        resume_id = str(uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "resume_id": resume_id,
            "user_id": user_id,
            "content": content,
            "content_type": content_type,
            "filename": filename,
            "s3_path": s3_path,
            "is_active": is_active,
            "parent_id": parent_id,
            "processed_data": processed_data,
            "processing_status": processing_status,
            "cover_letter": cover_letter,
            "outreach_message": outreach_message,
            "title": title,
            "created_at": now,
            "updated_at": now,
        }

        await self.collection.insert_one(doc)
        return doc

    async def get_by_id(self, resume_id: str, user_id: str) -> dict[str, Any] | None:
        """Get resume by ID for specific user."""
        return await self.collection.find_one({"resume_id": resume_id, "user_id": user_id})

    async def get_active(self, user_id: str) -> dict[str, Any] | None:
        """Get user's active resume."""
        return await self.collection.find_one({"user_id": user_id, "is_active": True})

    async def list_by_user(self, user_id: str, include_active: bool = False) -> list[dict[str, Any]]:
        """List all resumes for a user."""
        query = {"user_id": user_id}
        if not include_active:
            query["is_active"] = {"$ne": True}
        
        cursor = self.collection.find(query).sort("created_at", -1)
        return await cursor.to_list(length=None)

    async def update(self, resume_id: str, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update resume by ID for specific user."""
        updates["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.collection.find_one_and_update(
            {"resume_id": resume_id, "user_id": user_id},
            {"$set": updates},
            return_document=True,
        )
        return result

    async def delete(self, resume_id: str, user_id: str) -> bool:
        """Delete resume by ID for specific user."""
        result = await self.collection.delete_one({"resume_id": resume_id, "user_id": user_id})
        return result.deleted_count > 0

    async def set_active(self, resume_id: str, user_id: str) -> bool:
        """Set a resume as active (unsets all others for this user)."""
        # First, unset all active resumes for this user
        await self.collection.update_many(
            {"user_id": user_id, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Then set the specified resume as active
        result = await self.collection.update_one(
            {"resume_id": resume_id, "user_id": user_id},
            {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def unset_active(self, user_id: str) -> bool:
        """Remove active status from all user's resumes."""
        result = await self.collection.update_many(
            {"user_id": user_id, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
