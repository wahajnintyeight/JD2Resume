from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from app.config import settings


def _ensure_mongo_config() -> None:
    if not settings.mongodb_uri:
        raise RuntimeError("Missing MongoDB configuration: mongodb_uri")
    if not settings.mongodb_db:
        raise RuntimeError("Missing MongoDB configuration: mongodb_db")
    if not settings.mongodb_users_collection:
        raise RuntimeError("Missing MongoDB configuration: mongodb_users_collection")


@lru_cache(maxsize=1)
def get_users_collection() -> Any:
    # Import inside function so the module can be imported without optional deps failing at import time.
    from motor.motor_asyncio import AsyncIOMotorClient

    _ensure_mongo_config()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    return client[settings.mongodb_db][settings.mongodb_users_collection]


async def upsert_google_user(*, google_sub: str, email: str | None, name: str | None, picture: str | None) -> dict[str, Any]:
    """
    Persist/merge a Google-authenticated user.

    Returns a normalized user object used by `/api/v1/auth/me`.
    """
    users = get_users_collection()
    now = datetime.now(timezone.utc)

    # We keep Google `sub` stable as our internal `user_id` so `/api/v1/auth/me` can find the user later.
    # If you already have an existing `users` doc, we also try to match by `email` to avoid creating duplicates.
    filter: dict[str, Any] = {}
    if email:
        filter["email"] = email
    else:
        filter["google_sub"] = google_sub

    update: dict[str, Any] = {
        "$set": {
            "provider": "google",
            "user_id": google_sub,
            "google_sub": google_sub,
            "email": email,
            "name": name,
            # Your existing collection seems to use `avatar`; store Google picture into both fields.
            "avatar": picture,
            "picture": picture,
            # Support both snake_case and camelCase timestamp conventions.
            "updated_at": now,
            "updatedAt": now,
        },
        "$setOnInsert": {
            "created_at": now,
            "createdAt": now,
        },
    }

    await users.update_one(filter, update, upsert=True)
    # Reload using the stable key.
    doc = await users.find_one({"provider": "google", "google_sub": google_sub})
    if not doc:
        # Extremely unlikely: update succeeded but document not found.
        raise RuntimeError("Failed to load user after upsert")

    return {
        "id": str(doc.get("user_id", google_sub)),
        "email": doc.get("email"),
        "name": doc.get("name"),
        "picture": doc.get("picture") or doc.get("avatar"),
        "provider": doc.get("provider", "google"),
    }


async def get_user_by_session_subject(*, subject: str, provider: str) -> dict[str, Any] | None:
    users = get_users_collection()
    doc = await users.find_one({"provider": provider, "user_id": subject})
    if not doc:
        return None
    return {
        "id": str(doc.get("user_id", subject)),
        "email": doc.get("email"),
        "name": doc.get("name"),
        "picture": doc.get("picture") or doc.get("avatar"),
        "provider": doc.get("provider", provider),
    }

