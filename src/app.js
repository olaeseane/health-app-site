const HEADER_SCROLL_THRESHOLD = 24;
const HEADER_SCROLL_RESET_THRESHOLD = 4;

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
    if (window.scrollY > HEADER_SCROLL_THRESHOLD) {
      header.classList.add("site-header--scrolled");
    }

    if (window.scrollY <= HEADER_SCROLL_RESET_THRESHOLD) {
      header.classList.remove("site-header--scrolled");
    }
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
