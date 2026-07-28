# Repository Guidelines

## Project Structure & Module Organization

repo got product+design specs for russian "Здоровье" landing page now; no app code yet.

- `PRODUCT.md` = users, product purpose, claims, brand constraints.
- `docs/landing-brief.md` = implementation brief; `docs/logo.jpeg` = approved logo.
- `.impeccable/surfaces/landing.md` = chosen landing-page direction, interaction states, release blockers.
- `.agents/skills/` = local agent workflows. `.superpowers/` and `.impeccable/questions/` = working artifacts, not product source.

when build starts: keep page code one documented src dir (eg `src/`), public assets in `public/`, tests beside modules or in `tests/`. update this guide once stack picked.

## Build, Test, and Development Commands

no package manager, build script, test runner set up yet. don't assume `npm test` etc exist. before submit changes, run:

```sh
git status --short
git diff --check
```

once tooling added, expose common workflows via package scripts like `npm run dev`, `npm run build`, `npm test`, doc their exact behavior here.

## Coding Style & Naming Conventions

use UTF-8, LF endings, two-space indent for Markdown/JSON/CSS/JS/TS unless formatter says otherwise. prefer lowercase kebab-case filenames (`landing-brief.md`) and descriptive component names (`TaskNavigator.tsx`). keep russian user-facing copy consistent w/ `PRODUCT.md`; english for code identifiers and contributor docs.

## Testing Guidelines

no test framework or coverage threshold yet. every UI change: check mobile+desktop widths, keyboard nav, visible focus, reduced-motion behavior, no horizontal overflow. add automated tests w/ first implementation, name after observable behavior, eg `task-navigator.test.tsx`.

## Git Workflow

one issue-scoped feature branch + PR per implementation issue. see [`docs/agents/git-workflow.md`](docs/agents/git-workflow.md).

when opening PR for implementation issue, include `Closes #<issue-number>` in body so GitHub closes issue on merge.

keep PR titles/bodies consistent w/ recent repo PRs: use established `[codex] ...` title style and `Summary`, `Validation`, optional `Notes` sections unless user says otherwise.

## Product Safety & Content

don't invent metrics, testimonials, features, FAQ URLs, or medical outcomes. landing page must not imply diagnosis, treatment, or replacement of professional care. missing FAQ/doc URLs and final screenshots stay release blockers.