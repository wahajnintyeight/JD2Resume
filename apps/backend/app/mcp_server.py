"""Authenticated stateless MCP transport for the existing FastAPI application."""

import logging
import time
from collections.abc import Callable
from contextvars import ContextVar
from functools import wraps
from typing import Any, Literal

from fastapi import HTTPException, Request
from jose import jwt
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import CallToolResult, TextContent, Tool, ToolAnnotations
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.auth.context import current_user_id_var, set_current_user_id
from app.auth.jwt import create_session_token
from app.auth.mcp_oauth import SCOPES, issuer, provider
from app.auth.mongo import get_users_collection
from app.config import settings
from app.routers.resumes import list_resumes
from app.schemas import ResumeData
from app.services import mcp_tailoring

logger = logging.getLogger(__name__)
current_mcp_user: ContextVar[dict[str, Any]] = ContextVar("mcp_user")
current_mcp_token: ContextVar[str] = ContextVar("mcp_token")
current_mcp_scopes: ContextVar[set[str]] = ContextVar("mcp_scopes")

mcp = FastMCP(
    "JD2Resume",
    instructions=(
        "The user must connect and sign in before tailoring. Never ask for an email, password or token. "
        "Call list_my_resumes first. If upload_required, ask the user to upload a resume at website_url. "
        "If resume_not_ready, ask them to wait for processing or upload a new resume. "
        "Only when ready ask which resume to tailor. "
        "Ask for the job description and call get_tailoring_context. YOU are the LLM: "
        "decide what to change, remove or add using source facts; never invent credentials. "
        "Submit your complete structured draft to preview_tailor_resume, show the complete "
        "draft and numbered changes, and ask for suggestions or approval. Apply feedback "
        "yourself and submit a new draft with revise_tailor_preview. Tools never call an LLM. "
        "Never confirm until the user approves the latest preview. After confirmation, "
        "call export_resume_pdfs and return the expiring download links. "
        "Tools only access the authenticated account."
    ),
    stateless_http=True,
    json_response=True,
    transport_security=TransportSecuritySettings(
        allowed_hosts=settings.mcp_allowed_hosts,
        allowed_origins=settings.cors_origins,
    ),
)


def required_scope(name: str) -> str:
    return (
        "resumes:read"
        if name in {"list_my_resumes", "get_tailoring_context"}
        else "resumes:write"
    )


def tool_errors(function: Callable[..., Any]) -> Callable[..., Any]:
    """Keep existing endpoint/provider details out of MCP error responses."""

    @wraps(function)
    async def wrapped(*args: Any, **kwargs: Any) -> Any:
        try:
            if (
                function.__name__ != "list_my_resumes"
                and not current_mcp_user.get().get("user_id")
            ):
                raise ValueError(
                    f"Create a JD2Resume account and upload a resume at {settings.frontend_base_url} first."
                )
            required = required_scope(function.__name__)
            if required not in current_mcp_scopes.get():
                challenge = f'Bearer resource_metadata="{issuer()}/.well-known/oauth-protected-resource/mcp", error="insufficient_scope", error_description="Approve resume access to continue", scope="{required}"'
                return CallToolResult(
                    content=[
                        TextContent(
                            type="text",
                            text="Reconnect JD2Resume and approve the requested permission.",
                        )
                    ],
                    structuredContent={},
                    isError=True,
                    _meta={"mcp/www_authenticate": [challenge]},
                )
            return await function(*args, **kwargs)
        except ValueError as error:
            # Workflow validation messages are authored here; provider failures are
            # wrapped by the existing routers as HTTPException instead.
            raise ToolError(str(error)) from error
        except Exception as error:
            logger.exception("MCP tool %s failed", function.__name__)
            raise ToolError("Operation failed. Please try again.") from error

    return wrapped


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False))
@tool_errors
async def list_my_resumes() -> dict[str, Any]:
    """List the signed-in account's resumes. No account identifier is supplied by the caller."""
    user = current_mcp_user.get()
    website_url = settings.frontend_base_url.rstrip("/")
    if not user.get("user_id"):
        return {
            "status": "account_required",
            "resumes": [],
            "website_url": website_url,
            "message": "Create an account and upload your resume on the website first, then return here.",
        }
    result = await list_resumes(include_master=True, user=user)
    resumes = [item.model_dump(mode="json") for item in result.data]
    status = (
        "ready"
        if any(item.get("processing_status") == "ready" for item in resumes)
        else ("resume_not_ready" if resumes else "upload_required")
    )
    messages = {
        "ready": "Ask which ready resume the user wants to tailor.",
        "upload_required": "Upload a resume on the website first, then return here.",
        "resume_not_ready": "Wait for resume processing or upload a new resume on the website first.",
    }
    return {
        "status": status,
        "resumes": resumes,
        "website_url": website_url,
        "message": messages[status],
    }


@mcp.tool(annotations=ToolAnnotations(destructiveHint=False))
@tool_errors
async def get_tailoring_context(resume_id: str, job_description: str) -> dict[str, Any]:
    """Fetch the selected source and JD. YOU author the draft; no LLM provider is invoked."""
    return await mcp_tailoring.get_context(
        resume_id, job_description, current_mcp_user.get()
    )


@mcp.tool(annotations=ToolAnnotations(destructiveHint=False))
@tool_errors
async def preview_tailor_resume(
    preview_id: str,
    preview_revision: str,
    improved_data: ResumeData,
    title: str,
    improvements: list[str],
    cover_letter: str | None = None,
    outreach_message: str | None = None,
) -> dict[str, Any]:
    """Validate YOUR complete draft and return zero-based changes for user review.

    Author all content yourself from verified source facts. Include optional letters
    only when requested, and show them for review too. Never invent qualifications.
    No tailored resume is saved until confirmation. Preserve all contact fields.
    """
    return await mcp_tailoring.preview_tailoring(
        preview_id,
        preview_revision,
        improved_data,
        title,
        improvements,
        cover_letter,
        outreach_message,
        current_mcp_user.get(),
    )


@mcp.tool(annotations=ToolAnnotations(destructiveHint=False))
@tool_errors
async def revise_tailor_preview(
    preview_id: str,
    preview_revision: str,
    improved_data: ResumeData,
    title: str,
    improvements: list[str],
    cover_letter: str | None = None,
    outreach_message: str | None = None,
) -> dict[str, Any]:
    """Submit YOUR updated complete draft after user feedback; review the new revision."""
    return await mcp_tailoring.preview_tailoring(
        preview_id,
        preview_revision,
        improved_data,
        title,
        improvements,
        cover_letter,
        outreach_message,
        current_mcp_user.get(),
    )


@mcp.tool(annotations=ToolAnnotations(destructiveHint=False))
@tool_errors
async def confirm_tailor_resume(
    preview_id: str,
    preview_revision: str,
    approved: bool,
    rejected_change_indices: list[int] | None = None,
) -> dict[str, Any]:
    """Save the reviewed draft as a new resume only after explicit user approval.

    Pass zero-based indices of changes the user rejected; remaining changes are accepted.
    """
    return await mcp_tailoring.confirm_tailoring(
        preview_id,
        preview_revision,
        approved,
        rejected_change_indices or [],
        current_mcp_user.get(),
    )


@mcp.tool(annotations=ToolAnnotations(destructiveHint=False))
@tool_errors
async def export_resume_pdfs(
    resume_id: str,
    template: Literal[
        "swiss-single", "swiss-two-column", "modern", "modern-two-column", "classic-ats"
    ] = "swiss-single",
    page_size: Literal["A4", "LETTER"] = "A4",
    include_cover_letter: bool = False,
) -> dict[str, Any]:
    """Render a saved tailored resume, upload PDFs to S3, and return expiring download links."""
    return await mcp_tailoring.export_pdfs(
        resume_id,
        current_mcp_token.get(),
        current_mcp_user.get(),
        template,
        page_size,
        include_cover_letter,
    )


@mcp._mcp_server.list_tools()
async def authenticated_tool_descriptors() -> list[Tool]:
    """Advertise tool scopes both in the standard extension and OpenAI metadata."""
    result = []
    for tool in await mcp.list_tools():
        data = tool.model_dump(by_alias=True, exclude_none=True)
        schemes = [{"type": "oauth2", "scopes": [required_scope(tool.name)]}]
        data["securitySchemes"] = schemes
        data.setdefault("_meta", {})["securitySchemes"] = schemes
        result.append(Tool.model_validate(data))
    return result


async def authenticate_mcp(request: Request) -> tuple[dict[str, Any], str]:
    """Accept an MCP OAuth credential or the Sites adapter's signed identity assertion."""
    assertion = request.headers.get("X-MCP-Bridge-Token")
    if assertion:
        if not settings.mcp_bridge_secret:
            raise HTTPException(401, "Unauthorized")
        try:
            payload = jwt.decode(
                assertion,
                settings.mcp_bridge_secret,
                algorithms=["HS256"],
                audience="jd2resume-mcp",
                issuer="jd2resume-sites",
                options={"require_exp": True, "require_iat": True, "require_sub": True},
            )
            if (
                not payload.get("email")
                or not payload.get("sub")
                or not 0 < payload["exp"] - payload["iat"] <= 60
                or payload["iat"] > time.time() + 5
            ):
                raise ValueError("Invalid assertion")
            user = await get_users_collection().find_one(
                {"email": payload["email"], "provider": "google"}
            )
            if not user:
                # Verified Sites users can discover tools and receive onboarding,
                # but cannot access any account data or tailoring operations.
                return {
                    "user_id": None,
                    "email": payload["email"],
                    "provider": "google",
                }, ""
            user = {
                "user_id": user["user_id"],
                "email": user["email"],
                "provider": "google",
                "name": user.get("name"),
                "picture": user.get("picture"),
            }
            set_current_user_id(user["user_id"])
            token = create_session_token(
                subject=user["user_id"],
                provider="google",
                email=user["email"],
                name=user["name"],
                picture=user["picture"],
            )
            return user, token
        except HTTPException:
            raise
        except Exception:
            logger.warning("MCP bridge authentication failed", exc_info=True)
            raise HTTPException(401, "Unauthorized")
    header = request.headers.get("Authorization", "")
    token = (
        header.split(" ", 1)[1].strip() if header.lower().startswith("bearer ") else ""
    )
    access = await provider.load_access_token(token) if token else None
    if not access:
        raise HTTPException(401, "Sign in to connect JD2Resume.")
    account = await get_users_collection().find_one(
        {"user_id": access.subject, "provider": "google"}
    )
    if not account:
        raise HTTPException(401, "Account no longer available. Sign in again.")
    user = {
        "user_id": account["user_id"],
        "provider": "google",
        "email": account.get("email"),
        "name": account.get("name"),
        "picture": account.get("picture"),
    }
    current_mcp_scopes.set(set(access.scopes))
    set_current_user_id(user["user_id"])
    # Mint a separate five-minute internal print credential; the MCP token
    # is never sent to the website or placed in a print URL.
    now = int(time.time())
    print_token = jwt.encode(
        {
            "sub": user["user_id"],
            "provider": "google",
            "email": user["email"],
            "name": user["name"],
            "picture": user["picture"],
            "iat": now,
            "exp": now + 300,
        },
        settings.auth_jwt_secret,
        algorithm=settings.auth_jwt_algorithm,
    )
    return user, print_token


class MCPAuthentication:
    """ASGI middleware; restore account context after every request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] != "/mcp":
            await self.app(scope, receive, send)
            return
        request = Request(scope)
        account_context = current_user_id_var.set(None)
        scopes_context = current_mcp_scopes.set(set(SCOPES))
        try:
            user, token = await authenticate_mcp(request)
        except HTTPException as error:
            current_user_id_var.reset(account_context)
            current_mcp_scopes.reset(scopes_context)
            challenge = f'Bearer resource_metadata="{issuer()}/.well-known/oauth-protected-resource/mcp", scope="resumes:read resumes:write"'
            await JSONResponse(
                {"detail": error.detail},
                status_code=error.status_code,
                headers={"WWW-Authenticate": challenge, "Cache-Control": "no-store"},
            )(scope, receive, send)
            return
        except Exception:
            current_user_id_var.reset(account_context)
            current_mcp_scopes.reset(scopes_context)
            logger.exception("MCP authentication failed")
            await JSONResponse(
                {"detail": "Operation failed. Please try again."}, status_code=500
            )(scope, receive, send)
            return
        user_context = current_mcp_user.set(user)
        token_context = current_mcp_token.set(token)
        try:
            await self.app(scope, receive, send)
        finally:
            current_mcp_user.reset(user_context)
            current_mcp_token.reset(token_context)
            current_mcp_scopes.reset(scopes_context)
            current_user_id_var.reset(account_context)


mcp_app = MCPAuthentication(mcp.streamable_http_app())
