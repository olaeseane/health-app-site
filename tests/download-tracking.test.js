import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
const root = new URL("../", import.meta.url);
const routes = [
  ...["external", "internal", "download"].flatMap((source) =>
    ["ios", "android"].map((platform) => [`go/${source}/${platform}/`, `${source}_${platform}`, platform])),
  ...["ios", "android"].map((platform) => [`go/${platform}/`, `external_${platform}`, platform]),
  ...["ios", "android"].map((platform) => [`v2/go/${platform}/`, `v2_download_${platform}`, platform]),
];
test("all QR routes present complete platform instructions and native action links", () => {
  for (const [route, goal, platform] of routes) {
    const pageUrl = new URL(`${route}index.html`, root);
    const page = readFileSync(pageUrl, "utf8");
    assert.ok(page.includes(`data-goal="${goal}"`));
    assert.ok(page.includes(`data-platform="${platform}"`));
    assert.equal((page.match(/<li>/g) ?? []).length, 4);
    assert.doesNotMatch(page, /http-equiv|location\.replace|setTimeout|<noscript>/);
    assert.match(page, /noindex, nofollow/);
    for (const [, href] of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (!href.startsWith("http")) {
        // V2 shares public assets in source and gets its own copy at build time.
        const resolved = new URL(href, pageUrl);
        const source = resolved.href.includes("/v2/public/")
          ? new URL(resolved.href.replace("/v2/public/", "/public/")) : resolved;
        assert.ok(existsSync(source), `${route}: ${href}`);
      }
    }
    if (platform === "ios") {
      assert.match(page, /https:\/\/apps.apple.com\/app\/id899247664/);
      assert.match(page, /https:\/\/testflight.apple.com\/join\/KCJxFcV1/);
      assert.doesNotMatch(page, /data-action="download_apk"/);
    } else {
      assert.match(page, /href="https:\/\/predix-health.ru\/download\/predix-health-app.apk"/);
      assert.doesNotMatch(page, /data-action="open_invitation"/);
    }
  }
});
test("analytics records entry and explicit actions without triggering navigation", () => {
  const source = readFileSync(new URL("public/install-guide/guide.js", root), "utf8");
  for (const goal of [...routes.map(([, goal]) => goal), "unknown"]) {
    const calls = [];
    let click;
    const sandbox = {
      document: {
        documentElement: { dataset: { goal, platform: "android" } },
        scripts: [], createElement: () => ({}),
        getElementsByTagName: () => [{ parentNode: { insertBefore() {} } }],
        querySelectorAll: () => [{ dataset: { action: "download_apk" }, addEventListener(type, handler) { click = handler; } }],
      },
      ym: (...args) => calls.push(args),
    };
    sandbox.window = sandbox;
    vm.runInNewContext(source, sandbox);
    assert.equal(calls.filter((args) => args[1] === "reachGoal").length, goal === "unknown" ? 0 : 1);
    click();
    const actions = calls.filter((args) => args[2] === "install_guide_action");
    assert.equal(actions.length, goal === "unknown" ? 0 : 1);
    if (actions.length) assert.equal(actions[0][3].source_goal, goal);
  }
});
