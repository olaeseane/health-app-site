# Repository Guidelines

## Project Structure & Module Organization

This repository contains the implemented zero-dependency Russian landing
navigator for the «Здоровье» application.

- `index.html` defines the page structure and accessible content.
- `src/styles.css` contains the visual system and responsive layouts;
  `src/app.js` owns task-screen interactions; `src/atlas.js` owns canonical
  route state.
- `v2/` contains the isolated install-focused landing (`v2/index.html`,
  `v2/styles.css`, `v2/app.js`, and `v2/go/` redirect pages) with content
  governed by [`docs/v2-install-landing-spec.md`](docs/v2-install-landing-spec.md).
- `public/` contains shared v1 assets: the logo, local Manrope fonts,
  illustrations, and real application screenshots. V2-only QR, character, and
  icon assets live under `v2/public/v2/` so v1 builds remain byte-isolated.
- `tests/` contains Node-based state and observable landing-contract tests.
- `PRODUCT.md` and `DESIGN.md` are the durable product and design-system
  sources. `docs/landing-content.md`, `docs/faq.md`, and
  `docs/screenshots.md` provide approved copy and evidence mapping.
- `.impeccable/surfaces/landing.md` records the chosen landing direction and
  interaction constraints.
- [`docs/site-versions.md`](docs/site-versions.md) is the source of truth for
  v1/v2 source boundaries, build outputs, routes, analytics, and portal
  isolation. Read it before implementing or changing either site version.

## Build, Test, and Development Commands

The landing is a zero-dependency static site built with Node.js scripts.

```sh
npm run dev
npm run build
npm test
```

- `npm run dev` serves the repository at `http://127.0.0.1:4173`.
- `npm run build` recreates the deployable `dist/` directory.
- `npm run build:v2` recreates the deployable `dist-v2/` install landing
  served beneath `/install/`.
- `npm run build:v2:portal-inline` recreates the self-contained
  `dist-v2/portal-inline-ascii.html` portal artifact.
- `npm test` runs atlas-state and landing-contract tests for both site
  versions with Node's built-in test runner.

Before submit changes, run:

```sh
git status --short
git diff --check
```

## Coding Style & Naming Conventions

Use UTF-8, LF endings, and two-space indentation for Markdown, JSON, CSS, and
JavaScript. Prefer lowercase kebab-case filenames (`landing-content.md`) and
descriptive selectors and identifiers (`task-proof`, `selectTask`). Keep
Russian user-facing copy consistent with the approved content files; use
English for code identifiers and contributor documentation.

## Testing Guidelines

The project uses Node's built-in test runner and has no coverage threshold.
Name tests after observable behavior. For every UI change, check desktop and
mobile widths, keyboard navigation, visible focus, reduced motion, 200% zoom,
and horizontal overflow. Run `npm test`, `npm run build`, and
`git diff --check` before handoff.

## Git Workflow

one issue-scoped feature branch + PR per implementation issue. see [`docs/agents/git-workflow.md`](docs/agents/git-workflow.md).

when opening PR for implementation issue, include `Closes #<issue-number>` in body so GitHub closes issue on merge.

keep PR titles/bodies consistent w/ recent repo PRs: use established `[codex] ...` title style and `Summary`, `Validation`, optional `Notes` sections unless user says otherwise.

## Product Safety & Content

Do not invent metrics, testimonials, features, FAQ URLs, or medical outcomes.
The landing page must not imply diagnosis, treatment, or replacement of
professional care. FAQ and documentation controls stay disabled until real
destinations are supplied.
