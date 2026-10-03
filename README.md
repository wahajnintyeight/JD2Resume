# JD2Resume

Tailor a saved resume to a job description, review the changes, and export an application-ready document. Use the web app or connect an MCP-compatible assistant through OAuth.

[Getting started](#getting-started) · [MCP](#mcp-connection) · [Configuration](#configuration) · [Development](#development) · [Help](#help-and-contributing)

JD2Resume builds on [Resume Matcher](https://github.com/srbhr/Resume-Matcher), with Google sign-in, account-based resume storage, S3 file storage, and an authenticated MCP workflow.

## What you can do

- **Manage resumes:** Upload PDF or DOCX files, keep multiple master resumes, and save tailored copies for different applications.
- **Review edits:** Preview suggested changes, accept or reject individual edits, and refine the draft before saving.
- **Build your layout:** Edit sections, reorder content, and choose from five templates with controls for fonts, spacing, margins, and A4 or US Letter pages.
- **Prepare application materials:** Generate cover letters and outreach messages alongside your resume.
- **Check your resume:** Run an AI-powered ATS scan with scores, suggestions, and a report.
- **Export:** Download resumes as PDF or editable DOCX, and cover letters as PDF. MCP PDF exports go to S3 and return temporary download links.
- **Work in your language:** Use the interface in English, Spanish, Chinese, or Japanese and configure the content generation language.

### A typical application

1. Sign in with Google and upload your resume.
2. Wait for processing, then choose the resume you want to tailor.
3. Paste the job description and review the proposed changes.
4. Add your feedback, check the final wording, and save a tailored copy.
5. Choose a template and export your documents.

## Getting started

### Requirements

| Requirement                                                                        | Used for                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Python **3.13+** and [uv](https://docs.astral.sh/uv/getting-started/installation/) | Backend dependencies and commands                          |
| Node.js **22.13+ on the 22.x line, or 24+**, and npm                               | Frontend and development tools                             |
| MongoDB, local or Atlas                                                            | Accounts, resumes, job descriptions, and MCP OAuth records |
| A Google OAuth web client                                                          | Browser sign-in                                            |
| An AI provider or a running Ollama model                                           | Resume upload parsing and web-app AI features              |
| An S3 bucket or compatible object store                                            | Original files and MCP PDF exports                         |
| Playwright Chromium                                                                | PDF rendering; installed below                             |

The web app supports OpenAI, Anthropic, Google Gemini, OpenRouter, DeepSeek, and Ollama through LiteLLM. Choose a model supported by your provider. MCP tailoring uses the connected assistant as its language model; it does not make a separate provider call. Initial resume processing in the web app still needs an AI provider.

### 1. Clone and install

```bash
git clone https://github.com/wahajnintyeight/JD2Resume.git
cd JD2Resume

cd apps/backend
uv sync
uv run playwright install chromium
cp .env.example .env

cd ../frontend
npm install
cp .env.sample .env.local
```

On Linux, use `uv run playwright install --with-deps chromium` from `apps/backend` if Chromium's system dependencies are missing. The `cp` commands also work as aliases in PowerShell.

### 2. Configure your services

Edit `apps/backend/.env`. Replace the service placeholders with your own values; the following local URLs match the commands in this README:

```dotenv
HOST=127.0.0.1
PORT=1110
FRONTEND_BASE_URL=http://localhost:3333
CORS_ORIGINS=["http://localhost:3333"]

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=jd2resume
MONGODB_USERS_COLLECTION=users

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:1110/api/v1/auth/google/callback
AUTH_JWT_SECRET=<random-session-signing-secret>
AUTH_COOKIE_SECURE=false

LLM_PROVIDER=openai
LLM_MODEL=<model-id>
LLM_API_KEY=<provider-api-key>

S3_ACCESS_KEY_ID=<storage-access-key>
S3_SECRET_ACCESS_KEY=<storage-secret-key>
S3_BUCKET_NAME=<bucket-name>
S3_REGION=<bucket-region>
S3_FOLDER_NAME=jd2resume/

MCP_PUBLIC_BASE_URL=http://localhost:1110
```

Register these authorized redirect URIs on the Google OAuth client:

- Website: `http://localhost:1110/api/v1/auth/google/callback`
- MCP, if used: `http://localhost:1110/mcp/oauth/google/callback`

Edit `apps/frontend/.env.local` so it points to the backend origin, without `/api/v1`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:1110
```

Keep `localhost` consistent across browser URLs and configuration for cookie-based sign-in. The checked-in environment examples have older frontend defaults; use the values above for this setup. Keep credentials in your local environment files or deployment secret store.

### 3. Start both servers

Backend, in one terminal from the repository root:

```bash
cd apps/backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 1110
```

Frontend, in a second terminal from the repository root:

```bash
cd apps/frontend
npm run dev
```

Open [the local app](http://localhost:3333). Sign in with Google, confirm your AI configuration in Settings, and upload a resume. The frontend development script uses port **3333**. API documentation is available at [the backend's Swagger UI](http://localhost:1110/docs).

## MCP connection

The backend exposes **Streamable HTTP at `/mcp`**. Connect by URL and select **OAuth** in your assistant's MCP settings.

Before connecting, sign in on the website and upload a resume that has finished processing. During connection, approve the requesting client's permissions and sign in with Google. The tools resolve your account from the authenticated identity; the assistant does not ask for your email to select an account. An account that has not been created on the website receives signup and upload guidance.

For a deployed server, use `https://<backend-host>/mcp`. For local development, use `http://localhost:1110/mcp` with a client running on the same computer. A hosted assistant needs a publicly reachable HTTPS endpoint.

### Connect from Codex

Replace `<backend-host>` with your deployment's hostname:

```bash
codex mcp add jd2resume --url "https://<backend-host>/mcp"
codex mcp login jd2resume
```

Some Codex versions need an explicit OAuth client metadata URL instead of automatic registration. See the [Codex connection instructions](docs/agent/features/mcp.md#codex-url-connection) for the callback-specific setup. The server supports trusted client metadata and pre-registered public clients; dynamic client registration is not implemented.

### Tailor through your assistant

Try: “List my resumes, let me choose one, then help me tailor it to this job description. Show me the draft before saving and export the approved version as a PDF.”

| Tool                    | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `list_my_resumes`       | List the authenticated account's ready resumes            |
| `get_tailoring_context` | Read the selected resume and job description              |
| `preview_tailor_resume` | Preview a complete draft written by the assistant         |
| `revise_tailor_preview` | Incorporate your suggestions into the draft               |
| `confirm_tailor_resume` | Save an approved draft as a new tailored resume           |
| `export_resume_pdfs`    | Render PDFs, upload them to S3, and return download links |

The assistant decides how to tailor the content using the source resume and your feedback. It shows the draft and asks for approval before calling the save tool. Your source resume remains available. Links expire according to `S3_PRESIGN_TTL_SECONDS` (one hour by default).

Read the [MCP guide](docs/agent/features/mcp.md) for OAuth permissions, Google callbacks, Nginx routes, client configuration, local checks, and the optional Sites adapter.

## Configuration

| Setting                                                                   | Purpose                                                                                |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `FRONTEND_BASE_URL`                                                       | Frontend origin for browser redirects and backend PDF rendering                        |
| `NEXT_PUBLIC_API_URL`                                                     | Backend origin used by the frontend; set before a production build                     |
| `CORS_ORIGINS`                                                            | JSON array of allowed frontend origins                                                 |
| `MONGODB_URI`, `MONGODB_DB`                                               | MongoDB connection and database; required at startup                                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`         | Website Google sign-in                                                                 |
| `AUTH_JWT_SECRET`, `AUTH_COOKIE_SECURE`                                   | Session signing and secure-cookie settings                                             |
| `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_API_BASE`                | Web-app AI provider configuration; `LLM_API_BASE` supports Ollama and custom endpoints |
| `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage configuration                                                           |
| `S3_ENDPOINT_URL`                                                         | Optional endpoint for S3-compatible storage                                            |
| `MCP_PUBLIC_BASE_URL`                                                     | Canonical backend origin for OAuth discovery, without `/api/v1` or `/mcp`              |
| `MCP_OAUTH_METADATA_HOSTS`, `MCP_OAUTH_CLIENTS`                           | Trusted metadata hosts and pre-registered OAuth clients                                |
| `MCP_ALLOWED_HOSTS`                                                       | Hostnames accepted by the MCP transport                                                |

For a public deployment, use HTTPS origins, a strong session signing secret, and `AUTH_COOKIE_SECURE=true`. Register the production Google callbacks and ensure the backend can reach the frontend's print pages. Proxy MCP discovery and OAuth routes along with `/mcp`; the [MCP guide](docs/agent/features/mcp.md#reverse-proxy) lists them. Use `npm run build` and `npm run start -- -p 3333` in `apps/frontend` for a production frontend.

Resumes, job descriptions, account records, and OAuth state are stored in MongoDB. Original files and MCP-generated PDFs are stored in the configured object store. Web-app AI features send resume and job content to the selected provider; MCP tailoring shares that context with the connected assistant. AI settings may also be persisted in `apps/backend/data/config.json` and can override environment defaults.

## Development

| Area        | Stack                                                     |
| ----------- | --------------------------------------------------------- |
| Frontend    | Next.js 16, React 19, TypeScript, Tailwind CSS 4          |
| Backend     | FastAPI, Python 3.13+, Pydantic, LiteLLM                  |
| Persistence | MongoDB via PyMongo and Motor                             |
| Documents   | Playwright Chromium for PDF; python-docx for Word export  |
| MCP         | Official Python MCP SDK, Streamable HTTP, OAuth with PKCE |

```text
apps/
  backend/app/       API routes, authentication, services, storage, and MCP tools
  backend/tests/     Backend regression and workflow checks
  frontend/          Web app, resume editor, templates, and print pages
  mcp-sites/         Optional Sites identity bridge
docs/agent/          Feature, API, architecture, and design documentation
```

Run frontend checks from `apps/frontend`:

```bash
npm run lint
npm run format
npm test
```

Run the MCP regression checks from `apps/backend`:

```bash
uv run --with pytest python -m pytest tests/test_mcp_workflow.py tests/test_mcp_oauth.py -q
```

These MCP checks mock external services. A full integration run needs Google OAuth, MongoDB, object storage, and both servers. For development conventions, read [AGENTS.md](AGENTS.md); additional documentation is indexed in [docs/agent](docs/agent/README.md).

## Troubleshooting

| Symptom                                      | Check                                                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Backend cannot start                         | MongoDB is reachable and the URI/database are set                                                                             |
| Google rejects a redirect                    | The callback exactly matches an authorized Google redirect URI                                                                |
| Frontend cannot reach the API                | `NEXT_PUBLIC_API_URL` points to port 1110, and `CORS_ORIGINS` includes the frontend origin; restart after environment changes |
| Resume processing fails                      | Provider credentials, model availability, and backend logs; uploads are limited to 4 MB                                       |
| PDF export fails                             | Chromium is installed and `FRONTEND_BASE_URL` reaches the running frontend                                                    |
| MCP returns 401                              | Complete OAuth in the client; a browser request to `/mcp` without a credential is expected to return 401                      |
| OAuth discovery or client registration fails | Public origin, reverse-proxy routes, and trusted metadata/pre-registered client configuration in the MCP guide                |
| Download link expires                        | Export again to obtain a fresh link                                                                                           |

## Help and contributing

Report bugs and request features in [this repository's issues](https://github.com/wahajnintyeight/JD2Resume/issues). Include reproduction steps, your platform, and relevant logs with credentials and personal resume data removed.

For contributions, fork this repository, create a branch, and open a pull request against `main`. Include what changed and how you verified it. Documentation fixes, reproducible bug reports, and code contributions are welcome. Follow [the project conventions](AGENTS.md) and run the checks relevant to your change.

Maintained in [wahajnintyeight/JD2Resume](https://github.com/wahajnintyeight/JD2Resume). See [the contributor history](https://github.com/wahajnintyeight/JD2Resume/graphs/contributors) for everyone who has contributed.

## License and attribution

Licensed under [Apache License 2.0](LICENSE). JD2Resume is derived from [Resume Matcher](https://github.com/srbhr/Resume-Matcher), created by Saurabh Rai and its contributors. Existing license and copyright notices are retained.
