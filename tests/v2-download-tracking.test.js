import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const qrGeneratorUrl = new URL("scripts/generate-v2-download-qrs.py", root);
const iosQrUrl = new URL("v2/public/v2/download/ios-qr.png", root);
const androidQrUrl = new URL("v2/public/v2/download/android-qr.png", root);
const v2RedirectScriptUrl = new URL("v2/go/redirect.js", root);
const v2IosPageUrl = new URL("v2/go/ios/index.html", root);
const v2AndroidPageUrl = new URL("v2/go/android/index.html", root);
const v2RedirectStylesUrl = new URL("v2/go/styles.css", root);

function pngDimensions(path) {
  const buffer = readFileSync(path);

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function decodeQr(path) {
  const absolutePath = fileURLToPath(path);
  const script = `
import json
import zxingcpp
from PIL import Image

results = zxingcpp.read_barcodes(Image.open(${JSON.stringify(absolutePath)}))
print(json.dumps([{"text": result.text, "format": result.format.name} for result in results]))
`;
  const result = spawnSync(
    "uv",
    ["run", "--with", "zxing-cpp", "--with", "pillow", "python", "-c", script],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

test("v2 QR generator targets /install/go/ routes and QR images decode to the exact URLs", () => {
  assert.ok(existsSync(qrGeneratorUrl), "scripts/generate-v2-download-qrs.py should exist");
  assert.ok(existsSync(iosQrUrl), "public/v2/download/ios-qr.png should exist");
  assert.ok(existsSync(androidQrUrl), "public/v2/download/android-qr.png should exist");

  const generator = readFileSync(qrGeneratorUrl, "utf8");
  assert.match(generator, /https:\/\/predix-health\.ru\/install\/go\/ios\//);
  assert.match(generator, /https:\/\/predix-health\.ru\/install\/go\/android\//);
  assert.doesNotMatch(generator, /https:\/\/predix-health\.ru\/go\//);
  assert.doesNotMatch(generator, /source=|yqrid=|utm_/);

  assert.deepEqual(pngDimensions(iosQrUrl), { width: 160, height: 160 });
  assert.deepEqual(pngDimensions(androidQrUrl), { width: 160, height: 160 });

  assert.deepEqual(decodeQr(iosQrUrl), [
    { text: "https://predix-health.ru/install/go/ios/", format: "QRCode" },
  ]);
  assert.deepEqual(decodeQr(androidQrUrl), [
    { text: "https://predix-health.ru/install/go/android/", format: "QRCode" },
  ]);

  assert.ok(
    existsSync(new URL("public/download/ios-testflight-qr.png", root)),
    "v1 QR assets must remain in place",
  );
  assert.ok(
    existsSync(new URL("public/download/android-apk-qr.png", root)),
    "v1 QR assets must remain in place",
  );
});

test("v2 redirect pages send distinct v2 goals and keep the approved destinations", () => {
  for (const pageUrl of [v2IosPageUrl, v2AndroidPageUrl]) {
    assert.ok(existsSync(pageUrl), `${pageUrl.pathname} should exist`);
  }
  assert.ok(existsSync(v2RedirectScriptUrl), "v2/go/redirect.js should exist");
  assert.ok(existsSync(v2RedirectStylesUrl), "v2/go/styles.css should exist");

  const iosPage = readFileSync(v2IosPageUrl, "utf8");
  const androidPage = readFileSync(v2AndroidPageUrl, "utf8");
  const redirectScript = readFileSync(v2RedirectScriptUrl, "utf8");
  const redirectStyles = readFileSync(v2RedirectStylesUrl, "utf8");

  assert.match(iosPage, /data-goal="v2_download_ios"/);
  assert.match(
    iosPage,
    /data-destination="https:\/\/testflight\.apple\.com\/join\/KCJxFcV1"/,
  );
  assert.match(androidPage, /data-goal="v2_download_android"/);
  assert.match(
    androidPage,
    /data-destination="https:\/\/predix-health\.ru\/download\/predix-health-app\.apk"/,
  );
  assert.doesNotMatch(`${iosPage}${androidPage}${redirectScript}`, /"download_ios"|"download_android"/);
  assert.doesNotMatch(`${iosPage}${androidPage}`, /source=|yqrid=|utm_/);

  for (const page of [iosPage, androidPage]) {
    assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(page, /<script defer src="\.\.\/redirect\.js"><\/script>/);
    assert.match(page, /<noscript>[\s\S]*?http-equiv="refresh"/);
    assert.match(page, /<a data-fallback-link[^>]*>\s*Продолжить вручную\s*<\/a>/);
    assert.match(page, /<h1>/);
  }

  assert.match(redirectScript, /112104449/);
  assert.match(
    redirectScript,
    /ym\(112104449, "reachGoal", goal, \{\}, redirect\)/,
  );
  assert.match(redirectScript, /window\.setTimeout\(redirect, 1200\)/);
  assert.match(redirectScript, /window\.location\.replace\(destination\)/);
  assert.match(
    redirectScript,
    /https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=112104449/,
  );
  assert.match(
    redirectStyles,
    /h1\s*\{[^}]*font-size: clamp\(1\.35rem, 3\.2vw, 1\.85rem\);/,
  );
  assert.match(redirectStyles, /a\s*\{[^}]*margin-top: 28px;/);
});

test("v2 landing QR codes and buttons share one platform goal per platform", () => {
  const landing = readFileSync(new URL("v2/index.html", root), "utf8");

  assert.equal((landing.match(/href="\.\/go\/ios\/"/g) ?? []).length, 3);
  assert.equal((landing.match(/href="\.\/go\/android\/"/g) ?? []).length, 3);
  assert.doesNotMatch(landing, /href="https:\/\/testflight\.apple\.com|href="https:\/\/predix-health\.ru\/download\//);
  assert.doesNotMatch(landing, /v2_download_ios|v2_download_android/);
});
