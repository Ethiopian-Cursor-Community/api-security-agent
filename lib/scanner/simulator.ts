import type {
  ApiEndpoint,
  ApiGraph,
  RawFinding,
  ScanPlanItem,
  Severity,
  VulnerabilityCategory,
} from "@/lib/types";

function severityFor(
  category: VulnerabilityCategory,
  endpoint: ApiEndpoint
): Severity {
  if (category === "idor" && !endpoint.requiresAuth) return "critical";
  if (category === "broken_authentication" && /login|auth/i.test(endpoint.path))
    return "high";
  if (category === "sensitive_data_exposure") return "high";
  if (category === "injection") return "high";
  if (category === "broken_access_control") return "high";
  if (category === "mass_assignment") return "medium";
  if (category === "rate_limiting") return "medium";
  return "low";
}

function simulateCheck(
  endpoint: ApiEndpoint,
  category: VulnerabilityCategory
): RawFinding | null {
  const pathParam = endpoint.parameters.find((p) => p.in === "path");
  const queryParam = endpoint.parameters.find((p) => p.in === "query");

  switch (category) {
    case "idor":
      if (
        pathParam &&
        /id|user|account/i.test(pathParam.name) &&
        endpoint.method === "get"
      ) {
        if (
          endpoint.requiresAuth &&
          endpoint.requiresObjectOwnership
        ) {
          return null;
        }
        return {
          category,
          endpointId: endpoint.id,
          title: "Potential Insecure Direct Object Reference (IDOR)",
          severity: severityFor(category, endpoint),
          evidence: `${endpoint.method.toUpperCase()} ${endpoint.path} exposes \`${pathParam.name}\` without explicit ownership validation in the spec.`,
          examplePayload: `GET ${endpoint.path.replace(`{${pathParam.name}}`, "OTHER_USER_ID")}`,
          cwe: "CWE-639",
          owasp: "API1:2023 Broken Object Level Authorization",
        };
      }
      if (
        pathParam &&
        !endpoint.requiresAuth &&
        ["get", "put", "patch", "delete"].includes(endpoint.method)
      ) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Unauthenticated object access risk",
          severity: "critical",
          evidence: `Public ${endpoint.method.toUpperCase()} on ${endpoint.path} with identifier \`${pathParam.name}\`.`,
          examplePayload: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
          cwe: "CWE-862",
          owasp: "API1:2023 Broken Object Level Authorization",
        };
      }
      return null;

    case "broken_authentication":
      if (!endpoint.requiresAuth && /user|account|profile|me/i.test(endpoint.path)) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Sensitive route missing authentication",
          severity: "high",
          evidence: `No security scheme on ${endpoint.method.toUpperCase()} ${endpoint.path} despite sensitive resource path.`,
          cwe: "CWE-306",
          owasp: "API2:2023 Broken Authentication",
        };
      }
      if (/login|signin|token/i.test(endpoint.path) && !endpoint.requiresAuth) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Auth endpoint lacks rate-limit signals",
          severity: "medium",
          evidence: `Authentication surface ${endpoint.path} has no documented throttling.`,
          cwe: "CWE-307",
          owasp: "API2:2023 Broken Authentication",
        };
      }
      return null;

    case "broken_access_control":
      if (
        endpoint.tags.some((t) => /admin/i.test(t)) &&
        !endpoint.requiresAuth
      ) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Admin endpoint without authorization",
          severity: "critical",
          evidence: `Tagged as admin but no security requirement on ${endpoint.method.toUpperCase()} ${endpoint.path}.`,
          cwe: "CWE-285",
          owasp: "API5:2023 Broken Function Level Authorization",
        };
      }
      return null;

    case "injection":
      if (queryParam && endpoint.method === "get") {
        return {
          category,
          endpointId: endpoint.id,
          title: "Query parameter injection risk",
          severity: "high",
          evidence: `Parameter \`${queryParam.name}\` on GET ${endpoint.path} may reach SQL/NoSQL filters if unsanitized.`,
          examplePayload: `?${queryParam.name}=' OR '1'='1`,
          cwe: "CWE-89",
          owasp: "API8:2023 Security Misconfiguration",
        };
      }
      if (["post", "put", "patch"].includes(endpoint.method)) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Request body injection / unsafe deserialization risk",
          severity: "medium",
          evidence: `Write operation ${endpoint.method.toUpperCase()} ${endpoint.path} accepts structured input.`,
          examplePayload: `{"__proto__": {"isAdmin": true}}`,
          cwe: "CWE-74",
          owasp: "API8:2023 Security Misconfiguration",
        };
      }
      return null;

    case "mass_assignment":
      if (["post", "put", "patch"].includes(endpoint.method)) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Mass assignment via writable fields",
          severity: "medium",
          evidence: `${endpoint.method.toUpperCase()} ${endpoint.path} may accept extra properties (role, isAdmin) if server binds body blindly.`,
          examplePayload: `{"role":"admin","isVerified":true}`,
          cwe: "CWE-915",
          owasp: "API3:2023 Broken Object Property Level Authorization",
        };
      }
      return null;

    case "sensitive_data_exposure":
      if (endpoint.sensitiveFields.length > 0 && endpoint.method === "get") {
        return {
          category,
          endpointId: endpoint.id,
          title: "Sensitive data in response schema",
          severity: "high",
          evidence: `GET ${endpoint.path} may return: ${endpoint.sensitiveFields.join(", ")}.`,
          cwe: "CWE-200",
          owasp: "API3:2023 Broken Object Property Level Authorization",
        };
      }
      return null;

    case "rate_limiting":
      if (/login|register|reset|otp|verify/i.test(endpoint.path)) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Missing rate limiting on abuse-prone endpoint",
          severity: "medium",
          evidence: `No rate-limit documentation for ${endpoint.method.toUpperCase()} ${endpoint.path}.`,
          cwe: "CWE-770",
          owasp: "API4:2023 Unrestricted Resource Consumption",
        };
      }
      return null;

    case "security_misconfiguration":
      if (endpoint.path.includes("debug") || endpoint.path.includes("internal")) {
        return {
          category,
          endpointId: endpoint.id,
          title: "Debug/internal route exposed",
          severity: "high",
          evidence: `Operational path ${endpoint.path} appears in public API spec.`,
          cwe: "CWE-16",
          owasp: "API8:2023 Security Misconfiguration",
        };
      }
      return null;

    default:
      return null;
  }
}

export function runSimulatedScan(
  graph: ApiGraph,
  plan: ScanPlanItem[]
): RawFinding[] {
  const endpointMap = new Map(graph.endpoints.map((e) => [e.id, e]));
  const findings: RawFinding[] = [];
  const seen = new Set<string>();

  for (const item of plan) {
    const endpoint = endpointMap.get(item.endpointId);
    if (!endpoint) continue;

    for (const check of item.checks) {
      const result = simulateCheck(endpoint, check);
      if (!result) continue;
      const key = `${result.endpointId}:${result.category}:${result.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(result);
    }
  }

  return findings.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.severity] - order[b.severity];
  });
}
