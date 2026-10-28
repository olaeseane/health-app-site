import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const qrGeneratorUrl = new URL("scripts/generate-v2-download-qrs.py", root);
const iosQrUrl = new URL("v2/public/v2/download/ios-qr.png", root);
const androidQrUrl = new URL("v2/public/v2/download/android-qr.png", root);
const portalIosQrUrl = new URL("public/download/ios-testflight-qr.png", root);
const portalAndroidQrUrl = new URL("public/download/android-apk-qr.png", root);
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

test("portal QR assets encode the root download routes", () => {
  assert.deepEqual(decodeQr(portalIosQrUrl), [
    { text: "https://predix-health.ru/go/ios/", format: "QRCode" },
  ]);
  assert.deepEqual(decodeQr(portalAndroidQrUrl), [
    { text: "https://predix-health.ru/go/android/", format: "QRCode" },
  ]);
});

test("v2 landing keeps platform routes inside scan-only QR images", () => {
  const landing = readFileSync(new URL("v2/index.html", root), "utf8");

  assert.equal((landing.match(/href="\.\/go\/ios\/"/g) ?? []).length, 0);
  assert.equal((landing.match(/href="\.\/go\/android\/"/g) ?? []).length, 0);
  assert.equal((landing.match(/class="hero__qr-code"/g) ?? []).length, 2);
  assert.equal((landing.match(/class="download-option__code"/g) ?? []).length, 2);
  assert.doesNotMatch(landing, /<a[^>]*>\s*<img[^>]*-qr\.png/);
  assert.doesNotMatch(landing, /href="https:\/\/testflight\.apple\.com|href="https:\/\/predix-health\.ru\/download\//);
  assert.doesNotMatch(landing, /v2_download_ios|v2_download_android/);
});
