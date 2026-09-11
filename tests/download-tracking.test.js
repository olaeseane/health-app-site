import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const landing = readFileSync(new URL("index.html", root), "utf8");
const buildScript = readFileSync(new URL("scripts/build.mjs", root), "utf8");
const redirectScriptUrl = new URL("go/redirect.js", root);
const iosPageUrl = new URL("go/ios/index.html", root);
const androidPageUrl = new URL("go/android/index.html", root);
const redirectStylesUrl = new URL("go/styles.css", root);
const qrGeneratorUrl = new URL("scripts/generate-download-qrs.py", root);
const testFlightDestination = "https://testflight.apple.com/join/KCJxFcV1";
const androidDestination = "https://predix-health.ru/download/predix-health-app.apk";
const attributedRoutes = [
  ["external", "ios", "external_ios", testFlightDestination],
  ["external", "android", "external_android", androidDestination],
  ["internal", "ios", "internal_ios", testFlightDestination],
  ["internal", "android", "internal_android", androidDestination],
  ["download", "ios", "download_ios", testFlightDestination],
  ["download", "android", "download_android", androidDestination],
];

function executeRedirectScript(goal) {
  const source = readFileSync(redirectScriptUrl, "utf8");
  const fallbackLink = {};
  const eventListeners = new Map();
  const timers = [];
  const replacements = [];
  const sandbox = {
    document: {
      documentElement: {
        dataset: { goal, destination: testFlightDestination },
      },
      querySelector: () => fallbackLink,
      scripts: [],
      createElement: () => ({}),
      getElementsByTagName: () => [
        { parentNode: { insertBefore() {} } },
      ],
      referrer: "",
    },
    location: {
      href: "https://predix-health.ru/go/test/ios/",
      replace: (destination) => replacements.push(destination),
    },
    addEventListener: (type, callback, options) => {
      const listeners = eventListeners.get(type) ?? [];
      listeners.push({ callback, options });
      eventListeners.set(type, listeners);
    },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(
    `${source}\n;globalThis.__allowedGoals = [...allowedGoals];`,
    sandbox,
    { filename: "go/redirect.js" },
  );

  function dispatchEvent(type) {
    const listeners = eventListeners.get(type) ?? [];
    eventListeners.set(
      type,
      listeners.filter(({ options }) => !options?.once),
    );
    listeners.forEach(({ callback }) => callback());
  }

  return {
    allowedGoals: Array.from(sandbox.__allowedGoals),
    get calls() {
      return (sandbox.ym.a ?? []).map((args) => Array.from(args));
    },
    eventListeners,
    dispatchEvent,
    fallbackLink,
    replacements,
    timers,
  };
}

test("redirect waits for window load before sending a goal or starting fallback", () => {
  const execution = executeRedirectScript("internal_ios");
  const goalCalls = execution.calls.filter((call) => call[1] === "reachGoal");
  const loadListeners = execution.eventListeners.get("load") ?? [];

  assert.equal(goalCalls.length, 0);
  assert.equal(execution.timers.length, 0);
  assert.equal(execution.replacements.length, 0);
  assert.equal(loadListeners.length, 1);
  assert.equal(loadListeners[0].options?.once, true);

  execution.dispatchEvent("load");

  const callsAfterLoad = execution.calls.filter((call) => call[1] === "reachGoal");
  assert.equal(callsAfterLoad.length, 1);
  assert.equal(callsAfterLoad[0][2], "internal_ios");
  assert.deepEqual(execution.timers.map(({ delay }) => delay), [1200]);
  execution.dispatchEvent("load");
  assert.equal(execution.calls.filter((call) => call[1] === "reachGoal").length, 1);
  assert.deepEqual(execution.timers.map(({ delay }) => delay), [1200]);

  execution.timers[0].callback();
  assert.deepEqual(execution.replacements, [testFlightDestination]);
  execution.timers[0].callback();
  assert.deepEqual(execution.replacements, [testFlightDestination]);
  });

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

test("six attributed download routes map to exact goals and destinations", () => {
  const expectedGoals = attributedRoutes.map(([, , goal]) => goal);
  const actualGoals = new Set();

  for (const [variant, platform, goal, destination] of attributedRoutes) {
    const pageUrl = new URL(`go/${variant}/${platform}/index.html`, root);
    assert.ok(existsSync(pageUrl), `${pageUrl.pathname} should exist`);

    const page = readFileSync(pageUrl, "utf8");
    const goalAttributes = [
      ...page.matchAll(
        /\bdata-goal\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
      ),
    ].map((match) => match[1] ?? match[2] ?? match[3]);
    assert.deepEqual(goalAttributes, [goal]);
    actualGoals.add(goalAttributes[0]);
    assert.deepEqual(
      expectedGoals.filter((candidate) => page.includes(candidate)),
      [goal],
    );
    assert.ok(page.includes(`data-destination="${destination}"`));
    assert.ok(page.includes(`content="0;url=${destination}"`));
    assert.ok(page.includes(`data-fallback-link href="${destination}"`));
    assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(page, /<link rel="stylesheet" href="\.\.\/\.\.\/styles\.css" \/>/);
    assert.match(page, /<script defer src="\.\.\/\.\.\/redirect\.js"><\/script>/);
    assert.doesNotMatch(page, /source=|yqrid=|utm_/);
  }

  assert.deepEqual([...actualGoals].sort(), [
    "download_android",
    "download_ios",
    "external_android",
    "external_ios",
    "internal_android",
    "internal_ios",
  ]);
});

test("legacy root routes are external and always continue to download", () => {
  for (const pageUrl of [iosPageUrl, androidPageUrl]) {
    assert.ok(existsSync(pageUrl), `${pageUrl.pathname} should exist`);
  }
  assert.ok(existsSync(redirectScriptUrl), "go/redirect.js should exist");

  const iosPage = readFileSync(iosPageUrl, "utf8");
  const androidPage = readFileSync(androidPageUrl, "utf8");
  const redirectScript = readFileSync(redirectScriptUrl, "utf8");
  const redirectStyles = readFileSync(redirectStylesUrl, "utf8");

  assert.match(iosPage, /data-goal="external_ios"/);
  assert.match(
    iosPage,
    /data-destination="https:\/\/testflight\.apple\.com\/join\/KCJxFcV1"/,
  );
  assert.match(androidPage, /data-goal="external_android"/);
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

test("redirect goal allowlist accepts only the six attributed goals", () => {
  const expectedGoals = attributedRoutes.map(([, , goal]) => goal);
  const representativeExecution = executeRedirectScript(expectedGoals[0]);

  assert.deepEqual(
    representativeExecution.allowedGoals.toSorted(),
    expectedGoals.toSorted(),
  );

  for (const goal of expectedGoals) {
    let execution = executeRedirectScript(goal);
    execution.dispatchEvent("load");
    const goalCalls = execution.calls.filter((call) => call[1] === "reachGoal");

    assert.equal(goalCalls.length, 1);
    assert.equal(goalCalls[0][0], 112104449);
    assert.equal(goalCalls[0][2], goal);
    assert.equal(typeof goalCalls[0][4], "function");
    assert.equal(execution.fallbackLink.href, testFlightDestination);
    assert.deepEqual(execution.timers.map(({ delay }) => delay), [1200]);
    goalCalls[0][4]();
    execution.timers[0].callback();
    assert.deepEqual(execution.replacements, [testFlightDestination]);

    execution = executeRedirectScript(goal);
    execution.dispatchEvent("load");
    execution.timers[0].callback();
    assert.deepEqual(execution.replacements, [testFlightDestination]);
    const goalCallsAfter = execution.calls.filter((call) => call[1] === "reachGoal");
    goalCallsAfter[0][4]();
    assert.deepEqual(execution.replacements, [testFlightDestination]);
  }

  const rejected = executeRedirectScript("unapproved_goal");
  rejected.dispatchEvent("load");
  assert.equal(rejected.calls.filter((call) => call[1] === "reachGoal").length, 0);
  assert.equal(rejected.fallbackLink.href, testFlightDestination);
  assert.deepEqual(rejected.timers.map(({ delay }) => delay), [1200]);
  rejected.timers[0].callback();
  assert.deepEqual(rejected.replacements, [testFlightDestination]);
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
