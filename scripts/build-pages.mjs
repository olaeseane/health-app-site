import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const v1Directory = new URL("dist/", projectRoot);
const v2Directory = new URL("dist-v2/", projectRoot);
const pagesDirectory = new URL("dist-pages/", projectRoot);
const installDirectory = new URL("install/", pagesDirectory);
const foodDirectory = new URL("food/", pagesDirectory);

const portalArtifacts = ["portal-inline.html", "portal-inline-ascii.html"];
const portalCharacter = "public/v2/character/robot-portal.jpg";
await rm(pagesDirectory, { recursive: true, force: true });
await mkdir(installDirectory, { recursive: true });
await mkdir(foodDirectory, { recursive: true });
await cp(v1Directory, pagesDirectory, { recursive: true });
await cp(v2Directory, installDirectory, { recursive: true });

const pagesIndex = new URL("index.html", pagesDirectory);
const v1Html = await readFile(pagesIndex, "utf8");
await writeFile(pagesIndex, v1Html.replaceAll('href="/go/', 'href="./go/'));

for (const artifact of portalArtifacts) {
  await rm(new URL(artifact, pagesDirectory), { force: true });
  await rm(new URL(artifact, installDirectory), { force: true });
}
await rm(new URL(portalCharacter, installDirectory), { force: true });

await writeFile(new URL(".nojekyll", pagesDirectory), "");

console.log("Built combined GitHub Pages site in dist-pages/");
