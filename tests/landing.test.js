import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const screenshots = [
  "home-overview.jpg",
  "health-passport.jpg",
  "documents.jpg",
  "wellbeing-and-questionnaires.jpg",
  "wellbeing-today.jpg",
  "health-metrics.jpg",
  "devices-and-hrv.jpg",
  "health-status.jpg",
  "biological-age.jpg",
];

test("landing screenshot paths are available to the public site", () => {
  for (const screenshot of screenshots) {
    assert.equal(
      existsSync(new URL(`../public/screenshots/${screenshot}`, import.meta.url)),
      true,
      `public/screenshots/${screenshot} must exist`,
    );
  }
});
