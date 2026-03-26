"""LLM API configuration repository for MongoDB."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from app.repositories.base import get_collection

class LLMConfigRepository:
    """Repository for managing global LLM API configurations."""

    def __init__(self):
        self.collection = get_collection("llm_api_configs")

    async def list_configs(self) -> list[dict[str, Any]]:
        """List all LLM configurations."""
        cursor = self.collection.find({})
        return await cursor.to_list(length=100)

    async def get_active_config(self) -> dict[str, Any] | None:
        """Get the current active LLM configuration."""
        return await self.collection.find_one({"isActive": True})

    async def create_config(self, data: dict[str, Any], created_by: str) -> dict[str, Any]:
        """Create a new LLM configuration."""
        now = datetime.now(timezone.utc)
        doc = {
            **data,
            "createdBy": created_by,
            "createdAt": now,
            "updatedAt": now,
            "isActive": data.get("isActive", False)
        }
        
        # If this is active, deactivate others
        if doc["isActive"]:
            await self.collection.update_many({"isActive": True}, {"$set": {"isActive": False}})
            
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def update_config(self, config_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        """Update an existing LLM configuration."""
        from bson import ObjectId
        
        now = datetime.now(timezone.utc)
        update_data = {**data, "updatedAt": now}
        
        # If setting to active, deactivate others
        if update_data.get("isActive"):
            await self.collection.update_many({"isActive": True}, {"$set": {"isActive": False}})
            
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(config_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def delete_config(self, config_id: str) -> bool:
        """Delete an LLM configuration."""
        from bson import ObjectId
        result = await self.collection.delete_one({"_id": ObjectId(config_id)})
        return result.deleted_count > 0

    async def set_active(self, config_id: str) -> bool:
        """Set a configuration as active and deactivate all others."""
        from bson import ObjectId
        await self.collection.update_many({"isActive": True}, {"$set": {"isActive": False}})
        result = await self.collection.update_one(
            {"_id": ObjectId(config_id)},
            {"$set": {"isActive": True, "updatedAt": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
