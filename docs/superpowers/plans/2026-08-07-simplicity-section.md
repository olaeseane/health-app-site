# Simplicity Editorial Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the interactive «Основные задачи» directory with the approved static «Простота использования» editorial section containing four alternating text-and-screenshot chapters.

**Architecture:** Keep the landing zero-dependency and server-rendered in `index.html`. The new section is semantic static HTML, styled through a dedicated `simplicity` BEM namespace; JavaScript retains only cross-section focus navigation. Observable contract tests protect content, image evidence, responsive ordering, and removal of the obsolete task selector.

**Tech Stack:** HTML5, CSS custom properties and responsive grid, vanilla JavaScript, Node.js built-in test runner, existing static build scripts.

## Global Constraints

- Use the approved copy and order from `docs/superpowers/specs/2026-08-07-simplicity-section-design.md` exactly.
- Keep the existing hero, «С чего начать», «Интеграции», FAQ, documentation, and footer behavior unchanged.
- Keep one complete real UI screenshot per chapter; do not add crops, secondary screens, hover zoom, cards, panels, CTA, or interaction.
- Render screenshots directly on the white page. The only depth is the existing soft shadow plus a low-contrast organic Tiffany glow with no rectangular boundary.
- Reuse existing CSS tokens (`--white`, `--graphite`, `--graphite-soft`, `--tiffany-deep`, `--tiffany-mist`, `--line`, `--shadow-soft`, `--page-pad`, `--max-width`). Do not add one-off color tokens for this section.
- Preserve `src/atlas.js` and `tests/atlas.test.js`; they define canonical route state independently of the removed landing interaction.
- Use UTF-8, LF, and two-space indentation.
- Before each completion claim, run the exact validation commands listed in Task 4 and inspect their output.

---

## Task 1: Establish the static section contract and markup

**Files:**

- Modify: `tests/landing.test.js:13-39,90-107,208-363`
- Modify: `index.html:45-50,139-473`
- Modify: `src/app.js:1-351`
- Test: `tests/landing.test.js`

### Step 1: Replace the obsolete task fixtures with simplicity fixtures

- [ ] In `tests/landing.test.js`, remove `taskHeadings` and `taskLocations`. Add the exact contract data near the top of the file:

```js
const simplicityChapters = [
  {
    index: "01 / ПИТАНИЕ",
    title: "Дневник ведёт сам себя",
    lead: "Просто сфотографируйте еду",
    body:
      "ИИ определит блюдо, рассчитает среднее КБЖУ и автоматически добавит запись в дневник.",
    screenshot: "nutrition.jpg",
  },
  {
    index: "02 / ПРИВЫЧКИ",
    title: "Помнить всё не нужно",
    lead: "Отмечайте привычки в касание",
    body:
      "Выберите нужные один раз и отмечайте их каждый день. История сохранится автоматически и покажет прогресс за месяц.",
    screenshot: "habits.jpg",
  },
  {
    index: "03 / ДОКУМЕНТЫ",
    title: "Анализы вносятся сами",
    lead: "Загрузите их любым удобным способом",
    body: "QR-код, фотография или PDF — приложение съест всё.",
    screenshot: "document-add.jpg",
  },
  {
    index: "04 / СВЯЗЬ",
    title: "Интеграции интегрируются",
    lead: "Подключайте любимые устройства и сервисы",
    body:
      "Приложение автоматически получает показатели из популярных приложений и устройств.",
    screenshot: "devices-and-hrv.jpg",
  },
];
```

### Step 2: Write the failing header and section tests

- [ ] Replace the old header test and the three task-directory behavior tests with observable static-section tests:

```js
test("header links to simplicity after getting started", () => {
  const header = landing.match(
    /<header\b[^>]*class="site-header"[^>]*>([\s\S]*?)<\/header>/,
  )?.[1];

  assert.ok(header);
  assert.match(header, /href="#first-route"[^>]*>С чего начать/);
  assert.match(header, /href="#simplicity"[^>]*>Простота/);
  assert.ok(
    header.indexOf('href="#first-route"') <
      header.indexOf('href="#simplicity"'),
  );
  assert.doesNotMatch(header, /href="#tasks"|>Основные задачи</);
});

test("simplicity replaces the task directory with four editorial chapters", () => {
  const simplicity = section("simplicity");

  assert.ok(simplicity);
  const normalizedSimplicity = simplicity.replace(/\s+/g, " ");
  assert.match(simplicity, /Простота использования/);
  assert.match(simplicity, /Убрали всё, что мешает начать/);
  assert.equal(
    (simplicity.match(/class="simplicity__chapter"/g) ?? []).length,
    4,
  );
  assert.equal((simplicity.match(/<img\b/g) ?? []).length, 4);

  for (const chapter of simplicityChapters) {
    assert.ok(normalizedSimplicity.includes(chapter.index), chapter.index);
    assert.ok(normalizedSimplicity.includes(chapter.title), chapter.title);
    assert.ok(normalizedSimplicity.includes(chapter.lead), chapter.lead);
    assert.ok(normalizedSimplicity.includes(chapter.body), chapter.body);
    assert.match(
      simplicity,
      new RegExp(`src="\\./public/screenshots/${chapter.screenshot}"`),
    );
    assert.ok(
      existsSync(
        new URL(`../public/screenshots/${chapter.screenshot}`, import.meta.url),
      ),
      chapter.screenshot,
    );
  }

  assert.ok(
    landing.indexOf('id="first-route"') <
      landing.indexOf('id="simplicity"'),
  );
  assert.ok(
    landing.indexOf('id="simplicity"') <
      landing.indexOf('id="integrations"'),
  );
  assert.doesNotMatch(landing, /id="tasks"|class="task-directory"/);
});

test("simplicity is static while focus-target navigation remains available", () => {
  const simplicity = section("simplicity");

  assert.ok(simplicity);
  assert.doesNotMatch(
    simplicity,
    /data-task|aria-pressed|<button\b|task-proof|task-mobile-proof/,
  );
  assert.doesNotMatch(
    app,
    /taskScreens|selectTask|healthSiteSelectTask|data-task-select|data-task-item/,
  );
  assert.match(app, /function installFocusTargetLinks\(\)/);
  assert.match(app, /installFocusTargetLinks\(\);/);
});
```

- [ ] Update the existing route-ordering assertion to compare `#first-route` with `#simplicity`, and update the hero evidence test to read `section("simplicity")` and expect four screenshot images rather than `.task-proof`.
- [ ] Keep the generic fragment-resolution assertion unchanged; it will protect the new header anchor.

### Step 3: Run the focused tests and confirm RED

- [ ] Run:

```sh
node --test --test-name-pattern="header links to simplicity|simplicity replaces the task directory|simplicity is static|getting started follows|hero uses" tests/landing.test.js
```

Expected: failure because `#simplicity` and its four chapters do not exist, while `#tasks` and task-selection JavaScript still exist.

### Step 4: Replace the header link and task directory markup

- [ ] In `index.html`, change only the second nav link:

```html
<a href="#simplicity">Простота</a>
```

- [ ] Replace the entire old `<section class="task-directory" ...>` block with this structure and the approved text:

```html
<section
  class="simplicity"
  id="simplicity"
  aria-labelledby="simplicity-title"
>
  <div class="section-heading simplicity__heading">
    <p class="section-kicker">Простота использования</p>
    <h2 id="simplicity-title" tabindex="-1">
      Убрали всё, что мешает начать
    </h2>
  </div>

  <div class="simplicity__chapters">
    <article class="simplicity__chapter">
      <div class="simplicity__copy">
        <p class="simplicity__index">01 / ПИТАНИЕ</p>
        <h3>Дневник ведёт сам себя</h3>
        <p class="simplicity__lead">Просто сфотографируйте еду</p>
        <p class="simplicity__body">
          ИИ определит блюдо, рассчитает среднее КБЖУ и автоматически добавит
          запись в дневник.
        </p>
      </div>
      <figure class="simplicity__visual">
        <img
          src="./public/screenshots/nutrition.jpg"
          width="576"
          height="1280"
          alt="Сводка дневника питания с калориями и КБЖУ"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </article>

    <article class="simplicity__chapter">
      <div class="simplicity__copy">
        <p class="simplicity__index">02 / ПРИВЫЧКИ</p>
        <h3>Помнить всё не нужно</h3>
        <p class="simplicity__lead">Отмечайте привычки в касание</p>
        <p class="simplicity__body">
          Выберите нужные один раз и отмечайте их каждый день. История
          сохранится автоматически и покажет прогресс за месяц.
        </p>
      </div>
      <figure class="simplicity__visual">
        <img
          src="./public/screenshots/habits.jpg"
          width="576"
          height="1280"
          alt="Недельный прогресс по выбранным привычкам"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </article>

    <article class="simplicity__chapter">
      <div class="simplicity__copy">
        <p class="simplicity__index">03 / ДОКУМЕНТЫ</p>
        <h3>Анализы вносятся сами</h3>
        <p class="simplicity__lead">
          Загрузите их любым удобным способом
        </p>
        <p class="simplicity__body">
          QR-код, фотография или PDF — приложение съест всё.
        </p>
      </div>
      <figure class="simplicity__visual">
        <img
          src="./public/screenshots/document-add.jpg"
          width="576"
          height="1280"
          alt="Добавление документа по типу или QR-коду"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </article>

    <article class="simplicity__chapter">
      <div class="simplicity__copy">
        <p class="simplicity__index">04 / СВЯЗЬ</p>
        <h3>Интеграции интегрируются</h3>
        <p class="simplicity__lead">
          Подключайте любимые устройства и сервисы
        </p>
        <p class="simplicity__body">
          Приложение автоматически получает показатели из популярных
          приложений и устройств.
        </p>
      </div>
      <figure class="simplicity__visual">
        <img
          src="./public/screenshots/devices-and-hrv.jpg"
          width="576"
          height="1280"
          alt="Настройки подключённых устройств и Health Connect"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </article>
  </div>
</section>
```

- [ ] Preserve `loading="lazy"`, `decoding="async"`, and the intrinsic `576 × 1280` dimensions on all four images.
- [ ] Do not add `figcaption`: the adjacent visible copy already provides the semantic explanation.

### Step 5: Remove task-selector JavaScript without removing focus navigation

- [ ] In `src/app.js`, delete `taskScreens` and every function/listener used only by the old task directory: `getTaskElements`, `preloadTask`, `renderMobileProof`, `selectTask`, `installTaskInteractions`, `window.healthSiteSelectTask`, and the delegated task click listener.
- [ ] Retain the existing `installFocusTargetLinks` implementation and reduce initialization to:

```js
function initLandingInteractions() {
  installFocusTargetLinks();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLandingInteractions);
} else {
  initLandingInteractions();
}
```

- [ ] Leave the non-module `<script defer src="./src/app.js"></script>` in `index.html` so direct-file compatibility and hero focus movement continue to work.

### Step 6: Run focused tests and commit the structural change

- [ ] Run the focused command from Step 3. Expected: the new header, content, asset, ordering, and static-behavior assertions pass. CSS-oriented tests may still fail until Task 2.
- [ ] Run `git diff --check`.
- [ ] Commit only `index.html`, `src/app.js`, and `tests/landing.test.js`:

```sh
git add index.html src/app.js tests/landing.test.js
git commit -m "feat: add simplicity editorial section"
```

---

## Task 2: Implement the open editorial layout and responsive behavior

**Files:**

- Modify: `tests/landing.test.js:118-206,276-363,429`
- Modify: `src/styles.css:362-369,1153-1609`
- Test: `tests/landing.test.js`

### Step 1: Add failing CSS contract tests

- [ ] Replace old density, task-hover, and task-mobile CSS assertions with tests that describe the approved layout rather than pixel-perfect screenshots:

```js
test("simplicity uses an open editorial layout without screenshot panels", () => {
  assert.match(
    styles,
    /\.simplicity\s*\{[^}]*background: var\(--white\);/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter\s*\{[^}]*display: grid;[^}]*border-bottom: 1px solid var\(--line\);/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter:nth-child\(even\) \.simplicity__copy\s*\{[^}]*order: 2;/,
  );

  const visualRule = styles.match(/\.simplicity__visual\s*\{([^}]*)\}/)?.[1];
  assert.ok(visualRule);
  assert.doesNotMatch(visualRule, /\bbackground\s*:|\bborder\s*:/);
  const glowRule = styles.match(
    /\.simplicity__visual::before\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(glowRule);
  assert.match(glowRule, /background: radial-gradient\(/);
  assert.match(glowRule, /border-radius:/);
  assert.match(glowRule, /content: "";/);
  assert.match(
    styles,
    /\.simplicity__visual img\s*\{[^}]*object-fit: contain;[^}]*box-shadow: var\(--shadow-soft\);/,
  );
  assert.doesNotMatch(styles, /\.simplicity[^}]*cursor: zoom-in/);
});

test("simplicity keeps text before screenshots on narrow screens", () => {
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.simplicity__chapter,[\s\S]*?\.simplicity__chapter:nth-child\(even\)\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.simplicity__chapter:nth-child\(even\) \.simplicity__copy\s*\{[^}]*order: 0;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.simplicity__chapter\s*\{[^}]*gap:/,
  );
});
```

- [ ] Update the shared max-width/documentation assertions from `.task-directory` or `.task-directory__layout` to `.simplicity`/`.simplicity__chapter`.
- [ ] Update the mobile H3 typography assertion from `.task-item h3` to `.simplicity__copy h3`.
- [ ] Assert that no `.task-directory`, `.task-proof`, `.task-list`, `.task-item`, or `.task-mobile-proof` selector remains in production CSS.

### Step 2: Run the focused style tests and confirm RED

- [ ] Run:

```sh
node --test --test-name-pattern="simplicity uses an open editorial layout|simplicity keeps text before screenshots|desktop sections use|typography uses" tests/landing.test.js
```

Expected: failure because the old task-directory styles remain and the new `simplicity` rules are absent.

### Step 3: Remove the complete old task visual system

- [ ] In the shared max-width selector near `src/styles.css:362`, replace `.task-directory` with `.simplicity`.
- [ ] Remove all selectors rooted at:
  - `.task-directory`
  - `.task-proof`
  - `.task-list`
  - `.task-item`
  - `.task-mobile-proof`
- [ ] Remove their hover/fine-pointer and reduced-motion exceptions. Do not disturb the reduced-motion rules used by other sections.

### Step 4: Add the desktop editorial styles using existing tokens

- [ ] Add a dedicated block in the former task-section position. Use this as the implementation baseline, adjusting only after browser evidence:

```css
.simplicity {
  padding: clamp(88px, 7.8vw, 112px) var(--page-pad);
  background: var(--white);
  box-shadow: 0 0 0 100vmax var(--white);
  clip-path: inset(0 -100vmax);
}

.simplicity__heading {
  max-width: 980px;
}

.simplicity__chapters {
  margin-top: clamp(54px, 6vw, 84px);
  border-top: 1px solid var(--line);
}

.simplicity__chapter {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
  align-items: center;
  gap: clamp(48px, 7vw, 96px);
  padding: clamp(54px, 6vw, 80px) 0;
  border-bottom: 1px solid var(--line);
}

.simplicity__chapter:nth-child(even) {
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
}

.simplicity__chapter:nth-child(even) .simplicity__copy {
  order: 2;
}

.simplicity__copy {
  max-width: 720px;
}

.simplicity__index {
  margin: 0 0 12px;
  color: var(--tiffany-deep);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.simplicity__copy h3 {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(2.15rem, 4vw, 3.7rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.simplicity__lead {
  margin: 28px 0 0;
  color: var(--graphite);
  font-size: clamp(1.05rem, 1.5vw, 1.25rem);
  font-weight: 800;
}

.simplicity__body {
  max-width: 58ch;
  margin: 14px 0 0;
  color: var(--graphite-soft);
  font-size: clamp(1rem, 1.35vw, 1.16rem);
}

.simplicity__visual {
  position: relative;
  isolation: isolate;
  display: grid;
  min-width: 0;
  min-height: clamp(430px, 46vw, 580px);
  place-items: center;
  margin: 0;
}

.simplicity__visual::before {
  position: absolute;
  z-index: -1;
  width: min(92%, 360px);
  aspect-ratio: 0.82;
  border-radius: 44% 56% 61% 39% / 52% 38% 62% 48%;
  background: radial-gradient(
    circle at 50% 46%,
    var(--tiffany-mist) 0%,
    transparent 70%
  );
  filter: blur(18px);
  content: "";
}

.simplicity__visual img {
  width: auto;
  max-width: min(72%, 250px);
  height: auto;
  max-height: 560px;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: var(--shadow-soft);
}
```

- [ ] Keep `.simplicity__visual` itself free of `background`, `border`, and `box-shadow`; those would recreate the rejected panel.

### Step 5: Add responsive ordering and sizing

- [ ] At `max-width: 820px`, collapse both odd and even chapters and reset the even copy order:

```css
@media (max-width: 820px) {
  .simplicity__chapter,
  .simplicity__chapter:nth-child(even) {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }

  .simplicity__chapter:nth-child(even) .simplicity__copy {
    order: 0;
  }

  .simplicity__visual {
    min-height: 500px;
  }
}
```

- [ ] At `max-width: 600px`, reduce spacing and cap the screen without cropping:

```css
@media (max-width: 600px) {
  .simplicity {
    padding-top: 92px;
    padding-bottom: 92px;
  }

  .simplicity__chapters {
    margin-top: 48px;
  }

  .simplicity__chapter {
    gap: 30px;
    padding: 48px 0;
  }

  .simplicity__copy h3 {
    font-size: clamp(2rem, 10vw, 2.75rem);
  }

  .simplicity__visual {
    min-height: 420px;
  }

  .simplicity__visual img {
    max-width: min(68vw, 220px);
    max-height: 460px;
  }
}
```

- [ ] Do not assign explicit grid rows or visual order values that can move a screenshot before its text in the DOM reading order.

### Step 6: Run tests and inspect in a real browser

- [ ] Run the focused style tests from Step 2. Expected: pass.
- [ ] Run `npm run dev` if no site server is active, then inspect `http://127.0.0.1:4173/#simplicity` at approximately 1440 px, 820 px, 390 px, and 320 px widths.
- [ ] Confirm visually:
  - the section is white, not a dark green surface;
  - no rectangular panel surrounds any screenshot;
  - each screenshot is fully visible and does not touch a container edge;
  - desktop alternates sides;
  - mobile always reads text then screenshot;
  - organic glow has no readable rectangular edge;
  - there is no horizontal overflow.
- [ ] If the glow or phone scale needs adjustment, change only the size/blur/max-width values in the new namespace and repeat the browser check.

### Step 7: Commit the layout

- [ ] Run `git diff --check`.
- [ ] Commit only the style and related contract-test changes:

```sh
git add src/styles.css tests/landing.test.js
git commit -m "style: add simplicity editorial layout"
```

---

## Task 3: Synchronize durable product, content, and design documentation

**Files:**

- Modify: `docs/landing-content.md:35-109`
- Modify: `PRODUCT.md:20-55`
- Modify: `DESIGN.md:114-123,213-313,356`
- Modify: `.impeccable/surfaces/landing.md:12-161`
- Modify: `tests/landing.test.js:11,429-450`
- Test: `tests/landing.test.js`

### Step 1: Add a failing documentation contract

- [ ] Read the four documentation files in the test and add this contract:

```js
const product = readFileSync(new URL("../PRODUCT.md", import.meta.url), "utf8");
const content = readFileSync(
  new URL("../docs/landing-content.md", import.meta.url),
  "utf8",
);
const surface = readFileSync(
  new URL("../.impeccable/surfaces/landing.md", import.meta.url),
  "utf8",
);

test("durable docs describe the approved simplicity section", () => {
  for (const source of [content, design, surface]) {
    assert.match(source, /Простота использования/);
    assert.match(source, /Дневник ведёт сам себя/);
    assert.match(source, /Помнить всё не нужно/);
    assert.match(source, /Анализы вносятся сами/);
    assert.match(source, /Интеграции интегрируются/);
    assert.doesNotMatch(source, /task-directory|Task Directory/);
  }

  assert.match(product, /фотограф/i);
  assert.match(product, /PDF/);
  assert.doesNotMatch(product, /Выбрать задачу/);
});
```

### Step 2: Run the documentation test and confirm RED

- [ ] Run:

```sh
node --test --test-name-pattern="durable docs describe the approved simplicity section" tests/landing.test.js
```

Expected: failure because durable documents still describe the eleven-task selector or the earlier scenario-card model.

### Step 3: Update the approved content source

- [ ] In `docs/landing-content.md`, replace the old section 3 catalog with:
  - the section kicker and H2;
  - the four numbered chapters with the exact approved title, lead, and body;
  - the exact screenshot mapping;
  - a note that the section is static and the separate integrations section remains section 4.
- [ ] Remove the eleven old task entries only from this replaced section. Do not remove content used by FAQ or other approved sections.

### Step 4: Record confirmed product truth without medical overclaiming

- [ ] In `PRODUCT.md`, add the user-confirmed product capabilities narrowly:
  - food can be added from a photo and the app can determine the dish and calculate an average KBZhU value;
  - analyses/documents can be uploaded by QR code, photo, or PDF.
- [ ] Remove the stale internal action «Выбрать задачу» and describe the static four-chapter simplicity section instead.
- [ ] Keep the existing safety boundary: no diagnosis, treatment, medical outcome, invented metrics, or replacement of a professional.

### Step 5: Replace the old component model in design documentation

- [ ] In `DESIGN.md`:
  - replace old task-directory/proof component entries with `Simplicity Editorial Chapters`, `simplicity__chapter`, and `simplicity__visual` roles;
  - describe alternating two-column chapters, thin `--line` separators, open white background, soft `--shadow-soft`, and organic Tiffany glow;
  - record the mobile order `text → screenshot` and one-full-screen constraint;
  - change the section-kicker example from «Основные задачи» to «Простота использования»;
  - remove hover zoom, task selection, sticky proof, card/panel, and `aria-pressed` guidance for this section.
- [ ] In `.impeccable/surfaces/landing.md`:
  - change the visitor outcome from choosing a scenario to understanding four low-friction capabilities;
  - replace IA slot 4 with the approved `Простота использования` section;
  - remove the scenario-card/screenshot-result interaction model;
  - document desktop alternation, mobile text-first order, and lack of screenshot panels;
  - retain the current hero, integrations, FAQ, documentation, and safety constraints.

### Step 6: Run tests and commit the documentation sync

- [ ] Run the documentation test from Step 2. Expected: pass.
- [ ] Run `npm test` to ensure no obsolete content contract remains.
- [ ] Run `git diff --check`.
- [ ] Commit the durable documentation and its test:

```sh
git add docs/landing-content.md PRODUCT.md DESIGN.md \
  .impeccable/surfaces/landing.md tests/landing.test.js
git commit -m "docs: sync simplicity section"
```

---

## Task 4: Complete regression, accessibility, and build verification

**Files:**

- Verify: `index.html`
- Verify: `src/styles.css`
- Verify: `src/app.js`
- Verify: `tests/landing.test.js`
- Verify: `dist/` generated output

### Step 1: Run the complete automated suite

- [ ] Run:

```sh
npm test
```

Expected: all atlas and landing-contract tests pass with zero failures.

- [ ] Run:

```sh
npm run build
```

Expected: `dist/` is recreated successfully and contains the new `#simplicity` markup, updated CSS/JS, and all four referenced screenshot files.

- [ ] Confirm generated output:

```sh
rg -n 'id="simplicity"|Простота использования|nutrition.jpg|habits.jpg|document-add.jpg|devices-and-hrv.jpg' dist
rg -n 'task-directory|data-task-select|healthSiteSelectTask' dist
```

Expected: the first command finds the new section/assets; the second returns no matches.

### Step 2: Verify responsive and accessibility behavior in the browser

- [ ] At 1440 × 900, confirm the four chapters alternate text and screenshot while the `Интеграции` section remains unchanged below them.
- [ ] At 820 px, 390 px, and 320 px widths, confirm every chapter uses DOM/visual order text then screenshot, all text wraps, and no horizontal scrollbar appears.
- [ ] At 200% zoom, confirm the section remains readable without clipped copy or screens.
- [ ] Follow the header `Простота` link and confirm it lands on `#simplicity`.
- [ ] Use the keyboard to activate the hero `С чего начать` link; confirm `#first-route-title` still receives focus through `installFocusTargetLinks`.
- [ ] Confirm no screenshot receives focus, pointer cursor, hover enlargement, or motion-dependent content.
- [ ] Enable reduced motion and confirm the content remains complete and stable.

### Step 3: Inspect final scope and whitespace

- [ ] Run:

```sh
git diff --check
git status --short
```

Expected: no whitespace errors. Only intentional source changes or generated `dist/` changes allowed by the repository workflow are present; unrelated user files remain untouched.

- [ ] If browser verification required fixes, rerun `npm test`, `npm run build`, and `git diff --check`, then commit only those fixes:

```sh
git add index.html src/styles.css src/app.js tests/landing.test.js
git commit -m "fix: polish simplicity section"
```

- [ ] If no fixes were needed, do not create an empty final commit.

## Definition of Done

- [ ] Header shows `Простота` and resolves to `#simplicity`.
- [ ] «Основные задачи» and its selector behavior are absent from HTML, CSS, JavaScript, tests, and durable section documentation.
- [ ] Exactly four approved chapters and exactly four mapped screenshots are present.
- [ ] Screens are complete, unframed, softly shadowed, and supported only by a boundary-free Tiffany glow.
- [ ] Desktop alternates sides; all narrow layouts remain text-first with no horizontal overflow.
- [ ] Existing integrations, FAQ, documentation, hero focus behavior, and atlas state remain intact.
- [ ] Durable product/design/content docs reflect the approved section and confirmed product capabilities.
- [ ] `npm test`, `npm run build`, and `git diff --check` pass with fresh output.
