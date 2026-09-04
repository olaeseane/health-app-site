# Site Versioning

## Status

This document records the approved architecture for maintaining two landing
site variants in one repository. Version 1 exists today. Version 2, the
install-focused landing, is implemented under `v2/` and builds independently
into `dist-v2/`.

## Goals

- Preserve the current ordinary and portal builds as version 1.
- Add a conversion-oriented version 2 that encourages QR scanning and app
  installation.
- Keep both variants in the same repository without using a long-lived branch.
- Share stable assets while preventing version 2 changes from altering version
  1 output.

## Version 1: current landing

Version 1 remains the existing product landing.

| Target | Source | Build output | Public route |
| --- | --- | --- | --- |
| Ordinary web | `index.html`, `src/` | `dist/` | `/` |
| Portal | v1 portal transform | `dist/portal-inline-ascii.html` | Portal-managed |

Existing v1 routes such as `/video/`, `/go/ios/`, and `/go/android/` remain
part of the ordinary site.

The existing commands remain stable:

```sh
npm run build
npm run build:portal-inline
```

No version 2 implementation may silently change the observable output of these
commands.

## Version 2: install-focused landing

Version 2 is a separate install-focused experience.

| Target | Source | Build output | Public route |
| --- | --- | --- | --- |
| Ordinary web | `v2/index.html`, `v2/styles.css`, `v2/app.js` | `dist-v2/` | `/install/` |
| Portal | `scripts/build-v2-portal-inline.mjs` | `dist-v2/portal-inline-ascii.html` | Portal-managed |

Commands:

```sh
npm run build:v2
npm run build:v2:portal-inline
```

Page content and presentation for v2 are governed by
[`v2-install-landing-spec.md`](v2-install-landing-spec.md); this document
governs architecture.

## Source and dependency boundaries

Version 2 owns its HTML, CSS, JavaScript, tests, and portal transformation.
Do not implement version 2 as:

- a long-lived Git branch;
- a full copy of the repository;
- conditional mutations inside the v1 build that make v1 output depend on v2.

Both variants may read shared stable assets from `public/`, including:

- local Manrope fonts;
- brand marks;
- approved product screenshots;
- integration logos;
- download QR assets when their destinations are intentionally shared.

Treat shared assets as a compatibility boundary. Replacing a shared asset can
change both variants and therefore requires tests for both. Variant-specific
assets should live under a clearly named v2 subtree rather than being placed in
a shared path.

## Version 1 stability rule

Version 1 is the baseline. During version 2 work:

1. Run the existing v1 test suite before making v2 changes.
2. Keep `npm run build` and `npm run build:portal-inline` behavior unchanged.
3. Add separate v2 tests and build contracts.
4. Verify v1 and v2 builds independently before merge.
5. Do not move or rename v1 source files merely to make the v2 structure look
   symmetrical.

A v2 pull request is incomplete if it changes v1 output without explicit
approval.

## Routing and deployment

The approved ordinary v2 route is:

```text
/install/
```

The v2 build should be deployable beneath the same Nginx-served domain as v1.
The deployment must result in an `install/index.html` path beneath the active
web root, while `/` continues to serve v1.

Use relative internal asset URLs that work beneath `/install/`. Test both the
trailing-slash route `/install/` and Nginx behavior for `/install` before
production rollout.

## Search indexing

Version 2 must include:

```html
<meta name="robots" content="noindex, nofollow" />
```

Do not add v2 to a sitemap or link it from v1 unless separately approved.
Direct campaign and QR access is expected.

## Analytics

The ordinary v2 site uses the existing Yandex Metrika counter:

```text
112104449
```

Version 2 must use v2-specific goal IDs or labels so its conversions are not
mixed with v1 conversions. The implemented IDs are:

```text
v2_download_ios
v2_download_android
```

The person managing Yandex Metrika must create the two JavaScript goals in the
Metrika interface before production attribution is expected.

The portal v2 artifact must not embed Yandex Metrika. If portal QR scans need
conversion attribution, route them through approved ordinary-domain redirect
pages rather than adding analytics code to the portal artifact.

## Portal v2 requirements

Portal v2 is a separate build target, not a modification of the v1 portal
artifact. Its implementation must preserve the established portal constraints
unless explicitly changed:

- a single ASCII-safe HTML artifact;
- inline CSS, JavaScript, fonts, and images;
- no SVG content;
- no Yandex Metrika;
- host-shell compatibility overrides;
- an explicit output-size regression test.

Do not overwrite `dist/portal-inline-ascii.html` when building portal v2.

## Testing requirements

Dedicated v2 contracts live in:

```text
tests/v2-landing.test.js
tests/v2-download-tracking.test.js
tests/v2-portal-build.test.js
tests/v2-portal-paths.test.js
```

They verify:

- v1 ordinary build remains unchanged;
- v1 portal build remains unchanged;
- v2 ordinary build outputs `dist-v2/`;
- v2 contains `noindex, nofollow`;
- v2 analytics use only approved v2 identifiers;
- portal v2 contains no analytics code;
- shared asset references resolve beneath `/install/`;
- portal asset resolution cannot escape `dist-v2/`;
- keyboard focus and reduced-motion behavior follow the interaction contract.

Browser QA separately verifies `/install/` routing, desktop and 390 px mobile
layouts, keyboard carousel use, page overflow, CTA focus placement, failed
resources, and usability at 200% zoom.

## Git workflow

Implement v2 incrementally through issue-scoped feature branches and pull
requests. The architecture lives on `main`; v2 must not live in a permanent
`v2` branch.

Each v2 PR should state explicitly:

- which target it changes: ordinary v2, portal v2, or both;
- whether any shared asset changes affect v1;
- the v1 and v2 validation commands run;
- the generated artifact paths and verified sizes.
