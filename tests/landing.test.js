import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const landing = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const design = readFileSync(new URL("../DESIGN.md", import.meta.url), "utf8");

const product = readFileSync(new URL("../PRODUCT.md", import.meta.url), "utf8");
const content = readFileSync(
  new URL("../docs/landing-content.md", import.meta.url),
  "utf8",
);
const surface = readFileSync(
  new URL("../.impeccable/surfaces/landing.md", import.meta.url),
  "utf8",
);

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

const faqQuestions = [
  "С чего начать, если я впервые открыл приложение?",
  "Какие данные можно вести вручную?",
  "Как подключить Google Fit, Samsung Health, Apple Health или Health Connect?",
  "Можно ли использовать приложение вместо врача?",
  "Что означает «статус здоровья» и риски?",
  "Где хранятся документы и анализы?",
];

function section(id) {
  return landing.match(
    new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`),
  )?.[1];
}

test("hero presents one focused entry point", () => {
  const hero = section("top");

  assert.ok(hero);
  assert.doesNotMatch(hero, /Приложение «Здоровье»/);
  assert.match(hero, /Каждый день - возможность/);
  assert.match(
    hero,
    /Чтобы предупредить болезнь, сначала нужно заметить изменения за\s+тысячей рутинных дел/,
  );
  assert.match(hero, /href="#first-route"[^>]*>\s*С чего начать/);
  assert.doesNotMatch(hero, /href="#faq"/);
  assert.equal((hero.match(/class="button\b/g) ?? []).length, 1);
  assert.doesNotMatch(hero, /hero-topic-(?:line|index)/);
  assert.doesNotMatch(hero, /hero__disclaimer/);
  assert.match(
    hero,
    /Наблюдения складываются в историю — от утра к вечеру\./,
  );
  assert.match(
    styles,
    /\.hero \.button--primary\s*\{[^}]*background: var\(--tiffany-dark\);/,
  );
  assert.match(
    styles,
    /\.day-archive__caption\s*\{[^}]*white-space: nowrap;/,
  );
});

test("client interaction script works when index.html is opened directly", () => {
  assert.match(landing, /<script defer src="\.\/src\/app\.js"><\/script>/);
  assert.doesNotMatch(landing, /<script[^>]+type="module"[^>]+src="\.\/src\/app\.js"/);
});

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
  assert.match(header, /href="#faq"[^>]*>Частые вопросы/);
  assert.match(header, /href="#documentation"[^>]*>Документация/);
  assert.doesNotMatch(header, /href="#tasks"|>Основные задачи/);
  assert.doesNotMatch(styles, /\.header-route/);
});

test("section kickers use one shared visual format", () => {
  assert.equal((landing.match(/class="section-kicker"/g) ?? []).length, 5);
  assert.doesNotMatch(landing, /class="(?:hero__kicker|section-heading__label)"/);
  assert.match(
    styles,
    /\.section-kicker\s*\{[\s\S]*?color: var\(--tiffany-deep\);[\s\S]*?font-family: var\(--body\);[\s\S]*?font-size: 0\.78rem;[\s\S]*?font-weight: 800;[\s\S]*?line-height: 1\.6;[\s\S]*?letter-spacing: 0\.14em;[\s\S]*?text-transform: uppercase;/,
  );
  assert.match(
    styles,
    /\.faq-preview \.section-heading > p:not\(\.section-kicker\)/,
  );
  assert.match(
    styles,
    /\.integrations__copy > p:not\(\.section-kicker\)/,
  );
});

test("typography uses the local Manrope variable font", () => {
  assert.ok(
    existsSync(
      new URL(
        "../public/fonts/manrope/manrope-cyrillic-variable.woff2",
        import.meta.url,
      ),
    ),
  );
  assert.ok(
    existsSync(
      new URL(
        "../public/fonts/manrope/manrope-latin-variable.woff2",
        import.meta.url,
      ),
    ),
  );
  assert.match(
    landing,
    /rel="preload"[\s\S]*?manrope-cyrillic-variable\.woff2/,
  );
  assert.match(styles, /@font-face\s*\{[\s\S]*?font-family: "Manrope";/);
  assert.match(styles, /--display: "Manrope", "Segoe UI", Arial, sans-serif;/);
  assert.match(styles, /--body: "Manrope", "Segoe UI", Arial, sans-serif;/);
  assert.match(
    styles,
    /\.hero h1,[\s\S]*?\.support h2\s*\{[^}]*font-weight: 700;[^}]*letter-spacing: -0\.04em;/,
  );
  assert.match(design, /fontFamily: '"Manrope", "Segoe UI", Arial, sans-serif'/);
});

test("hero and section headlines keep a clear responsive hierarchy", () => {
  assert.match(
    styles,
    /\.hero h1\s*\{[^}]*font-size: clamp\(3rem, 6\.7vw, 6rem\);/,
  );
  assert.match(
    styles,
    /\.section-heading h2,[\s\S]*?\.support h2\s*\{[^}]*font-size: clamp\(2\.2rem, 4\.45vw, 4rem\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.hero h1\s*\{[^}]*font-size: clamp\(3rem, 12\.3vw, 4rem\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.section-heading h2,[\s\S]*?\.support h2\s*\{[^}]*font-size: clamp\(2\.2rem, 9vw, 2\.4rem\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.simplicity__copy h3\s*\{[^}]*font-size: clamp\(1\.75rem, 7\.5vw, 2\.1rem\);/,
  );
  assert.doesNotMatch(
    styles,
    /\.first-route \.section-heading h2\s*\{[^}]*font-size:/,
  );
});

test("desktop sections use the approved compact density", () => {
  assert.match(styles, /--max-width:\s*1320px;/);
  assert.match(
    styles,
    /\.simplicity\s*\{[^}]*padding: clamp\(88px, 7\.8vw, 112px\) var\(--page-pad\);/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter\s*\{[^}]*padding: clamp\(40px, 4\.2vw, 56px\) 0;/,
  );
  assert.match(
    styles,
    /\.integration-list li\s*\{[^}]*min-height: 80px;/,
  );
});

test("hero keeps its illustration while simplicity uses four real screens", () => {
  const hero = section("top");
  const simplicity = section("simplicity");

  assert.ok(hero);
  assert.ok(simplicity);
  assert.equal(
    existsSync(
      new URL(
        "../public/illustrations/one-day-archive-labeled-transparent.webp",
        import.meta.url,
      ),
    ),
    true,
  );
  assert.match(hero, /class="day-archive"/);
  assert.match(
    hero,
    /src="\.\/public\/illustrations\/one-day-archive-labeled-transparent\.webp"[\s\S]*?width="1254"[\s\S]*?height="1254"[\s\S]*?fetchpriority="high"/,
  );
  assert.match(
    hero,
    /alt="Слоистый архив дня с маршрутом между самочувствием, активностью, документами и подсказками"/,
  );
  assert.doesNotMatch(hero, /class="atlas"/);
  assert.equal((simplicity.match(/<img\b/g) ?? []).length, 4);
});

test("getting started follows the hero as one connected route", () => {
  const route = section("first-route");

  assert.ok(route);
  assert.ok(
    landing.indexOf('id="top"') < landing.indexOf('id="first-route"'),
    "getting started must follow the hero",
  );
  assert.ok(
    landing.indexOf('id="first-route"') < landing.indexOf('id="simplicity"'),
    "getting started must come before simplicity",
  );
  assert.match(route, /С чего начать/);
  assert.match(route, /Ваш первый портрет здоровья/);
  assert.equal((route.match(/class="first-route__step"/g) ?? []).length, 4);
  assert.equal((route.match(/class="first-route__num"/g) ?? []).length, 4);
  assert.doesNotMatch(route, /class="route-link"/);
  for (const heading of [
    "Добавьте то, что уже есть",
    "Получите первый портрет здоровья",
    "Дополняйте по мере изменений",
    "Наблюдайте, как меняется здоровье",
  ]) {
    assert.ok(route.includes(heading), heading);
  }
  assert.match(
    styles,
    /\.first-route\s*\{[\s\S]*?background: linear-gradient\(180deg, var\(--tiffany-fog\) 0%, var\(--white\) 100%\);/,
  );
  assert.match(
    styles,
    /\.first-route__grid::before\s*\{[^}]*position: absolute;[^}]*height: 2px;[^}]*background: var\(--line\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 1080px\)[\s\S]*?\.first-route__grid::before\s*\{[^}]*width: 2px;[^}]*height: auto;/,
  );
});

test("simplicity replaces the task directory with four editorial chapters", () => {
  const simplicity = section("simplicity");

  assert.ok(simplicity);
  const normalizedSimplicity = simplicity.replace(/\s+/g, " ");
  assert.match(simplicity, /Простота использования/);
  assert.match(simplicity, /Мы убрали всё, что обычно мешает начать/);
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

test("simplicity uses an open editorial layout without screenshot panels", () => {
  assert.match(
    styles,
    /\.simplicity\s*\{[^}]*background: var\(--white\);/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter\s*\{[^}]*display: grid;/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter \+ \.simplicity__chapter\s*\{[^}]*border-top: 1px solid var\(--line\);/,
  );
  assert.doesNotMatch(
    styles.match(/\.simplicity__chapters\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
  );
  assert.doesNotMatch(
    styles.match(/\.simplicity__chapter\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
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
  assert.doesNotMatch(
    styles,
    /\.task-directory|\.task-proof|\.task-list|\.task-item|\.task-mobile-proof/,
  );
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

test("integrations and FAQ use the supplied product copy", () => {
  const integrations = section("integrations");
  const faq = section("faq");

  assert.ok(integrations);
  assert.ok(faq);

  for (const name of [
    "Health Connect",
    "Кардиокарта",
    "NEYROX PRO",
    "Apple Health",
    "Google Fit",
    "Samsung Health",
  ]) {
    assert.ok(integrations.includes(name), name);
  }

  assert.doesNotMatch(integrations, /По данным продукта/);
  assert.doesNotMatch(integrations, /Подключить устройство/);
  assert.match(
    integrations,
    /Подключение выполняется в разделе «Настройки»\./,
  );
  assert.match(
    styles,
    /\.integrations\s*\{[\s\S]*?background: linear-gradient\(180deg, var\(--white\) 0%, var\(--tiffany-fog\) 100%\);/,
  );

  assert.equal((faq.match(/<details>/g) ?? []).length, 6);
  for (const question of faqQuestions) {
    assert.ok(faq.includes(question), question);
  }
  assert.match(
    faq,
    /<button\b[^>]*disabled[^>]*>\s*Читать все вопросы\s*<\/button>/,
  );
});

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

test("documentation stays honest when external destinations are absent", () => {
  const documentation = section("documentation");

  assert.ok(documentation);
  assert.match(
    documentation,
    /<button\b[^>]*class="button button--secondary support__action"[^>]*disabled[^>]*>\s*Открыть документацию\s*<\/button>/,
  );
  assert.doesNotMatch(documentation, /href="#faq"[^>]*>Частые вопросы/);
  assert.ok(
    documentation.indexOf("Открыть документацию") <
      documentation.indexOf('class="support__content"'),
  );
  assert.match(
    landing,
    /Приложение не ставит диагноз, не назначает лечение и не заменяет\s+консультацию врача\./,
  );

  const ids = new Set(
    [...landing.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of landing.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `fragment #${match[1]} must resolve`);
  }

  assert.match(styles, /\.simplicity__chapter/);
  assert.match(styles, /@media \(max-width: 600px\)/);
});
