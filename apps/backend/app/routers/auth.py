from __future__ import annotations

import secrets
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.auth.jwt import create_session_token, decode_session_token
from app.auth.mongo import get_user_by_session_subject, upsert_google_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"


def _require_google_config() -> None:
    missing: list[str] = []
    if not settings.google_client_id:
        missing.append("google_client_id")
    if not settings.google_client_secret:
        missing.append("google_client_secret")
    if not settings.google_redirect_uri:
        missing.append("google_redirect_uri")
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing Google OAuth configuration: {', '.join(missing)}",
        )


def _frontend_dashboard_url() -> str:
    base = settings.frontend_base_url.rstrip("/")
    return f"{base}/dashboard"


@router.get("/google/login")
async def google_login() -> RedirectResponse:
    """
    Starts Google OAuth by redirecting the browser to Google's authorization URL.
    """
    _require_google_config()

    state = secrets.token_urlsafe(32)

    params = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            # Keeps refresh token so users stay signed in (depending on Google policy).
            "access_type": "offline",
            "prompt": "select_account",
            "include_granted_scopes": "true",
        }
    )

    redirect_url = f"{GOOGLE_AUTHORIZATION_ENDPOINT}?{params}"

    response = RedirectResponse(url=redirect_url)
    response.set_cookie(
        key=settings.auth_oauth_state_cookie_name,
        value=state,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.auth_oauth_state_ttl_seconds,
        path="/",
    )
    return response


@router.get("/google/callback")
async def google_callback(request: Request, code: str | None = None, state: str | None = None) -> RedirectResponse:
    """
    Handles Google OAuth callback:
    - validates `state`
    - exchanges `code` for tokens
    - fetches userinfo
    - creates/updates the user in MongoDB
    - creates a signed session cookie
    """
    _require_google_config()

    if not code:
        raise HTTPException(status_code=400, detail="Missing `code` from Google callback")
    if not state:
        raise HTTPException(status_code=400, detail="Missing `state` from Google callback")

    expected_state = request.cookies.get(settings.auth_oauth_state_cookie_name)
    if not expected_state or expected_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    # Clear state cookie ASAP.
    clear_state_cookie = True

    async with httpx.AsyncClient(timeout=30.0) as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_ENDPOINT,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if token_resp.status_code >= 400:
            detail = await token_resp.text()
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {detail}")

        token_data: dict[str, Any] = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Missing access_token in token response")

        user_resp = await client.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code >= 400:
            detail = await user_resp.text()
            raise HTTPException(status_code=400, detail=f"Failed to fetch userinfo: {detail}")

        profile: dict[str, Any] = user_resp.json()

    google_sub = str(profile.get("sub") or "")
    if not google_sub:
        raise HTTPException(status_code=400, detail="Google profile missing `sub`")

    email = profile.get("email")
    name = profile.get("name") or profile.get("given_name")
    picture = profile.get("picture")

    user = await upsert_google_user(
        google_sub=google_sub,
        email=email,
        name=name,
        picture=picture,
    )

    session_token = create_session_token(
        subject=user["id"],
        provider=user["provider"],
        email=user["email"],
        name=user["name"],
        picture=user["picture"],
    )

    response = RedirectResponse(url=_frontend_dashboard_url())
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=session_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.auth_session_ttl_seconds,
        path="/",
    )
    if clear_state_cookie:
        response.set_cookie(
            key=settings.auth_oauth_state_cookie_name,
            value="",
            httponly=True,
            secure=settings.auth_cookie_secure,
            samesite="lax",
            max_age=0,
            path="/",
        )
    return response


@router.get("/me")
async def auth_me(request: Request) -> JSONResponse:
    """
    Returns the current logged-in user (based on the session cookie).
    """
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        return JSONResponse(status_code=401, content={"user": None})

    try:
        payload = decode_session_token(token)
    except Exception:
        return JSONResponse(status_code=401, content={"user": None})

    user = await get_user_by_session_subject(subject=payload.sub, provider=payload.provider)
    if not user:
        return JSONResponse(status_code=401, content={"user": None})

    return JSONResponse(status_code=200, content={"user": user})


@router.post("/logout")
async def auth_logout(request: Request) -> JSONResponse:
    """
    Clears the session cookie.
    """
    response = JSONResponse(status_code=200, content={"message": "Logged out"})
    response.set_cookie(
        key=settings.auth_cookie_name,
        value="",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=0,
        path="/",
    )
    response.set_cookie(
        key=settings.auth_oauth_state_cookie_name,
        value="",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=0,
        path="/",
    )
    return response

