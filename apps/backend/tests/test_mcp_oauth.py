"""MCP OAuth security round trips; Google and Mongo are mocked, website auth is untouched."""

import asyncio
import base64
import copy
import hashlib
import unittest
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs, urlsplit

from fastapi import FastAPI
from fastapi.testclient import TestClient

with patch("pymongo.MongoClient"):
    from app import mcp_server
    from app.auth import mcp_oauth
    from app.auth.jwt import create_session_token
    from app.routers import mcp_auth

ACCOUNT = {
    "user_id": "google-owner",
    "google_sub": "google-owner",
    "provider": "google",
    "email": "owner@example.com",
}


class MemoryMongo:
    def __init__(self) -> None:
        self.docs: dict[str, dict[str, Any]] = {}

    def matches(self, doc: dict[str, Any], query: dict[str, Any]) -> bool:
        for key, wanted in query.items():
            value: Any = doc
            for part in key.split("."):
                value = value.get(part) if isinstance(value, dict) else None
            if isinstance(wanted, dict):
                if "$gt" in wanted and not (
                    value is not None and value > wanted["$gt"]
                ):
                    return False
                if "$exists" in wanted and (value is not None) != wanted["$exists"]:
                    return False
            elif value != wanted:
                return False
        return True

    async def insert_one(self, doc: dict[str, Any]) -> None:
        self.docs[doc["_id"]] = copy.deepcopy(doc)

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        return next(
            (
                copy.deepcopy(doc)
                for doc in self.docs.values()
                if self.matches(doc, query)
            ),
            None,
        )

    async def update_one(self, query: dict[str, Any], updates: dict[str, Any]) -> Any:
        doc = await self.find_one(query)
        if doc:
            self.docs[doc["_id"]].update(updates["$set"])
        return MagicMock(modified_count=int(doc is not None))

    async def find_one_and_update(
        self, query: dict[str, Any], updates: dict[str, Any]
    ) -> dict[str, Any] | None:
        doc = await self.find_one(query)
        await self.update_one(query, updates)
        return doc

    async def find_one_and_delete(self, query: dict[str, Any]) -> dict[str, Any] | None:
        doc = await self.find_one(query)
        if doc:
            del self.docs[doc["_id"]]
        return doc

    async def delete_one(self, query: dict[str, Any]) -> None:
        await self.find_one_and_delete(query)


class MCPOAuthTests(unittest.TestCase):
    def setUp(self) -> None:
        self.store = MemoryMongo()
        self.users = MagicMock()
        self.users.find_one = AsyncMock(return_value=ACCOUNT)
        self.patches = [
            patch.object(mcp_oauth, "collection", return_value=self.store),
            patch.object(mcp_auth, "collection", return_value=self.store),
            patch.object(mcp_auth, "get_users_collection", return_value=self.users),
            patch.object(mcp_server, "get_users_collection", return_value=self.users),
            patch.object(
                mcp_oauth.settings, "mcp_public_base_url", "http://localhost:8000"
            ),
            patch.object(mcp_oauth.settings, "auth_jwt_secret", "test-session-secret"),
            patch.object(mcp_oauth.settings, "google_client_id", "test-google-client"),
            patch.object(
                mcp_oauth.settings, "google_client_secret", "test-google-secret"
            ),
            patch.object(
                mcp_oauth.settings,
                "mcp_oauth_clients",
                {
                    "test-client": {
                        "client_name": "Test Client",
                        "redirect_uris": ["http://localhost:1234/callback"],
                    }
                },
            ),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)
        app = FastAPI()
        app.include_router(mcp_auth.router)
        app.mount("/", mcp_server.mcp_app)
        self.client = TestClient(app, base_url="http://localhost:8000")
        self.addCleanup(self.client.close)
        self.verifier = "v" * 64
        self.params = {
            "client_id": "test-client",
            "response_type": "code",
            "redirect_uri": "http://localhost:1234/callback",
            "code_challenge": base64.urlsafe_b64encode(
                hashlib.sha256(self.verifier.encode()).digest()
            )
            .decode()
            .rstrip("="),
            "code_challenge_method": "S256",
            "resource": mcp_oauth.resource(),
            "scope": "resumes:read resumes:write",
            "state": "client-state",
        }

    def start(self) -> tuple[str, dict[str, Any]]:
        response = self.client.get(
            "/authorize", params=self.params, follow_redirects=False
        )
        self.assertEqual(response.status_code, 302, response.text)
        request_id = parse_qs(urlsplit(response.headers["location"]).query)[
            "request_id"
        ][0]
        response = self.client.get(response.headers["location"])
        self.assertEqual(response.status_code, 200, response.text)
        # Browser redirects after form submission are subject to form-action too.
        policy = response.headers["content-security-policy"]
        self.assertIn(
            "form-action 'self' https://accounts.google.com http://localhost:1234;",
            policy,
        )
        self.assertIn("frame-ancestors 'none'", policy)
        pending = self.store.docs[mcp_oauth.digest(request_id)]
        return request_id, pending

    def test_pkce_tokens_refresh_revocation_and_account_isolation(self) -> None:
        response = self.client.post("/mcp", json={})
        self.assertEqual(response.status_code, 401)
        self.assertIn(
            "oauth-protected-resource/mcp", response.headers["www-authenticate"]
        )
        metadata = self.client.get("/.well-known/oauth-authorization-server").json()
        self.assertEqual(metadata["code_challenge_methods_supported"], ["S256"])
        session = create_session_token(
            subject=ACCOUNT["user_id"],
            provider="google",
            email=ACCOUNT["email"],
            name=None,
            picture=None,
        )
        self.client.cookies.set(mcp_auth.settings.auth_cookie_name, session)
        self.assertEqual(
            self.client.post(
                "/mcp", headers={"Authorization": "Bearer " + session}
            ).status_code,
            401,
        )
        request_id, pending = self.start()
        form = {"request_id": request_id, "csrf": pending["csrf"], "decision": "allow"}
        self.assertEqual(
            self.client.post(
                "/mcp/oauth/consent", data={**form, "csrf": "wrong"}
            ).status_code,
            400,
        )
        response = self.client.post(
            "/mcp/oauth/consent", data=form, follow_redirects=False
        )
        self.assertEqual(response.status_code, 302, response.text)
        callback = parse_qs(urlsplit(response.headers["location"]).query)
        self.assertEqual(callback["state"], ["client-state"])
        self.assertEqual(callback["iss"], [mcp_oauth.issuer()])
        repeated = self.client.post("/mcp/oauth/consent", data=form)
        self.assertEqual(repeated.status_code, 400)
        self.assertIn("Start a new connection", repeated.text)
        self.assertIn("Return to your assistant", repeated.text)
        data = {
            "client_id": "test-client",
            "grant_type": "authorization_code",
            "code": callback["code"][0],
            "redirect_uri": self.params["redirect_uri"],
            "code_verifier": self.verifier,
            "resource": mcp_oauth.resource(),
        }
        self.assertEqual(
            self.client.post(
                "/token", data={**data, "code_verifier": "wrong"}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/token", data={**data, "resource": "https://wrong.example/mcp"}
            ).status_code,
            400,
        )
        response = self.client.post("/token", data=data)
        self.assertEqual(response.status_code, 200, response.text)
        tokens = response.json()
        self.assertEqual(self.client.post("/token", data=data).status_code, 400)
        access = asyncio.run(
            mcp_oauth.provider.load_access_token(tokens["access_token"])
        )
        self.assertEqual(access.subject, ACCOUNT["user_id"])
        self.assertEqual(access.resource, mcp_oauth.resource())
        self.assertNotIn(tokens["access_token"], str(self.store.docs))
        refresh = {
            "client_id": "test-client",
            "grant_type": "refresh_token",
            "refresh_token": tokens["refresh_token"],
            "resource": mcp_oauth.resource(),
        }
        rotated = self.client.post("/token", data=refresh)
        self.assertEqual(rotated.status_code, 200, rotated.text)
        self.assertEqual(self.client.post("/token", data=refresh).status_code, 400)
        self.assertIsNone(
            asyncio.run(
                mcp_oauth.provider.load_access_token(rotated.json()["access_token"])
            )
        )
        fresh = asyncio.run(
            mcp_oauth.provider.issue_tokens(
                ACCOUNT["user_id"], "test-client", mcp_oauth.SCOPES
            )
        )
        revoked = self.client.post(
            "/revoke",
            data={
                "client_id": "test-client",
                "token": fresh.refresh_token,
            },
        )
        self.assertEqual(revoked.status_code, 200, revoked.text)
        self.assertIsNone(
            asyncio.run(mcp_oauth.provider.load_access_token(fresh.access_token))
        )
        self.assertEqual(
            self.client.get(
                "/authorize",
                params={
                    **self.params,
                    "redirect_uri": "https://attacker.example/callback",
                },
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get(
                "/authorize", params={**self.params, "code_challenge_method": "plain"}
            ).status_code,
            400,
        )
        for client_id in (
            "http://127.0.0.1/private.json",
            "https://chatgpt.com:invalid/oauth/client.json",
            "https://[invalid/oauth/client.json",
        ):
            with self.subTest(client_id=client_id):
                self.assertIsNone(asyncio.run(mcp_oauth.provider.get_client(client_id)))

    def test_google_state_is_browser_bound_and_uses_subject_not_email(self) -> None:
        request_id, pending = self.start()
        response = self.client.post(
            "/mcp/oauth/consent",
            data={
                "request_id": request_id,
                "csrf": pending["csrf"],
                "decision": "allow",
            },
            follow_redirects=False,
        )
        query = parse_qs(urlsplit(response.headers["location"]).query)
        self.assertEqual(
            query["redirect_uri"], [mcp_oauth.issuer() + "/mcp/oauth/google/callback"]
        )
        self.assertNotEqual(
            query["redirect_uri"][0], mcp_auth.settings.google_redirect_uri
        )
        state = query["state"][0]
        stranger = TestClient(self.client.app, base_url="http://localhost:8000")
        self.assertEqual(
            stranger.get(
                "/mcp/oauth/google/callback",
                params={"state": state, "code": "google-code"},
            ).status_code,
            400,
        )
        stranger.close()
        google = AsyncMock()
        google.post.return_value = MagicMock(
            json=lambda: {"access_token": "google-only-token"}
        )
        google.get.return_value = MagicMock(
            json=lambda: {"sub": "google-owner", "email": "different@example.com"}
        )
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=google)
        context.__aexit__ = AsyncMock(return_value=None)
        with patch.object(mcp_auth.httpx, "AsyncClient", return_value=context):
            response = self.client.get(
                "/mcp/oauth/google/callback",
                params={"state": state, "code": "google-code"},
                follow_redirects=False,
            )
        self.assertEqual(response.status_code, 302, response.text)
        self.users.find_one.assert_awaited_with(
            {
                "provider": "google",
                "$or": [{"google_sub": "google-owner"}, {"user_id": "google-owner"}],
            }
        )
        self.assertEqual(
            self.client.get(
                "/mcp/oauth/google/callback",
                params={"state": state, "code": "google-code"},
            ).status_code,
            400,
        )
        self.assertFalse(
            any(doc["kind"] == "access" for doc in self.store.docs.values())
        )


if __name__ == "__main__":
    unittest.main()
