import fs from "fs/promises";
import path from "path";

const SPEC_FILE_PATTERN = /^(openapi|swagger)\.(ya?ml|json)$/i;

const CANDIDATE_RELATIVE = [
  "openapi.yaml",
  "openapi.yml",
  "openapi.json",
  "swagger.yaml",
  "swagger.yml",
  "swagger.json",
  "api/openapi.yaml",
  "api/openapi.json",
  "docs/openapi.yaml",
  "docs/openapi.json",
  "spec/openapi.yaml",
  "spec/openapi.json",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

export async function discoverOpenApiSpec(
  repoPath: string
): Promise<{ content: string; fileName: string; absolutePath: string }> {
  const root = path.resolve(repoPath.trim());

  let stat;
  try {
    stat = await fs.stat(root);
  } catch {
    throw new Error(`Repo path does not exist: ${root}`);
  }

  if (!stat.isDirectory()) {
    throw new Error("repoPath must be a directory");
  }

  for (const relative of CANDIDATE_RELATIVE) {
    const absolutePath = path.join(root, relative);
    try {
      const fileStat = await fs.stat(absolutePath);
      if (!fileStat.isFile()) continue;
      const content = await fs.readFile(absolutePath, "utf8");
      return {
        content,
        fileName: path.basename(absolutePath),
        absolutePath,
      };
    } catch {
      // try next candidate
    }
  }

  const discovered = await findSpecFile(root, 4);
  if (discovered) {
    const content = await fs.readFile(discovered, "utf8");
    return {
      content,
      fileName: path.basename(discovered),
      absolutePath: discovered,
    };
  }

  throw new Error(
    "No OpenAPI/Swagger spec found in repo. Add openapi.yaml, swagger.json, or similar at the repo root or under api/, docs/, or spec/."
  );
}

async function findSpecFile(
  dir: string,
  maxDepth: number
): Promise<string | null> {
  if (maxDepth < 0) return null;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !SPEC_FILE_PATTERN.test(entry.name)) continue;
    return path.join(dir, entry.name);
  }

  if (maxDepth === 0) return null;

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    const nested = await findSpecFile(path.join(dir, entry.name), maxDepth - 1);
    if (nested) return nested;
  }

  return null;
}
