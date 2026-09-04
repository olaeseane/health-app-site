function resolveScrollBehavior(prefersReducedMotion) {
  return prefersReducedMotion ? "auto" : "smooth";
}

function installFocusTargetLinks(doc, win) {
  doc.querySelectorAll("[data-focus-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("data-focus-target");
      const target = targetId ? doc.getElementById(targetId) : null;

      if (!target) return;

      event.preventDefault();

      const prefersReducedMotion = Boolean(
        typeof win.matchMedia === "function" &&
          win.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );

      target.scrollIntoView({
        behavior: resolveScrollBehavior(prefersReducedMotion),
        block: "center",
      });

      if (win.history && typeof win.history.replaceState === "function") {
        win.history.replaceState(null, "", `#${targetId}`);
      }

      target.focus({ preventScroll: true });
    });
  });
}

function initLandingInteractions() {
  installFocusTargetLinks(document, window);
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLandingInteractions);
  } else {
    initLandingInteractions();
  }
}
