export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type VulnerabilityCategory =
  | "broken_authentication"
  | "broken_access_control"
  | "injection"
  | "mass_assignment"
  | "sensitive_data_exposure"
  | "security_misconfiguration"
  | "rate_limiting"
  | "idor";

export interface ApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie" | "body";
  required: boolean;
  schema?: { type?: string; format?: string };
  sensitive: boolean;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  tags: string[];
  parameters: ApiParameter[];
  requiresAuth: boolean;
  /** Set when the operation documents object-level authorization (e.g. extension x-requires-object-ownership). */
  requiresObjectOwnership?: boolean;
  authSchemes: string[];
  requestBodyRequired: boolean;
  sensitiveFields: string[];
  riskScore: number;
}

export interface ApiGraph {
  title: string;
  version: string;
  baseUrl?: string;
  endpoints: ApiEndpoint[];
  totalEndpoints: number;
  authenticatedCount: number;
  publicCount: number;
  highRiskCount: number;
}

export interface ScanPlanItem {
  endpointId: string;
  checks: VulnerabilityCategory[];
  rationale: string;
}

export interface RawFinding {
  category: VulnerabilityCategory;
  endpointId: string;
  title: string;
  severity: Severity;
  evidence: string;
  examplePayload?: string;
  cwe?: string;
  owasp?: string;
}

export interface Finding extends RawFinding {
  id: string;
  endpoint: ApiEndpoint;
  explanation: string;
  businessImpact: string;
  recommendation: string;
  remediationStatus: "pending" | "in_progress" | "completed" | "skipped";
  patch?: PatchResult;
}

export interface PatchResult {
  summary: string;
  diff: string;
  filesTouched: string[];
  mode: "cursor_sdk" | "simulated";
  agentRunId?: string;
}

export type ScanStatus =
  | "pending"
  | "parsing"
  | "mapping"
  | "planning"
  | "scanning"
  | "analyzing"
  | "completed"
  | "failed";

export interface ScanJob {
  id: string;
  status: ScanStatus;
  progress: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  specFileName: string;
  repoUrl: string;
  repoPath?: string;
  apiGraph?: ApiGraph;
  scanPlan?: ScanPlanItem[];
  findings?: Finding[];
  report?: SecurityReport;
  error?: string;
}

export interface SecurityReport {
  generatedAt: string;
  executiveSummary: string;
  attackSurface: {
    totalEndpoints: number;
    publicEndpoints: number;
    authenticatedEndpoints: number;
    highRiskEndpoints: number;
  };
  findingsBySeverity: Record<Severity, number>;
  topRisks: string[];
  endpointRiskMap: { endpoint: string; method: string; riskScore: number }[];
  remediationSummary: string;
  complianceChecklist: { item: string; status: "pass" | "fail" | "warn" }[];
}
