import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const root = new URL("../", import.meta.url);

async function runPortalBuild() {
  return run("npm", ["run", "build:v2:portal-inline"], {
    cwd: fileURLToPath(root),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

test("concurrent v2 portal builds serialize without corrupting dist-v2", async () => {
  const results = await Promise.allSettled([runPortalBuild(), runPortalBuild()]);
  const failures = results.filter((result) => result.status === "rejected");

  assert.deepEqual(
    failures.map((result) => result.reason?.stderr || result.reason?.message),
    [],
  );
});
