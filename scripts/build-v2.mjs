import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { extname } from "node:path";

const outputDirectory = new URL("../dist-v2/", import.meta.url);
const sourceDirectory = new URL("../v2/", import.meta.url);

const sharedPublicAssets = [
  "fonts/",
  "logo-mark.png",
  "icons/chat-logo-96.png",
  "screenshots/food1.png",
  "screenshots/food2.png",
  "screenshots/doc1.png",
  "screenshots/doc2.png",
  "screenshots/integration1.png",
  "screenshots/habits1.png",
];

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
await cp(new URL("index.html", sourceDirectory), new URL("index.html", outputDirectory));
await cp(new URL("styles.css", sourceDirectory), new URL("styles.css", outputDirectory));
await cp(new URL("app.js", sourceDirectory), new URL("app.js", outputDirectory));
await cp(new URL("public/", sourceDirectory), new URL("public/", outputDirectory), {
  recursive: true,
});
await cp(new URL("go/", sourceDirectory), new URL("go/", outputDirectory), {
  recursive: true,
});

for (const asset of sharedPublicAssets) {
  const from = new URL(`../public/${asset}`, import.meta.url);
  const to = new URL(`public/${asset}`, outputDirectory);
  await mkdir(new URL(".", to), { recursive: true });
  await cp(from, to, { recursive: true });
}

await removeSvgAssets(new URL("public/", outputDirectory));

console.log("Built v2 install landing in dist-v2/");
