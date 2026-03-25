"""Base repository with MongoDB connection management."""

from functools import lru_cache
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from app.config import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient:
    """Get cached MongoDB client."""
    return AsyncIOMotorClient(settings.mongodb_uri)


def get_collection(collection_name: str) -> AsyncIOMotorCollection:
    """Get MongoDB collection."""
    client = get_mongo_client()
    return client[settings.mongodb_db][collection_name]
