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

const taskHeadings = [
  "Понять, как меняется самочувствие",
  "Собрать свой паспорт здоровья",
  "Пройти анкеты",
  "Посмотреть статус здоровья",
  "Хранить анализы и документы",
  "Следить за питанием и весом",
  "Наблюдать за привычками",
  "Узнать биологический возраст",
  "Следить за ежедневными показателями",
  "Выполнять задания и получать награды",
  "Задать вопрос чат-боту",
];

const taskLocations = [
  "Самочувствие",
  "Паспорт здоровья",
  "Анкеты",
  "Статус здоровья",
  "Документы",
  "Питание и вес",
  "Привычки",
  "Биологический возраст",
  "Ежедневные показатели",
  "Задания и награды",
  "Практический чат-бот",
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

test("hero follows the approved landing content", () => {
  const hero = section("top");

  assert.ok(hero);
  assert.match(hero, /Приложение «Здоровье»/);
  assert.match(hero, /Всё о вашем здоровье — в одном месте/);
  assert.match(
    hero,
    /Отмечайте самочувствие, смотрите данные о шагах, сне и пульсе,/,
  );
  assert.match(hero, /href="#tasks"[^>]*>\s*С чего начать/);
  assert.match(hero, /href="#faq"[^>]*>Частые вопросы/);
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

test("header keeps one navigation system without a duplicate task action", () => {
  const header = landing.match(
    /<header\b[^>]*class="site-header"[^>]*>([\s\S]*?)<\/header>/,
  )?.[1];

  assert.ok(header);
  assert.match(header, /href="#faq"[^>]*>Частые вопросы/);
  assert.match(header, /href="#documentation"[^>]*>Документация/);
  assert.doesNotMatch(header, /class="header-route"/);
  assert.doesNotMatch(header, />\s*Выбрать задачу\s*</);
  assert.doesNotMatch(styles, /\.header-route/);
});

test("section kickers use one shared visual format", () => {
  assert.equal((landing.match(/class="section-kicker"/g) ?? []).length, 6);
  assert.doesNotMatch(landing, /class="(?:hero__kicker|section-heading__label)"/);
  assert.match(
    styles,
    /\.section-kicker\s*\{[\s\S]*?color: var\(--tiffany-deep\);[\s\S]*?font-family: var\(--body\);[\s\S]*?font-size: 0\.78rem;[\s\S]*?font-weight: 800;[\s\S]*?line-height: 1\.6;[\s\S]*?letter-spacing: 0\.14em;[\s\S]*?text-transform: uppercase;/,
  );
  assert.match(
    styles,
    /\.task-directory \.section-heading > p:not\(\.section-kicker\)/,
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
    /@media \(max-width: 600px\)[\s\S]*?\.task-item h3\s*\{[^}]*font-size: clamp\(1\.55rem, 7vw, 1\.9rem\);/,
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
    /\.task-directory\s*\{[^}]*padding: clamp\(88px, 7\.8vw, 112px\) var\(--page-pad\);/,
  );
  assert.match(
    styles,
    /\.task-proof\s*\{[^}]*height: 660px;/,
  );
  assert.match(
    styles,
    /\.task-item\s*\{[^}]*padding: clamp\(30px, 3vw, 40px\) 0;/,
  );
  assert.match(
    styles,
    /\.first-route__step\s*\{[^}]*min-height: 220px;/,
  );
  assert.match(
    styles,
    /\.integration-list li\s*\{[^}]*min-height: 80px;/,
  );
});

test("hero uses the generated one-day archive while tasks keep screenshot evidence", () => {
  const hero = section("top");
  const tasks = section("tasks");

  assert.ok(hero);
  assert.ok(tasks);
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
  assert.match(tasks, /class="task-proof"/);
  assert.match(tasks, /<img\b/);
});

test("first route contains the four approved steps", () => {
  const route = section("first-route");

  assert.ok(route);
  assert.ok(
    landing.indexOf('id="tasks"') < landing.indexOf('id="first-route"'),
    "tasks must come before the first route",
  );
  assert.ok(
    landing.indexOf('id="first-route"') < landing.indexOf('id="integrations"'),
    "first route must come before integrations",
  );
  assert.match(route, /Начните с простого пути/);
  assert.equal((route.match(/class="first-route__step"/g) ?? []).length, 4);
  assert.equal((route.match(/class="first-route__num"/g) ?? []).length, 4);
  assert.doesNotMatch(route, /class="route-link"/);
  for (const heading of [
    "Выберите задачу",
    "Добавьте то, что уже есть",
    "Посмотрите общую картину",
    "Продолжайте в удобном темпе",
  ]) {
    assert.ok(route.includes(heading), heading);
  }
  assert.match(
    styles,
    /\.first-route\s*\{[\s\S]*?background: linear-gradient\(180deg, var\(--tiffany-fog\) 0%, var\(--white\) 100%\);/,
  );
  assert.match(
    styles,
    /@media \(min-width: 1081px\)[\s\S]*?\.first-route__grid\s*\{[^}]*grid-template-columns: repeat\(4,/,
  );
});

test("task directory contains all eleven tasks and app locations", () => {
  const tasks = section("tasks");

  assert.ok(tasks);
  assert.match(
    tasks,
    /Выберите задачу — покажем соответствующие экраны\s+приложения\./,
  );
  assert.equal(
    (tasks.match(/class="task-item(?:\s[^"]*)?"/g) ?? []).length,
    11,
  );
  assert.equal((tasks.match(/class="task-item__location"/g) ?? []).length, 11);
  assert.equal((tasks.match(/class="task-item__state"/g) ?? []).length, 11);
  assert.equal((tasks.match(/data-task-select=/g) ?? []).length, 11);
  assert.equal((tasks.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.equal((tasks.match(/aria-pressed="false"/g) ?? []).length, 10);

  for (const value of [...taskHeadings, ...taskLocations]) {
    assert.ok(tasks.includes(value), value);
  }

  assert.doesNotMatch(tasks, /class="task-item__location"[^>]*>\s*(?:Открыть|Выбрать|Добавить|Посмотреть|Рассчитать)/);
  assert.match(tasks, /Это информационная оценка, а не диагноз\./);
  assert.doesNotMatch(styles, /content: "(?:Смотреть|Показано)"/);
  assert.match(
    styles,
    /\.task-item\.is-selected \.task-item__state::before\s*\{[^}]*border-width: 0 0 2px 2px/,
  );
  for (const screenshot of [
    "practical-chatbot.jpg",
    "questionnaires.jpg",
    "nutrition.jpg",
    "habits.jpg",
    "rewards.jpg",
    "daily-tasks.jpg",
    "document-add.jpg",
  ]) {
    assert.ok(
      existsSync(
        new URL(`../public/screenshots/${screenshot}`, import.meta.url),
      ),
      screenshot,
    );
    assert.ok(app.includes(`./public/screenshots/${screenshot}`), screenshot);
  }

  assert.match(app, /function selectTask\(taskId\)/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /item\.addEventListener\("click", \(event\) =>/);
  assert.match(styles, /\.task-item\s*\{[^}]*cursor: pointer;/);
  assert.match(styles, /\.task-item\.is-selected/);
  assert.match(styles, /\.task-mobile-proof/);
});

test("task screen changes keep the proof visually stable", () => {
  assert.doesNotMatch(app, /screen\.animate\(/);
  assert.match(app, /task\.screens\.length === 1[\s\S]*?\[null, task\.screens\[0\], null\]/);
  assert.doesNotMatch(
    styles,
    /\.task-proof\[data-screen-count="(?:1|2)"\]\s+\.task-proof__screen/,
  );
  assert.doesNotMatch(
    styles,
    /\.task-item\.is-selected\s*\{[^}]*background/,
  );
});

test("task screenshots come forward on precise-pointer hover", () => {
  assert.match(
    landing,
    /class="task-proof__hint"[^>]*aria-hidden="true"[\s\S]*?Наведите, чтобы увеличить/,
  );
  assert.match(
    styles,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.task-proof__screen\s*\{[\s\S]*?cursor: zoom-in;[\s\S]*?\.task-proof__screen:hover\s*\{[\s\S]*?z-index: 10;[\s\S]*?transform: rotate\(0deg\) scale\(1\.12\);/,
  );
  assert.match(
    styles,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.task-proof figcaption \.task-proof__hint\s*\{[\s\S]*?display: inline-flex;/,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.task-proof__screen:hover\s*\{[\s\S]*?transform: rotate\(var\(--screen-rotation\)\);/,
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

  assert.match(styles, /\.task-directory__layout/);
  assert.match(styles, /@media \(max-width: 600px\)/);
});
