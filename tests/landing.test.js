import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const screenshots = [
  "home-overview.jpg",
  "health-passport.jpg",
  "documents.jpg",
  "wellbeing-and-questionnaires.jpg",
  "wellbeing-today.jpg",
  "health-metrics.jpg",
  "devices-and-hrv.jpg",
  "health-status.jpg",
  "biological-age.jpg",
];

const landing = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const capabilityRoutes = [
  {
    id: "manual",
    badge: "ВВОД",
    title: "Добавить данные",
    scenario: "Вести вручную",
    description: "Самочувствие, привычки, питание и показатели.",
    detail: "Фиксируйте то, что обычно теряется между заметками и памятью.",
    capabilities: ["Самочувствие", "Привычки", "Питание", "Анкеты", "Показатели"],
    screenshots: ["wellbeing-and-questionnaires.jpg", "wellbeing-today.jpg"],
  },
  {
    id: "sync",
    badge: "СВЯЗЬ",
    title: "Подключить устройства",
    scenario: "Подключить из платформ и устройств",
    description: "Health-платформы, устройства, шаги, сон и пульс.",
    detail: "Соберите базовую картину из привычных health-сервисов и устройств.",
    capabilities: [
      "Активность",
      "Сон",
      "Пульс",
      "ВСР",
      "Кардиокарта",
      "NEYROX PRO",
      "Health Connect",
      "Google Fit",
      "Samsung Health",
      "Apple Health",
    ],
    screenshots: ["health-metrics.jpg", "devices-and-hrv.jpg"],
  },
  {
    id: "archive",
    badge: "АРХИВ",
    title: "История здоровья",
    scenario: "Хранить историю",
    description: "Паспорт, документы и результаты исследований.",
    detail: "Держите важные медицинские материалы рядом с контекстом самочувствия.",
    capabilities: [
      "Паспорт здоровья",
      "Приёмы",
      "Лабораторные исследования",
      "Генетические исследования",
      "Исследования",
      "Запросы",
      "Добавление через QR",
    ],
    screenshots: ["documents.jpg", "health-passport.jpg"],
  },
  {
    id: "care",
    badge: "ЗАБОТА",
    title: "Сводка здоровья",
    scenario: "Ориентироваться и готовиться к разговору со специалистом",
    description: "Статусы, расчётные оценки и вопросы для специалиста.",
    detail: "Собирайте вопросы и подсказки как информационную поддержку, не диагноз.",
    capabilities: [
      "Статус здоровья",
      "Биологический возраст",
      "Чат-бот «Практический»",
      "Информационные материалы",
      "Экспериментальная аналитика",
    ],
    screenshots: ["health-status.jpg", "biological-age.jpg"],
  },
];
const firstRouteSteps = [
  "Отметьте самочувствие за сегодня или откройте FAQ, если нужен короткий ответ.",
  "Заполните базовые данные паспорта: рост, вес, самочувствие.",
  "Подключите Health Connect / Google Fit / Samsung Health / Apple Health или устройство, если пользуетесь ими.",
  "Добавьте первые документы: лабораторные или генетические — вручную или через QR.",
  "Отмечайте привычки и смотрите прогресс за день, неделю или 90 дней.",
  "Откройте документацию, когда нужен подробный разбор раздела.",
];
const faqPreview = [
  {
    question: "С чего начать, если я впервые открыл приложение?",
    answer:
      "Начните с одного понятного действия: отметьте самочувствие сегодня, откройте паспорт здоровья или добавьте документ. На лендинге выберите задачу, затем перейдите в раздел приложения: Главная, Я+Здоровье, Документы или Настройки.",
  },
  {
    question: "Какие данные можно вести вручную?",
    answerParts: [
      "Самочувствие сегодня: силы после пробуждения, радость жизни, головная боль, тревога и напряжённость, перепады настроения",
      "Привычки (день / неделя / 90 дней)",
      "Дневник питания: ккал, белки, жиры, углеводы",
      "Анкеты: общие показатели, онко, питание, диабет, кардио",
      "Ввод показателей здоровья",
      "Документы: лабораторные (базовые и расширенные), генетические исследования",
    ],
  },
  {
    question:
      "Как подключить Google Fit, Samsung Health, Apple Health или Health Connect?",
    answer:
      "В Настройки → Мои устройства доступен Health Connect. Подключения Google Fit, Samsung Health и Apple Health описаны в продуктовых материалах — точные шаги будут в документации. Если пользуетесь трекером или кардиоустройством, там же смотрите Кардиокарта и NEYROX PRO.",
  },
  {
    question: "Можно ли использовать приложение вместо врача?",
    answer:
      "Нет. «Здоровье» помогает вести данные, смотреть динамику и готовить вопросы. Оно не ставит диагноз, не назначает лечение и не заменяет консультацию специалиста.",
  },
  {
    question: "Что означает «статус здоровья» и риски?",
    answer:
      "На экране Статус здоровья показаны ориентиры по направлениям: кардио, онко, диабет, метаболизм (например, «в норме», «требует внимания», «в зоне риска»). Это информационная оценка по вашим данным, не диагноз и не подтверждение заболевания. Подробности и рекомендации внутри раздела — как подсказки для внимания к здоровью.",
  },
  {
    question: "Где хранятся документы и анализы?",
    answer:
      "Вкладка Документы: приёмы, лабораторные исследования, генетические исследования, исследования, запросы. Добавить документ можно через «+» или сканирование QR-кода.",
  },
];

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function plainText(value) {
  return normalize(value.replace(/<[^>]+>/g, " ")).replace(/\s+([,.;:!?])/g, "$1");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("landing screenshot paths are available to the public site", () => {
  for (const screenshot of screenshots) {
    assert.equal(
      existsSync(new URL(`../public/screenshots/${screenshot}`, import.meta.url)),
      true,
      `public/screenshots/${screenshot} must exist`,
    );
  }
});

test("hero presents the approved app entry point and evidence atlas", () => {
  const hero = landing.replace(/\s+/g, " ");

  assert.match(
    hero,
    /<title>Здоровье — самочувствие, показатели и документы<\/title>/,
  );
  assert.match(
    hero,
    /content="Отмечайте день, смотрите шаги, сон и пульс, храните анализы и находите нужный раздел\. FAQ и документация — если нужен короткий ответ\."/,
  );
  assert.match(hero, />Приложение «Здоровье»</);
  assert.match(
    hero,
    /<h1 id="hero-title">Самочувствие, показатели и документы — в одном месте<\/h1>/,
  );
  assert.match(
    hero,
    /Отмечайте день, смотрите шаги, сон и пульс, храните анализы и открывайте нужный раздел без блуждания по всему приложению\./,
  );

  for (const [label, target] of [
    ["Сценарии", "#capabilities"],
    ["С чего начать", "#first-route"],
    ["Интеграции", "#integrations"],
    ["FAQ", "#faq"],
  ]) {
    assert.match(hero, new RegExp(`<a href="${target}">${label}</a>`));
  }

  assert.match(
    hero,
    /<button class="button button--primary" type="button" disabled aria-describedby="link-status"\s*>\s*Читать FAQ\s*<\/button>/,
  );
  assert.match(
    hero,
    /<button class="button button--secondary" type="button" disabled aria-describedby="link-status"\s*>\s*Читать документацию\s*<\/button>/,
  );
  assert.match(
    hero,
    /<p class="link-status" id="link-status">\s*Ссылки станут доступны после публикации отдельных FAQ и документации\.\s*<\/p>/,
  );
  assert.match(
    hero,
    /href="#capabilities" data-focus-target="capabilities-title"/,
  );
  assert.match(hero, /id="capabilities-title" tabindex="-1"/);

  for (const screenshot of [
    "home-overview.jpg",
    "health-passport.jpg",
    "documents.jpg",
  ]) {
    assert.match(
      hero,
      new RegExp(`src="\\./public/screenshots/${screenshot}"[\\s\\S]*?width="576"[\\s\\S]*?height="1280"`),
    );
  }

  assert.match(
    hero,
    /alt="Главный экран приложения: самочувствие, статус и привычки"[\s\S]*?fetchpriority="high"/,
  );
});

test("capability cards expose four canonical semantic route controls", () => {
  const routeButtons = [
    ...landing.matchAll(/<button\b[^>]*\bdata-route="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g),
  ];

  assert.deepEqual(
    routeButtons.map((match) => match[1]),
    ["manual", "sync", "archive", "care"],
  );

  for (const [index, route] of capabilityRoutes.entries()) {
    const [button, routeId, body] = routeButtons[index];

    assert.equal(routeId, route.id);
    assert.match(button, /type="button"/);
    assert.match(button, /aria-pressed="(?:true|false)"/);
    assert.match(body, /data-selected-label/);
    assert.match(normalize(body), new RegExp(escapeRegex(route.badge)));
    assert.match(normalize(body), new RegExp(escapeRegex(route.title)));
    assert.match(normalize(body), new RegExp(escapeRegex(route.description)));
    assert.doesNotMatch(body, /<(?:a|button)\b/);
  }

  assert.match(normalize(routeButtons[0][2]), /data-selected-label[^>]*>Выбрано</);
  for (const [, , body] of routeButtons.slice(1)) {
    assert.match(body, /data-selected-label[^>]*>\s*</);
  }
});

test("capability panels keep every canonical route and its evidence in source", () => {
  const numericCaption =
    "Числа на экранах — пример заполнения, не метрики продукта.";

  for (const route of capabilityRoutes) {
    const match = landing.match(
      new RegExp(
        `<article\\b(?=[^>]*data-route-panel="${route.id}")[^>]*>[\\s\\S]*?<\\/article>`,
      ),
    );

    assert.ok(match, `data-route-panel="${route.id}" must exist`);
    const panel = match[0];
    const openingTag = panel.slice(0, panel.indexOf(">") + 1);
    assert.doesNotMatch(openingTag, /\bhidden\b/);

    for (const text of [
      route.badge,
      route.scenario,
      route.detail,
      route.description,
      ...route.capabilities,
      numericCaption,
    ]) {
      assert.match(normalize(panel), new RegExp(escapeRegex(text)));
    }

    assert.match(
      panel,
      new RegExp(
        `src="\\./public/screenshots/${route.screenshots[0]}"[\\s\\S]*?width="576"[\\s\\S]*?height="1280"[\\s\\S]*?src="\\./public/screenshots/${route.screenshots[1]}"[\\s\\S]*?width="576"[\\s\\S]*?height="1280"`,
      ),
    );

    const altTexts = [...panel.matchAll(/<img\b[^>]*\balt="([^"]+)"[^>]*>/g)].map(
      (image) => image[1],
    );
    assert.equal(altTexts.length, 2);
    assert.notEqual(altTexts[0], altTexts[1]);
    assert.ok(altTexts.every(Boolean));
  }

  assert.doesNotMatch(landing, /Больничный лист|Результаты анализов/);
});

test("capability explorer has one local atomic live result and safety note", () => {
  assert.equal((landing.match(/\baria-live="polite"/g) ?? []).length, 1);
  assert.equal((landing.match(/\baria-atomic="true"/g) ?? []).length, 1);
  assert.match(
    landing,
    /<div class="route-results" data-route-results aria-live="polite" aria-atomic="true">/,
  );
  assert.match(
    normalize(landing),
    /Оценки и подсказки в приложении не являются диагнозом и не означают наличие заболевания\. При вопросах о здоровье обсуждайте показатели со специалистом\./,
  );
});

test("capability section uses the approved introduction and bounded pastels", () => {
  const normalizedLanding = normalize(landing);

  for (const text of [
    "КАРТА ВОЗМОЖНОСТЕЙ",
    "Выберите знакомую задачу",
    "Самочувствие, данные с устройств, документы и ориентиры по статусу — четыре входа в одно приложение.",
    "Главная, Я+Здоровье, Документы и Настройки закрывают разные задачи. На этой странице — короткие сценарии и ответы на частые вопросы, чтобы быстрее найти нужное.",
  ]) {
    assert.match(normalizedLanding, new RegExp(escapeRegex(text)));
  }

  assert.match(styles, /--capability-mint:\s*#edf7f1;/);
  assert.match(styles, /--capability-blue:\s*#edf5fb;/);
  assert.match(styles, /--capability-rose:\s*#f8eef1;/);
});

test("first route is a six-step ordered guide with one FAQ preview link", () => {
  const section = landing.match(
    /<section\b[^>]*\bid="first-route"[^>]*>([\s\S]*?)<\/section>/,
  );

  assert.ok(section, "#first-route must exist");
  const content = section[1];
  assert.match(content, /<ol\b[^>]*class="first-route__grid"[^>]*>/);
  assert.equal(
    (content.match(/<li\b[^>]*class="first-route__step"[^>]*>/g) ?? []).length,
    6,
  );
  assert.equal(
    (content.match(/class="first-route__num" aria-hidden="true"/g) ?? []).length,
    6,
  );

  let previousIndex = -1;
  for (const step of firstRouteSteps) {
    const index = normalize(content).indexOf(step);
    assert.ok(index > previousIndex, `step must appear in order: ${step}`);
    previousIndex = index;
  }

  assert.match(content, /<a\b[^>]*href="#faq"[^>]*>/);
  assert.match(plainText(content), /Посмотреть частые вопросы на этой странице →/);
});

test("supporting sections use confirmed integrations, safety copy, and FAQ preview", () => {
  const integrations = landing.match(
    /<section\b[^>]*\bid="integrations"[^>]*>([\s\S]*?)<\/section>/,
  );
  const safety = landing.match(
    /<section\b[^>]*\bid="safety"[^>]*>([\s\S]*?)<\/section>/,
  );
  const faq = landing.match(
    /<section\b[^>]*\bid="faq"[^>]*>([\s\S]*?)<\/section>/,
  );

  assert.ok(integrations);
  assert.ok(safety);
  assert.ok(faq);

  for (const name of [
    "Google Fit",
    "Samsung Health",
    "Apple Health",
    "Health Connect",
    "Кардиокарта",
    "NEYROX PRO",
  ]) {
    assert.match(normalize(integrations[1]), new RegExp(escapeRegex(name)));
  }

  assert.match(
    normalize(safety[1]),
    /Информационная поддержка, не медицинское решение/,
  );
  assert.match(
    normalize(safety[1]),
    /«Здоровье» помогает вести данные, ориентироваться в показателях и готовить вопросы для специалиста\. Приложение не ставит диагноз, не назначает лечение и не заменяет консультацию врача\./,
  );

  const details = [
    ...faq[1].matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g),
  ];
  assert.equal(details.length, 6);
  assert.match(normalize(faq[1]), /Превью FAQ/);

  for (const [index, item] of faqPreview.entries()) {
    const detail = plainText(details[index][1]);
    assert.match(detail, new RegExp(escapeRegex(item.question)));

    for (const answer of item.answerParts ?? [item.answer]) {
      assert.match(detail, new RegExp(escapeRegex(answer)));
    }
  }
});

test("future help remains disabled and every internal fragment resolves", () => {
  const support = landing.match(
    /<section\b[^>]*\bid="support"[^>]*>([\s\S]*?)<\/section>/,
  );

  assert.ok(support, "#support must exist");
  assert.match(
    support[1],
    /<button\b[^>]*disabled[^>]*>\s*Читать FAQ\s*<\/button>/,
  );
  assert.match(
    support[1],
    /<button\b[^>]*disabled[^>]*>\s*Читать документацию\s*<\/button>/,
  );
  assert.match(
    normalize(support[1]),
    /Отдельные FAQ и документация ещё не опубликованы\. Ссылки появятся здесь после публикации\./,
  );

  const ids = new Set(
    [...landing.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of landing.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `fragment #${match[1]} must resolve`);
  }
});

test("landing removes duplicate card sections, fake docs, and internal meta-language", () => {
  const userFacing = landing.replace(/<!--[\s\S]*?-->/g, "");

  assert.doesNotMatch(landing, /\bid="docs"/);
  assert.doesNotMatch(landing, /class="[^"]*(?:pain-card|proof|gallery)[^"]*"/);
  assert.doesNotMatch(
    userFacing,
    /Production\/beta|production\/beta|Пространственный атлас|Пространственный|Атлас/,
  );
  assert.match(
    normalize(userFacing),
    /«Здоровье» помогает вести данные, ориентироваться в показателях и готовить вопросы для специалиста\. Приложение не ставит диагноз, не назначает лечение и не заменяет консультацию врача\./,
  );
});

test("fallback controls and focus handoff stay honest without delayed focus", () => {
  assert.match(
    styles,
    /\.capability-grid\s*\{[^}]*display:\s*none;/,
  );
  assert.match(
    styles,
    /\[data-capability-explorer\]\[data-enhanced\]\s+\.capability-grid\s*\{[^}]*display:\s*grid;/,
  );
  assert.equal(
    (
      landing.match(
        /data-focus-target="capabilities-title"/g,
      ) ?? []
    ).length,
    2,
  );
  assert.doesNotMatch(app, /setTimeout/);
  assert.match(
    styles,
    /\.site-footer\s*>\s*a:last-child\s*\{[^}]*min-height:\s*44px;/,
  );
});
