"""User preferences repository for MongoDB operations."""

from datetime import datetime, timezone
from typing import Any

from app.repositories.base import get_collection


class UserPreferencesRepository:
    """Repository for user preferences operations."""

    def __init__(self):
        self.collection = get_collection("user_preferences")

    async def get(self, user_id: str) -> dict[str, Any] | None:
        """Get user preferences."""
        return await self.collection.find_one({"user_id": user_id})

    async def upsert(self, user_id: str, preferences: dict[str, Any]) -> dict[str, Any]:
        """Create or update user preferences."""
        now = datetime.now(timezone.utc)

        result = await self.collection.find_one_and_update(
            {"user_id": user_id},
            {
                "$set": {**preferences, "updated_at": now},
                "$setOnInsert": {"user_id": user_id, "created_at": now}
            },
            upsert=True,
            return_document=True,
        )
        return result

    async def delete(self, user_id: str) -> bool:
        """Delete user preferences."""
        result = await self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0
