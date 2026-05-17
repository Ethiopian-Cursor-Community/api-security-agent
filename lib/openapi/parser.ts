import yaml from "js-yaml";

const SENSITIVE_NAMES =
  /password|passwd|secret|token|api[_-]?key|authorization|ssn|credit|card|cvv|pin|private/i;

export interface ParsedSpec {
  raw: Record<string, unknown>;
  title: string;
  version: string;
  baseUrl?: string;
}

export function parseSpecContent(
  content: string,
  fileName: string
): ParsedSpec {
  const isYaml =
    fileName.endsWith(".yaml") ||
    fileName.endsWith(".yml") ||
    (!fileName.endsWith(".json") && content.trim().startsWith("openapi:"));

  const raw = (isYaml
    ? yaml.load(content)
    : JSON.parse(content)) as Record<string, unknown>;

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid OpenAPI document: expected an object");
  }

  if (!raw.openapi && !raw.swagger) {
    throw new Error("Not a valid OpenAPI/Swagger document");
  }

  const info = (raw.info as Record<string, unknown>) ?? {};
  const title = String(info.title ?? "Untitled API");
  const version = String(info.version ?? "0.0.0");

  let baseUrl: string | undefined;
  if (Array.isArray(raw.servers) && raw.servers.length > 0) {
    const server = raw.servers[0] as { url?: string };
    baseUrl = server.url;
  } else if (raw.host) {
    const scheme =
      (Array.isArray(raw.schemes) ? raw.schemes[0] : "https") ?? "https";
    const basePath = (raw.basePath as string) ?? "";
    baseUrl = `${scheme}://${raw.host}${basePath}`;
  }

  return { raw, title, version, baseUrl };
}

export function isSensitiveField(name: string): boolean {
  return SENSITIVE_NAMES.test(name);
}

export function collectSchemaFields(
  schema: unknown,
  prefix = ""
): string[] {
  if (!schema || typeof schema !== "object") return [];
  const s = schema as Record<string, unknown>;
  const fields: string[] = [];

  if (s.properties && typeof s.properties === "object") {
    for (const [key, value] of Object.entries(
      s.properties as Record<string, unknown>
    )) {
      const path = prefix ? `${prefix}.${key}` : key;
      fields.push(path);
      fields.push(...collectSchemaFields(value, path));
    }
  }

  if (s.items) {
    fields.push(...collectSchemaFields(s.items, prefix));
  }

  if (s.allOf && Array.isArray(s.allOf)) {
    for (const part of s.allOf) {
      fields.push(...collectSchemaFields(part, prefix));
    }
  }

  return fields;
}
