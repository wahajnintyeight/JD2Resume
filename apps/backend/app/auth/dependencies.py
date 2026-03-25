"""FastAPI dependencies for authentication."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request

from app.auth.context import set_current_user_id
from app.auth.jwt import decode_session_token
from app.config import settings


def require_authenticated_user(request: Request) -> dict:
    """
    FastAPI dependency that:
    - validates the session cookie
    - stores the current user_id in request-scoped context
    - returns user payload dict
    """
    auth_header = request.headers.get("Authorization") or ""
    token: str | None = None
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    if not token:
        token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        payload = decode_session_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Store for downstream database access.
    set_current_user_id(payload.sub)

    return {
        "user_id": payload.sub,
        "provider": payload.provider,
        "email": payload.email,
        "name": payload.name,
        "picture": payload.picture,
    }


def get_current_user_payload(payload: dict = Depends(require_authenticated_user)) -> dict:
    """Small indirection to allow swapping auth dependencies later."""
    return payload

