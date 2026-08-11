import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pngSize = (path) => {
  const buffer = statSync(path);
  return buffer.size;
};

const pngDimensions = (path) => {
  const buffer = readFileSync(path);

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

test("portal inline build optimizes screenshot assets before inlining", async () => {
  const build = spawnSync("npm", ["run", "build:portal-inline"], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const asciiPortal = new URL("../dist/portal-inline-ascii.html", import.meta.url);
  const asciiPortalHtml = readFileSync(asciiPortal, "utf8");

  assert.ok(
    statSync(asciiPortal).size < 1_000_000,
    "ASCII portal inline build should stay under 1 MB",
  );
  assert.doesNotMatch(asciiPortalHtml, /data:image\/svg\+xml|\.svg/);
  assert.ok(existsSync(new URL("../docs/assets/brand/logo.svg", import.meta.url)));
  assert.match(
    readFileSync(new URL("../docs/assets/brand/logo.svg", import.meta.url), "utf8"),
    /<svg\b/,
  );
  assert.deepEqual(
    pngDimensions(new URL("../dist/public/logo-mark.png", import.meta.url)),
    { width: 192, height: 192 },
  );
  assert.ok(
    statSync(new URL("../dist/public/logo-mark.png", import.meta.url)).size < 35_000,
    "dist logo mark should be optimized PNG",
  );
  assert.equal((asciiPortalHtml.match(/data:image\/jpeg;base64,/g) ?? []).length, 6);

  for (const screenshot of [
    "food1.png",
    "food2.png",
    "habits1.png",
    "doc1.png",
    "doc2.png",
    "integration1.png",
  ]) {
    const optimizedName = screenshot.replace(/\.png$/, ".portal.jpg");
    const screenshotUrl = new URL(`../dist/public/screenshots/${optimizedName}`, import.meta.url);

    assert.ok(existsSync(screenshotUrl), `${optimizedName} should be generated`);
    assert.ok(pngSize(screenshotUrl) < 90_000, `${optimizedName} should be optimized`);
  }
});
