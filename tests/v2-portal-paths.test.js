import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  readFileInsideDirectory,
  resolveInsideDirectory,
} from "../scripts/lib/safe-dist-path.mjs";

const distDirectory = new URL("../dist-v2/", import.meta.url);

test("portal asset resolution rejects paths outside dist-v2", () => {
  assert.throws(
    () => resolveInsideDirectory(distDirectory, "../private.txt"),
    /outside the build directory/,
  );
  assert.throws(
    () => resolveInsideDirectory(distDirectory, "/etc/passwd"),
    /outside the build directory/,
  );
});

test("portal asset resolution accepts files inside dist-v2", () => {
  const resolved = resolveInsideDirectory(
    distDirectory,
    "./public/fonts/manrope/manrope-cyrillic-variable.woff2",
  );

  assert.equal(
    resolved.relativePath,
    "public/fonts/manrope/manrope-cyrillic-variable.woff2",
  );
  assert.ok(resolved.absolutePath.endsWith("/dist-v2/public/fonts/manrope/manrope-cyrillic-variable.woff2"));
});

test("portal asset reads cannot disclose a file outside the build directory", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "portal-path-test-"));
  const buildPath = join(fixtureRoot, "dist-v2");
  const buildDirectory = pathToFileURL(`${buildPath}/`);

  try {
    await mkdir(buildPath);
    await writeFile(join(fixtureRoot, "secret.txt"), "must-not-be-read");
    await writeFile(join(buildPath, "asset.txt"), "allowed");

    await assert.rejects(
      readFileInsideDirectory(buildDirectory, "./public/../../secret.txt"),
      /outside the build directory/,
    );
    assert.equal(
      (await readFileInsideDirectory(buildDirectory, "asset.txt")).buffer.toString(),
      "allowed",
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("portal HTML and CSS assets use the guarded read path", async () => {
  const builder = await readFile(
    new URL("../scripts/build-v2-portal-inline.mjs", import.meta.url),
    "utf8",
  );

  assert.match(
    builder,
    /readFileInsideDirectory\(\s*distDirectory,\s*relativePath,?\s*\)/,
  );
});

test("portal asset reads reject symlinks that escape the build directory", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "portal-symlink-test-"));
  const buildPath = join(fixtureRoot, "dist-v2");
  const buildDirectory = pathToFileURL(`${buildPath}/`);

  try {
    await mkdir(buildPath);
    const secretPath = join(fixtureRoot, "secret.txt");
    await writeFile(secretPath, "must-not-be-read");
    await symlink(secretPath, join(buildPath, "asset.txt"));

    await assert.rejects(
      readFileInsideDirectory(buildDirectory, "asset.txt"),
      /outside the build directory/,
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
