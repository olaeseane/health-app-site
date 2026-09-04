import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const lockDirectory = join(tmpdir(), "health-app-site-v2-build.lock");
const lockTimeoutMs = 180_000;

/**
 * Serializes build-spawning tests across test files. `node --test` runs test
 * files in parallel, and both v2 build commands rewrite `dist-v2/`, so their
 * spawns must not overlap.
 */
export async function withBuildLock(fn) {
  const deadline = Date.now() + lockTimeoutMs;

  for (;;) {
    try {
      mkdirSync(lockDirectory);
      break;
    } catch (error) {
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for the v2 build lock: ${error}`);
      }
      await sleep(200);
    }
  }

  try {
    return await fn();
  } finally {
    rmSync(lockDirectory, { recursive: true, force: true });
  }
}

/**
 * Reads a file twice and only returns a hash once two consecutive reads match,
 * so hashes stay reliable even when another test file rebuilds `dist/`
 * concurrently without taking the v2 lock.
 */
export async function stableSha256(path) {
  let previous = await readFile(path);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await sleep(60);
    const current = await readFile(path);

    if (current.equals(previous)) {
      return createHash("sha256").update(current).digest("hex");
    }

    previous = current;
  }

  throw new Error(`File kept changing while hashing: ${path}`);
}
