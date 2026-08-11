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

const pngSize = (path) => {
  const buffer = readFileSync(path);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const simplicityChapters = [
  {
    index: "01 / ПИТАНИЕ",
    title: "Дневник ведёт сам себя",
    lead: "Просто сфотографируйте еду",
    body: "ИИ определит блюдо, рассчитает среднее КБЖУ и автоматически добавит запись",
    screenshots: ["food1.png", "food2.png"],
  },
  {
    index: "02 / ПРИВЫЧКИ",
    title: "Отмечайте привычки в касание",
    lead: "Помнить всё не нужно",
    body: "Выберите нужные один раз и отмечайте их каждый день — история сохранится автоматически и покажет прогресс за месяц",
    screenshots: ["habits1.png"],
  },
  {
    index: "03 / ДОКУМЕНТЫ",
    title: "Загружайте анализы",
    lead: "Чтобы видеть всю картину",
    body: "QR-код, фотография или PDF — ИИ сам считает результаты и дополнит ваш портрет и рекомендации",
    screenshots: ["doc1.png", "doc2.png"],
  },
  {
    index: "04 / СВЯЗЬ",
    title: "Интеграции работают на вас",
    lead: "Подключайте любимые устройства и сервисы",
    body: "Приложение автоматически получает показатели из популярных приложений и устройств",
    screenshots: ["integration1.png"],
  },
];

const privacyPrinciples = [
  "Вы управляете данными",
  "Пользуйтесь анонимно",
  "Без идентификации",
  "Геолокация не нужна",
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
  assert.match(hero, /Каждый день — это/);
  assert.match(hero, /возможность/);
  assert.doesNotMatch(hero, /hero-title__dash/);
  assert.match(styles, /\.section-heading h2,[\s\S]*?margin-left: -0\.055em;/);
  assert.match(
    hero,
    /Чтобы предупредить болезнь и заметить изменения за\s+тысячей\s+рутинных дел/,
  );
  assert.match(hero, /href="#first-route"[^>]*>\s*С чего начать/);
  assert.doesNotMatch(hero, /href="#faq"/);
  assert.equal((hero.match(/class="button\b/g) ?? []).length, 1);
  assert.doesNotMatch(hero, /hero-topic-(?:line|index)/);
  assert.doesNotMatch(hero, /hero__disclaimer/);
  assert.match(hero, /Наблюдения складываются в историю — от утра к вечеру/);
  assert.match(
    styles,
    /\.hero \.button--primary\s*\{[^}]*background: var\(--tiffany-dark\);/,
  );
  assert.match(
    styles,
    /\.day-archive__caption\s*\{[^}]*width: 100%;[^}]*margin: -14px 0 0;[^}]*text-align: center;[^}]*white-space: nowrap;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.day-archive\s*\{[^}]*width: min\(94%, 520px\);[^}]*margin: 30px auto 0;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.day-archive__caption\s*\{[^}]*width: min\(100%, 36rem\);[^}]*margin: -6px auto 0;[^}]*white-space: normal;/,
  );
});

test("main copy avoids sentence-final periods", () => {
  const main = landing.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];

  assert.ok(main);
  const visibleText = main
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "\n");
  assert.doesNotMatch(visibleText, /[А-Яа-яЁё][^\n]*\./);
});

test("client interaction script works when index.html is opened directly", () => {
  assert.match(landing, /<script defer src="\.\/src\/app\.js"><\/script>/);
  assert.doesNotMatch(
    landing,
    /<script[^>]+type="module"[^>]+src="\.\/src\/app\.js"/,
  );
});

test("header links to the five current landing sections", () => {
  const header = landing.match(
    /<header\b[^>]*class="site-header"[^>]*>([\s\S]*?)<\/header>/,
  )?.[1];

  assert.ok(header);
  assert.doesNotMatch(header, /<a class="brand"[^>]*href="#top"/);
  assert.match(header, /<div class="brand" aria-label="Здоровье">/);
  assert.match(header, /<!-- <span class="brand__name">Здоровье<\/span> -->/);
  assert.match(styles, /\.brand__mark\s*\{[^}]*width: 52px;[^}]*height: 52px;/);
  assert.match(styles, /\.brand--footer \.brand__mark\s*\{[^}]*width: 44px;[^}]*height: 44px;/);
  assert.match(styles, /@media \(max-width: 820px\)[\s\S]*?\.brand__mark\s*\{[^}]*width: 46px;[^}]*height: 46px;/);
  assert.match(header, /href="#first-route"[^>]*>С чего начать/);
  assert.match(header, /href="#simplicity"[^>]*>Простота/);
  assert.ok(
    header.indexOf('href="#first-route"') <
      header.indexOf('href="#simplicity"'),
  );
  assert.match(header, /href="#integrations"[^>]*>Интеграции/);
  assert.match(header, /href="#privacy"[^>]*>Анонимность/);
  assert.match(header, /href="#download"[^>]*>Скачать/);
  assert.doesNotMatch(header, /href="#faq"|href="#documentation"/);
  assert.doesNotMatch(header, /href="#tasks"|>Основные задачи/);
  assert.doesNotMatch(styles, /\.header-route/);
});

test("footer links to the documentation PDF mockup", () => {
  const footer = landing.match(
    /<footer\b[^>]*class="site-footer"[^>]*>([\s\S]*?)<\/footer>/,
  )?.[1];

  assert.ok(footer);
  assert.match(footer, /<!-- <span class="brand__name">Здоровье<\/span> -->/);
  assert.match(footer, /class="site-footer__links"[^>]*aria-label="Ссылки в подвале"/);
  assert.match(footer, /href="#top"[^>]*>В начало/);
  assert.match(footer, /<span aria-hidden="true">·<\/span>/);
  assert.match(
    footer,
    /href="\.\/public\/health-app-documentation-mock\.pdf"[^>]*>Документация/,
  );
  assert.ok(
    existsSync(new URL("../public/health-app-documentation-mock.pdf", import.meta.url)),
  );
  assert.match(styles, /\.site-footer__links\s*\{[\s\S]*?justify-self: end;/);
  assert.match(styles, /\.site-footer p\s*\{[^}]*font-size: 0\.74rem;/);
});

test("section kickers use one shared visual format", () => {
  assert.equal((landing.match(/class="section-kicker"/g) ?? []).length, 5);
  assert.doesNotMatch(
    landing,
    /class="(?:hero__kicker|section-heading__label)"/,
  );
  assert.match(
    styles,
    /\.section-kicker\s*\{[\s\S]*?color: var\(--tiffany-deep\);[\s\S]*?font-family: var\(--body\);[\s\S]*?font-size: 0\.78rem;[\s\S]*?font-weight: 800;[\s\S]*?line-height: 1\.6;[\s\S]*?letter-spacing: 0\.14em;[\s\S]*?text-transform: uppercase;/,
  );
  assert.match(styles, /\.integrations__copy > p:not\(\.section-kicker\)/);
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
    /\.hero h1,[\s\S]*?\.download-section h2\s*\{[^}]*font-weight: 700;[^}]*letter-spacing: -0\.04em;/,
  );
  assert.match(
    design,
    /fontFamily: '"Manrope", "Segoe UI", Arial, sans-serif'/,
  );
});

test("hero and section headlines keep a clear responsive hierarchy", () => {
  assert.match(
    styles,
    /\.hero h1\s*\{[^}]*font-size: clamp\(3rem, 6\.7vw, 6rem\);/,
  );
  assert.match(
    styles,
    /\.section-heading h2,[\s\S]*?\.safety h2\s*\{[^}]*font-size: clamp\(2\.2rem, 4\.45vw, 4rem\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.hero h1\s*\{[^}]*font-size: clamp\(3rem, 12\.3vw, 4rem\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.section-heading h2,[\s\S]*?\.safety h2\s*\{[^}]*font-size: clamp\(2\.2rem, 9vw, 2\.4rem\);/,
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
    /\.simplicity\s*\{[^}]*padding: clamp\(72px, 6vw, 96px\) var\(--page-pad\);/,
  );
  assert.match(
    styles,
    /\.simplicity__chapter\s*\{[^}]*padding: clamp\(28px, 3\.2vw, 44px\) 0;/,
  );
  assert.match(styles, /\.integration-list li\s*\{[^}]*min-height: 104px;/);
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
  assert.equal((simplicity.match(/<img\b/g) ?? []).length, 6);
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
  for (const step of [
    "Добавьте то, что уже есть",
    "Получите первый результат",
    "Дополняйте портрет",
    "Наблюдайте за изменениями",
  ]) {
    assert.ok(route.includes(step), step);
  }
  assert.match(styles, /\.first-route\s*\{[\s\S]*?background: var\(--white\);/);
  assert.match(
    styles,
    /\.first-route__grid::before\s*\{[^}]*position: absolute;[^}]*height: 2px;[^}]*background: var\(--line\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 1080px\)[\s\S]*?\.first-route__grid::before\s*\{[^}]*width: 2px;[^}]*height: auto;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.first-route__step h3\s*\{[^}]*min-height: 44px;[^}]*display: flex;[^}]*align-items: center;[^}]*margin-top: 0;/,
  );
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
  assert.equal((simplicity.match(/<img\b/g) ?? []).length, 6);

  for (const chapter of simplicityChapters) {
    assert.ok(normalizedSimplicity.includes(chapter.index), chapter.index);
    assert.ok(normalizedSimplicity.includes(chapter.title), chapter.title);
    assert.ok(normalizedSimplicity.includes(chapter.lead), chapter.lead);
    assert.ok(normalizedSimplicity.includes(chapter.body), chapter.body);

    for (const screenshot of chapter.screenshots) {
      assert.match(
        simplicity,
        new RegExp(`src="\\./public/screenshots/${screenshot}"`),
      );
      assert.ok(
        existsSync(new URL(`../public/screenshots/${screenshot}`, import.meta.url)),
        screenshot,
      );
    }
  }

  assert.equal((simplicity.match(/class="simplicity__visual simplicity__visual--pair"/g) ?? []).length, 2);

  for (const { screenshots } of simplicityChapters) {
    for (const screenshot of screenshots) {
      assert.deepEqual(
        pngSize(new URL(`../public/screenshots/${screenshot}`, import.meta.url)),
        { width: 720, height: 1500 },
        screenshot,
      );
    }
  }

  assert.ok(
    landing.indexOf('id="first-route"') < landing.indexOf('id="simplicity"'),
  );
  assert.ok(
    landing.indexOf('id="simplicity"') < landing.indexOf('id="integrations"'),
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
    /\.simplicity\s*\{[^}]*background: var\(--section-fog\);/,
  );
  assert.match(styles, /\.simplicity__chapter\s*\{[^}]*display: grid;/);
  assert.match(
    styles,
    /\.simplicity__chapters\s*\{[^}]*margin-top: clamp\(40px, 3\.5vw, 52px\);/,
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
    /\.simplicity__visual img\s*\{[^}]*object-fit: contain;[^}]*border-radius: 8px;[^}]*box-shadow: var\(--shadow-soft\);/,
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

test("integrations use the supplied product copy", () => {
  const integrations = section("integrations");

  assert.ok(integrations);

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

  assert.match(integrations, /Лёгкий старт/);
  assert.match(
    integrations,
    /Если вы уже пользуетесь приложениями для здоровья или носимыми\s+устройствами, просто подключите их к приложению в настройках/,
  );
  assert.equal(
    (integrations.match(/class="integration-mark /g) ?? []).length,
    6,
  );
  for (const logo of [
    "neyrox-logo.png",
    "google-fit-logo.png",
    "samsung-health-logo.png",
    "cardiokarta-logo.png",
  ]) {
    assert.match(
      integrations,
      new RegExp(`src="\\./public/integrations/${logo.replace(".", "\\.")}"`),
    );
    assert.ok(
      existsSync(new URL(`../public/integrations/${logo}`, import.meta.url)),
      logo,
    );
  }
  assert.doesNotMatch(integrations, /\.svg/);
  assert.doesNotMatch(
    styles.match(/\.integration-list\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
  );
  assert.doesNotMatch(
    styles.match(/\.integration-list li\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
  );
  assert.doesNotMatch(integrations, /По данным продукта/);
  assert.doesNotMatch(integrations, /Подключить устройство/);
  assert.doesNotMatch(integrations, /Подключение выполняется/);
  assert.match(
    styles,
    /\.integrations\s*\{[\s\S]*?background: var\(--white\);/,
  );
  assert.doesNotMatch(
    styles.match(/\.integrations\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
  );
});

test("privacy manifesto follows integrations as an open four-principle grid", () => {
  const privacy = section("privacy");

  assert.ok(privacy);
  assert.match(privacy, /Анонимность/);
  assert.match(privacy, /Ваше здоровье — ваше дело/);
  assert.match(
    privacy,
    /Мы сделали всё от нас зависящее, чтобы обеспечить безопасность\s+данных и не отвлекать вас от заботы о здоровье/,
  );
  for (const principle of privacyPrinciples) {
    assert.ok(privacy.includes(principle), principle);
  }
  assert.equal((privacy.match(/class="privacy-principle"/g) ?? []).length, 4);
  assert.equal(
    (privacy.match(/class="privacy-principle__icon"/g) ?? []).length,
    4,
  );
  assert.doesNotMatch(privacy, />\s*0[1-4]\s*</);
  assert.doesNotMatch(privacy, /<button\b|class="[^\"]*card/);
  assert.ok(
    landing.indexOf('id="integrations"') < landing.indexOf('id="privacy"'),
  );
  assert.ok(landing.indexOf('id="privacy"') < landing.indexOf('id="download"'));
  assert.match(
    styles,
    /\.privacy-manifesto__principles\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    styles,
    /\.privacy-principle__icon\s*\{[^}]*width: 44px;[^}]*border-radius: 50%;[^}]*background: var\(--tiffany-mist\);/,
  );
  assert.match(
    styles,
    /\.privacy-manifesto\s*\{[^}]*background: var\(--section-fog\);/,
  );
  assert.match(
    styles,
    /\.privacy-manifesto\s*\{[^}]*padding: clamp\(72px, 6vw, 96px\)/,
  );
  assert.match(
    styles,
    /\.privacy-manifesto__principles\s*\{[^}]*row-gap: clamp\(36px, 4vw, 52px\);[^}]*margin-top: clamp\(48px, 5vw, 64px\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.privacy-manifesto\s*\{[^}]*padding-top: 68px;[^}]*padding-bottom: 68px;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.privacy-manifesto__principles\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
  );
});

test("download route follows privacy with two honest QR placeholders", () => {
  const download = section("download");

  assert.ok(download);
  assert.match(download, /Скачать приложение/);
  assert.match(download, /Это ваш первый шаг/);
  assert.match(download, /<strong>iOS<\/strong>/);
  assert.match(download, /<strong>Android<\/strong>/);
  assert.equal((download.match(/class="download-option"/g) ?? []).length, 2);
  assert.equal((download.match(/Ссылка появится позже/g) ?? []).length, 2);
  assert.doesNotMatch(download, /<a\b|href=|<button\b/);
  assert.ok(landing.indexOf('id="privacy"') < landing.indexOf('id="download"'));
  assert.match(
    styles,
    /\.download-section\s*\{[^}]*display: grid;[^}]*background: var\(--white\);/,
  );
  assert.match(
    styles,
    /\.download-section\s*\{[^}]*padding: clamp\(64px, 5\.5vw, 88px\) var\(--page-pad\);/,
  );
  assert.match(
    styles,
    /\.download-section__visual\s*\{[^}]*min-height: 360px;/,
  );
  assert.doesNotMatch(
    styles.match(/\.download-section\s*\{([^}]*)\}/)?.[1] ?? "",
    /\bborder(?:-top|-bottom)?\s*:/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.download-section,[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.download-section\s*\{[^}]*padding-top: 68px;[^}]*padding-bottom: 68px;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.download-section__route\s*\{[^}]*display: none;/,
  );
});

test("mobile footer keeps its links readable", () => {
  assert.match(
    styles,
    /\.site-footer__links a\s*\{[^}]*white-space: nowrap;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.site-footer\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.site-footer__links\s*\{[^}]*justify-self: start;/,
  );
});

test("durable docs describe the approved simplicity section", () => {
  for (const source of [content, design, surface]) {
    assert.match(source, /Простота использования/);
    assert.match(source, /Дневник ведёт сам себя/);
    assert.match(source, /Отмечайте привычки в касание/);
    assert.match(source, /Просто загрузите анализы/);
    assert.match(source, /Интеграции работают на вас/);
    assert.doesNotMatch(source, /task-directory|Task Directory/);
  }

  assert.match(product, /фотограф/i);
  assert.match(product, /PDF/);
  assert.doesNotMatch(product, /Выбрать задачу/);
});

test("durable docs describe the approved privacy manifesto", () => {
  for (const source of [content, design, product]) {
    assert.match(source, /Анонимность/);
    assert.match(source, /Ваше здоровье — ваше дело|контрол[ья] пользователя/);
  }

  for (const principle of privacyPrinciples) {
    assert.ok(content.includes(principle), principle);
  }
  assert.match(design, /Privacy Manifesto/);
  assert.match(design, /открыт[^\n]*сетк[^\n]*2 × 2/);
});

test("durable docs describe unavailable iOS and Android download routes", () => {
  for (const source of [content, design, product, surface]) {
    assert.match(source, /Скачать приложение/);
    assert.match(source, /iOS/);
    assert.match(source, /Android/);
  }

  assert.match(content, /Ссылка появится позже/);
  assert.match(design, /Download Route/);
  assert.match(product, /подтверждённых (?:адресов|ссылок)/);
});

test("removed FAQ and documentation sections leave no stale routes", () => {
  assert.equal(section("faq"), undefined);
  assert.equal(section("documentation"), undefined);
  assert.doesNotMatch(landing, /faq-preview|faq-list|support__content/);
  assert.doesNotMatch(styles, /\.faq-preview|\.faq-list|\.support__content/);
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
