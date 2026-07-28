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

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
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
