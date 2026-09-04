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

function clampCarouselIndex(index, count) {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

function findNearestCarouselIndex(scrollLeft, offsets) {
  if (offsets.length === 0) return 0;

  return offsets.reduce((nearest, offset, index) =>
    Math.abs(offset - scrollLeft) < Math.abs(offsets[nearest] - scrollLeft)
      ? index
      : nearest, 0);
}

function installCarouselControls(doc, win) {
  const carousel = doc.querySelector("[data-carousel]");
  const previous = doc.querySelector("[data-carousel-prev]");
  const next = doc.querySelector("[data-carousel-next]");
  const current = doc.querySelector("[data-carousel-current]");
  const total = doc.querySelector("[data-carousel-total]");
  const cards = carousel ? [...carousel.querySelectorAll(".carousel__card")] : [];

  if (!carousel || !previous || !next || !current || !total || cards.length === 0) {
    return;
  }

  const prefersReducedMotion = Boolean(
    typeof win.matchMedia === "function" &&
      win.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const offsets = () => {
    const firstOffset = cards[0].offsetLeft;
    return cards.map((card) => card.offsetLeft - firstOffset);
  };
  let activeIndex = 0;

  function updateControls(index) {
    activeIndex = clampCarouselIndex(index, cards.length);
    current.textContent = String(activeIndex + 1).padStart(2, "0");
    total.textContent = String(cards.length).padStart(2, "0");
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;

  }

  function goTo(index) {
    const targetIndex = clampCarouselIndex(index, cards.length);
    carousel.scrollTo({
      left: offsets()[targetIndex],
      behavior: resolveScrollBehavior(prefersReducedMotion),
    });
    updateControls(targetIndex);
  }

  previous.addEventListener("click", () => goTo(activeIndex - 1));
  next.addEventListener("click", () => goTo(activeIndex + 1));

  carousel.addEventListener("scroll", () => {
    updateControls(findNearestCarouselIndex(carousel.scrollLeft, offsets()));
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  win.addEventListener("resize", () => {
    updateControls(findNearestCarouselIndex(carousel.scrollLeft, offsets()));
  });

  updateControls(0);
}

function initLandingInteractions() {
  installFocusTargetLinks(document, window);
  installCarouselControls(document, window);
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLandingInteractions);
  } else {
    initLandingInteractions();
  }
}
