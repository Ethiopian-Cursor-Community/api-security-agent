import type { ApiEndpoint, ApiGraph, ScanPlanItem, VulnerabilityCategory } from "@/lib/types";

function checksForEndpoint(endpoint: ApiEndpoint): {
  checks: VulnerabilityCategory[];
  rationale: string;
} {
  const checks: VulnerabilityCategory[] = [];
  const reasons: string[] = [];

  if (!endpoint.requiresAuth) {
    checks.push("broken_authentication", "broken_access_control");
    reasons.push("no auth declared in OpenAPI security");
  }

  if (endpoint.parameters.some((p) => p.in === "path" && /id|user|account/i.test(p.name))) {
    checks.push("idor", "broken_access_control");
    reasons.push("user-controlled path identifier");
  }

  if (
    endpoint.method === "get" &&
    endpoint.parameters.some((p) => p.in === "query")
  ) {
    checks.push("injection");
    reasons.push("query parameters may be concatenated into backend queries");
  }

  if (["post", "put", "patch"].includes(endpoint.method)) {
    checks.push("mass_assignment", "injection");
    reasons.push("write operation accepts request body");
  }

  if (endpoint.sensitiveFields.length > 0) {
    checks.push("sensitive_data_exposure");
    reasons.push(`sensitive fields: ${endpoint.sensitiveFields.join(", ")}`);
  }

  if (endpoint.tags.some((t) => /admin|auth|login|register/i.test(t))) {
    checks.push("broken_authentication", "rate_limiting");
    reasons.push("auth/admin surface");
  }

  if (endpoint.path.includes("upload") || endpoint.path.includes("file")) {
    checks.push("security_misconfiguration");
    reasons.push("file upload surface");
  }

  if (endpoint.riskScore >= 50 && !checks.includes("rate_limiting")) {
    checks.push("rate_limiting");
    reasons.push("high inherent risk score");
  }

  const unique = [...new Set(checks)];
  if (unique.length === 0) {
    unique.push("security_misconfiguration");
    reasons.push("baseline API hygiene check");
  }

  return {
    checks: unique,
    rationale: reasons.join("; "),
  };
}

export function buildScanPlan(graph: ApiGraph): ScanPlanItem[] {
  return graph.endpoints.map((endpoint) => {
    const { checks, rationale } = checksForEndpoint(endpoint);
    return {
      endpointId: endpoint.id,
      checks,
      rationale,
    };
  });
}
