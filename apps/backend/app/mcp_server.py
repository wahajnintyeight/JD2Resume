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
from mcp.types import ToolAnnotations
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.auth.context import current_user_id_var, set_current_user_id
from app.auth.dependencies import require_authenticated_user
from app.auth.jwt import create_session_token
from app.auth.mongo import get_users_collection
from app.config import settings
from app.routers.resumes import list_resumes
from app.schemas import ResumeData
from app.services import mcp_tailoring

logger = logging.getLogger(__name__)
current_mcp_user: ContextVar[dict[str, Any]] = ContextVar("mcp_user")
current_mcp_token: ContextVar[str] = ContextVar("mcp_token")

mcp = FastMCP(
    "JD2Resume",
    instructions=(
        "Your first question must ask for the user's JD2Resume account email, unless already provided. "
        "Call list_resumes_by_email before asking for a resume or JD. If status is account_required, "
        "ask the user to create an account and upload a resume at the returned website_url, then stop. "
        "If upload_required, ask them to upload a resume there first. If resume_not_ready, ask them "
        "to wait for processing or upload a new resume. Only when ready ask which resume to tailor. "
        "Ask for the job description and call get_tailoring_context. YOU are the LLM: "
        "decide what to change, remove or add using source facts; never invent credentials. "
        "Submit your complete structured draft to preview_tailor_resume, show the complete "
        "draft and numbered changes, and ask for suggestions or approval. Apply feedback "
        "yourself and submit a new draft with revise_tailor_preview. Tools never call an LLM. "
        "Never confirm until the user approves the latest preview. After confirmation, "
        "call export_resume_pdfs and return the expiring download links. Email is a selector, "
        "not authorization; tools only access the connected account."
    ),
    stateless_http=True,
    json_response=True,
    transport_security=TransportSecuritySettings(
        allowed_hosts=settings.mcp_allowed_hosts,
        allowed_origins=settings.cors_origins,
    ),
)


def tool_errors(function: Callable[..., Any]) -> Callable[..., Any]:
    """Keep existing endpoint/provider details out of MCP error responses."""

    @wraps(function)
    async def wrapped(*args: Any, **kwargs: Any) -> Any:
        try:
            if (
                function.__name__ != "list_resumes_by_email"
                and not current_mcp_user.get().get("user_id")
            ):
                raise ValueError(
                    f"Create a JD2Resume account and upload a resume at {settings.frontend_base_url} first."
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
async def list_resumes_by_email(email: str) -> dict[str, Any]:
    """FIRST ask for email, then call this. Missing accounts must sign up and upload on website_url."""
    user = current_mcp_user.get()
    if (
        not user.get("email")
        or email.strip().casefold() != user["email"].strip().casefold()
    ):
        raise ValueError("Use the email of your authenticated JD2Resume account.")
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


async def authenticate_mcp(request: Request) -> tuple[dict[str, Any], str]:
    """Accept the app session or a Sites adapter's independently signed identity assertion."""
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
    user = await require_authenticated_user(request)
    account = await get_users_collection().find_one(
        {"user_id": user["user_id"], "provider": user["provider"]}
    )
    if not account:
        return {**user, "user_id": None}, ""
    header = request.headers.get("Authorization", "")
    token = (
        header.split(" ", 1)[1].strip()
        if header.lower().startswith("bearer ")
        else request.cookies[settings.auth_cookie_name]
    )
    return user, token


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
        try:
            user, token = await authenticate_mcp(request)
        except HTTPException as error:
            current_user_id_var.reset(account_context)
            await JSONResponse({"detail": error.detail}, status_code=error.status_code)(
                scope, receive, send
            )
            return
        user_context = current_mcp_user.set(user)
        token_context = current_mcp_token.set(token)
        try:
            await self.app(scope, receive, send)
        finally:
            current_mcp_user.reset(user_context)
            current_mcp_token.reset(token_context)
            current_user_id_var.reset(account_context)


mcp_app = MCPAuthentication(mcp.streamable_http_app())
