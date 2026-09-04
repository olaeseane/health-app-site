import { withProjectBuildLock } from "./lib/project-build-lock.mjs";

const projectRoot = new URL("../", import.meta.url);
const mode = process.argv[2];

if (!new Set(["ordinary", "portal-inline"]).has(mode)) {
  throw new Error(`Unknown v2 build mode: ${mode}`);
}

await withProjectBuildLock(projectRoot, async () => {
  await import("./build-v2.mjs");

  if (mode === "portal-inline") {
    await import("./build-v2-portal-inline.mjs");
  }
});
