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
