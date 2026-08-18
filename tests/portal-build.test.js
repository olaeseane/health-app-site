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
  assert.match(asciiPortalHtml, /<header class="site-header site-header--portal"/);
  assert.match(asciiPortalHtml, /class="brand__wordmark"/);
  assert.match(asciiPortalHtml, /&#1055;&#1088;&#1077;&#1076;&#1080;&#1082;&#1089;/);
  assert.match(asciiPortalHtml, /&#1047;&#1076;&#1086;&#1088;&#1086;&#1074;&#1100;&#1077;/);
  assert.match(asciiPortalHtml, /class="site-nav"/);
  assert.match(asciiPortalHtml, /href="#first-route"/);
  assert.match(asciiPortalHtml, /class="site-nav__chat"[^>]*href="http:\/\/chat"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*aria-label="&#1054;&#1090;&#1082;&#1088;&#1099;&#1090;&#1100; &#1095;&#1072;&#1090;"/);
  assert.match(asciiPortalHtml, /class="site-footer__chat"[^>]*href="http:\/\/chat"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*aria-label="&#1054;&#1090;&#1082;&#1088;&#1099;&#1090;&#1100; &#1095;&#1072;&#1090;"/);
  assert.doesNotMatch(asciiPortalHtml, /<span>&#1063;&#1072;&#1090;<\/span>|>Чат<\/a>/);
  assert.match(asciiPortalHtml, /data:image\/png;base64/);
  assert.doesNotMatch(asciiPortalHtml, /chat-logo-source\.svg|data:image\/svg\+xml|\.svg/);
  assert.match(asciiPortalHtml, /href="#first-route"[^>]*style="color: #12686b !important; text-decoration-color: currentColor !important;"/);
  assert.match(asciiPortalHtml, /class="site-nav__cta"[^>]*href="#download"[^>]*style="color: #ffffff !important; text-decoration: none !important;"/);
  assert.doesNotMatch(asciiPortalHtml, /\.site-header \{[^}]*background: rgba\(255, 255, 255, 0\.88\);/);
  assert.doesNotMatch(asciiPortalHtml, /\.site-header \{[^}]*background: rgba\(244, 251, 250, 0\.64\);/);
  assert.doesNotMatch(asciiPortalHtml, /\.site-header \{[^}]*box-shadow:/);
  assert.match(asciiPortalHtml, /\.site-header \{[^}]*position: sticky;[^}]*top: 0;[^}]*background: transparent;[^}]*backdrop-filter: none;[^}]*border-bottom: 0;/);
  assert.match(asciiPortalHtml, /\.site-header::before \{[^}]*left: 50%;[^}]*width: 100vw;[^}]*transform: translateX\(-50%\);[^}]*background: transparent;[^}]*border-bottom: 0;/);
  assert.match(asciiPortalHtml, /\.site-header--portal \{\s*position: fixed !important;\s*z-index: 2147483647 !important;\s*top: 0 !important;\s*left: 50% !important;\s*width: 100vw !important;\s*max-width: none !important;\s*box-sizing: border-box !important;\s*margin: 0 !important;\s*padding-inline: max\(var\(--page-pad\), calc\(\(100vw - var\(--max-width\)\) \/ 2 \+ var\(--page-pad\)\)\) !important;[\s\S]*?background: #f4fbfa !important;\s*background-color: #f4fbfa !important;\s*border-bottom: 1px solid rgba\(184, 223, 220, 0\.42\) !important;/);
  assert.match(asciiPortalHtml, /\.site-header--portal::before \{\s*display: none !important;/);
  assert.match(asciiPortalHtml, /\.site-header--portal \+ \.health-site-main \{\s*padding-top: clamp\(92px, 9vh, 108px\) !important;/);
  assert.match(asciiPortalHtml, /\.simplicity__download-link:is\(:link, :visited, :hover, :focus-visible, :active\) \{\s*background: var\(--tiffany-deep\) !important;\s*color: var\(--white\) !important;\s*text-decoration: none !important;\s*text-decoration-color: transparent !important;/);
  assert.match(asciiPortalHtml, /\.site-footer__chat \{\s*width: 36px !important;\s*height: 36px !important;\s*min-width: 36px !important;\s*flex: 0 0 36px !important;/);
  assert.match(asciiPortalHtml, /\.site-footer__chat img \{\s*width: 32px !important;\s*height: 32px !important;\s*min-width: 32px !important;\s*max-width: none !important;/);
  assert.match(asciiPortalHtml, /\.site-header--scrolled \{[^}]*padding-block: 12px;/);
  assert.match(asciiPortalHtml, /\.site-header--scrolled::before \{[^}]*background: rgba\(244, 251, 250, 0\.78\);[^}]*backdrop-filter: blur\(14px\);[^}]*border-bottom: 1px solid rgba\(184, 223, 220, 0\.32\);/);
  assert.match(asciiPortalHtml, /const HEADER_SCROLL_THRESHOLD = 24;/);
  assert.match(asciiPortalHtml, /const HEADER_SCROLL_RESET_THRESHOLD = 4;/);
  assert.match(asciiPortalHtml, /if \(window\.scrollY > HEADER_SCROLL_THRESHOLD\) \{/);
  assert.match(asciiPortalHtml, /if \(window\.scrollY <= HEADER_SCROLL_RESET_THRESHOLD\) \{/);
  assert.doesNotMatch(asciiPortalHtml, /classList\.toggle\("site-header--scrolled", window\.scrollY > HEADER_SCROLL_THRESHOLD\)/);
  assert.match(
    asciiPortalHtml,
    /\.site-nav a:not\(\.site-nav__cta\):is\(:link, :visited, :hover, :focus-visible, :active\) \{\s*color: var\(--tiffany-deep\) !important;\s*text-decoration-color: currentColor;/,
  );
  assert.match(asciiPortalHtml, /\.site-nav__cta \{[^}]*background: var\(--tiffany-deep\);[^}]*color: var\(--white\) !important;[^}]*border-radius: 999px;/);
  assert.match(
    asciiPortalHtml,
    /\.site-footer__links a:is\(:link, :visited, :hover, :focus-visible, :active\) \{\s*color: var\(--tiffany-deep\) !important;\s*text-decoration-color: currentColor;/,
  );
  assert.match(asciiPortalHtml, /\.site-footer__links a \{[^}]*font-size: 0\.84rem;[^}]*text-decoration: none;/);
  assert.match(asciiPortalHtml, /\.site-footer__links a:hover,[\s\S]*?\.site-footer__links a:focus-visible \{[^}]*text-decoration: underline;/);
  assert.match(asciiPortalHtml, /href="doc\.pdf"/);
  assert.match(asciiPortalHtml, /href="#top"[^>]*style="color: #12686b !important; text-decoration-color: currentColor !important;"/);
  assert.match(
    asciiPortalHtml,
    /<a class="brand brand--footer" href="#top" style="color: #35333f !important; text-decoration: none !important; text-decoration-color: currentColor !important;">/,
  );
  assert.match(asciiPortalHtml, /href="doc\.pdf"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*style="color: #12686b !important; text-decoration-color: currentColor !important;"/);
  assert.doesNotMatch(asciiPortalHtml, /data:application\/(?:octet-stream|pdf);base64/);
  assert.match(asciiPortalHtml, /href="https:\/\/testflight\.apple\.com\/join\/KCJxFcV1"/);
  assert.match(asciiPortalHtml, /href="https:\/\/hubthe\.team\/shared\/docs\/bcaa672e-9fd8-43a3-91e2-abe3189a88ae"/);
  assert.doesNotMatch(asciiPortalHtml, /predix-health-app-1\.16\.apk/);
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
