import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const landing = readFileSync(new URL("index.html", projectRoot), "utf8");
const buildScript = readFileSync(
  new URL("scripts/build.mjs", projectRoot),
  "utf8",
);
const videoPageUrl = new URL("video/index.html", projectRoot);
const placeholderUrl = new URL("video/placeholder.mp4", projectRoot);
const posterUrl = new URL("video/poster.png", projectRoot);

test("standalone video page is unlinked and excluded from analytics", () => {
  assert.ok(existsSync(videoPageUrl), "video/index.html should exist");
  const page = readFileSync(videoPageUrl, "utf8");

  assert.doesNotMatch(landing, /href=["'][^"']*\/video\/?["']/);
  assert.doesNotMatch(page, /mc\.yandex\.ru|ym\(112104449|Yandex\.Metrika/);
  assert.doesNotMatch(page, /<a\b/);
  assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.match(page, /background:[^;]*(?:gradient|#f4fbfa)/);
});

test("video page exposes native playback controls without autoplay or download UI", () => {
  assert.ok(existsSync(videoPageUrl), "video/index.html should exist");
  const page = readFileSync(videoPageUrl, "utf8");

  assert.match(page, /<video\b[^>]*\bcontrols\b/);
  assert.match(page, /<video\b[^>]*\bplaysinline\b/);
  assert.match(page, /<video\b[^>]*\bpreload="metadata"/);
  assert.match(page, /<video\b[^>]*\bcontrolslist="nodownload noremoteplayback"/);
  assert.match(page, /<video\b[^>]*\bdisablepictureinpicture\b/);
  assert.doesNotMatch(page, /<video\b[^>]*\bautoplay\b/);
  assert.match(page, /<source src="\.\/placeholder\.mp4" type="video\/mp4" \/>/);
  assert.match(page, /poster="\.\/poster\.png"/);
  assert.match(page, /contextmenu[\s\S]*?preventDefault/);
});

test("video placeholder assets are valid and included in ordinary builds", () => {
  assert.ok(existsSync(placeholderUrl), "video/placeholder.mp4 should exist");
  assert.ok(existsSync(posterUrl), "video/poster.png should exist");
  assert.ok(statSync(placeholderUrl).size > 1_000, "placeholder MP4 should not be empty");
  assert.ok(statSync(posterUrl).size > 1_000, "poster PNG should not be empty");

  const mp4Header = readFileSync(placeholderUrl).subarray(4, 8).toString("ascii");
  assert.equal(mp4Header, "ftyp");
  assert.match(
    buildScript,
    /await cp\(new URL\("\.\.\/video\/", import\.meta\.url\), new URL\("video\/", outputDirectory\), \{[\s\S]*?recursive: true,[\s\S]*?\}\);/,
  );
});
