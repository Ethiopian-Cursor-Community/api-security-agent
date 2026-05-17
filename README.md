# API Security Agent

**API Security Agent** is an autonomous API security testing and remediation platform built with **Next.js** and the **Cursor SDK**.

Paste a GitHub repository URL → the app clones the repo, discovers OpenAPI/Swagger specs, maps the attack surface, runs rule-based vulnerability simulations, explains each finding with OWASP/CWE context, and can auto-patch issues via Cursor. It also generates printable security reports.

---

## What it does

1. **Clone** — Fetches a public or private GitHub repo (private repos need `GITHUB_TOKEN`). Git must be installed on the machine running the server.
2. **Discover specs** — Searches the clone for OpenAPI 3 or Swagger 2 files (JSON and YAML).
3. **Map the API** — Builds a graph of endpoints with auth requirements, sensitive fields, parameters, tags, and per-endpoint risk scores.
4. **Plan checks** — Selects vulnerability categories per endpoint based on path shape, HTTP method, auth metadata, and risk.
5. **Simulate scans** — Produces findings from static analysis of the spec (not live HTTP traffic against a running API).
6. **Analyze** — Adds severity, business impact, plain-language explanation, and remediation guidance.
7. **Remediate** — Optional **Auto-patch with Cursor SDK** on each finding; without `CURSOR_API_KEY`, returns demo patch diffs.
8. **Report** — Executive summary, compliance-style checklist, and PDF export from the scan dashboard.

**In short:** paste a repo → scan APIs for common issues → review findings → optionally auto-remediate with Cursor.

---

## Features

| Area | Details |
|------|---------|
| **GitHub** | Clone from URL; supports `owner/repo` shorthand |
| **OpenAPI** | Parser + discovery across the repo tree |
| **Attack surface** | Endpoint list, auth vs public counts, high-risk highlights |
| **Scan planner** | Rule-based check selection (not a live LLM call in the planner step) |
| **Simulator** | IDOR, broken auth, broken access control, injection, mass assignment, sensitive data exposure, misconfiguration, rate limiting |
| **Standards** | OWASP API Top 10 (2023) and CWE references on findings |
| **Remediation** | [`@cursor/sdk`](https://cursor.com/docs/api/sdk/typescript) `Agent.prompt` against the cloned repo |
| **UI** | Upload landing, live scan progress, API map, findings panel, patch diff viewer, report view |