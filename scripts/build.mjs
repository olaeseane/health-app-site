import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { extname } from "node:path";

const outputDirectory = new URL("../dist/", import.meta.url);

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

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });
await cp(new URL("../index.html", import.meta.url), new URL("index.html", outputDirectory));
await cp(new URL("../src/", import.meta.url), new URL("src/", outputDirectory), {
  recursive: true,
});
await cp(new URL("../public/", import.meta.url), new URL("public/", outputDirectory), {
  recursive: true,
});
await cp(new URL("../video/", import.meta.url), new URL("video/", outputDirectory), {
  recursive: true,
});
await cp(new URL("../go/", import.meta.url), new URL("go/", outputDirectory), {
  recursive: true,
});
await removeSvgAssets(new URL("public/", outputDirectory));

console.log("Built static landing page in dist/");
