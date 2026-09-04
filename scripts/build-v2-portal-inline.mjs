import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  readFileInsideDirectory,
  resolveInsideDirectory,
} from "./lib/safe-dist-path.mjs";

const projectRoot = new URL("../", import.meta.url);
const distDirectory = new URL("../dist-v2/", import.meta.url);
const outputFile = new URL("portal-inline.html", distDirectory);
const asciiOutputFile = new URL("portal-inline-ascii.html", distDirectory);
const run = promisify(execFile);

const maxArtifactBytes = 1_000_000;

const portalScreenshotPaths = new Set([
  "public/screenshots/food1.png",
  "public/screenshots/food2.png",
  "public/screenshots/doc1.png",
  "public/screenshots/doc2.png",
  "public/screenshots/integration1.png",
  "public/screenshots/habits1.png",
]);

const characterWebpPath = "public/v2/character/robot.webp";
const characterPortalPath = "public/v2/character/robot-portal.jpg";

const mimeTypes = new Map([
  [".css", "text/css"],
  [".js", "text/javascript"],
  [".html", "text/html"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function mimeFor(pathname) {
  return mimeTypes.get(extname(pathname).toLowerCase()) ?? "application/octet-stream";
}

function normalizedDistPath(relativePath) {
  return relativePath.replace(/^\.\//, "");
}

async function dataUrlFromDist(relativePath) {
  const { buffer, relativePath: safePath } = await readFileInsideDirectory(
    distDirectory,
    relativePath,
  );

  return `data:${mimeFor(safePath)};base64,${buffer.toString("base64")}`;
}

function portalOptimizedScreenshotPath(relativePath) {
  const normalizedPath = normalizedDistPath(relativePath);

  if (!portalScreenshotPaths.has(normalizedPath)) {
    return null;
  }

  return normalizedPath.replace(/\.png$/, ".portal.jpg");
}

async function optimizePortalScreenshot(relativePath) {
  const normalizedPath = normalizedDistPath(relativePath);
  const optimizedPath = portalOptimizedScreenshotPath(normalizedPath);

  if (!optimizedPath) {
    return normalizedPath;
  }

  const sourceUrl = new URL(normalizedPath, distDirectory);
  const optimizedUrl = new URL(optimizedPath, distDirectory);
  const resizedUrl = new URL(`${optimizedPath}.tmp.png`, distDirectory);

  await run("sips", [
    "--resampleHeight",
    "900",
    fileURLToPath(sourceUrl),
    "--out",
    fileURLToPath(resizedUrl),
  ]);
  await run("sips", [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "74",
    fileURLToPath(resizedUrl),
    "--out",
    fileURLToPath(optimizedUrl),
  ]);
  await rm(resizedUrl, { force: true });

  return optimizedPath;
}

function escapeScript(text) {
  return text.replaceAll("</script", "<\\/script");
}

function escapeNonAsciiForHtml(text) {
  return text.replace(/[\u0080-\uFFFF]/g, (character) => {
    return `&#${character.codePointAt(0)};`;
  });
}

function escapeNonAsciiForJavaScript(text) {
  return text.replace(/[\u0080-\uFFFF]/g, (character) => {
    const codePoint = character.codePointAt(0);

    if (codePoint <= 0xffff) {
      return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    }

    return `\\u{${codePoint.toString(16)}}`;
  });
}

function escapeNonAsciiForCss(text) {
  return text.replace(/[\u0080-\uFFFF]/g, (character) => {
    return `\\${character.codePointAt(0).toString(16)} `;
  });
}

function makeAsciiSafeHtml(html) {
  const blocks = [];

  let protectedHtml = html.replace(
    /<style data-portal-inline="styles">([\s\S]*?)<\/style>/,
    (_, styleBody) => {
      const token = `__PORTAL_INLINE_BLOCK_${blocks.length}__`;
      blocks.push(
        `<style data-portal-inline="styles">${escapeNonAsciiForCss(styleBody)}</style>`,
      );

      return token;
    },
  );

  protectedHtml = protectedHtml.replace(
    /<script data-portal-inline="app">([\s\S]*?)<\/script>/,
    (_, scriptBody) => {
      const token = `__PORTAL_INLINE_BLOCK_${blocks.length}__`;
      blocks.push(
        `<script data-portal-inline="app">${escapeNonAsciiForJavaScript(scriptBody)}</script>`,
      );

      return token;
    },
  );

  protectedHtml = escapeNonAsciiForHtml(protectedHtml);

  blocks.forEach((block, index) => {
    protectedHtml = protectedHtml.replace(`__PORTAL_INLINE_BLOCK_${index}__`, block);
  });

  return protectedHtml;
}

async function inlineCssUrls(css) {
  const matches = [...css.matchAll(/url\(([^)]+)\)/g)];
  let inlinedCss = css;

  for (const match of matches) {
    const rawUrl = match[1].trim().replace(/^['"]|['"]$/g, "");

    if (/^(?:data:|https?:|#)/.test(rawUrl)) {
      continue;
    }

    const { relativePath } = resolveInsideDirectory(distDirectory, rawUrl);
    const dataUrl = await dataUrlFromDist(relativePath);

    inlinedCss = inlinedCss.replace(match[0], `url("${dataUrl}")`);
  }

  return inlinedCss;
}

async function inlineHtmlAssetUrls(html) {
  const matches = [...html.matchAll(/(src|href)=(['"])(\.\/public\/[^'"]+)\2/g)];
  let inlinedHtml = html;

  for (const match of matches) {
    const [fullMatch, attribute, quote, assetPath] = match;
    const normalizedPath = normalizedDistPath(assetPath);

    if (attribute === "href" && extname(normalizedPath).toLowerCase() === ".pdf") {
      inlinedHtml = inlinedHtml.replace(fullMatch, `${attribute}=${quote}doc.pdf${quote}`);
      continue;
    }

    let inlinePath = normalizedPath;
    if (normalizedPath === characterWebpPath) {
      inlinePath = characterPortalPath;
    } else if (portalOptimizedScreenshotPath(normalizedPath)) {
      inlinePath = await optimizePortalScreenshot(normalizedPath);
    }

    const dataUrl = await dataUrlFromDist(inlinePath);
    inlinedHtml = inlinedHtml.replace(fullMatch, `${attribute}=${quote}${dataUrl}${quote}`);
  }

  return inlinedHtml;
}

function removePortalSkipLink(html) {
  return html.replace(/\n\s*<a class="skip-link"[\s\S]*?<\/a>\n/, "\n");
}

function removePortalSkipLinkStyles(css) {
  return css.replace(/\.skip-link \{[^}]*\}\n\n\.skip-link:focus \{[^}]*\}\n\n/, "");
}

function removePortalMetrika(html) {
  return html.replace(
    /\n\s*<!-- Yandex\.Metrika counter -->[\s\S]*?<!-- \/Yandex\.Metrika counter -->\n/,
    "\n",
  );
}

function addPortalHeaderClass(html) {
  return html.replace(
    '<header class="site-header"',
    '<header class="site-header site-header--portal"',
  );
}

function addPortalDocumentationLink(html) {
  return html.replace(
    "<!-- portal-documentation-link -->",
    '<span aria-hidden="true">·</span>\n        <a href="doc.pdf" target="_blank" rel="noopener noreferrer" style="color: #12686b !important; text-decoration-color: currentColor !important;">Документация</a>',
  );
}

function escapeRegExp(text) {
  return text.replaceAll(".", "\\.").replaceAll("/", "\\/");
}

function unwrapHeroQrLinks(html) {
  return html.replace(
    /<a\s+class="hero__qr-link"\s+href="\.\/go\/(?:ios|android)\/"\s+aria-label="[^"]+"\s*>\s*(<img\s[\s\S]*?\/>)\s*<\/a>/g,
    '<div class="hero__qr-link">\n                $1\n              </div>',
  );
}

function restorePortalDownloadPresentation(html) {
  const platforms = [
    ["./go/ios/", "iOS", "Скачать iOS"],
    ["./go/android/", "Android", "Скачать Android"],
  ];

  for (const [href, label, buttonText] of platforms) {
    html = html.replace(
      new RegExp(
        `<a\\s+class="download-option__code"\\s+href="${escapeRegExp(href)}"\\s+aria-label="[^"]+"\\s*>\\s*(<img\\s[\\s\\S]*?\\/>)\\s*<\\/a>`,
      ),
      '<div class="download-option__code">\n                $1\n              </div>',
    );
    html = html.replace(
      `<figcaption>\n                <a\n                  class="download-option__link"\n                  href="${href}"\n                >\n                  ${buttonText}\n                </a>\n              </figcaption>`,
      `<figcaption>\n                <strong>${label}</strong>\n              </figcaption>`,
    );
  }

  return html;
}

function withPortalCssOverrides(css) {
  return `#wrapper #header,
.breadcrumbs,
.section-footer,
.footer-copyright {
  display: none;
}

#content {
  padding: 0;
}

${css}

html {
  scroll-padding-top: 84px !important;
}

.site-header--portal {
  position: fixed !important;
  z-index: 2147483647 !important;
  top: 0 !important;
  left: 50% !important;
  width: 100vw !important;
  max-width: none !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding-inline: max(var(--page-pad), calc((100vw - var(--max-width)) / 2 + var(--page-pad))) !important;
  padding-block: 12px !important;
  transform: translateX(-50%) !important;
  background: #f4fbfa !important;
  background-color: #f4fbfa !important;
  border-bottom: 1px solid rgba(184, 223, 220, 0.42) !important;
}

.site-header--portal::before {
  display: none !important;
}

.site-header--portal + .health-site-main {
  padding-top: 68px !important;
}

.button--primary:is(:link, :visited, :hover, :focus-visible, :active) {
  color: var(--white) !important;
  text-decoration: none !important;
  text-decoration-color: transparent !important;
}

.button--primary:hover {
  background: var(--tiffany-deep) !important;
  box-shadow: 0 16px 34px rgba(18, 104, 107, 0.24) !important;
  transform: translateY(-1px) !important;
}

.button--primary:active {
  background: var(--tiffany-deep) !important;
  box-shadow: 0 10px 24px rgba(18, 104, 107, 0.2) !important;
  transform: translateY(0) !important;
}

.button--primary:focus-visible {
  outline: 3px solid rgba(127, 211, 205, 0.45) !important;
  outline-offset: 3px !important;
}

.site-nav__cta:is(:link, :visited, :hover, :focus-visible, :active) {
  color: var(--white) !important;
  text-decoration: none !important;
  text-decoration-color: transparent !important;
}

.site-nav__cta:hover {
  background: var(--tiffany-dark) !important;
  box-shadow: 0 16px 34px rgba(18, 104, 107, 0.24) !important;
  transform: translateY(-1px) !important;
}

.site-nav__cta:active {
  background: var(--tiffany-dark) !important;
  box-shadow: 0 10px 24px rgba(18, 104, 107, 0.2) !important;
  transform: translateY(0) !important;
}

.site-nav__cta:focus-visible {
  outline: 3px solid rgba(127, 211, 205, 0.45) !important;
  outline-offset: 3px !important;
}

.hero__qr-link,
.download-option__code {
  cursor: default !important;
}

.hero__qr-link:hover,
.download-option__code:hover {
  transform: none !important;
}

.site-footer__chat {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  flex: 0 0 36px !important;
}

.site-footer__chat img {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  max-width: none !important;
}

@media (max-width: 600px) {
  .site-footer {
    grid-template-columns: minmax(0, 1fr) !important;
    align-items: start !important;
    gap: 28px !important;
    padding: 42px var(--page-pad) 54px !important;
  }

  .site-footer > div {
    grid-column: auto !important;
    grid-row: 3 !important;
  }

  .site-footer__links {
    grid-column: auto !important;
    grid-row: auto !important;
    justify-self: start !important;
  }
}`;
}

function assertPortalContract(name, html, forbiddenPattern) {
  if (forbiddenPattern.test(html)) {
    throw new Error(`Portal v2 build failed contract check: ${name}`);
  }
}

async function buildPortalInline() {
  await mkdir(distDirectory, { recursive: true });

  let html = await readFile(new URL("index.html", distDirectory), "utf8");
  const css = withPortalCssOverrides(
    removePortalSkipLinkStyles(
      await inlineCssUrls(
        await readFile(new URL("styles.css", distDirectory), "utf8"),
      ),
    ),
  );
  const js = await readFile(new URL("app.js", distDirectory), "utf8");

  html = removePortalMetrika(html);
  html = removePortalSkipLink(html);
  html = addPortalHeaderClass(html);
  html = addPortalDocumentationLink(html);
  html = unwrapHeroQrLinks(html);
  html = restorePortalDownloadPresentation(html);
  html = await inlineHtmlAssetUrls(html);
  html = html.replaceAll(
    /\n\s*<link\s+rel="preload"[\s\S]*?\/>/g,
    "",
  );
  html = html.replace(
    /\s*<link rel="stylesheet" href="\.\/styles\.css" \/>/,
    `\n    <style data-portal-inline="styles">\n${css}\n    </style>`,
  );
  html = html.replace(
    /\s*<script defer src="\.\/app\.js"><\/script>/,
    "",
  );
  html = html.replace(
    "</body>",
    `    <script data-portal-inline="app">\n${escapeScript(js)}\n    </script>\n  </body>`,
  );

  const asciiHtml = makeAsciiSafeHtml(html);

  assertPortalContract("no SVG content", asciiHtml, /<svg|image\/svg\+xml|\.svg/);
  assertPortalContract(
    "no Metrika or v2 goals",
    asciiHtml,
    /mc\.yandex\.ru|112104449|ym\(|v2_download_ios|v2_download_android/,
  );
  assertPortalContract(
    "no unresolved local references",
    asciiHtml,
    /(?:src|href)="\.\//,
  );

  if (Buffer.byteLength(asciiHtml, "utf8") >= maxArtifactBytes) {
    throw new Error(
      `Portal v2 artifact exceeds ${maxArtifactBytes} bytes: ${Buffer.byteLength(asciiHtml, "utf8")}`,
    );
  }

  await writeFile(outputFile, html, "utf8");
  await writeFile(asciiOutputFile, asciiHtml, "utf8");

  console.log(`Built v2 portal inline file: ${outputFile.pathname}`);
  console.log(
    `Built ASCII-safe v2 portal inline file: ${asciiOutputFile.pathname} (${Buffer.byteLength(asciiHtml, "utf8")} bytes)`,
  );
}

await buildPortalInline();
