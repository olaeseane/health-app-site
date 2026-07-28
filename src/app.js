import { createAtlasState, routeIds, selectRoute } from "./atlas.js";

const capabilityExplorer = document.querySelector("[data-capability-explorer]");
const routeOptions = [
  ...(capabilityExplorer?.querySelectorAll("[data-route]") ?? []),
];
const routePanels = [
  ...(capabilityExplorer?.querySelectorAll("[data-route-panel]") ?? []),
];

const routeControls = routeIds.map((routeId) => {
  const option = routeOptions.find(({ dataset }) => dataset.route === routeId);

  return {
    option,
    selectedLabel: option?.querySelector("[data-selected-label]"),
  };
});

const hasCompleteExplorer =
  capabilityExplorer &&
  routeOptions.length === routeIds.length &&
  routePanels.length === routeIds.length &&
  routeControls.every(({ option, selectedLabel }) => option && selectedLabel) &&
  routeIds.every((routeId) =>
    routePanels.some(({ dataset }) => dataset.routePanel === routeId),
  );

if (hasCompleteExplorer) {
  let atlasState = createAtlasState();

  function renderAtlas(state) {
    routeControls.forEach(({ option, selectedLabel }) => {
      const selected = option.dataset.route === state.activeRouteId;
      option.classList.toggle("is-active", selected);
      option.setAttribute("aria-pressed", String(selected));
      selectedLabel.textContent = selected ? "Выбрано" : "";
    });

    routePanels.forEach((panel) => {
      panel.hidden = panel.dataset.routePanel !== state.activeRouteId;
    });
  }

  routeControls.forEach(({ option }) => {
    option.addEventListener("click", () => {
      const nextState = selectRoute(atlasState, option.dataset.route);

      if (nextState === atlasState) {
        return;
      }

      atlasState = nextState;
      renderAtlas(atlasState);
    });
  });

  capabilityExplorer.dataset.enhanced = "true";
  renderAtlas(atlasState);
}

document.querySelectorAll("[data-focus-target]").forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.getElementById(link.dataset.focusTarget);

    window.setTimeout(() => target?.focus({ preventScroll: true }), 450);
  });
});
