from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import settings


@dataclass(frozen=True)
class SessionPayload:
    sub: str
    provider: str
    email: str | None
    name: str | None
    picture: str | None
    iat: int
    exp: int


def _require_jwt_secret() -> str:
    if not settings.auth_jwt_secret:
        raise RuntimeError("Missing auth_jwt_secret")
    return settings.auth_jwt_secret


def create_session_token(*, subject: str, provider: str, email: str | None, name: str | None, picture: str | None) -> str:
    """
    Creates a signed JWT used for the session cookie.
    """
    from jose import jwt  # optional dependency loaded lazily

    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=settings.auth_session_ttl_seconds)

    payload: dict[str, Any] = {
        "sub": subject,
        "provider": provider,
        "email": email,
        "name": name,
        "picture": picture,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, _require_jwt_secret(), algorithm=settings.auth_jwt_algorithm)


def decode_session_token(token: str) -> SessionPayload:
    """
    Validates and decodes the JWT from the session cookie.
    Raises jose.JWTError for invalid/expired tokens.
    """
    from jose import jwt  # optional dependency loaded lazily

    decoded = jwt.decode(
        token,
        _require_jwt_secret(),
        algorithms=[settings.auth_jwt_algorithm],
    )

    return SessionPayload(
        sub=str(decoded["sub"]),
        provider=str(decoded.get("provider", "google")),
        email=decoded.get("email"),
        name=decoded.get("name"),
        picture=decoded.get("picture"),
        iat=int(decoded["iat"]),
        exp=int(decoded["exp"]),
    )

