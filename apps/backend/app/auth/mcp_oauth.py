"""MCP-only OAuth provider using SDK validation and opaque MongoDB credentials."""

import hashlib
import json
import re
import secrets
import time
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlsplit

import httpx
from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    AuthorizeError,
    RefreshToken,
    TokenError,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken
from pydantic import AnyUrl

from app.auth.mongo import get_users_collection
from app.config import settings

SCOPES = ["resumes:read", "resumes:write"]


def issuer() -> str:
    value = settings.mcp_public_base_url.rstrip("/")
    parts = urlsplit(value)
    if (
        parts.scheme not in {"http", "https"}
        or not parts.hostname
        or parts.username
        or parts.password
        or parts.path
        or parts.query
        or parts.fragment
        or (
            parts.scheme != "https"
            and parts.hostname not in {"localhost", "127.0.0.1", "::1"}
        )
    ):
        raise ValueError(
            "MCP_PUBLIC_BASE_URL must be an HTTPS origin (HTTP allowed for local development)."
        )
    return value


def resource() -> str:
    return issuer() + "/mcp"


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def collection() -> Any:
    return get_users_collection().database["mcp_oauth"]


async def put(kind: str, token: str, payload: dict[str, Any], ttl: int) -> None:
    await collection().insert_one(
        {
            "_id": digest(token),
            "kind": kind,
            **payload,
            "issuer": issuer(),
            "expires_at": time.time() + ttl,
            "expiresAt": datetime.fromtimestamp(time.time() + ttl, UTC),
        }
    )


async def get(kind: str, token: str) -> dict[str, Any] | None:
    return await collection().find_one(
        {
            "_id": digest(token),
            "kind": kind,
            "issuer": issuer(),
            "expires_at": {"$gt": time.time()},
        }
    )


class NativeOAuthClient(OAuthClientInformationFull):
    """RFC 8252: native IP-loopback callbacks may choose a listener port."""

    def validate_redirect_uri(self, redirect_uri: AnyUrl | None) -> AnyUrl:
        if redirect_uri is not None:
            candidate = urlsplit(str(redirect_uri))
            if (
                candidate.scheme == "http"
                and candidate.hostname in {"127.0.0.1", "::1"}
                and not candidate.username
                and not candidate.password
            ):
                for registered in self.redirect_uris or []:
                    expected = urlsplit(str(registered))
                    if expected.port is None and (
                        candidate.scheme,
                        candidate.hostname,
                        candidate.path,
                        candidate.query,
                        candidate.fragment,
                    ) == (
                        expected.scheme,
                        expected.hostname,
                        expected.path,
                        expected.query,
                        expected.fragment,
                    ):
                        return redirect_uri
        return super().validate_redirect_uri(redirect_uri)


class MCPOAuthProvider:
    """The SDK handles OAuth parsing, redirect validation and PKCE; this stores grants."""

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        metadata = settings.mcp_oauth_clients.get(client_id)
        if metadata is None:
            # Only explicitly trusted public metadata hosts; never follow redirects.
            try:
                parts = urlsplit(client_id)
                if (
                    parts.scheme != "https"
                    or parts.hostname not in settings.mcp_oauth_metadata_hosts
                    or parts.username
                    or parts.password
                    or parts.fragment
                    or parts.port not in {None, 443}
                    or parts.path in {"", "/"}
                ):
                    return None
                async with (
                    httpx.AsyncClient(timeout=5, follow_redirects=False) as client,
                    client.stream("GET", client_id) as response,
                ):
                    response.raise_for_status()
                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > 65536:
                            return None
                metadata = json.loads(body)
                if (
                    not isinstance(metadata, dict)
                    or metadata.get("client_id") != client_id
                ):
                    return None
                methods = metadata.get(
                    "token_endpoint_auth_methods_supported",
                    [metadata.get("token_endpoint_auth_method", "none")],
                )
                if not isinstance(methods, list) or "none" not in methods:
                    return None
            except (httpx.HTTPError, ValueError):
                return None
        try:
            redirects = metadata["redirect_uris"]
            if not isinstance(redirects, list) or not 1 <= len(redirects) <= 16:
                return None
            for value in redirects:
                parts = urlsplit(value)
                if (
                    parts.fragment
                    or parts.username
                    or parts.password
                    or not parts.hostname
                    or (
                        parts.scheme != "https"
                        and not (
                            parts.scheme == "http"
                            and parts.hostname in {"localhost", "127.0.0.1", "::1"}
                        )
                    )
                ):
                    return None
            client_type = (
                NativeOAuthClient
                if metadata.get("application_type") == "native"
                else OAuthClientInformationFull
            )
            return client_type(
                client_id=client_id,
                client_name=metadata.get("client_name", client_id),
                redirect_uris=redirects,
                token_endpoint_auth_method="none",
                grant_types=["authorization_code", "refresh_token"],
                scope=" ".join(SCOPES),
            )
        except (KeyError, TypeError, ValueError):
            return None

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        if params.resource != resource() or not re.fullmatch(
            r"[A-Za-z0-9_-]{43}", params.code_challenge
        ):
            raise AuthorizeError(
                "invalid_request", "Use this MCP resource and a PKCE S256 challenge."
            )
        if not set(params.scopes or SCOPES).issubset(SCOPES):
            raise AuthorizeError("invalid_scope", "Unsupported scope.")
        request_id = secrets.token_urlsafe(32)
        await put(
            "pending",
            request_id,
            {
                "client_id": client.client_id,
                "client_name": client.client_name,
                "params": params.model_dump(mode="json"),
                "csrf": secrets.token_urlsafe(32),
            },
            600,
        )
        return issuer() + "/mcp/oauth/consent?request_id=" + request_id

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, code: str
    ) -> AuthorizationCode | None:
        doc = await get("code", code)
        if not doc or doc["payload"]["client_id"] != client.client_id:
            return None
        return AuthorizationCode(code=code, **doc["payload"])

    async def exchange_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode
    ) -> OAuthToken:
        doc = await collection().find_one_and_delete(
            {
                "_id": digest(authorization_code.code),
                "kind": "code",
                "issuer": issuer(),
                "expires_at": {"$gt": time.time()},
                "payload.client_id": client.client_id,
            }
        )
        if not doc:
            raise TokenError(
                "invalid_grant", "Authorization code expired or already used."
            )
        return await self.issue_tokens(
            authorization_code.subject, client.client_id, authorization_code.scopes
        )

    async def issue_tokens(
        self,
        subject: str,
        client_id: str,
        scopes: list[str],
        grant_id: str | None = None,
    ) -> OAuthToken:
        if not subject or not client_id or not set(scopes).issubset(SCOPES):
            raise TokenError("invalid_grant", "Invalid account or permissions.")
        if grant_id is None:
            grant_id = secrets.token_urlsafe(32)
            await put(
                "grant",
                grant_id,
                {"subject": subject, "client_id": client_id, "revoked": False},
                30 * 86400,
            )
        access, refresh = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        data = {
            "subject": subject,
            "client_id": client_id,
            "scopes": scopes,
            "resource": resource(),
            "grant_id": grant_id,
        }
        await put("access", access, data, 600)
        await put("refresh", refresh, {**data, "used": False}, 30 * 86400)
        return OAuthToken(
            access_token=access,
            refresh_token=refresh,
            expires_in=600,
            scope=" ".join(scopes),
        )

    async def valid_grant(self, doc: dict[str, Any]) -> bool:
        grant = await get("grant", doc["grant_id"])
        return bool(
            grant
            and not grant["revoked"]
            and grant["subject"] == doc["subject"]
            and grant["client_id"] == doc["client_id"]
            and doc["resource"] == resource()
        )

    async def load_access_token(self, token: str) -> AccessToken | None:
        doc = await get("access", token)
        if not doc or not await self.valid_grant(doc):
            return None
        return AccessToken(
            token=token,
            client_id=doc["client_id"],
            scopes=doc["scopes"],
            expires_at=int(doc["expires_at"]),
            resource=doc["resource"],
            subject=doc["subject"],
        )

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> RefreshToken | None:
        doc = await get("refresh", refresh_token)
        if not doc or doc["client_id"] != client.client_id:
            return None
        if doc["used"]:
            await self.revoke_token(
                RefreshToken(token=refresh_token, client_id=client.client_id, scopes=[])
            )
            return None
        if not await self.valid_grant(doc):
            return None
        return RefreshToken(
            token=refresh_token,
            client_id=doc["client_id"],
            scopes=doc["scopes"],
            expires_at=int(doc["expires_at"]),
            resource=doc["resource"],
            subject=doc["subject"],
        )

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        doc = await collection().find_one_and_update(
            {
                "_id": digest(refresh_token.token),
                "kind": "refresh",
                "issuer": issuer(),
                "client_id": client.client_id,
                "used": False,
                "expires_at": {"$gt": time.time()},
            },
            {"$set": {"used": True}},
        )
        if not doc or not await self.valid_grant(doc):
            await self.revoke_token(refresh_token)
            raise TokenError(
                "invalid_grant", "Refresh token expired, revoked or already used."
            )
        return await self.issue_tokens(
            doc["subject"], doc["client_id"], scopes, doc["grant_id"]
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        doc = await collection().find_one(
            {"_id": digest(token.token), "issuer": issuer()}
        )
        if doc and doc.get("grant_id") and doc["client_id"] == token.client_id:
            await collection().update_one(
                {"_id": digest(doc["grant_id"])}, {"$set": {"revoked": True}}
            )


provider = MCPOAuthProvider()
