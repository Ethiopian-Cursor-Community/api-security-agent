import type { Finding, PatchResult } from "@/lib/types";

function buildRemediationPrompt(finding: Finding): string {
  const ep = finding.endpoint;
  return `You are an autonomous API security engineer. Fix this vulnerability in the backend codebase.

## Finding
- Title: ${finding.title}
- Severity: ${finding.severity}
- Category: ${finding.category}
- Endpoint: ${ep.method.toUpperCase()} ${ep.path}
- Operation ID: ${ep.operationId ?? "n/a"}

## Evidence
${finding.evidence}

## Recommendation
${finding.recommendation}

## Requirements
1. Locate the route handler, controller, or service for this endpoint.
2. Apply a minimal, production-ready fix (authorization check, input validation, rate limit, DTO whitelist, etc.).
3. Do not break unrelated code.
4. If tests exist nearby, add or update a focused security test.

Respond with a brief summary of what you changed and which files were modified.`;
}

function simulatedPatch(finding: Finding): PatchResult {
  const ep = finding.endpoint;
  const handler =
    ep.operationId ??
    `${ep.method}${ep.path.replace(/[{}/]/g, "_").replace(/_+/g, "_")}`;

  const diff = `--- a/src/routes/${handler}.ts
+++ b/src/routes/${handler}.ts
@@ -1,6 +1,18 @@
 import { Router } from "express";
+import { requireAuth } from "../middleware/auth";
+import { assertResourceOwner } from "../middleware/authorization";
+import { rateLimit } from "../middleware/rateLimit";
 
 const router = Router();
 
-router.${ep.method}("${ep.path}", async (req, res) => {
+router.${ep.method}(
+  "${ep.path}",
+  requireAuth,
+  rateLimit({ windowMs: 60_000, max: 30 }),
+  async (req, res) => {
+    // ${finding.title}
+    await assertResourceOwner(req.user.id, req.params.id);
     // ... handler logic
   }
 );
`;

  return {
    summary: `Simulated patch: added auth, rate limiting, and ownership check for ${ep.method.toUpperCase()} ${ep.path}. Set CURSOR_API_KEY to run real Cursor SDK remediation.`,
    diff,
    filesTouched: [`src/routes/${handler}.ts`, "src/middleware/authorization.ts"],
    mode: "simulated",
  };
}

export async function remediateFinding(
  finding: Finding,
  options: { repoPath: string }
): Promise<PatchResult> {
  const apiKey = process.env.CURSOR_API_KEY;
  const cwd = options.repoPath.trim();

  if (!cwd) {
    throw new Error("repoPath is required for remediation");
  }

  if (!apiKey) {
    return simulatedPatch(finding);
  }

  try {
    const { Agent } = await import("@cursor/sdk");
    const prompt = buildRemediationPrompt(finding);

    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2" },
      local: { cwd },
    });

    if (result.status === "error") {
      return {
        ...simulatedPatch(finding),
        summary: `Cursor agent run failed; showing simulated patch. Run ID: ${result.id}`,
        mode: "simulated",
      };
    }

    const text =
      typeof result.result === "string"
        ? result.result
        : JSON.stringify(result.result);

    return {
      summary: text.slice(0, 2000) || "Remediation completed via Cursor SDK.",
      diff: `--- Cursor SDK remediation transcript ---\n${text}`,
      filesTouched: ["(see agent transcript)"],
      mode: "cursor_sdk",
      agentRunId: result.id,
    };
  } catch {
    return simulatedPatch(finding);
  }
}
