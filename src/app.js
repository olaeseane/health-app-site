import { createAtlasState, selectRoute } from "./atlas.js";

const atlas = document.querySelector("[data-atlas]");
const routeOptions = [...document.querySelectorAll("[data-route]")];
const activeScreen = document.querySelector("[data-active-screen]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let atlasState = createAtlasState();

function updateText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}

function renderAtlas(state) {
  const { activeRoute, contextRoutes } = state;

  updateText("[data-active-annotation]", activeRoute.annotation);
  updateText("[data-active-label]", activeRoute.label);
  updateText("[data-active-status]", activeRoute.status);
  updateText("[data-active-title]", activeRoute.title);
  updateText("[data-detail-annotation]", activeRoute.annotation);
  updateText("[data-detail-title]", activeRoute.title);
  updateText("[data-detail-description]", activeRoute.description);

  contextRoutes.forEach((route, index) => {
    updateText(`[data-context-annotation="${index}"]`, route.annotation);
    updateText(`[data-context-screen="${index}"]`, route.annotation);
  });

  routeOptions.forEach((option) => {
    const selected = option.dataset.route === activeRoute.id;
    option.classList.toggle("is-active", selected);
    option.setAttribute("aria-pressed", String(selected));
    option.querySelector("strong").textContent = selected ? activeRoute.status : "";
  });
}

function chooseRoute(routeId) {
  const nextState = selectRoute(atlasState, routeId);

  if (nextState === atlasState) {
    return;
  }

  atlasState = nextState;

  if (reduceMotion.matches) {
    renderAtlas(atlasState);
    return;
  }

  atlas?.classList.add("is-changing");
  window.setTimeout(() => {
    renderAtlas(atlasState);
    atlas?.classList.remove("is-changing");
  }, 180);
}

routeOptions.forEach((option) => {
  option.addEventListener("click", () => chooseRoute(option.dataset.route));
});

document.querySelectorAll("[data-focus-target]").forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.getElementById(link.dataset.focusTarget);

    window.setTimeout(() => target?.focus({ preventScroll: true }), 450);
  });
});

renderAtlas(atlasState);
