import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function parsePng(path) {
  const script = `
from PIL import Image
import json
im=Image.open(${JSON.stringify(path)}).convert('RGBA')
print(json.dumps({'size': im.size, 'pixels': list(im.getdata())}))
`;
  const result = spawnSync("uv", ["run", "--with", "pillow", "python", "-c", script], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function averageChannelDelta(a, b) {
  assert.deepEqual(a.size, b.size);
  let total = 0;
  const channels = a.pixels.length * 4;

  for (let index = 0; index < a.pixels.length; index += 1) {
    for (let channel = 0; channel < 4; channel += 1) {
      total += Math.abs(a.pixels[index][channel] - b.pixels[index][channel]);
    }
  }

  return total / channels;
}

test("dist logo keeps the same visible halo as the source public logo", () => {
  const build = spawnSync("npm", ["run", "build"], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const publicLogo = parsePng(new URL("../public/logo-mark.png", import.meta.url).pathname);
  const distLogo = parsePng(new URL("../dist/public/logo-mark.png", import.meta.url).pathname);
  const averageDelta = averageChannelDelta(publicLogo, distLogo);

  assert.ok(
    averageDelta < 1,
    `dist logo should match public logo closely, average channel delta: ${averageDelta}`,
  );
});
