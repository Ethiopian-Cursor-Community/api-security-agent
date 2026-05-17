import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const specPath = path.join(repoRoot, "vulnerable-demo-api.swagger.json");

test("GET /users/{userId} documents auth and object ownership (IDOR remediation)", () => {
  const raw = fs.readFileSync(specPath, "utf8");
  const doc = /** @type {Record<string, unknown>} */ (JSON.parse(raw));
  const paths = /** @type {Record<string, unknown>} */ (doc.paths ?? {});
  const pathItem = /** @type {Record<string, unknown>} */ (paths["/users/{userId}"]);
  assert.ok(pathItem, "expected /users/{userId} path");
  const op = /** @type {Record<string, unknown>} */ (pathItem.get);
  assert.ok(op, "expected GET operation");
  assert.equal(op.operationId, "getUserById");

  assert.ok(Array.isArray(op.security) && op.security.length > 0, "expected security requirement");
  const usesBearer = op.security.some(
    (req) =>
      req &&
      typeof req === "object" &&
      Object.prototype.hasOwnProperty.call(req, "bearerAuth")
  );
  assert.ok(usesBearer, "expected bearerAuth in security requirement");
  assert.equal(op["x-requires-object-ownership"], true, "expected ownership extension");

  const responses = /** @type {Record<string, unknown>} */ (op.responses ?? {});
  assert.ok(responses["403"], "expected 403 Forbidden response");
  assert.ok(responses["401"], "expected 401 Unauthorized response");
});
