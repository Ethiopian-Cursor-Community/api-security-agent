import type {
  ApiGraph,
  Finding,
  RawFinding,
  VulnerabilityCategory,
} from "@/lib/types";

const CATEGORY_COPY: Record<
  VulnerabilityCategory,
  { impact: string; recommendation: string }
> = {
  idor: {
    impact:
      "Attackers can read or modify other users' data by changing identifiers, leading to account takeover or data breach.",
    recommendation:
      "Enforce object-level authorization: verify the authenticated subject owns the resource before returning or mutating it.",
  },
  broken_authentication: {
    impact:
      "Weak or missing authentication allows unauthorized access to protected operations and user data.",
    recommendation:
      "Require valid tokens on sensitive routes, use short-lived JWTs, and add rate limiting on auth endpoints.",
  },
  broken_access_control: {
    impact:
      "Privilege escalation — regular users may invoke admin-only functionality.",
    recommendation:
      "Apply role-based or attribute-based checks at the controller/service layer, not only in the API gateway.",
  },
  injection: {
    impact:
      "Untrusted input may execute SQL/NoSQL/commands or alter application logic.",
    recommendation:
      "Use parameterized queries, strict input validation (Zod/Joi), and deny unknown JSON properties.",
  },
  mass_assignment: {
    impact:
      "Clients can set privileged fields (role, isAdmin) and escalate privileges.",
    recommendation:
      "Whitelist allowed DTO fields; never bind request bodies directly to database models.",
  },
  sensitive_data_exposure: {
    impact:
      "Password hashes, tokens, or PII may leak in API responses or logs.",
    recommendation:
      "Return minimal DTOs; redact secrets; use field-level response filtering.",
  },
  security_misconfiguration: {
    impact:
      "Debug endpoints and verbose errors expand attack surface and aid exploitation.",
    recommendation:
      "Remove internal routes from production builds; return generic errors to clients.",
  },
  rate_limiting: {
    impact:
      "Credential stuffing, OTP brute force, and resource exhaustion become feasible.",
    recommendation:
      "Add per-IP and per-account rate limits with exponential backoff on auth flows.",
  },
};

function explainFinding(raw: RawFinding, endpointLabel: string): string {
  return [
    `The endpoint **${endpointLabel}** was flagged during simulated analysis.`,
    raw.evidence,
    raw.examplePayload
      ? `Example test: \`${raw.examplePayload}\``
      : null,
    raw.owasp ? `Mapped to ${raw.owasp}.` : null,
    raw.cwe ? `Reference: ${raw.cwe}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function analyzeFindings(
  graph: ApiGraph,
  rawFindings: RawFinding[]
): Finding[] {
  const endpointMap = new Map(graph.endpoints.map((e) => [e.id, e]));

  return rawFindings.map((raw, index) => {
    const endpoint = endpointMap.get(raw.endpointId)!;
    const label = `${raw.endpointId.split(":")[0]} ${endpoint.path}`;
    const copy = CATEGORY_COPY[raw.category];

    return {
      ...raw,
      id: `finding-${index + 1}-${raw.category}`,
      endpoint,
      explanation: explainFinding(raw, label),
      businessImpact: copy.impact,
      recommendation: copy.recommendation,
      remediationStatus: "pending",
    };
  });
}
