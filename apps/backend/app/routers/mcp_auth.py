"""Browser OAuth endpoints for MCP; website Google auth routes stay independent."""

import hmac
import logging
import secrets
import time
from html import escape
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from jose import JWTError
from mcp.server.auth.handlers.authorize import AuthorizationHandler
from mcp.server.auth.handlers.revoke import RevocationHandler
from mcp.server.auth.handlers.token import TokenHandler
from mcp.server.auth.middleware.client_auth import ClientAuthenticator
from mcp.server.auth.provider import construct_redirect_uri
from starlette.datastructures import FormData
from starlette.responses import JSONResponse, RedirectResponse, Response

from app.auth.jwt import decode_session_token
from app.auth.mcp_oauth import (
    SCOPES,
    collection,
    digest,
    get,
    issuer,
    provider,
    put,
    resource,
)
from app.auth.mcp_pages import consent_content, expired_connection, page
from app.auth.mongo import get_users_collection
from app.config import settings
from app.routers.auth import (
    GOOGLE_AUTHORIZATION_ENDPOINT,
    GOOGLE_TOKEN_ENDPOINT,
    GOOGLE_USERINFO_ENDPOINT,
)

router = APIRouter(tags=["MCP authentication"])
logger = logging.getLogger(__name__)
client_auth = ClientAuthenticator(provider)


def cookie_name() -> str:
    return "__Host-mcp-browser" if issuer().startswith("https:") else "mcp-browser"


@router.get("/.well-known/oauth-protected-resource/mcp")
@router.get("/.well-known/oauth-protected-resource")
async def protected_resource_metadata() -> dict[str, Any]:
    return {
        "resource": resource(),
        "authorization_servers": [issuer()],
        "scopes_supported": SCOPES,
    }


@router.get("/.well-known/oauth-authorization-server")
async def authorization_metadata() -> dict[str, Any]:
    return {
        "issuer": issuer(),
        "authorization_endpoint": issuer() + "/authorize",
        "token_endpoint": issuer() + "/token",
        "revocation_endpoint": issuer() + "/revoke",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["none"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": SCOPES,
        "client_id_metadata_document_supported": True,
        "authorization_response_iss_parameter_supported": True,
    }


@router.get("/authorize")
async def authorize(request: Request) -> Response:
    # Require an explicit S256 method; the SDK otherwise defaults an omitted method.
    if request.query_params.get("code_challenge_method") != "S256":
        return JSONResponse(
            {"error": "invalid_request", "error_description": "PKCE S256 is required."},
            400,
        )
    result = await AuthorizationHandler(provider).handle(request)
    if result.status_code in {302, 303}:
        result.headers["location"] = construct_redirect_uri(
            result.headers["location"], iss=issuer()
        )
    return result


async def token_form(request: Request) -> dict[str, Any]:
    if len(await request.body()) > 65536:
        raise HTTPException(413, "Request too large")
    return dict(await request.form())


@router.post("/token")
async def token(request: Request) -> Response:
    form = await token_form(request)
    if form.get("resource") != resource():
        return JSONResponse(
            {
                "error": "invalid_target",
                "error_description": "Use the canonical MCP resource.",
            },
            400,
            headers={"Cache-Control": "no-store"},
        )
    return await TokenHandler(provider, client_auth).handle(request)


@router.post("/revoke")
async def revoke(request: Request) -> Response:
    form = await token_form(request)
    # This SDK version requires the nullable field even for public clients.
    request._form = FormData({"client_secret": "", **form})
    return await RevocationHandler(provider, client_auth).handle(request)


async def bound_request(request: Request, request_id: str) -> dict[str, Any]:
    pending = await get("pending", request_id)
    binding = request.cookies.get(cookie_name(), "")
    if (
        not pending
        or not binding
        or not hmac.compare_digest(digest(binding), pending.get("browser_binding", ""))
    ):
        raise HTTPException(
            400, "Connection request expired. Start the MCP connection again."
        )
    return pending


async def browser_account(request: Request) -> dict[str, Any] | None:
    try:
        payload = decode_session_token(
            request.cookies.get(settings.auth_cookie_name, "")
        )
        if payload.provider != "google":
            return None
    except (JWTError, KeyError, ValueError):
        return None
    return await get_users_collection().find_one(
        {"provider": "google", "user_id": payload.sub}
    )


async def finish(request_id: str, account: dict[str, Any]) -> RedirectResponse:
    pending = await collection().find_one_and_delete(
        {
            "_id": digest(request_id),
            "kind": "pending",
            "issuer": issuer(),
            "approved": True,
            "expires_at": {"$gt": time.time()},
        }
    )
    if not pending:
        raise HTTPException(400, "Connection request expired or already completed.")
    params = pending["params"]
    code = secrets.token_urlsafe(32)
    await put(
        "code",
        code,
        {
            "payload": {
                "client_id": pending["client_id"],
                "scopes": params["scopes"] or SCOPES,
                "code_challenge": params["code_challenge"],
                "redirect_uri": params["redirect_uri"],
                "redirect_uri_provided_explicitly": params[
                    "redirect_uri_provided_explicitly"
                ],
                "resource": resource(),
                "subject": account["user_id"],
                "expires_at": time.time() + 120,
            }
        },
        120,
    )
    response = RedirectResponse(
        construct_redirect_uri(
            params["redirect_uri"], code=code, state=params.get("state"), iss=issuer()
        ),
        status_code=302,
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )
    response.delete_cookie(
        cookie_name(),
        path="/",
        secure=issuer().startswith("https:"),
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/mcp/oauth/consent")
async def consent_page(request: Request, request_id: str) -> Response:
    pending = await get("pending", request_id)
    if not pending:
        return expired_connection()
    binding = None
    if not pending.get("browser_binding"):
        binding = secrets.token_urlsafe(32)
        updated = await collection().update_one(
            {"_id": digest(request_id), "browser_binding": {"$exists": False}},
            {"$set": {"browser_binding": digest(binding)}},
        )
        if updated.modified_count != 1:
            return expired_connection()
    else:
        try:
            await bound_request(request, request_id)
        except HTTPException:
            return expired_connection()
    account = await browser_account(request)
    scopes = pending["params"]["scopes"] or SCOPES
    response = page(
        f"Connect to {pending['client_name'] or pending['client_id']}",
        consent_content(request_id, pending, account, scopes),
        form_redirect_uri=pending["params"]["redirect_uri"],
    )
    if binding:
        response.set_cookie(
            cookie_name(),
            binding,
            max_age=600,
            httponly=True,
            secure=issuer().startswith("https:"),
            samesite="lax",
            path="/",
        )
    return response


@router.post("/mcp/oauth/consent")
async def consent(request: Request) -> Response:
    form = await token_form(request)
    request_id = str(form.get("request_id", ""))
    try:
        pending = await bound_request(request, request_id)
    except HTTPException:
        return expired_connection()
    if not hmac.compare_digest(str(form.get("csrf", "")), pending["csrf"]):
        raise HTTPException(400, "Invalid connection request.")
    if form.get("decision") != "allow":
        await collection().delete_one({"_id": digest(request_id)})
        params = pending["params"]
        return RedirectResponse(
            construct_redirect_uri(
                params["redirect_uri"],
                error="access_denied",
                state=params.get("state"),
                iss=issuer(),
            ),
            status_code=302,
        )
    await collection().update_one(
        {"_id": digest(request_id)}, {"$set": {"approved": True}}
    )
    account = await browser_account(request)
    if account:
        return await finish(request_id, account)
    if not settings.google_client_id or not settings.google_client_secret:
        return page(
            "Sign-in unavailable",
            "<p>Google sign-in is not configured. Contact the app administrator.</p>",
            503,
        )
    state = secrets.token_urlsafe(32)
    await put(
        "google_state",
        state,
        {"request_id": request_id, "browser_binding": pending["browser_binding"]},
        600,
    )
    return RedirectResponse(
        GOOGLE_AUTHORIZATION_ENDPOINT
        + "?"
        + urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": issuer() + "/mcp/oauth/google/callback",
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "prompt": "select_account",
            }
        ),
        status_code=302,
        headers={"Cache-Control": "no-store"},
    )


@router.get("/mcp/oauth/google/callback")
async def google_callback(
    request: Request, state: str = "", code: str = ""
) -> Response:
    saved = await get("google_state", state)
    binding = request.cookies.get(cookie_name(), "")
    if (
        not saved
        or not binding
        or not hmac.compare_digest(digest(binding), saved["browser_binding"])
    ):
        raise HTTPException(400, "Invalid Google sign-in state.")
    pending = await bound_request(request, saved["request_id"])
    if not pending.get("approved") or not await collection().find_one_and_delete(
        {"_id": digest(state), "kind": "google_state"}
    ):
        raise HTTPException(400, "Google sign-in already completed or expired.")
    if not code:
        return page(
            "Sign-in cancelled",
            "<p>Start the MCP connection again when you are ready.</p>",
            400,
        )
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            result = await client.post(
                GOOGLE_TOKEN_ENDPOINT,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": issuer() + "/mcp/oauth/google/callback",
                    "grant_type": "authorization_code",
                },
            )
            result.raise_for_status()
            profile = await client.get(
                GOOGLE_USERINFO_ENDPOINT,
                headers={"Authorization": "Bearer " + result.json()["access_token"]},
            )
            profile.raise_for_status()
            subject = profile.json()["sub"]
        if not isinstance(subject, str) or not subject:
            raise ValueError("Missing Google subject")
        account = await get_users_collection().find_one(
            {
                "provider": "google",
                "$or": [{"google_sub": subject}, {"user_id": subject}],
            }
        )
        if not account:
            return page(
                "Create your JD2Resume account",
                "<p>Sign in on the website and upload a resume first. "
                'Then start the MCP connection again.</p><p><a href="'
                + escape(settings.frontend_base_url, quote=True)
                + '">Open JD2Resume</a></p>',
                403,
            )
        return await finish(saved["request_id"], account)
    except HTTPException:
        raise
    except Exception:
        logger.exception("MCP Google sign-in failed")
        return page(
            "Sign-in failed",
            "<p>Start the MCP connection again. If the problem continues, contact the administrator.</p>",
            400,
        )
