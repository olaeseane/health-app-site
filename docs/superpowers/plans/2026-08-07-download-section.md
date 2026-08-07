# Download Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved «Скачать приложение» section immediately after «Анонимность».

**Architecture:** Keep the landing static and dependency-free. Add one semantic, non-interactive section to `index.html`; draw intentionally non-scannable QR placeholders and the coral route as inline SVG; scope responsive presentation under `download-section` selectors in `src/styles.css`.

**Tech Stack:** Semantic HTML, CSS Grid, inline SVG, Node.js built-in test runner.

## Global Constraints

- Use the approved open white composition without an enclosing panel or horizontal dividers.
- Show two unavailable destinations labelled `iOS` and `Android`; do not invent links or imply the builds are available.
- Keep both QR graphics intentionally non-scannable and label their unavailable state in visible text.
- The user explicitly requested inline execution without TDD; update implementation and contracts together, then run the full suite.

---

### Task 1: Add the semantic download section

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `section-kicker` and section typography patterns.
- Produces: `section#download.download-section` between `#privacy` and `#faq`, with two unavailable QR figures.

- [x] Add the approved kicker and heading.
- [x] Add two platform figures, visible unavailable-state copy, decorative QR SVGs, and the coral route SVG.

### Task 2: Implement the responsive open composition

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: current page width, spacing, color, and typography tokens.
- Produces: asymmetric desktop layout, open QR grouping, coral route, and a compact mobile stack.

- [x] Add unframed desktop styles without section dividers or a common panel.
- [x] Stack copy and QR figures at `820px`; preserve readable labels and prevent overflow at `360px`.

### Task 3: Synchronize durable product truth and contracts

**Files:**
- Modify: `docs/landing-content.md`
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Modify: `.impeccable/surfaces/landing.md`
- Modify: `tests/landing.test.js`

**Interfaces:**
- Consumes: approved placeholder semantics and established landing contract helpers.
- Produces: documented section order and tests for copy, structure, disabled destinations, and responsive layout.

- [x] Document the new section, unavailable destinations, and visual pattern.
- [x] Assert section order, two QR figures, no download links, unavailable labels, and mobile stacking.

### Task 4: Verify the complete landing

**Files:**
- Verify: modified sources and generated `dist/` output.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Inspect desktop and mobile layouts in the local browser.
