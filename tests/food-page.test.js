import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const foodPageUrl = new URL("../food/index.html", import.meta.url);
const foodStylesUrl = new URL("../food/styles.css", import.meta.url);
const heroAssetUrl = new URL(
  "../food/public/food-hero.png",
  import.meta.url,
);
const buildScriptUrl = new URL("../scripts/build.mjs", import.meta.url);
const pagesBuildUrl = new URL("../scripts/build-pages.mjs", import.meta.url);

test("food landing is an isolated public nutrition page", () => {
  assert.ok(existsSync(foodPageUrl), "food/index.html should exist");
  assert.ok(existsSync(foodStylesUrl), "food/styles.css should exist");
  assert.ok(existsSync(heroAssetUrl), "food hero asset should exist");

  const page = readFileSync(foodPageUrl, "utf8");
  const styles = readFileSync(foodStylesUrl, "utf8");

  assert.match(page, /<title>Питание — Предикс\.Здоровье<\/title>/);
  assert.match(page, /<header class="site-header"/);
  assert.match(page, /<footer class="site-footer"/);
  assert.match(page, /<h1[^>]*>Задайте рациону свой ритм<\/h1>/);
  assert.match(page, /Ведите дневник, ставьте цели и получайте персональный план питания/);
  assert.match(page, /<section class="food-steps"[^>]*>/);
  assert.match(page, /<h2[^>]*>Записи за пару секунд<\/h2>/);
  assert.match(page, /Одно фото/);
  assert.match(page, /Распознавание/);
  assert.match(page, /Дневник/);
  assert.match(page, /<h2[^>]*>Персональная цель с учётом привычек<\/h2>/);
  assert.match(page, /Параметры/);
  assert.match(page, /Активность/);
  assert.match(page, /Ваша цель/);
  assert.match(page, /<h2[^>]*>Узнать себя лучше<\/h2>/);
  assert.match(page, /Пройдите научный тест на 10 вопросов/);
  assert.match(page, /<h2[^>]*>Добавьте первую запись<\/h2>/);
  assert.match(page, /go\/external\/ios/);
  assert.match(page, /go\/external\/android/);
  assert.doesNotMatch(page, /<a[^>]+(?:food-qr|food-download__qr)/);

  assert.match(styles, /@media \(max-width:\s*760px\)/);
  assert.match(styles, /\.food-steps__grid/);
  assert.match(styles, /\.food-goal/);
  assert.match(styles, /\.food-recommendations/);
});

test("ordinary and Pages builds publish the nutrition page at /food/", () => {
  const buildScript = readFileSync(buildScriptUrl, "utf8");
  const pagesBuild = readFileSync(pagesBuildUrl, "utf8");

  assert.match(buildScript, /\.\.\/food\//);
  assert.match(pagesBuild, /food\//);
});
