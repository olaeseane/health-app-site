import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const v1Directory = new URL("dist/", projectRoot);
const v2Directory = new URL("dist-v2/", projectRoot);
const pagesDirectory = new URL("dist-pages/", projectRoot);
const installDirectory = new URL("install/", pagesDirectory);

const portalArtifacts = ["portal-inline.html", "portal-inline-ascii.html"];
const portalCharacter = "public/v2/character/robot-portal.jpg";
const pagesAndroidDestination =
  "https://hubthe.team/shared/docs/bcaa672e-9fd8-43a3-91e2-abe3189a88ae";

await rm(pagesDirectory, { recursive: true, force: true });
await mkdir(installDirectory, { recursive: true });
await cp(v1Directory, pagesDirectory, { recursive: true });
await cp(v2Directory, installDirectory, { recursive: true });

const pagesIndex = new URL("index.html", pagesDirectory);
const v1Html = await readFile(pagesIndex, "utf8");
await writeFile(pagesIndex, v1Html.replaceAll('href="/go/', 'href="./go/'));

const androidRedirect = new URL("go/android/index.html", pagesDirectory);
const androidHtml = await readFile(androidRedirect, "utf8");
await writeFile(
  androidRedirect,
  androidHtml.replaceAll("/download/predix-health-app.apk", pagesAndroidDestination),
);

for (const artifact of portalArtifacts) {
  await rm(new URL(artifact, pagesDirectory), { force: true });
  await rm(new URL(artifact, installDirectory), { force: true });
}
await rm(new URL(portalCharacter, installDirectory), { force: true });

await writeFile(new URL(".nojekyll", pagesDirectory), "");

console.log("Built combined GitHub Pages site in dist-pages/");
