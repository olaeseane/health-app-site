import { execFile } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const outputDirectory = new URL("../dist/", import.meta.url);
const run = promisify(execFile);

async function removeSvgAssets(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryUrl = new URL(entry.name, directoryUrl);

      if (entry.isDirectory()) {
        await removeSvgAssets(new URL(`${entry.name}/`, directoryUrl));
        return;
      }

      if (extname(entry.name).toLowerCase() === ".svg") {
        await rm(entryUrl, { force: true });
      }
    }),
  );
}

async function optimizeBrandMark() {
  const sourceLogoUrl = new URL("../docs/assets/brand/logo.svg", import.meta.url);
  const logoMarkUrl = new URL("public/logo-mark.png", outputDirectory);
  const extractedLogoUrl = new URL("public/logo-mark.source.png", outputDirectory);
  const sourceLogo = await readFile(sourceLogoUrl, "utf8");
  const embeddedPng = sourceLogo.match(/xlink:href="data:image\/png;base64,([^"]+)"/);

  if (embeddedPng) {
    await writeFile(extractedLogoUrl, Buffer.from(embeddedPng[1], "base64"));
  }

  await run("magick", [
    fileURLToPath(embeddedPng ? extractedLogoUrl : logoMarkUrl),
    "-trim",
    "+repage",
    "-bordercolor",
    "none",
    "-border",
    "18",
    "-resize",
    "192x192",
    "-gravity",
    "center",
    "-background",
    "none",
    "-extent",
    "192x192",
    "-strip",
    "-define",
    "png:compression-level=9",
    fileURLToPath(logoMarkUrl),
  ]);
  await rm(extractedLogoUrl, { force: true });
}

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });
await cp(new URL("../index.html", import.meta.url), new URL("index.html", outputDirectory));
await cp(new URL("../src/", import.meta.url), new URL("src/", outputDirectory), {
  recursive: true,
});
await cp(new URL("../public/", import.meta.url), new URL("public/", outputDirectory), {
  recursive: true,
});
await optimizeBrandMark();
await removeSvgAssets(new URL("public/", outputDirectory));

console.log("Built static landing page in dist/");
