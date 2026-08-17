const HEADER_SCROLL_THRESHOLD = 24;

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

function installHeaderScrollState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const syncHeaderSurface = () => {
    header.classList.toggle("site-header--scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
  };

  syncHeaderSurface();
  window.addEventListener("scroll", syncHeaderSurface, { passive: true });
}

function initLandingInteractions() {
  installFocusTargetLinks();
  installHeaderScrollState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLandingInteractions);
} else {
  initLandingInteractions();
}
