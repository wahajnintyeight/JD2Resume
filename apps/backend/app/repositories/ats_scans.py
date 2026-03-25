"""ATS scan repository for MongoDB operations."""

from datetime import datetime, timezone
from typing import Any

from app.repositories.base import get_collection


class ATSScanRepository:
    """Repository for ATS scan operations."""

    def __init__(self):
        self.collection = get_collection("ats_scans")

    async def save(self, resume_id: str, user_id: str, scan_results: dict[str, Any]) -> dict[str, Any]:
        """Save or update ATS scan results for a resume."""
        now = datetime.now(timezone.utc)

        # Check if scan already exists
        existing = await self.collection.find_one({"resume_id": resume_id, "user_id": user_id})

        if existing:
            # Update existing scan
            await self.collection.update_one(
                {"resume_id": resume_id, "user_id": user_id},
                {"$set": {"scan_results": scan_results, "updated_at": now}}
            )
            return {**existing, "scan_results": scan_results, "updated_at": now}
        else:
            # Create new scan
            doc = {
                "resume_id": resume_id,
                "user_id": user_id,
                "scan_results": scan_results,
                "created_at": now,
                "updated_at": now,
            }
            await self.collection.insert_one(doc)
            return doc

    async def get(self, resume_id: str, user_id: str) -> dict[str, Any] | None:
        """Get ATS scan results for a resume."""
        result = await self.collection.find_one({"resume_id": resume_id, "user_id": user_id})
        return result.get("scan_results") if result else None

    async def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """List all ATS scans for a user."""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)
