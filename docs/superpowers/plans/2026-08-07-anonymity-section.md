# Anonymity Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved open «Анонимность» manifesto immediately after integrations.

**Architecture:** Keep the page static and dependency-free. Add one semantic section to `index.html`, scope all new layout and icon rules under `privacy-manifesto` selectors in `src/styles.css`, and synchronize durable content and contract tests.

**Tech Stack:** Semantic HTML, CSS Grid, inline SVG, Node.js built-in test runner.

## Global Constraints

- Preserve all current uncommitted integrations work.
- Do not add a header link or CTA.
- Do not introduce cards, numbered principles, or horizontal dividers.
- The user explicitly requested inline execution without TDD; update implementation and contracts together, then run the full suite.
- Use the concise wording from the approved manifesto prototype.

---

### Task 1: Add the semantic manifesto section

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `section-kicker`, typography, and page section patterns.
- Produces: `section#privacy.privacy-manifesto` with four `.privacy-principle` articles.

- [x] Insert `#privacy` between `#integrations` and `#faq`.
- [x] Add the approved heading, lead, four principles, and decorative inline SVG icons.

### Task 2: Implement responsive editorial styling

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `--white`, `--tiffany-fog`, `--tiffany-deep`, `--graphite`, `--graphite-soft`, `--page-pad`, and `--max-width`.
- Produces: two-column intro and `2 × 2` principle grid, stacking to one column at `600px`.

- [x] Add open, unframed manifesto layout and 44px circular icon markers.
- [x] Add `820px` intro stacking and `600px` single-column principle rules.

### Task 3: Synchronize product truth and contracts

**Files:**
- Modify: `docs/landing-content.md`
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Modify: `tests/landing.test.js`

**Interfaces:**
- Consumes: the approved copy and established static landing contract helpers.
- Produces: durable section order, content, visual-system guidance, and observable tests.

- [x] Add the new fifth screen to landing content and renumber following screens.
- [x] Record the section and open manifesto pattern in product/design sources.
- [x] Assert section order, four principles, icon count, no numbering, and mobile stacking.

### Task 4: Verify the complete landing

**Files:**
- Verify: all modified files and generated `dist/` output.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Inspect desktop and mobile layouts in the local browser.
