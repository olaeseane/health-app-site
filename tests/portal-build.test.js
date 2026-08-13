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
  assert.match(asciiPortalHtml, /<header class="site-header"/);
  assert.match(asciiPortalHtml, /class="brand__wordmark"/);
  assert.match(asciiPortalHtml, /&#1055;&#1088;&#1077;&#1076;&#1080;&#1082;&#1089;/);
  assert.match(asciiPortalHtml, /&#1047;&#1076;&#1086;&#1088;&#1086;&#1074;&#1100;&#1077;/);
  assert.match(asciiPortalHtml, /class="site-nav"/);
  assert.match(asciiPortalHtml, /href="#first-route"/);
  assert.match(
    asciiPortalHtml,
    /\.site-nav a:is\(:link, :visited, :hover, :focus-visible, :active\) \{\s*color: var\(--graphite\) !important;\s*text-decoration-color: currentColor;/,
  );
  assert.match(
    asciiPortalHtml,
    /\.site-footer__links a:is\(:link, :visited, :hover, :focus-visible, :active\) \{\s*color: var\(--graphite\) !important;\s*text-decoration-color: currentColor;/,
  );
  assert.match(asciiPortalHtml, /\.site-footer__links a \{[^}]*font-size: 0\.9rem;/);
  assert.match(asciiPortalHtml, /href="doc\.pdf"/);
  assert.doesNotMatch(asciiPortalHtml, /data:application\/(?:octet-stream|pdf);base64/);
  assert.match(asciiPortalHtml, /href="https:\/\/testflight\.apple\.com\/join\/KCJxFcV1"/);
  assert.match(asciiPortalHtml, /href="https:\/\/hubthe\.team\/entity-files\/1e46406f-78da-4cec-afa1-9a8451951e93\/72d19454-eae1-46df-9a76-8187ba9531dc_predix-health-app-1\.16\.apk"/);
  assert.ok(
    (asciiPortalHtml.match(/data:image\/png;base64,/g) ?? []).length >= 4,
    "portal should inline logo and QR PNG assets",
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
  const distLogoSize = statSync(new URL("../dist/public/logo-mark.png", import.meta.url)).size;
  assert.ok(distLogoSize > 10_000, "dist logo mark should not be empty");
  assert.ok(
    distLogoSize < 35_000,
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
