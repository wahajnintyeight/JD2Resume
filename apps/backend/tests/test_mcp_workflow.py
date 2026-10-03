"""Local MCP protocol and workflow checks; no live LLM, MongoDB or S3 writes."""

import copy
import time
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

# MongoDatabase creates indexes at import time. Keep these checks fully local.
with patch("pymongo.MongoClient"):
    from mcp.server.auth.provider import AccessToken

    from app import mcp_server
    from app.main import app
    from app.schemas import ResumeData
from fastapi.testclient import TestClient
from jose import jwt

from app.services import mcp_tailoring

USER = {
    "user_id": "user-1",
    "email": "owner@example.com",
    "provider": "google",
    "name": "Owner",
    "picture": None,
}
RESUME = {
    "resume_id": "source",
    "content": "source markdown",
    "processing_status": "ready",
    "processed_data": ResumeData(
        personalInfo={"name": "Owner"}, summary="Original"
    ).model_dump(),
}


class MCPWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        indexes = MagicMock()
        indexes.create_index = AsyncMock()
        cls.index_patch = patch("app.main.mcp_oauth_collection", return_value=indexes)
        cls.index_patch.start()
        cls.client = TestClient(app).__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.__exit__(None, None, None)
        cls.index_patch.stop()

    def setUp(self) -> None:
        users = MagicMock()
        users.find_one = AsyncMock(return_value=USER)
        account_lookup = patch.object(
            mcp_server, "get_users_collection", return_value=users
        )
        account_lookup.start()
        self.addCleanup(account_lookup.stop)
        self.token = "local-mcp-test-token"
        verifier = patch.object(
            mcp_server.provider,
            "load_access_token",
            AsyncMock(
                return_value=AccessToken(
                    token=self.token,
                    client_id="local-test",
                    scopes=["resumes:read", "resumes:write"],
                    subject=USER["user_id"],
                    resource="http://127.0.0.1:8000/mcp",
                )
            ),
        )
        verifier.start()
        self.addCleanup(verifier.stop)
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Host": "localhost:8000",
            "Accept": "application/json, text/event-stream",
        }

    def rpc(
        self, method: str, params: dict | None = None, authenticated: bool = True
    ) -> dict:
        response = self.client.post(
            "/mcp",
            headers=self.headers if authenticated else {"Host": "localhost:8000"},
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_protocol_discovery_and_authentication(self) -> None:
        response = self.client.post(
            "/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
        )
        self.assertEqual(response.status_code, 401)
        initialized = self.rpc(
            "initialize",
            {
                "protocolVersion": "2025-11-25",
                "capabilities": {},
                "clientInfo": {"name": "local-test", "version": "1"},
            },
        )
        self.assertIn("serverInfo", initialized["result"])
        tools = self.rpc("tools/list")["result"]["tools"]
        self.assertEqual(
            {tool["name"] for tool in tools},
            {
                "list_my_resumes",
                "get_tailoring_context",
                "preview_tailor_resume",
                "revise_tailor_preview",
                "confirm_tailor_resume",
                "export_resume_pdfs",
            },
        )
        response = self.client.post(
            "/mcp",
            headers={**self.headers, "Origin": "https://untrusted.example"},
            json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            "/mcp",
            headers={**self.headers, "Host": "untrusted.example"},
            json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        )
        self.assertEqual(response.status_code, 421)

    def test_listing_uses_authenticated_account_without_email_input(self) -> None:
        with patch.object(
            mcp_server, "list_resumes", AsyncMock(return_value=MagicMock(data=[]))
        ) as listing:
            result = self.rpc(
                "tools/call", {"name": "list_my_resumes", "arguments": {}}
            )["result"]
        self.assertFalse(result.get("isError", False), result)
        self.assertEqual(listing.call_args.kwargs["user"]["user_id"], USER["user_id"])
        tools = self.rpc("tools/list")["result"]["tools"]
        tool = next(tool for tool in tools if tool["name"] == "list_my_resumes")
        self.assertFalse(tool["inputSchema"].get("properties"))

    def test_listing_requires_upload_or_ready_resume_before_tailoring(self) -> None:
        for states, expected in [
            ([], "upload_required"),
            (["pending"], "resume_not_ready"),
            (["ready"], "ready"),
        ]:
            with self.subTest(status=expected):
                entries = []
                for state in states:
                    item = MagicMock()
                    item.model_dump.return_value = {
                        "resume_id": "source",
                        "processing_status": state,
                    }
                    entries.append(item)
                with patch.object(
                    mcp_server,
                    "list_resumes",
                    AsyncMock(return_value=MagicMock(data=entries)),
                ):
                    result = self.rpc(
                        "tools/call",
                        {
                            "name": "list_my_resumes",
                            "arguments": {},
                        },
                    )["result"]
                self.assertFalse(result.get("isError", False), result)
                self.assertEqual(result["structuredContent"]["status"], expected)
                self.assertIn("website_url", result["structuredContent"])

    def test_local_flow_preview_review_confirm_export(self) -> None:
        database = MagicMock()
        database.get_resume.return_value = copy.deepcopy(RESUME)
        database.create_job.return_value = {"job_id": "preview", "resume_id": "source"}
        job: dict = {"resume_id": "source"}

        def update_job(job_id: str, updates: dict, user_id: str) -> dict:
            self.assertEqual(user_id, USER["user_id"])
            job.update(copy.deepcopy(updates))
            return job

        database.update_job.side_effect = update_job
        database.get_job.side_effect = lambda job_id, user_id: (
            copy.deepcopy(job) if user_id == USER["user_id"] else None
        )
        database.claim_mcp_preview.return_value = True
        database.create_resume.return_value = {"resume_id": "tailored"}
        with (
            patch.object(mcp_tailoring, "db", database),
            patch(
                "app.llm.complete_json",
                AsyncMock(side_effect=AssertionError("MCP must not call an LLM")),
            ) as provider,
            patch.object(
                mcp_tailoring,
                "render_resume_pdf",
                AsyncMock(return_value=b"%PDF-local"),
            ),
            patch.object(mcp_tailoring, "upload_bytes_to_s3") as upload,
            patch.object(
                mcp_tailoring,
                "generate_presigned_get_url",
                return_value="https://s3.example/signed",
            ) as presign,
        ):
            result = self.rpc(
                "tools/call",
                {
                    "name": "get_tailoring_context",
                    "arguments": {
                        "resume_id": "source",
                        "job_description": "An engineering role requiring Python and API development experience.",
                    },
                },
            )["result"]
            self.assertFalse(result.get("isError", False), result)
            payload = result["structuredContent"]
            revision = payload["preview_revision"]
            draft = copy.deepcopy(payload["original_resume"])
            draft["summary"] = "Agent-authored summary"
            result = self.rpc(
                "tools/call",
                {
                    "name": "preview_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": revision,
                        "improved_data": draft,
                        "title": "Engineer",
                        "improvements": ["Focus summary"],
                    },
                },
            )["result"]
            self.assertFalse(result.get("isError", False), result)
            revision = result["structuredContent"]["preview_revision"]
            database.create_resume.assert_not_called()
            denied = self.rpc(
                "tools/call",
                {
                    "name": "confirm_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": revision,
                        "approved": False,
                    },
                },
            )["result"]
            self.assertTrue(denied["isError"])
            stale = self.rpc(
                "tools/call",
                {
                    "name": "confirm_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": "stale",
                        "approved": True,
                    },
                },
            )["result"]
            self.assertTrue(stale["isError"])
            database.create_resume.assert_not_called()
            saved = self.rpc(
                "tools/call",
                {
                    "name": "confirm_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": revision,
                        "approved": True,
                    },
                },
            )["result"]
            self.assertEqual(saved["structuredContent"]["resume_id"], "tailored")
            self.rpc(
                "tools/call",
                {
                    "name": "confirm_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": revision,
                        "approved": True,
                    },
                },
            )
            self.assertEqual(database.create_resume.call_count, 1)
            self.assertEqual(
                database.create_resume.call_args.kwargs["processed_data"]["summary"],
                "Agent-authored summary",
            )
            provider.assert_not_awaited()
            database.get_resume.return_value = {
                **RESUME,
                "resume_id": "tailored",
                "parent_id": "source",
            }
            exported = self.rpc(
                "tools/call",
                {"name": "export_resume_pdfs", "arguments": {"resume_id": "tailored"}},
            )["result"]
            self.assertFalse(exported.get("isError", False), exported)
            self.assertEqual(
                exported["structuredContent"]["files"][0]["download_url"],
                "https://s3.example/signed",
            )
            self.assertIn("/user-1/tailored/", upload.call_args.kwargs["key"])
            self.assertEqual(upload.call_args.kwargs["data"], b"%PDF-local")
            presign.assert_called_once()

    def test_write_scope_requires_reauthorization_without_calling_service(self) -> None:
        access = AccessToken(
            token=self.token,
            client_id="local-test",
            subject=USER["user_id"],
            scopes=["resumes:read"],
        )
        with (
            patch.object(
                mcp_server.provider, "load_access_token", AsyncMock(return_value=access)
            ),
            patch.object(
                mcp_tailoring, "preview_tailoring", new_callable=AsyncMock
            ) as service,
        ):
            result = self.rpc(
                "tools/call",
                {
                    "name": "preview_tailor_resume",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": "revision",
                        "improved_data": RESUME["processed_data"],
                        "title": "Engineer",
                        "improvements": [],
                    },
                },
            )["result"]
        self.assertTrue(result["isError"])
        self.assertIn("resumes:write", result["_meta"]["mcp/www_authenticate"][0])
        service.assert_not_awaited()

    def test_errors_do_not_leak_provider_details(self) -> None:
        with patch.object(
            mcp_tailoring,
            "get_context",
            AsyncMock(side_effect=RuntimeError("private-api-key")),
        ):
            result = self.rpc(
                "tools/call",
                {
                    "name": "get_tailoring_context",
                    "arguments": {"resume_id": "source", "job_description": "Some JD"},
                },
            )
        self.assertTrue(result["result"]["isError"])
        self.assertNotIn("private-api-key", str(result))

    def test_sites_identity_is_signed_and_resolves_existing_account(self) -> None:
        now = int(time.time())
        secret = "local-bridge-secret"
        assertion = jwt.encode(
            {
                "iss": "jd2resume-sites",
                "aud": "jd2resume-mcp",
                "sub": "sites-user",
                "email": USER["email"],
                "iat": now,
                "exp": now + 60,
            },
            secret,
            algorithm="HS256",
        )
        users = MagicMock()
        users.find_one = AsyncMock(return_value=USER)
        headers = {**self.headers, "X-MCP-Bridge-Token": assertion}
        headers.pop("Authorization")
        with (
            patch.object(mcp_server.settings, "mcp_bridge_secret", secret),
            patch.object(mcp_server, "get_users_collection", return_value=users),
        ):
            response = self.client.post(
                "/mcp",
                headers=headers,
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
            )
            self.assertEqual(response.status_code, 200)
            users.find_one.assert_awaited_with(
                {"email": USER["email"], "provider": "google"}
            )
            users.find_one.return_value = None
            response = self.client.post(
                "/mcp",
                headers=headers,
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
            )
            self.assertEqual(response.status_code, 200)
            with patch.object(
                mcp_server, "list_resumes", new_callable=AsyncMock
            ) as listing:
                response = self.client.post(
                    "/mcp",
                    headers=headers,
                    json={
                        "jsonrpc": "2.0",
                        "id": 2,
                        "method": "tools/call",
                        "params": {
                            "name": "list_my_resumes",
                            "arguments": {},
                        },
                    },
                )
                onboarding = response.json()["result"]["structuredContent"]
                self.assertEqual(onboarding["status"], "account_required")
                self.assertIn("Create an account", onboarding["message"])
                self.assertEqual(
                    onboarding["website_url"],
                    mcp_server.settings.frontend_base_url.rstrip("/"),
                )
                listing.assert_not_awaited()
                response = self.client.post(
                    "/mcp",
                    headers=headers,
                    json={
                        "jsonrpc": "2.0",
                        "id": 3,
                        "method": "tools/call",
                        "params": {
                            "name": "get_tailoring_context",
                            "arguments": {
                                "resume_id": "source",
                                "job_description": "Some JD",
                            },
                        },
                    },
                )
                self.assertTrue(response.json()["result"]["isError"])
            headers["X-MCP-Bridge-Token"] = assertion + "tampered"
            response = self.client.post(
                "/mcp",
                headers=headers,
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
            )
            self.assertEqual(response.status_code, 401)

    def test_source_edits_and_concurrent_confirmation_are_rejected(self) -> None:
        database = MagicMock()
        job = {
            "resume_id": "source",
            "mcp_source_hash": mcp_tailoring.resume_fingerprint(RESUME),
            "mcp_preview_revision": "revision",
            "mcp_preview": {
                "resume_preview": RESUME["processed_data"],
                "improvements": [],
                "detailed_changes": [],
            },
        }
        database.get_job.return_value = job
        database.get_resume.return_value = {**RESUME, "content": "edited"}
        with (
            patch.object(mcp_tailoring, "db", database),
        ):
            params = {
                "name": "confirm_tailor_resume",
                "arguments": {
                    "preview_id": "preview",
                    "preview_revision": "revision",
                    "approved": True,
                },
            }
            result = self.rpc("tools/call", params)
            self.assertTrue(result["result"]["isError"])
            database.get_resume.return_value = RESUME
            database.claim_mcp_preview.return_value = False
            result = self.rpc("tools/call", params)
            self.assertTrue(result["result"]["isError"])
            database.create_resume.assert_not_called()

    def test_feedback_revises_draft_without_saving_source(self) -> None:
        database = MagicMock()
        data = copy.deepcopy(RESUME["processed_data"])
        data["workExperience"] = [
            {"title": "Engineer", "company": "Acme", "description": ["Old bullet"]}
        ]
        original = {**RESUME, "processed_data": data}
        job = {
            "resume_id": "source",
            "mcp_source_hash": mcp_tailoring.resume_fingerprint(original),
            "mcp_preview_revision": "revision",
            "mcp_preview": {"resume_preview": data},
        }
        database.get_job.return_value = job
        database.get_resume.return_value = original
        database.claim_mcp_preview.return_value = True
        draft = copy.deepcopy(data)
        draft["workExperience"][0]["description"] = ["New bullet"]
        with patch.object(mcp_tailoring, "db", database):
            result = self.rpc(
                "tools/call",
                {
                    "name": "revise_tailor_preview",
                    "arguments": {
                        "preview_id": "preview",
                        "preview_revision": "revision",
                        "improved_data": draft,
                        "title": "Engineer",
                        "improvements": ["Be concise"],
                    },
                },
            )["result"]
        self.assertFalse(result.get("isError", False), result)
        revised = result["structuredContent"]
        self.assertNotEqual(revised["preview_revision"], "revision")
        self.assertEqual(
            revised["resume_preview"]["workExperience"][0]["description"],
            ["New bullet"],
        )
        self.assertEqual(data["workExperience"][0]["description"], ["Old bullet"])
        database.update_resume.assert_not_called()


if __name__ == "__main__":
    unittest.main()
