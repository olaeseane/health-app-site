import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute, relative, resolve, sep } from "node:path";

export function resolveInsideDirectory(directoryUrl, requestedPath) {
  const directoryPath = resolve(fileURLToPath(directoryUrl));
  const absolutePath = resolve(directoryPath, requestedPath);
  const relativePath = relative(directoryPath, absolutePath);

  if (
    isAbsolute(requestedPath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`Asset path resolves outside the build directory: ${requestedPath}`);
  }

  return {
    absolutePath,
    relativePath: relativePath.split(sep).join("/"),
  };
}

export async function readFileInsideDirectory(directoryUrl, requestedPath) {
  const resolved = resolveInsideDirectory(directoryUrl, requestedPath);
  const directoryPath = await realpath(fileURLToPath(directoryUrl));
  const assetPath = await realpath(resolved.absolutePath);
  const realRelativePath = relative(directoryPath, assetPath);

  if (
    realRelativePath === ".." ||
    realRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(realRelativePath)
  ) {
    throw new Error(`Asset path resolves outside the build directory: ${requestedPath}`);
  }

  return {
    ...resolved,
    buffer: await readFile(assetPath),
  };
}
