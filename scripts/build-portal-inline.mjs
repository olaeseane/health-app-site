import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const projectRoot = new URL("../", import.meta.url);
const distDirectory = new URL("../dist/", import.meta.url);
const outputFile = new URL("../dist/portal-inline.html", import.meta.url);
const asciiOutputFile = new URL("../dist/portal-inline-ascii.html", import.meta.url);
const run = promisify(execFile);

const portalScreenshotPaths = new Set([
  "public/screenshots/food1.png",
  "public/screenshots/food2.png",
  "public/screenshots/habits1.png",
  "public/screenshots/doc1.png",
  "public/screenshots/doc2.png",
  "public/screenshots/integration1.png",
]);

const mimeTypes = new Map([
  [".css", "text/css"],
  [".js", "text/javascript"],
  [".html", "text/html"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
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
  const normalizedPath = normalizedDistPath(relativePath);
  const fileUrl = new URL(normalizedPath, distDirectory);
  const buffer = await readFile(fileUrl);

  return `data:${mimeFor(normalizedPath)};base64,${buffer.toString("base64")}`;
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
    "76",
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

    const resolvedFromCss = resolve(
      new URL("../dist/src/", import.meta.url).pathname,
      rawUrl,
    );
    const relativeToDist = posix.relative(
      new URL("../dist/", import.meta.url).pathname,
      resolvedFromCss,
    );
    const dataUrl = await dataUrlFromDist(relativeToDist);

    inlinedCss = inlinedCss.replace(match[0], `url("${dataUrl}")`);
  }

  return inlinedCss;
}

async function inlineAppAssetUrls(js) {
  const matches = [...js.matchAll(/src: "(\.\/public\/[^"]+)"/g)];
  let inlinedJs = js;

  for (const match of matches) {
    const dataUrl = await dataUrlFromDist(match[1]);
    inlinedJs = inlinedJs.replace(match[0], `src: "${dataUrl}"`);
  }

  return inlinedJs;
}

async function inlineHtmlAssetUrls(html) {
  const matches = [...html.matchAll(/(src|href)=(['"])(\.\/public\/[^'"]+)\2/g)];
  let inlinedHtml = html;

  for (const match of matches) {
    const [fullMatch, attribute, quote, assetPath] = match;

    if (attribute === "href" && extname(assetPath).toLowerCase() === ".pdf") {
      inlinedHtml = inlinedHtml.replace(fullMatch, `${attribute}=${quote}doc.pdf${quote}`);
      continue;
    }

    const optimizedAssetPath = await optimizePortalScreenshot(assetPath);
    const dataUrl = await dataUrlFromDist(optimizedAssetPath);
    inlinedHtml = inlinedHtml.replace(fullMatch, `${attribute}=${quote}${dataUrl}${quote}`);
  }

  return inlinedHtml;
}

function removePortalSkipLink(html) {
  return html.replace(/\n\s*<a class="skip-link"[\s\S]*?<\/a>\n/, "\n");
}

function addPortalInlineTaskHandlers(html) {
  return html
    .replace(/(<li class="task-item[^"]*" data-task-item="([^"]+)")/g, (_, prefix, taskId) => {
      return `${prefix} onclick="return window.healthSiteSelectTask ? window.healthSiteSelectTask('${taskId}') : true"`;
    })
    .replace(/(<button class="task-item__select" type="button" data-task-select="([^"]+)")/g, (_, prefix, taskId) => {
      return `${prefix} onclick="return window.healthSiteSelectTask ? window.healthSiteSelectTask('${taskId}') : true"`;
    });
}

function addPortalHeaderClass(html) {
  return html.replace(
    '<header class="site-header"',
    '<header class="site-header site-header--portal"',
  );
}

function withPortalCssOverrides(css) {
  return `${css}

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
  transform: translateX(-50%) !important;
  background: #f4fbfa !important;
  background-color: #f4fbfa !important;
  border-bottom: 1px solid rgba(184, 223, 220, 0.42) !important;
}

.site-header--portal::before {
  display: none !important;
}

.site-header--portal + .health-site-main {
  padding-top: clamp(92px, 9vh, 108px) !important;
}

.simplicity__download-link:is(:link, :visited, :hover, :focus-visible, :active) {
  background: var(--tiffany-deep) !important;
  color: var(--white) !important;
  text-decoration: none !important;
  text-decoration-color: transparent !important;
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

@media (max-width: 820px) {
  .site-header--portal + .health-site-main {
    padding-top: 92px !important;
  }
}`;
}

async function buildPortalInline() {
  await mkdir(distDirectory, { recursive: true });

  let html = await readFile(new URL("index.html", projectRoot), "utf8");
  const css = withPortalCssOverrides(
    await inlineCssUrls(
      await readFile(new URL("src/styles.css", projectRoot), "utf8"),
    ),
  );
  const js = await inlineAppAssetUrls(
    await readFile(new URL("src/app.js", projectRoot), "utf8"),
  );

  html = removePortalSkipLink(html);
  html = addPortalHeaderClass(html);
  html = addPortalInlineTaskHandlers(html);
  html = await inlineHtmlAssetUrls(html);
  html = html.replaceAll(
    /\n\s*<link\s+rel="preload"[\s\S]*?\/>/g,
    "",
  );
  html = html.replace(
    /\s*<link rel="stylesheet" href="\.\/src\/styles\.css" \/>/,
    `\n    <style data-portal-inline="styles">\n${css}\n    </style>`,
  );
  html = html.replace(
    /\s*<script defer src="\.\/src\/app\.js"><\/script>/,
    "",
  );
  html = html.replace(
    "</body>",
    `    <script data-portal-inline="app">\n${escapeScript(js)}\n    </script>\n  </body>`,
  );
  html = html.replace(
    "<body>",
    '<body data-portal-build="inline" data-portal-note="Preliminary Liferay HTML widget build with inlined CSS, JS, fonts, and images.">',
  );

  await writeFile(outputFile, html, "utf8");
  await writeFile(asciiOutputFile, makeAsciiSafeHtml(html), "utf8");

  console.log(`Built preliminary portal inline file: ${outputFile.pathname}`);
  console.log(
    `Built ASCII-safe portal inline file: ${asciiOutputFile.pathname}`,
  );
}

await buildPortalInline();
