import type { ApiEndpoint, ApiGraph, ApiParameter, HttpMethod } from "@/lib/types";
import {
  collectSchemaFields,
  isSensitiveField,
  type ParsedSpec,
} from "@/lib/openapi/parser";

const METHODS: HttpMethod[] = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
];

function globalSecurity(raw: Record<string, unknown>): string[] {
  const sec = raw.security;
  if (!Array.isArray(sec)) return [];
  return sec.flatMap((req) =>
    typeof req === "object" && req !== null ? Object.keys(req) : []
  );
}

function operationSecurity(
  op: Record<string, unknown>,
  fallback: string[]
): string[] {
  if (op.security === null) return [];
  if (Array.isArray(op.security)) {
    return op.security.flatMap((req) =>
      typeof req === "object" && req !== null ? Object.keys(req) : []
    );
  }
  return fallback;
}

function mapParameters(
  params: unknown[],
  bodySchema?: unknown
): ApiParameter[] {
  const result: ApiParameter[] = [];

  for (const p of params) {
    if (!p || typeof p !== "object") continue;
    const param = p as Record<string, unknown>;
    const name = String(param.name ?? "");
    const loc = String(param.in ?? "query") as ApiParameter["in"];
    const schema = param.schema as { type?: string; format?: string } | undefined;
    result.push({
      name,
      in: loc,
      required: Boolean(param.required),
      schema,
      sensitive: isSensitiveField(name),
    });
  }

  if (bodySchema) {
    const fields = collectSchemaFields(bodySchema);
    for (const field of fields) {
      if (isSensitiveField(field.split(".").pop() ?? field)) {
        result.push({
          name: field,
          in: "body",
          required: false,
          sensitive: true,
        });
      }
    }
  }

  return result;
}

function computeRiskScore(
  method: HttpMethod,
  requiresAuth: boolean,
  parameters: ApiParameter[],
  sensitiveFields: string[],
  tags: string[],
  requiresObjectOwnership: boolean
): number {
  let score = 0;

  if (!requiresAuth) score += 35;
  if (["post", "put", "patch", "delete"].includes(method)) score += 15;
  if (parameters.some((p) => p.in === "path")) score += 20;
  if (parameters.some((p) => p.sensitive)) score += 15;
  if (sensitiveFields.length > 0) score += 20;
  if (tags.some((t) => /admin|internal|manage/i.test(t))) score += 25;
  if (
    parameters.some((p) => /id|user|account/i.test(p.name)) &&
    !requiresObjectOwnership
  ) {
    score += 15;
  }

  return Math.min(100, score);
}

export function mapApiGraph(spec: ParsedSpec): ApiGraph {
  const { raw, title, version, baseUrl } = spec;
  const paths = (raw.paths as Record<string, Record<string, unknown>>) ?? {};
  const fallbackAuth = globalSecurity(raw);
  const endpoints: ApiEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    const sharedParams = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    const pathItemRecord = pathItem as Record<string, unknown>;
    for (const method of METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (!op) continue;

      const authSchemes = operationSecurity(op, fallbackAuth);
      const requiresAuth = authSchemes.length > 0;
      const requiresObjectOwnership = Boolean(
        op["x-requires-object-ownership"] ??
          pathItemRecord["x-requires-object-ownership"]
      );

      const opParams = Array.isArray(op.parameters) ? op.parameters : [];
      const allParams = [...sharedParams, ...opParams];

      let bodySchema: unknown;
      const requestBody = op.requestBody as Record<string, unknown> | undefined;
      if (requestBody?.content && typeof requestBody.content === "object") {
        const content = requestBody.content as Record<
          string,
          { schema?: unknown }
        >;
        const json =
          content["application/json"] ??
          content["*/*"] ??
          Object.values(content)[0];
        bodySchema = json?.schema;
      }

      const parameters = mapParameters(allParams as unknown[], bodySchema);
      const sensitiveFields = [
        ...parameters.filter((p) => p.sensitive).map((p) => p.name),
        ...collectSchemaFields(bodySchema).filter(isSensitiveField),
      ];

      const tags = Array.isArray(op.tags)
        ? op.tags.map(String)
        : ["default"];

      const endpoint: ApiEndpoint = {
        id: `${method.toUpperCase()}:${path}`,
        path,
        method,
        operationId: op.operationId as string | undefined,
        summary: op.summary as string | undefined,
        tags,
        parameters,
        requiresAuth,
        requiresObjectOwnership: requiresObjectOwnership || undefined,
        authSchemes,
        requestBodyRequired: Boolean(requestBody?.required),
        sensitiveFields: [...new Set(sensitiveFields)],
        riskScore: 0,
      };

      endpoint.riskScore = computeRiskScore(
        method,
        requiresAuth,
        parameters,
        endpoint.sensitiveFields,
        tags,
        requiresObjectOwnership
      );

      endpoints.push(endpoint);
    }
  }

  const authenticatedCount = endpoints.filter((e) => e.requiresAuth).length;

  return {
    title,
    version,
    baseUrl,
    endpoints,
    totalEndpoints: endpoints.length,
    authenticatedCount,
    publicCount: endpoints.length - authenticatedCount,
    highRiskCount: endpoints.filter((e) => e.riskScore >= 60).length,
  };
}
