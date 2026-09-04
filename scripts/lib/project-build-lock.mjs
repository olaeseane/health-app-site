import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const retryDelayMs = 100;
const lockTimeoutMs = 180_000;
const incompleteOwnerGraceMs = 5_000;

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

async function readOwner(lockDirectory) {
  try {
    return JSON.parse(await readFile(join(lockDirectory, "owner.json"), "utf8"));
  } catch {
    return null;
  }
}

async function removeStaleLock(lockDirectory) {
  const owner = await readOwner(lockDirectory);

  if (owner?.pid && processIsAlive(owner.pid)) {
    return false;
  }

  if (!owner) {
    try {
      const lockStat = await stat(lockDirectory);
      if (Date.now() - lockStat.mtimeMs < incompleteOwnerGraceMs) {
        return false;
      }
    } catch {
      return true;
    }
  }

  const ownerBeforeRemoval = await readOwner(lockDirectory);
  if (ownerBeforeRemoval?.token !== owner?.token) {
    return false;
  }

  await rm(lockDirectory, { recursive: true, force: true });
  return true;
}

export async function withProjectBuildLock(projectDirectoryUrl, fn) {
  const projectPath = await realpath(projectDirectoryUrl);
  const projectHash = createHash("sha256").update(projectPath).digest("hex").slice(0, 16);
  const lockDirectory = join(tmpdir(), `health-app-site-v2-build-${projectHash}.lock`);
  const token = randomUUID();
  const deadline = Date.now() + lockTimeoutMs;

  for (;;) {
    try {
      await mkdir(lockDirectory);
      await writeFile(
        join(lockDirectory, "owner.json"),
        JSON.stringify({ pid: process.pid, token, createdAt: new Date().toISOString() }),
        { flag: "wx" },
      );
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw error;
      }
      await removeStaleLock(lockDirectory);
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for the v2 build lock: ${lockDirectory}`);
      }
      await sleep(retryDelayMs);
    }
  }

  try {
    return await fn();
  } finally {
    const owner = await readOwner(lockDirectory);
    if (owner?.token === token) {
      await rm(lockDirectory, { recursive: true, force: true });
    }
  }
}
