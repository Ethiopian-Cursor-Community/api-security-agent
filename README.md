# API Security Agent

Autonomous API penetration testing and remediation platform powered by **Cursor SDK**.

Paste a GitHub repo link → clone → discover OpenAPI → map attack surface → simulate vulnerability scans → explain findings → auto-patch with Cursor SDK → export security reports.

## Features

- **GitHub clone** — clones the repo (public or private with `GITHUB_TOKEN`)
- **Spec discovery** — finds OpenAPI 3 / Swagger 2 (JSON & YAML) in the clone
- **API structure mapper** — endpoints, auth, sensitive fields, risk scores
- **AI scan planner** — rule-based check selection per endpoint
- **Vulnerability simulator** — IDOR, broken auth, injection, mass assignment, rate limits, and more
- **Finding analyzer** — severity, business impact, OWASP/CWE mapping
- **Cursor SDK remediation** — `Agent.prompt` against your repo (or simulated diffs without API key)
- **Security reports** — executive summary, compliance checklist, printable PDF

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), paste a GitHub repo URL, then click **Start security scan**. Git must be installed on the server.

## Cursor SDK remediation

1. Copy `.env.example` to `.env.local`
2. Set `CURSOR_API_KEY` from [Cursor Dashboard](https://cursor.com/settings)
3. Paste a GitHub repo URL in the scan form (set `GITHUB_TOKEN` for private repos)
4. On any finding, click **Auto-patch with Cursor SDK**

Without an API key, the platform returns **simulated patch diffs** for demo purposes.

## Architecture

```
app/
  page.tsx                 # Upload landing
  scan/[id]/               # Scan dashboard (progress, map, findings, report)
  api/
    scan/                  # POST upload, GET status
    remediate/             # POST trigger Cursor remediation
lib/
  openapi/                 # Parser + API graph mapper
  scanner/                 # Planner, simulator, analyzer, pipeline
  remediation/             # Cursor SDK agent
  reports/                 # Report generator
  store.ts                 # In-memory job store (MVP)
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scan` | `{ repoUrl }` — clones GitHub repo, discovers OpenAPI |
| GET | `/api/scan/:id` | Poll scan job |
| POST | `/api/remediate` | `{ scanId, findingId }` |
| GET | `/api/scans` | List recent scans |

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- [@cursor/sdk](https://cursor.com/docs/api/sdk/typescript)
- js-yaml

## License

MIT
