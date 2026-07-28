import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const atlas = await import("../src/atlas.js");

test("atlas state module is available to the landing page", () => {
  assert.equal(
    existsSync(new URL("../src/atlas.js", import.meta.url)),
    true,
    "src/atlas.js must exist",
  );
});

test("atlas state exposes route selection behavior", () => {
  assert.equal(typeof atlas.createAtlasState, "function");
  assert.equal(typeof atlas.selectRoute, "function");
});

test("atlas exposes the canonical route order", () => {
  assert.deepEqual(atlas.routeIds, ["manual", "sync", "archive", "care"]);
});

test("atlas starts with the manual route selected", () => {
  assert.deepEqual(atlas.createAtlasState(), { activeRouteId: "manual" });
});

for (const routeId of ["sync", "archive", "care"]) {
  test(`selecting ${routeId} returns that route as active`, () => {
    assert.deepEqual(atlas.selectRoute(atlas.createAtlasState(), routeId), {
      activeRouteId: routeId,
    });
  });
}

test("an unknown route leaves the current atlas state unchanged", () => {
  const state = atlas.selectRoute(atlas.createAtlasState(), "sync");

  assert.equal(atlas.selectRoute(state, "missing"), state);
});

test("selecting the active route leaves the current atlas state unchanged", () => {
  const state = atlas.selectRoute(atlas.createAtlasState(), "archive");

  assert.equal(atlas.selectRoute(state, "archive"), state);
});
