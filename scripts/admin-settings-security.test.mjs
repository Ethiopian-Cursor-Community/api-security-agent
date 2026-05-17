import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const samplePath = path.join(repoRoot, "lib", "sample-spec.ts");

test("GET /admin/settings documents bearer authentication (admin BAC fix)", () => {
  const src = fs.readFileSync(samplePath, "utf8");
  const m = src.match(/`([\s\S]*)`/);
  assert.ok(m, "expected embedded OpenAPI template literal in sample-spec.ts");
  const doc = /** @type {Record<string, unknown>} */ (yaml.load(m[1]));
  const paths = /** @type {Record<string, unknown>} */ (doc.paths ?? {});
  const pathItem = /** @type {Record<string, unknown>} */ (paths["/admin/settings"]);
  assert.ok(pathItem, "expected /admin/settings path");
  const op = /** @type {Record<string, unknown>} */ (pathItem.get);
  assert.ok(op, "expected GET operation");
  assert.ok(Array.isArray(op.security) && op.security.length > 0, "expected security requirement");
  const usesBearer = op.security.some(
    (req) =>
      req &&
      typeof req === "object" &&
      Object.prototype.hasOwnProperty.call(req, "bearerAuth")
  );
  assert.ok(usesBearer, "expected bearerAuth in security requirement");
});
