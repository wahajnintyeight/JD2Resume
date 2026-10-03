# JD2Resume MCP

The FastAPI app exposes authenticated, stateless Streamable HTTP at `/mcp`
(not `/api/v1/mcp`). The official Python MCP SDK handles initialization, discovery,
input schemas, and tool calls. Existing REST routes retain precedence.

## Conversation flow

1. The MCP client prompts the user to connect through browser OAuth. The user
   approves client-specific permissions and signs in with Google using the app's
   credentials and an MCP-only callback. Call `list_my_resumes()` with no arguments.
   It returns `status`, `website_url`, `message` and `resumes`. For `upload_required`,
   ask them to upload first. For `resume_not_ready`, wait for processing or upload a
   new resume. Only `ready` proceeds to resume selection. Users without an app account
   receive website signup/upload guidance during connection. No tool accepts an email
   as an account selector. `website_url` uses `FRONTEND_BASE_URL`.
2. Ask for a JD. `get_tailoring_context(resume_id, job_description)` returns the
   full source resume, JD, preview ID and revision. The calling assistant **is the
   tailoring LLM**: it decides what to rewrite, add or remove from verified facts.
   The MCP workflow makes no LLM provider calls and needs no provider API key.
3. Submit the assistant-authored complete `ResumeData` using
   `preview_tailor_resume(preview_id, preview_revision, improved_data, title,
improvements, cover_letter?, outreach_message?)`. Contact fields are validated;
   existing deterministic diff logic produces zero-based change indices. Show the
   complete draft and changes, including optional letters, and ask for suggestions
   or approval. Apply user feedback in the assistant and submit a complete new draft
   through `revise_tailor_preview` with the same arguments. Source resumes stay intact.
   The diff is advisory: custom sections and section ordering may not appear in it.
4. After explicit user approval, call
   `confirm_tailor_resume(preview_id, preview_revision, approved=true,
rejected_change_indices=[])`. This reuses selective rejection and saves a new
   tailored resume. The revision must be the one just reviewed. Source edits invalidate
   drafts; an atomic Mongo claim prevents concurrent confirmation/revision writes.
   Repeat confirmation returns the saved ID. Tool descriptions guide the agent's
   approval conversation; the boolean does not independently prove human consent.
5. `export_resume_pdfs(resume_id, template="swiss-single", page_size="A4",
include_cover_letter=false)` renders existing Next.js print pages, uploads the
   result through the existing S3 helpers, stores object keys, and returns presigned
   download links. Cover-letter export requires an assistant-authored cover letter.
   Export retries target the same user/resume/filename object, without creating
   another tailored resume. URLs expire according to `S3_PRESIGN_TTL_SECONDS`.

Preview handles are persisted in the existing user-scoped jobs collection, so
they survive server restarts and do not rely on a protocol session. If confirmation
fails after claiming a draft, the draft stays busy because the database operation may
have already written data. Inspect the job/resume records before clearing `mcp_busy`
or start a new preview; automatically retrying an uncertain save risks duplicates.

## Authentication

Direct MCP connections use OAuth authorization-code flow with PKCE S256. An
unauthenticated request receives HTTP 401 with a Bearer `WWW-Authenticate` challenge.
Public discovery metadata describes the issuer, resource and supported clients.
The installed MCP SDK handles OAuth validation, exact registered callback matching
and PKCE verification. Google proves identity; JD2Resume issues its own opaque MCP
credentials. Website session cookies/tokens and Google tokens are not accepted as
MCP bearer credentials. A valid website session may be reused in the browser consent
page, with explicit permission for the requesting client.

MCP sign-in looks up existing Google accounts by subject (`google_sub`/`user_id`),
never by the email returned by Google. It does not modify the website's user-upsert,
login, callback or session behavior. The MCP-only Google callback is
`/mcp/oauth/google/callback`. An unknown Google account must sign in and upload on the
website first; MCP does not create users.

Permissions are `resumes:read` for listing/source context and `resumes:write` for
drafts, saving and PDF exports. Tools advertise OAuth scopes and return native
reauthorization metadata if an additional permission is needed. Tokens and one-use
codes are hashed in the `mcp_oauth` Mongo collection; records expire through a TTL
index. Access lasts 10 minutes; grants/rotating refresh tokens last up to 30 days.
Refresh replay revokes the grant. Revocation and account removal stop access.
Google state is one-use and browser-bound; consent is protected against CSRF and
clickjacking. The consent page separates the requesting client, Google account and
requested permissions; full client/callback URLs are available in expandable details.
Its Content Security Policy allows form redirects to the registered client's callback
origin and Google sign-in, because Chromium enforces `form-action` after a POST's
redirect too. Other origins remain blocked. Expired or repeated approvals show a
400 page directing the user to start a new connection in their assistant.
A separate five-minute internal print credential supports existing PDF
pages without exposing an MCP credential in a print URL.

Raw Sites identity headers are never trusted by the backend. MCP Host and Origin
checks use `MCP_ALLOWED_HOSTS` and `CORS_ORIGINS`.

### Production configuration

Set `MCP_PUBLIC_BASE_URL` to the canonical externally reachable backend origin,
including the HTTPS scheme and hostname, with no `/api/v1` suffix. Its local default
is the loopback backend origin on port 1110. Set `PORT=1110` for the backend. Add
the resulting `/mcp/oauth/google/callback` redirect URI to the existing Google OAuth client's
allowed redirects. The configured `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
are reused. Keep the website's existing redirect URI registered too.

Clients can use CIMD metadata hosted on an explicitly trusted public host
(`MCP_OAUTH_METADATA_HOSTS`, default `chatgpt.com`) or pre-registered public clients
configured through `MCP_OAUTH_CLIENTS` (JSON mapping client IDs to `client_name` and
`redirect_uris`). Use the exact callback/metadata identity supplied by the client's
configuration screen. Remote metadata fetches are size-limited, HTTPS-only and do
not follow redirects. Public client token exchange uses authentication method `none`
with PKCE. Dynamic registration and private-key client assertions are not implemented.

Forward these routes through Nginx in addition to the existing `/mcp` proxy:

```nginx
location ~ ^/(\.well-known/oauth-|authorize$|token$|revoke$|mcp/oauth/) {
    proxy_pass http://127.0.0.1:1110;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Discovery is `GET /.well-known/oauth-protected-resource/mcp` and
`GET /.well-known/oauth-authorization-server`; authorization is `GET /authorize`,
code/refresh exchange is `POST /token`, and disconnect is `POST /revoke`.

The optional `apps/mcp-sites/worker.mjs` adapter is a Cloudflare-compatible ESM
Worker. Sites owns OAuth and supplies verified user identity at its hosting boundary.
The Worker signs a 60-second assertion with `MCP_BRIDGE_SECRET` and proxies to
`https://api-jd2resume.theprojectphoenix.top/mcp`. The backend must have the same
dedicated secret, resolves the verified email to an **existing Google account**,
and applies its user ID. Missing accounts can discover tools and receive signup/upload instructions; all
resume access and tailoring tools are blocked. The bridge creates no users.
Configure `JD2RESUME_BACKEND_URL` to change the trusted upstream (HTTPS required).
Never reuse the app session-signing secret as the bridge secret.

The adapter is local source only until Sites registration/publishing is requested.
For deployment, register this adapter as a private Site, add `"mcp"` to its actual
`.openai/hosting.json` capabilities, configure the secret through Sites, and build
with `npm run build` in `apps/mcp-sites` (entrypoint `dist/server/index.js`). Use the
Site-provisioned plugin and OAuth connection. Do not configure local stdio MCP or
replace Sites OAuth. A localhost backend cannot be reached by a hosted Worker.

## Local verification

Run in `apps/backend`:

```powershell
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 1110
```

For real PDFs, also run `npm run dev` in `apps/frontend`, set the backend's
`FRONTEND_BASE_URL=http://127.0.0.1:3333`, and ensure the frontend's
`NEXT_PUBLIC_API_URL` reaches this local backend. Google login must have a registered
local redirect URI. Connect through OAuth for data-bearing calls.
MongoDB, S3 and Chromium must be configured for a real full-flow test.

```powershell
# In apps/backend; protocol/workflow checks mock external side effects.
uv run --with pytest python -m pytest tests/test_mcp_workflow.py tests/test_mcp_oauth.py -q

# In apps/mcp-sites; validates signed identity forwarding without live requests.
npm test
npm run build
```

Initialization/discovery require authentication too and contain no resume data.
Backend/provider exception details are logged server-side; MCP returns a generic
failure. Known workflow-validation failures return actionable messages.

For an interactive developer test with a real existing account, run
`scripts/mcp_test_drive.py` from `apps/backend` and supply a JSON object on stdin
with `email`, `tool`, and `arguments`. It resolves that account directly using the
developer's MongoDB credentials, then calls the running localhost MCP endpoint
with a 10-minute opaque test credential backed by the MCP grant collection. This CLI
is not an HTTP endpoint or a production sign-in path. Use it only for accounts you
are authorized to test.

```powershell
'{"email":"your-account@example.com","tool":"list_my_resumes","arguments":{}}' | uv run python scripts/mcp_test_drive.py
```

Relevant implementation: `app/mcp_server.py`, `app/services/mcp_tailoring.py`,
`app/mongo_database.py::claim_mcp_preview`, and `apps/mcp-sites/worker.mjs`.
