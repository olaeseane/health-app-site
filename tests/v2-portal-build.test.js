import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { withBuildLock, stableSha256 } from "./helpers/build-lock.mjs";

const root = new URL("../", import.meta.url);
const v2PortalAsciiUrl = new URL("dist-v2/portal-inline-ascii.html", root);
const v1PortalAsciiUrl = new URL("dist/portal-inline-ascii.html", root);

test("build:v2:portal-inline emits one ASCII-safe self-contained artifact under 1 MB", async () => {
  await withBuildLock(async () => {
    if (!existsSync(v1PortalAsciiUrl)) {
      const baselineBuild = spawnSync("npm", ["run", "build:portal-inline"], {
        cwd: fileURLToPath(root),
        encoding: "utf8",
        timeout: 240_000,
      });
      assert.equal(
        baselineBuild.status,
        0,
        `${baselineBuild.stdout}\n${baselineBuild.stderr}`,
      );
    }

    const v1PortalHashBefore = await stableSha256(v1PortalAsciiUrl);

    const build = spawnSync("npm", ["run", "build:v2:portal-inline"], {
      cwd: fileURLToPath(root),
      encoding: "utf8",
      timeout: 240_000,
    });

    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
    assert.equal(
      await stableSha256(v1PortalAsciiUrl),
      v1PortalHashBefore,
      "v2 portal build must not overwrite dist/portal-inline-ascii.html",
    );
  });

  assert.ok(existsSync(v2PortalAsciiUrl), "dist-v2/portal-inline-ascii.html should exist");

  const asciiBuffer = readFileSync(v2PortalAsciiUrl);
  assert.ok(
    asciiBuffer.length < 1_000_000,
    `portal v2 artifact must stay under 1 MB, got ${asciiBuffer.length}`,
  );
  assert.ok(
    asciiBuffer.every((byte) => byte < 128),
    "portal v2 artifact must be ASCII-safe",
  );

  const html = asciiBuffer.toString("utf8");

  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);

  assert.doesNotMatch(html, /mc\.yandex\.ru|112104449|ym\(|v2_download_ios|v2_download_android/);

  assert.doesNotMatch(html, /<svg|image\/svg\+xml|\.svg/);

  assert.match(html, /<header class="site-header site-header--portal"/);
  assert.match(
    html,
    /\.site-header--portal \{\s*position: fixed !important;\s*z-index: 2147483647 !important;/,
  );
  assert.match(html, /\.site-header--portal \+ \.health-site-main \{\s*padding-top: 68px !important;/);
  assert.match(
    html,
    /html \{\s*scroll-padding-top: 84px !important;\s*\}/,
    "portal anchors must clear the fixed header",
  );
  assert.doesNotMatch(html, /body\[data-portal-build\]/);
  assert.match(html, /#wrapper #header,\n\.breadcrumbs,\n\.section-footer,\n\.footer-copyright \{\n  display: none;\n\}/);

  assert.doesNotMatch(html, /skip-link/);

  assert.equal((html.match(/<a\s+class="hero__qr-link"/g) ?? []).length, 0);
  assert.equal((html.match(/<div class="hero__qr-link">/g) ?? []).length, 2);
  assert.equal((html.match(/<a\s+class="download-option__code"/g) ?? []).length, 0);
  assert.equal((html.match(/<div class="download-option__code">/g) ?? []).length, 2);
  assert.equal((html.match(/class="download-option__link"/g) ?? []).length, 0);
  assert.doesNotMatch(html, /&#1057;&#1082;&#1072;&#1095;&#1072;&#1090;&#1100; (?:iOS|Android)/);
  assert.match(html, /<strong>iPhone<\/strong>/);
  assert.match(html, /<strong>Android<\/strong>/);
  assert.doesNotMatch(html, /href="\.\.\/go\//);

  assert.match(
    html,
    /href="doc\.pdf"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
  );
  assert.match(html, /&#1044;&#1086;&#1082;&#1091;&#1084;&#1077;&#1085;&#1090;&#1072;&#1094;&#1080;&#1103;/);
  assert.doesNotMatch(html, /portal-documentation-link/);

  assert.match(html, /<style data-portal-inline="styles">/);
  assert.match(html, /<script data-portal-inline="app">/);
  assert.doesNotMatch(html, /<link rel="stylesheet"/);
  assert.doesNotMatch(html, /<script[^>]+src="\.\//);
  assert.doesNotMatch(html, /(?:src|href)="\.\//);
  assert.doesNotMatch(html, /data:application\/pdf/);

  assert.ok(
    (html.match(/data:font\/woff2;base64,/g) ?? []).length >= 2,
    "portal should inline Manrope fonts",
  );
  assert.ok(
    (html.match(/data:image\/jpeg;base64,/g) ?? []).length >= 7,
    "portal should inline optimized JPEG screenshots and character",
  );
  assert.ok(
    (html.match(/data:image\/png;base64,/g) ?? []).length >= 10,
    "portal should inline logo, QR, chat and icon PNG assets",
  );
  assert.equal((html.match(/data:image\/webp/g) ?? []).length, 0);
  assert.match(
    html,
    /class="outcome__character"[\s\S]{0,120}?src="data:image\/jpeg;base64,/,
  );
  assert.doesNotMatch(html, /robot\.webp/);

  assert.match(html, /class="carousel__track"/);
  assert.match(html, /&#1042;&#1089;&#1105; &#1101;&#1090;&#1086; &#1076;&#1086;&#1087;&#1086;&#1083;&#1085;&#1103;&#1077;&#1090;/);
  assert.match(html, /data-focus-target="download-qr"/);

  const plainPortalUrl = new URL("dist-v2/portal-inline.html", root);
  assert.ok(existsSync(plainPortalUrl), "debug portal-inline.html should exist");
  assert.ok(statSync(plainPortalUrl).size < statSync(v2PortalAsciiUrl).size);
});
