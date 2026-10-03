"""Exercise the running localhost MCP server using an existing account.

Developer-only CLI: reads one JSON request from stdin and keeps its short-lived
test credential in memory. It is never exposed by the web application.
"""

import asyncio
import json
import logging
import re
import sys
from datetime import timedelta
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from app.auth.mcp_oauth import SCOPES, provider
from app.auth.mongo import get_users_collection
from app.config import settings

logger = logging.getLogger(__name__)


async def run(request: dict[str, Any]) -> dict[str, Any]:
    """Call a real MCP tool under the explicitly selected test account."""
    email = request["email"].strip()
    user = await get_users_collection().find_one(
        {
            "provider": "google",
            "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"},
        }
    )
    if not user:
        raise ValueError("No existing JD2Resume account found for that email.")
    tokens = await provider.issue_tokens(user["user_id"], "local-test-drive", SCOPES)
    token = tokens.access_token
    async with (
        streamablehttp_client(
            f"http://127.0.0.1:{settings.port}/mcp",
            headers={"Authorization": f"Bearer {token}"},
            timeout=timedelta(minutes=20),
            sse_read_timeout=timedelta(minutes=20),
        ) as (read, write, _),
        ClientSession(
            read, write, read_timeout_seconds=timedelta(minutes=20)
        ) as session,
    ):
        await session.initialize()
        result = await session.call_tool(request["tool"], request.get("arguments", {}))
        return result.model_dump(mode="json", exclude_none=True)


if __name__ == "__main__":
    try:
        output = asyncio.run(run(json.load(sys.stdin)))
        print(json.dumps(output, ensure_ascii=False))
    except Exception:
        logger.exception("Local MCP test failed")
        print(
            "Local MCP test failed. Check the backend logs and account configuration.",
            file=sys.stderr,
        )
        sys.exit(1)
