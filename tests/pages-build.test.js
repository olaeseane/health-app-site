import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pages = new URL("dist-pages/", root);

function bytes(path) {
  return readFileSync(new URL(path, root));
}

test("build:pages publishes v1 at root and v2 beneath install", () => {
  const build = spawnSync("npm", ["run", "build:pages"], {
    cwd: fileURLToPath(root),
    encoding: "utf8",
  });

  assert.equal(build.status, 0, build.stderr || build.stdout);
  const expectedV1Html = bytes("dist/index.html")
    .toString("utf8")
    .replaceAll('href="/go/', 'href="./go/');
  const pagesV1Html = bytes("dist-pages/index.html").toString("utf8");
  assert.equal(pagesV1Html, expectedV1Html);
  assert.doesNotMatch(pagesV1Html, /href="\/go\//);
  assert.deepEqual(bytes("dist-pages/install/index.html"), bytes("dist-v2/index.html"));
  assert.ok(existsSync(new URL(".nojekyll", pages)));
  assert.ok(existsSync(new URL("install/go/ios/index.html", pages)));
  assert.ok(existsSync(new URL("install/go/android/index.html", pages)));
  const pagesAndroidRedirect = bytes("dist-pages/go/android/index.html").toString("utf8");
  assert.doesNotMatch(pagesAndroidRedirect, /\/download\/predix-health-app\.apk/);
  assert.match(
    pagesAndroidRedirect,
    /https:\/\/hubthe\.team\/shared\/docs\/bcaa672e-9fd8-43a3-91e2-abe3189a88ae/,
  );
});

test("build:pages excludes portal-only artifacts", () => {
  assert.equal(existsSync(new URL("portal-inline.html", pages)), false);
  assert.equal(existsSync(new URL("portal-inline-ascii.html", pages)), false);
  assert.equal(existsSync(new URL("install/portal-inline.html", pages)), false);
  assert.equal(existsSync(new URL("install/portal-inline-ascii.html", pages)), false);
  assert.equal(
    existsSync(new URL("install/public/v2/character/robot-portal.jpg", pages)),
    false,
  );
});

test("Pages workflow validates and deploys the combined ordinary build", () => {
  const workflowUrl = new URL(".github/workflows/deploy-pages.yml", root);
  assert.ok(existsSync(workflowUrl));
  const workflow = readFileSync(workflowUrl, "utf8");

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /^permissions: \{\}$/m);
  assert.match(
    workflow,
    /build:\s*\n\s*permissions:\s*\n\s*contents:\s*read\s*\n\s*pages:\s*read/,
  );
  assert.match(
    workflow,
    /deploy:\s*\n\s*permissions:\s*\n\s*pages:\s*write\s*\n\s*id-token:\s*write/,
  );
  assert.match(workflow, /run:\s*node --test tests\/pages-build\.test\.js/);
  assert.doesNotMatch(workflow, /run:\s*npm test/);
  assert.match(workflow, /run:\s*npm run build:pages/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path:\s*\.\/dist-pages/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.doesNotMatch(workflow, /build:(?:v2:)?portal-inline/);
});
