"""Small, self-contained browser pages for MCP consent and sign-in messages."""

from html import escape
from typing import Any
from urllib.parse import urlsplit

from starlette.responses import HTMLResponse

STYLES = """
:root {
  color-scheme: only light;
  --canvas: #F0F0E8;
  --paper: #FFFFFF;
  --ink: #000000;
  --secondary: #4B5563;
  --accent: #1D4ED8;
  --success: #15803D;
  --serif: Georgia, 'Times New Roman', serif;
  --sans: Arial, Helvetica, sans-serif;
  --mono: 'SFMono-Regular', Consolas, monospace;
}
* { box-sizing: border-box; }
html, body { overflow-x: clip; }
body {
  margin: 0; padding: 48px 24px; min-height: 100svh;
  display: grid; place-items: center;
  background: var(--canvas); color: var(--ink);
  font: 16px/1.5 var(--sans);
}
main {
  width: 100%; max-width: 600px; min-width: 0;
  border: 1px solid var(--ink); background: var(--paper);
  box-shadow: 8px 8px 0 var(--ink);
}
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 32px; border-bottom: 1px solid var(--ink);
}
.brand-mark {
  display: grid; place-items: center; flex: 0 0 32px; height: 32px;
  background: var(--ink); color: var(--paper);
  font: 700 12px var(--mono);
}
.brand-name { font: 700 20px var(--serif); }
.content { padding: 28px 32px 32px; }
.label {
  margin: 0; font: 11px/1.5 var(--mono); letter-spacing: .08em;
  text-transform: uppercase; color: var(--secondary);
}
h1 {
  margin: 8px 0 12px; font: 700 clamp(30px, 6vw, 38px)/1.15 var(--serif);
  overflow-wrap: anywhere; min-width: 0;
}
p { margin: 0 0 16px; }
.intro { color: var(--secondary); }
.origin { font: 12px/1.5 var(--mono); overflow-wrap: anywhere; }
.account { margin: 24px 0; padding: 16px; background: var(--canvas); }
.account .label { display: flex; align-items: center; gap: 8px; }
.account.signed-in .label::before {
  content: ''; width: 8px; height: 8px; background: var(--success);
}
.identity { display: block; margin-top: 4px; overflow-wrap: anywhere; }
.account p { margin: 4px 0 0; font-size: 14px; }
.permissions { margin: 8px 0 0; padding: 0; list-style: none; }
.permissions li {
  display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 12px;
  padding: 16px 0; border-bottom: 1px solid var(--ink);
}
.number { padding-top: 3px; font: 11px/1.5 var(--mono); color: var(--secondary); }
.permissions strong { display: block; font-size: 15px; }
.permissions p { margin: 4px 0 0; color: var(--secondary); font-size: 14px; }
.review-note { margin: 20px 0; font-size: 14px; }
.review-note strong { display: block; margin-bottom: 4px; }
.review-note p { margin: 0; color: var(--secondary); }
details { font-size: 13px; }
summary { width: fit-content; cursor: pointer; color: var(--secondary); }
summary:hover { color: var(--ink); }
dl { margin: 12px 0 0; }
dt { margin-top: 12px; font: 10px/1.5 var(--mono); text-transform: uppercase; }
dd { margin: 4px 0 0; }
code { font: 12px/1.6 var(--mono); overflow-wrap: anywhere; }
form { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; margin-top: 24px; }
button {
  min-height: 48px; padding: 12px 20px; border: 1px solid var(--ink);
  border-radius: 0; font: 700 14px/1.5 var(--sans); cursor: pointer;
  background: var(--paper); color: var(--ink);
  transition: transform 120ms ease, box-shadow 120ms ease;
}
button.primary {
  background: var(--accent); color: var(--paper); box-shadow: 3px 3px 0 var(--ink);
}
button.primary:hover { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--ink); }
button.primary:active { transform: translate(3px, 3px); box-shadow: none; }
button.secondary:hover { background: var(--canvas); }
button:focus-visible, summary:focus-visible, a:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 4px;
}
a { color: var(--accent); text-underline-offset: 3px; }
.footnote { margin: 16px 0 0; font-size: 12px; color: var(--secondary); }
@media (max-width: 480px) {
  body { padding: 24px 16px; }
  main { box-shadow: 4px 4px 0 var(--ink); }
  .brand { padding: 16px 20px; }
  .content { padding: 24px 20px; }
  form { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { button { transition: none; } }
"""


def page(
    title: str,
    content: str,
    status: int = 200,
    *,
    form_redirect_uri: str | None = None,
) -> HTMLResponse:
    """Use the same accessible shell for consent, cancellation and sign-in errors."""
    form_action = "'self'"
    if form_redirect_uri:
        target = urlsplit(form_redirect_uri)
        if (
            target.scheme not in {"http", "https"}
            or not target.hostname
            or target.username
            or target.password
            or any(character in target.netloc for character in "\"'; \t\r\n")
        ):
            raise ValueError("Invalid consent redirect origin")
        # Chromium checks form-action again after the POST's 302 redirect.
        # The callback has already been validated against the client's registered URIs.
        form_action += f" https://accounts.google.com {target.scheme}://{target.netloc}"
    return HTMLResponse(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="color-scheme" content="light">'
        f"<title>{escape(title)} | JD2Resume</title><style>{STYLES}</style></head><body>"
        '<main aria-labelledby="page-title"><header class="brand">'
        '<span class="brand-mark" aria-hidden="true">JD</span>'
        '<span class="brand-name">JD2Resume</span></header><div class="content">'
        '<p class="label">Account connection</p>'
        f'<h1 id="page-title">{escape(title)}</h1>{content}</div></main></body></html>',
        status_code=status,
        headers={
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
            "X-Frame-Options": "DENY",
            "Content-Security-Policy": f"default-src 'none'; style-src 'unsafe-inline'; form-action {form_action}; base-uri 'none'; frame-ancestors 'none'",
        },
    )


def expired_connection() -> HTMLResponse:
    """Keep stale links and repeated approvals actionable without replaying a grant."""
    return page(
        "Start a new connection",
        '<p class="intro">This request has expired, was already used, or belongs to another browser.</p>'
        "<p>Return to your assistant and start the JD2Resume connection again. "
        "Use the new link in the same browser through sign-in and approval.</p>",
        400,
    )


def consent_content(
    request_id: str,
    pending: dict[str, Any],
    account: dict[str, Any] | None,
    scopes: list[str],
) -> str:
    """Render requested permissions without changing the browser-bound consent form."""
    name = escape(pending["client_name"] or pending["client_id"])
    client_id = pending["client_id"]
    try:
        origin = urlsplit(client_id).hostname or client_id
    except ValueError:
        origin = client_id
    identity = (
        '<section class="account signed-in" aria-label="Connected account">'
        '<p class="label">Signed in with Google</p>'
        f'<strong class="identity">{escape(account.get("email", ""))}</strong></section>'
        if account
        else '<section class="account" aria-label="Sign-in required">'
        '<p class="label">Choose your account</p>'
        "<p>Continue with Google to choose the JD2Resume account you want to connect.</p></section>"
    )
    permissions = []
    for scope, title, description in (
        (
            "resumes:read",
            "Read your saved resumes",
            "View resume details to prepare tailored drafts.",
        ),
        (
            "resumes:write",
            "Create tailored copies and PDFs",
            "Save approved drafts and export downloadable PDFs.",
        ),
    ):
        if scope in scopes:
            permissions.append(
                f'<li><span class="number" aria-hidden="true">{len(permissions) + 1:02d}</span>'
                f"<div><strong>{title}</strong><p>{description}</p></div></li>"
            )
    label = "Allow access" if account else "Continue with Google"
    return (
        f'<p class="intro">{name} is requesting access to your JD2Resume account.</p>'
        f'<p class="origin">Request from {escape(origin)}</p>{identity}'
        '<section aria-labelledby="permissions-title">'
        '<h2 class="label" id="permissions-title">Requested permissions</h2>'
        f'<ul class="permissions">{"".join(permissions)}</ul></section>'
        '<div class="review-note"><strong>Your approval comes first.</strong>'
        "<p>You will review and approve resume edits before saving them.</p></div>"
        "<details><summary>Connection details</summary><dl><dt>Client ID</dt>"
        f"<dd><code>{escape(client_id)}</code></dd><dt>Return address</dt>"
        f"<dd><code>{escape(pending['params']['redirect_uri'])}</code></dd></dl></details>"
        '<form method="post" action="/mcp/oauth/consent">'
        f'<input type="hidden" name="request_id" value="{escape(request_id, quote=True)}">'
        f'<input type="hidden" name="csrf" value="{escape(pending["csrf"], quote=True)}">'
        f'<button class="primary" type="submit" name="decision" value="allow">{label}</button>'
        '<button class="secondary" type="submit" name="decision" value="deny">Cancel</button></form>'
        f'<p class="footnote">Connecting gives {name} the permissions listed above.</p>'
    )
