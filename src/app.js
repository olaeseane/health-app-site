function installFocusTargetLinks() {
  document.querySelectorAll("[data-focus-target]").forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("data-focus-target");
      if (!targetId) return;

      window.setTimeout(() => {
        document.getElementById(targetId)?.focus({ preventScroll: true });
      }, 0);
    });
  });
}

function initLandingInteractions() {
  installFocusTargetLinks();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLandingInteractions);
} else {
  initLandingInteractions();
}
