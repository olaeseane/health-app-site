import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const landing = readFileSync(new URL("index.html", root), "utf8");
const buildScript = readFileSync(new URL("scripts/build.mjs", root), "utf8");
const redirectScriptUrl = new URL("go/redirect.js", root);
const iosPageUrl = new URL("go/ios/index.html", root);
const androidPageUrl = new URL("go/android/index.html", root);
const redirectStylesUrl = new URL("go/styles.css", root);
const qrGeneratorUrl = new URL("scripts/generate-download-qrs.py", root);

test("download buttons and clickable QR images share platform redirect routes", () => {
  const download = landing.match(
    /<section\b[^>]*\bid="download"[^>]*>([\s\S]*?)<\/section>/,
  )?.[1];

  assert.ok(download);
  assert.equal((download.match(/href="\/go\/ios\/"/g) ?? []).length, 2);
  assert.equal((download.match(/href="\/go\/android\/"/g) ?? []).length, 2);
  assert.doesNotMatch(download, /href="[^"?]+\?(?:source|yqrid|utm_)=/);
  assert.doesNotMatch(
    download,
    /href="https:\/\/testflight\.apple\.com|href="https:\/\/hubthe\.team/,
  );
});

test("redirect pages send one platform goal and always continue to download", () => {
  for (const pageUrl of [iosPageUrl, androidPageUrl]) {
    assert.ok(existsSync(pageUrl), `${pageUrl.pathname} should exist`);
  }
  assert.ok(existsSync(redirectScriptUrl), "go/redirect.js should exist");

  const iosPage = readFileSync(iosPageUrl, "utf8");
  const androidPage = readFileSync(androidPageUrl, "utf8");
  const redirectScript = readFileSync(redirectScriptUrl, "utf8");
  const redirectStyles = readFileSync(redirectStylesUrl, "utf8");

  assert.match(iosPage, /data-goal="download_ios"/);
  assert.match(
    iosPage,
    /data-destination="https:\/\/testflight\.apple\.com\/join\/KCJxFcV1"/,
  );
  assert.match(androidPage, /data-goal="download_android"/);
  assert.match(androidPage, /data-destination="\/download\/predix-health-app\.apk"/);
  assert.match(iosPage, /<h1>Открываем TestFlight…<\/h1>/);
  assert.match(androidPage, /<h1>Начинаем загрузку…<\/h1>/);
  assert.doesNotMatch(iosPage, /Переходим к загрузке|Сейчас откроется TestFlight/);
  assert.doesNotMatch(androidPage, /Переходим к загрузке|Сейчас начнётся загрузка приложения/);

  for (const page of [iosPage, androidPage]) {
    assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(page, /<script defer src="\.\.\/redirect\.js"><\/script>/);
    assert.match(page, /<noscript>[\s\S]*?http-equiv="refresh"/);
    assert.match(page, /<a data-fallback-link[^>]*>\s*Продолжить вручную\s*<\/a>/);
  }

  assert.match(redirectScript, /112104449/);
  assert.match(redirectScript, /ym\(112104449, "reachGoal", goal, \{\}, redirect\)/);
  assert.match(redirectScript, /window\.setTimeout\(redirect, 1200\)/);
  assert.match(redirectScript, /window\.location\.replace\(destination\)/);
  assert.match(redirectScript, /https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=112104449/);
  assert.match(
    redirectStyles,
    /h1\s*\{[^}]*font-size: clamp\(1\.35rem, 3\.2vw, 1\.85rem\);/,
  );
  assert.match(redirectStyles, /a\s*\{[^}]*margin-top: 28px;/);
});

test("ordinary build copies redirect pages and QR generator uses temporary domain", () => {
  assert.match(
    buildScript,
    /await cp\(new URL\("\.\.\/go\/", import\.meta\.url\), new URL\("go\/", outputDirectory\), \{[\s\S]*?recursive: true,[\s\S]*?\}\);/,
  );
  assert.ok(existsSync(qrGeneratorUrl), "QR generator should exist");

  const generator = readFileSync(qrGeneratorUrl, "utf8");
  assert.match(generator, /https:\/\/predix-health\.ru\/go\/ios\//);
  assert.match(generator, /https:\/\/predix-health\.ru\/go\/android\//);
  assert.doesNotMatch(generator, /source=|yqrid=|utm_/);
});
