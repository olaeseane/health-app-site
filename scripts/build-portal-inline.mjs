import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, posix, resolve } from "node:path";

const projectRoot = new URL("../", import.meta.url);
const distDirectory = new URL("../dist/", import.meta.url);
const outputFile = new URL("../dist/portal-inline.html", import.meta.url);

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

async function dataUrlFromDist(relativePath) {
  const normalizedPath = relativePath.replace(/^\.\//, "");
  const fileUrl = new URL(normalizedPath, distDirectory);
  const buffer = await readFile(fileUrl);

  return `data:${mimeFor(normalizedPath)};base64,${buffer.toString("base64")}`;
}

function escapeScript(text) {
  return text.replaceAll("</script", "<\\/script");
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
    const dataUrl = await dataUrlFromDist(assetPath);
    inlinedHtml = inlinedHtml.replace(fullMatch, `${attribute}=${quote}${dataUrl}${quote}`);
  }

  return inlinedHtml;
}

async function buildPortalInline() {
  await mkdir(distDirectory, { recursive: true });

  let html = await readFile(new URL("index.html", projectRoot), "utf8");
  const css = await inlineCssUrls(
    await readFile(new URL("src/styles.css", projectRoot), "utf8"),
  );
  const js = await inlineAppAssetUrls(
    await readFile(new URL("src/app.js", projectRoot), "utf8"),
  );

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

  console.log(`Built preliminary portal inline file: ${outputFile.pathname}`);
}

await buildPortalInline();
