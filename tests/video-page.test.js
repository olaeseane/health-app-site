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
const videoUrl = new URL("video/video.mp4", projectRoot);
const legacyPlaceholderUrl = new URL("video/placeholder.mp4", projectRoot);
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
  assert.match(page, /<source src="\.\/video\.mp4" type="video\/mp4" \/>/);
  assert.doesNotMatch(page, /<video\b[^>]*\bposter=/);
  assert.match(page, /contextmenu[\s\S]*?preventDefault/);
});

test("video assets use their final names and are included in ordinary builds", () => {
  assert.ok(existsSync(videoUrl), "video/video.mp4 should exist");
  assert.ok(!existsSync(legacyPlaceholderUrl), "legacy placeholder.mp4 should be removed");
  assert.ok(existsSync(posterUrl), "video/poster.png should exist");
  assert.ok(statSync(videoUrl).size > 1_000, "video MP4 should not be empty");
  assert.ok(statSync(posterUrl).size > 1_000, "poster PNG should not be empty");

  const mp4Header = readFileSync(videoUrl).subarray(4, 8).toString("ascii");
  assert.equal(mp4Header, "ftyp");
  const poster = readFileSync(posterUrl);
  assert.deepEqual(
    { width: poster.readUInt32BE(16), height: poster.readUInt32BE(20) },
    { width: 1280, height: 720 },
  );
  assert.match(
    buildScript,
    /await cp\(new URL\("\.\.\/video\/", import\.meta\.url\), new URL\("video\/", outputDirectory\), \{[\s\S]*?recursive: true,[\s\S]*?\}\);/,
  );
});
