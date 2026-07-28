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

test("atlas starts with the indicators route selected", () => {
  const state = atlas.createAtlasState();

  assert.deepEqual(
    {
      id: state.activeRoute?.id,
      label: state.activeRoute?.label,
      status: state.activeRoute?.status,
    },
    {
      id: "indicators",
      label: "Вести показатели",
      status: "Выбрано",
    },
  );
});

test("selecting a route moves it to the active atlas layer", () => {
  const state = atlas.createAtlasState();
  const nextState = atlas.selectRoute(state, "integrations");

  assert.equal(nextState.activeRoute?.id, "integrations");
  assert.equal(nextState.activeRoute?.annotation, "Интеграции");
  assert.deepEqual(
    nextState.contextRoutes?.map(({ id }) => id),
    ["indicators", "dynamics"],
  );
});

test("an unknown route leaves the current atlas state unchanged", () => {
  const state = atlas.selectRoute(atlas.createAtlasState(), "dynamics");

  assert.equal(atlas.selectRoute(state, "missing"), state);
});
