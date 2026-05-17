import type { ApiGraph, Finding, SecurityReport, Severity } from "@/lib/types";

const SEVERITIES: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

export function generateReport(
  graph: ApiGraph,
  findings: Finding[]
): SecurityReport {
  const findingsBySeverity = SEVERITIES.reduce(
    (acc, s) => {
      acc[s] = findings.filter((f) => f.severity === s).length;
      return acc;
    },
    {} as Record<Severity, number>
  );

  const criticalCount = findingsBySeverity.critical;
  const highCount = findingsBySeverity.high;

  const executiveSummary =
    criticalCount > 0
      ? `Security assessment of **${graph.title}** (v${graph.version}) identified **${criticalCount} critical** and **${highCount} high** issues across ${graph.totalEndpoints} endpoints. Immediate remediation is recommended for broken access control and authentication gaps.`
      : highCount > 0
        ? `Assessment of **${graph.title}** found **${highCount} high-severity** issues. Address authentication and injection risks before production deployment.`
        : `Assessment of **${graph.title}** completed with **${findings.length}** findings, mostly medium/low. Continue hardening rate limits and input validation.`;

  const patched = findings.filter((f) => f.remediationStatus === "completed");

  const remediationSummary =
    patched.length > 0
      ? `${patched.length} of ${findings.length} findings have proposed or applied patches via the remediation agent.`
      : findings.length > 0
        ? `${findings.length} findings are ready for automated remediation. Use the dashboard to generate patch diffs with Cursor SDK.`
        : "No vulnerabilities detected in simulated scan.";

  const topRisks = findings
    .slice(0, 5)
    .map((f) => `[${f.severity.toUpperCase()}] ${f.title} — ${f.endpoint.method.toUpperCase()} ${f.endpoint.path}`);

  const complianceChecklist = [
    {
      item: "Authentication documented on sensitive routes",
      status: graph.publicCount === 0 || graph.authenticatedCount > graph.publicCount
        ? ("pass" as const)
        : ("fail" as const),
    },
    {
      item: "No critical IDOR/BOLA findings",
      status: findings.some((f) => f.category === "idor" && f.severity === "critical")
        ? ("fail" as const)
        : ("pass" as const),
    },
    {
      item: "Injection risks reviewed",
      status: findings.some((f) => f.category === "injection" && f.severity === "high")
        ? ("warn" as const)
        : ("pass" as const),
    },
    {
      item: "Rate limiting on auth endpoints",
      status: findings.some((f) => f.category === "rate_limiting")
        ? ("warn" as const)
        : ("pass" as const),
    },
    {
      item: "Sensitive fields not over-exposed",
      status: findings.some((f) => f.category === "sensitive_data_exposure")
        ? ("fail" as const)
        : ("pass" as const),
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    executiveSummary,
    attackSurface: {
      totalEndpoints: graph.totalEndpoints,
      publicEndpoints: graph.publicCount,
      authenticatedEndpoints: graph.authenticatedCount,
      highRiskEndpoints: graph.highRiskCount,
    },
    findingsBySeverity,
    topRisks,
    endpointRiskMap: graph.endpoints
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 15)
      .map((e) => ({
        endpoint: e.path,
        method: e.method.toUpperCase(),
        riskScore: e.riskScore,
      })),
    remediationSummary,
    complianceChecklist,
  };
}
