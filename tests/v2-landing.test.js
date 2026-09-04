import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import { withBuildLock, stableSha256 } from "./helpers/build-lock.mjs";

const root = new URL("../", import.meta.url);
const v2IndexUrl = new URL("v2/index.html", root);
const v2StylesUrl = new URL("v2/styles.css", root);
const v2AppUrl = new URL("v2/app.js", root);

function readSource(fileUrl) {
  return readFileSync(fileUrl, "utf8");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function sectionOf(html, id) {
  return html.match(
    new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`),
  )?.[1];
}

const v2IconFiles = [
  "advantage-anonymous.png",
  "advantage-control.png",
  "advantage-minimum.png",
  "privacy-data.png",
  "privacy-user.png",
  "privacy-anon.png",
  "privacy-geo.png",
];

function inspectImages(paths) {
  const absolutePaths = paths.map((path) => fileURLToPath(new URL(path, root)));
  const script = `
import json
from PIL import Image

paths = ${JSON.stringify(absolutePaths)}
report = []
for path in paths:
    with Image.open(path) as image:
        report.append({
            "path": path.rsplit("/", 1)[-1],
            "format": image.format,
            "size": list(image.size),
            "mode": image.mode,
            "has_alpha": image.mode in ("RGBA", "LA") or "transparency" in image.info,
        })
print(json.dumps(report))
`;
  const result = spawnSync(
    "uv",
    ["run", "--with", "pillow", "python", "-c", script],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return Object.fromEntries(
    JSON.parse(result.stdout).map((entry) => [entry.path, entry]),
  );
}

test("v2 asset subtree stays isolated from the v1 public tree", () => {
  const buildScript = readSource(new URL("scripts/build-v2.mjs", root));

  assert.ok(existsSync(new URL("v2/public/v2/", root)));
  assert.doesNotMatch(buildScript, /^\s*"v2\/",$/m);
  assert.match(buildScript, /new URL\("public\/", sourceDirectory\)/);
});

test("v2 asset subtree ships the character and branded line icons without SVG", () => {
  const characterUrl = new URL("v2/public/v2/character/robot.webp", root);
  const characterPortalUrl = new URL("v2/public/v2/character/robot-portal.jpg", root);

  assert.ok(existsSync(characterUrl), "public/v2/character/robot.webp should exist");
  assert.ok(
    existsSync(characterPortalUrl),
    "public/v2/character/robot-portal.jpg should exist",
  );

  const inspected = inspectImages([
    "v2/public/v2/character/robot.webp",
    "v2/public/v2/character/robot-portal.jpg",
    ...v2IconFiles.map((name) => `v2/public/v2/icons/${name}`),
  ]);

  assert.deepEqual(inspected["robot.webp"], {
    path: "robot.webp",
    format: "WEBP",
    size: [1024, 1536],
    mode: "RGBA",
    has_alpha: true,
  });
  assert.ok(
    statSync(characterUrl).size < 400_000,
    "ordinary character WebP should be optimized",
  );

  assert.equal(inspected["robot-portal.jpg"].format, "JPEG");
  assert.equal(inspected["robot-portal.jpg"].has_alpha, false);
  assert.ok(
    statSync(characterPortalUrl).size < 140_000,
    "portal character JPEG must respect the 1 MB portal budget",
  );

  for (const name of v2IconFiles) {
    assert.deepEqual(inspected[name], {
      path: name,
      format: "PNG",
      size: [96, 96],
      mode: "RGBA",
      has_alpha: true,
    });
  }

  const svgFiles = readdirSync(new URL("v2/public/v2/", root), { recursive: true })
    .filter((entry) => String(entry).toLowerCase().endsWith(".svg"));

  assert.deepEqual(svgFiles, [], "v2/public/v2/ must not contain SVG assets");
  assert.ok(
    existsSync(new URL("public/illustrations/one-day-archive-labeled-transparent.webp", root)),
    "v1 hero illustration must remain untouched",
  );
});

test("v2 sources exist and declare install-specific metadata with noindex", () => {
  for (const fileUrl of [v2IndexUrl, v2StylesUrl, v2AppUrl]) {
    assert.ok(existsSync(fileUrl), `${fileUrl.pathname} should exist`);
  }

  const landing = readSource(v2IndexUrl);

  assert.match(
    landing,
    /<meta name="robots" content="noindex, nofollow" \/>/,
  );
  assert.match(landing, /<html lang="ru">/);
  assert.match(landing, /<title>Скачать Предикс\.Здоровье[^<]*<\/title>/);
  assert.doesNotMatch(landing, /<title>Здоровье — всё важное в одном месте<\/title>/);
  assert.match(landing, /name="description" content="[^"]*портрет здоровья[^"]*"/);
  assert.match(landing, /<link rel="stylesheet" href="\.\/styles\.css" \/>/);
  assert.match(landing, /<script defer src="\.\/app\.js"><\/script>/);
  assert.match(landing, /<link rel="icon" href="\.\/public\/logo-mark\.png" \/>/);
  assert.match(landing, /rel="preload"[\s\S]*?manrope-cyrillic-variable\.woff2/);
  assert.match(landing, /<a class="skip-link" href="#main">К содержанию<\/a>/);
  assert.match(landing, /ym\(112104449, 'init', \{ssr:true, webvisor:true/);
});

test("v2 page order follows the approved install narrative without integrations", () => {
  const landing = readSource(v2IndexUrl);

  const order = [
    '<header class="site-header"',
    'id="top"',
    'id="first-route"',
    'id="simplicity"',
    'id="outcome"',
    'id="privacy"',
    'id="download"',
    '<footer class="site-footer">',
  ];

  let previous = -1;
  for (const marker of order) {
    const index = landing.indexOf(marker);
    assert.ok(index > previous, `${marker} must appear in order`);
    previous = index;
  }

  assert.ok(
    landing.indexOf('<main class="health-site-main" id="main">') <
      landing.indexOf('id="top"'),
    "hero must live inside main",
  );
  assert.doesNotMatch(landing, /id="integrations"|href="#integrations"/);
  assert.doesNotMatch(landing, /integration-list|public\/integrations\//);
  assert.doesNotMatch(landing, /one-day-archive|day-archive/);
  assert.doesNotMatch(landing, /id="tasks"|class="task-directory"/);

  const ids = new Set(
    [...landing.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of landing.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `fragment #${match[1]} must resolve`);
  }
});

test("v2 header navigation replaces integrations with the outcome anchor", () => {
  const landing = readSource(v2IndexUrl);
  const header = landing.match(
    /<header\b[^>]*class="site-header"[^>]*>([\s\S]*?)<\/header>/,
  )?.[1];

  assert.ok(header);
  assert.match(header, /<div class="brand" aria-label="Здоровье">/);
  assert.match(header, /href="#first-route"[^>]*>С чего начать<\/a>/);
  assert.match(header, /href="#simplicity"[^>]*>Простота<\/a>/);
  assert.match(header, /href="#outcome"[^>]*>Что в итоге\?<\/a>/);
  assert.match(header, /href="#privacy"[^>]*>Анонимность<\/a>/);
  assert.ok(
    header.indexOf('href="#first-route"') <
      header.indexOf('href="#simplicity"'),
  );
  assert.ok(
    header.indexOf('href="#simplicity"') <
      header.indexOf('href="#outcome"'),
  );
  assert.ok(header.indexOf('href="#outcome"') < header.indexOf('href="#privacy"'));
  assert.match(
    header,
    /class="site-nav__chat"[^>]*href="http:\/\/chat"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*aria-label="Открыть чат"/,
  );
  assert.match(
    header,
    /class="site-nav__cta"[^>]*href="#download"[^>]*>Скачать<\/a>/,
  );
  assert.ok(
    header.indexOf('class="site-nav__chat"') < header.indexOf('class="site-nav__cta"'),
  );
});

test("hero uses the approved install copy with a focusable offset QR composition", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const hero = sectionOf(landing, "top");

  assert.ok(hero);
  assert.match(
    hero,
    /<h1 id="hero-title">\s*Начните с понятного первого шага\s*<\/h1>/,
  );
  assert.match(
    hero,
    /Предикс\.Здоровье собирает данные о питании, активности, анализах и привычках в единый портрет здоровья и помогает понять, что делать дальше/,
  );
  assert.equal((hero.match(/class="button\b/g) ?? []).length, 1);
  assert.match(
    hero,
    /href="#download-qr"[^>]*data-focus-target="download-qr"[^>]*>\s*Скачать Предикс\.Здоровье\s*</,
  );
  assert.match(
    hero,
    /<[^>]*\bid="download-qr"[^>]*tabindex="-1"/,
  );
  assert.match(hero, /Сканируйте QR-код/);
  assert.match(
    hero,
    /<img\s+class="hero__qr-arrow"\s+src="\.\/public\/v2\/decorations\/qr-pair-arrow\.png"\s+width="88"\s+height="64"\s+alt=""\s+aria-hidden="true"\s*\/>/,
    "the hero uses the tightly cropped curved decorative arrow",
  );
  assert.match(
    styles,
    /\.hero__qr-intro\s*{[^}]*position:\s*relative;[^}]*width:\s*min\(100%,\s*430px\);[^}]*justify-content:\s*flex-end;/s,
    "the instruction is aligned over the QR pair",
  );
  assert.match(
    styles,
    /\.hero__qr-arrow\s*{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*top:\s*calc\(100% \+ 2px\);[^}]*width:\s*88px;[^}]*height:\s*64px;[^}]*transform:\s*translateX\(-8px\);/s,
    "the cropped arrow starts below the instruction and targets the clear upper gap",
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.hero__qr-arrow\s*{[^}]*top:\s*calc\(100% - 3px\);/,
    "the short arrow stays clear of both QR cards on tablet and mobile",
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.hero__qr-cards\s*{[^}]*gap:\s*34px;/,
    "narrow screens leave enough clear space around the centered arrowhead",
  );
  assert.match(
    hero,
    /href="\.\/go\/ios\/"[^>]*>[\s\S]*?src="\.\/public\/v2\/download\/ios-qr\.png"[^>]*?width="160"[^>]*?height="160"/,
  );
  assert.match(
    hero,
    /href="\.\/go\/android\/"[^>]*>[\s\S]*?src="\.\/public\/v2\/download\/android-qr\.png"[^>]*?width="160"[^>]*?height="160"/,
  );
  assert.match(hero, /<strong>iPhone<\/strong>/);
  assert.match(hero, /<strong>Android<\/strong>/);
  assert.ok(
    hero.indexOf("ios-qr.png") < hero.indexOf("android-qr.png"),
    "iPhone card comes first",
  );

  const advantages = hero.match(
    /<ul class="hero__advantages">([\s\S]*?)<\/ul>/,
  )?.[1];
  assert.ok(advantages);
  assert.equal((advantages.match(/<li\b/g) ?? []).length, 3);
  for (const text of [
    "Используйте анонимно",
    "Ваши данные под вашим контролем",
    "Начните с минимума информации",
  ]) {
    assert.ok(advantages.includes(text), text);
  }
  for (const icon of [
    "advantage-anonymous.png",
    "advantage-control.png",
    "advantage-minimum.png",
  ]) {
    assert.match(
      advantages,
      new RegExp(`src="\\./public/v2/icons/${icon}"[^>]*alt=""`),
    );
  }
  assert.doesNotMatch(hero, /comment|avatar|комментар/);
});

test("simplicity becomes a native snap carousel with the four approved cards", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const simplicity = sectionOf(landing, "simplicity");

  assert.ok(simplicity);
  assert.match(simplicity, /<p class="section-kicker">Простота использования<\/p>/);
  assert.match(
    simplicity,
    /<h2 id="simplicity-title" tabindex="-1">\s*Здоровье не нужно собирать вручную\s*<\/h2>/,
  );

  const cards = simplicity.match(
    /<ol class="carousel__track">([\s\S]*?)<\/ol>/,
  )?.[1];
  assert.ok(cards, "carousel must use an ordered list track");
  assert.equal((cards.match(/class="carousel__card"/g) ?? []).length, 4);

  const chapters = [
    {
      tag: "Питание",
      title: "Фотографируйте еду",
      body: "ИИ распознает блюдо, рассчитает КБЖУ и сам создаст запись в дневнике",
      screenshots: ["food1.png", "food2.png"],
    },
    {
      tag: "Анализы",
      title: "Добавляйте анализы",
      body: "Просто загрузите фото, PDF или отсканируйте QR",
      screenshots: ["doc1.png", "doc2.png"],
    },
    {
      tag: "Трекеры",
      title: "Подключайте трекеры",
      body: "Устройства и приложения синхронизируются автоматически",
      screenshots: ["integration1.png"],
    },
    {
      tag: "Привычки",
      title: "Отмечайте привычки",
      body: "Создайте их один раз, а история и прогресс сохранятся навсегда",
      screenshots: ["habits1.png"],
    },
  ];

  let previousTitle = -1;
  for (const chapter of chapters) {
    const titleIndex = cards.indexOf(chapter.title);
    assert.ok(titleIndex > previousTitle, `${chapter.title} must keep carousel order`);
    previousTitle = titleIndex;

    const cardStart = cards.lastIndexOf('<li class="carousel__card">', titleIndex);
    const cardEnd = cards.indexOf("</li>", titleIndex);
    const card = cards.slice(cardStart, cardEnd).replace(/\s+/g, " ");
    assert.ok(card.includes(chapter.tag), chapter.tag);
    assert.ok(card.includes(chapter.body), chapter.body);
    for (const screenshot of chapter.screenshots) {
      assert.match(
        card,
        new RegExp(`src="\\./public/screenshots/${screenshot}"`),
      );
      assert.ok(
        existsSync(new URL(`public/screenshots/${screenshot}`, root)),
        screenshot,
      );
    }
  }

  assert.match(
    simplicity,
    /<div\s+class="carousel"\s+id="simplicity-carousel"\s+data-carousel\s+tabindex="0"\s+role="region"\s+aria-label="[^"]+">/,
  );
  assert.match(
    simplicity,
    /class="carousel__status"[^>]*aria-live="polite"[^>]*>[\s\S]*?data-carousel-current>01<[\s\S]*?data-carousel-total>04</,
  );
  assert.match(
    simplicity,
    /<button\s+class="carousel__button carousel__button--previous"\s+type="button"\s+data-carousel-prev\s+aria-controls="simplicity-carousel"\s+aria-label="Предыдущая карточка"\s+disabled><span class="carousel__arrow" aria-hidden="true"><\/span><\/button>/,
  );
  assert.match(
    simplicity,
    /<button\s+class="carousel__button carousel__button--next"\s+type="button"\s+data-carousel-next\s+aria-controls="simplicity-carousel"\s+aria-label="Следующая карточка"><span class="carousel__arrow" aria-hidden="true"><\/span><\/button>/,
  );
  assert.match(
    simplicity,
    /<h2[^>]*>[\s\S]*?Здоровье не нужно собирать вручную[\s\S]*?<\/h2>\s*<p class="simplicity__lead">Всё это дополняет ваш портрет<\/p>/,
  );
  assert.doesNotMatch(simplicity, /carousel__footer|carousel__closing|>←<|>→</);
  assert.doesNotMatch(simplicity, /autoplay|carousel__progress|carousel__pagination|data-carousel-dot|type="range"/);

  assert.match(
    styles,
    /\.carousel\s*\{[^}]*overflow-x: auto;[^}]*scroll-snap-type: x mandatory;[^}]*scrollbar-width: none;/,
  );
  assert.match(styles, /\.carousel::-webkit-scrollbar\s*\{[^}]*display: none;/);
  assert.match(styles, /\.carousel__button\s*\{[^}]*width: 48px;[^}]*height: 48px;[^}]*place-items: center;/s);
  assert.match(styles, /\.carousel__arrow\s*\{[^}]*width: 20px;[^}]*height: 14px;/s);
  assert.match(styles, /\.carousel__arrow::before\s*\{[^}]*top: 6px;[^}]*height: 2px;/s);
  assert.match(styles, /\.carousel__arrow::after\s*\{[^}]*transform: rotate\(45deg\);/s);
  assert.match(styles, /\.carousel__button--previous \.carousel__arrow\s*\{[^}]*transform: scaleX\(-1\);/s);
  assert.match(styles, /\.carousel__card\s*\{[^}]*width: clamp\(360px, 38vw, 510px\);[^}]*scroll-snap-align: start;/s);
  assert.match(
    styles,
    /\.carousel__visual\s*\{[^}]*height: var\(--carousel-screenshot-height\);[^}]*align-items: flex-end;/s,
  );
  assert.match(
    styles,
    /\.carousel__visual img\s*\{[^}]*width: auto;[^}]*height: var\(--carousel-screenshot-height\);[^}]*object-fit: contain;/s,
  );
  assert.doesNotMatch(styles, /\.carousel__visual--pair img:(?:first|last)-child\s*\{[^}]*transform:/s);
  assert.match(styles, /\.carousel__track\s*\{[^}]*display: flex;/);
  assert.match(
    styles,
    /\.carousel__track::after\s*\{[^}]*content:\s*"";[^}]*flex:\s*0 0 calc\(100% - var\(--page-pad\) - var\(--carousel-card-width\)\);/s,
    "the final card has enough trailing space to become the nearest active card",
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.carousel__card\s*\{[^}]*width: min\(80vw, 620px\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.carousel__card\s*\{[^}]*width: min\(86vw, 400px\);/,
  );
});

test("outcome section pairs the approved copy with the decorative character", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const outcome = sectionOf(landing, "outcome");

  assert.ok(outcome);
  assert.match(outcome, /<p class="section-kicker">Что в итоге\?<\/p>/);
  assert.match(
    outcome,
    /<h2 id="outcome-title">\s*Не просто данные, а понимание, что делать дальше\s*<\/h2>/,
  );
  assert.match(
    outcome,
    /Мы поможем вам увидеть главное и понять следующий шаг/,
  );
  assert.equal((outcome.match(/class="button\b/g) ?? []).length, 1);
  assert.match(
    outcome,
    /href="#download-qr"[^>]*data-focus-target="download-qr"[^>]*>\s*Скачать Предикс\.Здоровье\s*</,
  );
  assert.match(
    outcome,
    /src="\.\/public\/v2\/character\/robot\.webp"[^>]*alt=""/,
  );
  assert.doesNotMatch(outcome, /robot\.svg|<svg/);
  assert.match(
    styles,
    /\.outcome\s*\{[^}]*display: grid;[^}]*grid-template-columns:/,
  );
  assert.match(
    styles,
    /\.outcome__character\s*\{[^}]*align-self: end;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]*?\.outcome\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
  );
});

test("first-route, privacy and footer carry the v1 contracts into v2", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const v1Landing = readSource(new URL("index.html", root));

  assert.equal(
    normalizeWhitespace(sectionOf(landing, "first-route")),
    normalizeWhitespace(sectionOf(v1Landing, "first-route")),
    "first-route must be carried over unchanged",
  );

  const v2Footer = normalizeWhitespace(
    landing.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1],
  );
  const v1Footer = normalizeWhitespace(
    v1Landing.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1],
  );
  assert.match(
    v2Footer,
    /<a class="brand brand--footer" href="#top" aria-label="В начало"/,
    "the focusable footer logo needs an accessible name",
  );
  assert.equal(
    v2Footer.replace(' aria-label="В начало"', ""),
    v1Footer,
    "footer must be carried over unchanged apart from its accessible link name",
  );

  const privacy = sectionOf(landing, "privacy");
  assert.ok(privacy);
  assert.match(privacy, /<p class="section-kicker">Анонимность<\/p>/);
  assert.match(privacy, /<h2 id="privacy-title">Ваше здоровье — ваше дело<\/h2>/);
  assert.match(
    privacy,
    /Мы сделали всё от нас зависящее, чтобы обеспечить безопасность\s+данных и не отвлекать вас от заботы о здоровье/,
  );
  assert.equal((privacy.match(/class="privacy-principle"/g) ?? []).length, 4);
  for (const principle of [
    "Вы управляете данными",
    "Пользуйтесь анонимно",
    "Без идентификации",
    "Геолокация не нужна",
  ]) {
    assert.ok(privacy.includes(principle), principle);
  }
  for (const icon of [
    "privacy-data.png",
    "privacy-user.png",
    "privacy-anon.png",
    "privacy-geo.png",
  ]) {
    assert.match(
      privacy,
      new RegExp(`class="privacy-principle__icon"[^>]*aria-hidden="true"[^>]*>[\\s\\S]*?src="\\./public/v2/icons/${icon}"[^>]*alt=""`),
    );
  }
  assert.doesNotMatch(privacy, /<svg/);
  assert.match(
    styles,
    /\.privacy-manifesto__principles\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.privacy-manifesto__principles\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
  );
  assert.match(
    landing,
    /Приложение не ставит диагноз, не назначает лечение и не заменяет\s+консультацию врача\./,
  );
});

test("download section keeps the supporting line and v2 redirect routes aligned", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const download = sectionOf(landing, "download");

  assert.ok(download);
  assert.match(download, /<p class="section-kicker">Скачать приложение<\/p>/);
  assert.match(download, /<h2 id="download-title">Ваш первый осознанный шаг<\/h2>/);
  assert.match(
    styles,
    /\.download-section h2\s*\{[^}]*overflow-wrap: normal;/,
    "download heading must not split a Russian word between letters",
  );
  assert.match(
    download,
    /<p class="download-section__lead">Начните с того, что уже знаете о себе<\/p>/,
  );
  assert.doesNotMatch(download, /знаете о себе<\./);

  assert.equal((download.match(/class="download-option"/g) ?? []).length, 2);
  assert.match(
    download,
    /<span class="download-section__route" aria-hidden="true"><\/span>/,
  );
  assert.match(styles, /\.download-section__route\s*\{[^}]*position: absolute;/);
  assert.match(styles, /\.download-section__route::before[\s\S]*?border-top:/);
  assert.match(styles, /\.download-section__route::after[\s\S]*?box-shadow: 470px 12px 0 var\(--tiffany-dark\);/);
  assert.match(styles, /\.download-option__code\s*\{[^}]*width: 188px;[^}]*padding: 14px;/);
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]*?\.hero__qr-link,[\s\S]*?\.download-option__code\s*\{[^}]*width: min\(100%, 160px\);[^}]*padding: 0;/,
    "mobile QR cards shrink below 160px instead of overlapping",
  );
  assert.match(
    download,
    /href="\.\/go\/ios\/"[^>]*aria-label="[^"]+"\s*>\s*<img\s[^\n]*src="\.\/public\/v2\/download\/ios-qr\.png"/,
  );
  assert.match(
    download,
    /href="\.\/go\/android\/"[^>]*aria-label="[^"]+"\s*>\s*<img\s[^\n]*src="\.\/public\/v2\/download\/android-qr\.png"/,
  );
  assert.match(
    download,
    /class="download-option__link"\s+href="\.\/go\/ios\/"[^>]*>\s*Скачать iOS\s*<\/a>/,
  );
  assert.match(
    download,
    /class="download-option__link"\s+href="\.\/go\/android\/"[^>]*>\s*Скачать Android\s*<\/a>/,
  );
  assert.doesNotMatch(download, /href="\/go\//);
  assert.doesNotMatch(download, /Ссылка появится позже/);
});

test("v2 uses relative asset URLs that resolve beneath /install/", () => {
  const landing = readSource(v2IndexUrl);
  const styles = readSource(v2StylesUrl);
  const redirectStyles = readSource(new URL("v2/go/styles.css", root));

  for (const match of landing.matchAll(/(?:src|href)="(\.[^"]+)"/g)) {
    const relativePath = match[1].replace(/^\.\//, "");
    const resolvedUrl = relativePath.startsWith("public/v2/")
      ? new URL(`v2/${relativePath}`, root)
      : relativePath.startsWith("public/")
        ? new URL(relativePath, root)
        : new URL(`v2/${relativePath}`, root);
    assert.ok(
      existsSync(resolvedUrl),
      `${match[1]} must resolve from the v2 build layout`,
    );
  }

  assert.doesNotMatch(landing, /(?:src|href)="\//);
  assert.doesNotMatch(landing, /(?:src|href)="\.\.\//);
  assert.match(styles, /url\("\.\/public\/fonts\/manrope\/manrope-cyrillic-variable\.woff2"\)/);
  assert.match(styles, /url\("\.\/public\/fonts\/manrope\/manrope-latin-variable\.woff2"\)/);
  assert.doesNotMatch(styles, /url\(["']?\.\.\//);
  assert.match(redirectStyles, /url\("\.\.\/public\/fonts\/manrope\/manrope-cyrillic-variable\.woff2"\)/);
  assert.doesNotMatch(redirectStyles, /url\(["']?\.\.\/\.\.\//);
});

test("v2 main copy avoids sentence-final periods", () => {
  const landing = readSource(v2IndexUrl);
  const main = landing.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];

  assert.ok(main);
  const visibleText = main
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "\n")
    .replace(/Предикс\.Здоровье/g, "ПредиксЗдоровье");
  assert.doesNotMatch(visibleText, /[А-Яа-яЁё][^\n]*\./);
});

function loadV2App(source) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "v2/app.js" });
  return sandbox;
}

function createFakeEnvironment({
  reducedMotion = false,
  hasTarget = true,
} = {}) {
  const clickHandlers = [];
  const scrollIntoViewCalls = [];
  const focusCalls = [];
  const replaceStateCalls = [];
  const link = {
    getAttribute: (name) => (name === "data-focus-target" ? "download-qr" : null),
    addEventListener: (type, handler) => clickHandlers.push(handler),
  };
  const target = {
    scrollIntoView: (options) => scrollIntoViewCalls.push(options),
    focus: (options) => focusCalls.push(options),
  };
  const document = {
    querySelectorAll: () => [link],
    getElementById: (id) => (hasTarget && id === "download-qr" ? target : null),
  };
  const window = {
    matchMedia: () => ({ matches: reducedMotion }),
    history: {
      replaceState: (...args) => replaceStateCalls.push(args),
    },
  };

  return {
    document,
    window,
    target,
    dispatchClick: (event = { preventDefault() {} }) =>
      clickHandlers.forEach((handler) => handler(event)),
    scrollIntoViewCalls,
    focusCalls,
    replaceStateCalls,
  };
}

test("v2 carousel controls move one card and keep status in sync", () => {
  const source = readSource(v2AppUrl);
  const sandbox = loadV2App(source);

  assert.equal(typeof sandbox.clampCarouselIndex, "function");
  assert.equal(typeof sandbox.findNearestCarouselIndex, "function");
  assert.equal(typeof sandbox.installCarouselControls, "function");
  assert.equal(sandbox.clampCarouselIndex(-1, 4), 0);
  assert.equal(sandbox.clampCarouselIndex(8, 4), 3);
  assert.equal(sandbox.findNearestCarouselIndex(530, [0, 520, 1040, 1560]), 1);

  const createTarget = () => {
    const handlers = {};
    return {
      handlers,
      disabled: false,
      attributes: new Map(),
      addEventListener(type, handler) {
        (handlers[type] ??= []).push(handler);
      },
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
      removeAttribute(name) {
        this.attributes.delete(name);
      },
    };
  };

  const cards = [24, 544, 1064, 1584].map((offsetLeft) => ({ offsetLeft }));
  const carousel = createTarget();
  carousel.scrollLeft = 0;
  carousel.querySelectorAll = () => cards;
  carousel.scrollCalls = [];
  carousel.scrollTo = (options) => {
    carousel.scrollCalls.push(options);
    carousel.scrollLeft = options.left;
    for (const handler of carousel.handlers.scroll ?? []) handler();
  };

  const previous = createTarget();
  const next = createTarget();
  const current = { textContent: "" };
  const total = { textContent: "" };
  const selectors = new Map([
    ["[data-carousel]", carousel],
    ["[data-carousel-prev]", previous],
    ["[data-carousel-next]", next],
    ["[data-carousel-current]", current],
    ["[data-carousel-total]", total],
  ]);
  const document = {
    querySelector: (selector) => selectors.get(selector) ?? null,
    querySelectorAll: () => [],
  };
  const window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
  };

  sandbox.installCarouselControls(document, window);
  assert.equal(current.textContent, "01");
  assert.equal(total.textContent, "04");
  assert.equal(previous.disabled, true);
  assert.equal(next.disabled, false);


  next.handlers.click[0]();
  assert.deepEqual(
    carousel.scrollCalls.map((call) => ({ ...call })),
    [{ left: 520, behavior: "smooth" }],
  );
  assert.equal(current.textContent, "02");
  assert.equal(previous.disabled, false);

  const keyEvent = {
    key: "ArrowLeft",
    preventDefault() { keyEvent.defaultPrevented = true; },
  };
  carousel.handlers.keydown[0](keyEvent);
  assert.ok(keyEvent.defaultPrevented);
  assert.equal(carousel.scrollCalls.at(-1).left, 0);
  assert.equal(current.textContent, "01");

  const reducedCarousel = createTarget();
  reducedCarousel.scrollLeft = 0;
  reducedCarousel.querySelectorAll = () => cards;
  reducedCarousel.scrollTo = (options) => { reducedCarousel.lastScroll = options; };
  const reducedPrevious = createTarget();
  const reducedNext = createTarget();
  const reducedSelectors = new Map([
    ["[data-carousel]", reducedCarousel],
    ["[data-carousel-prev]", reducedPrevious],
    ["[data-carousel-next]", reducedNext],
    ["[data-carousel-current]", { textContent: "" }],
    ["[data-carousel-total]", { textContent: "" }],
  ]);
  sandbox.installCarouselControls({
    querySelector: (selector) => reducedSelectors.get(selector) ?? null,
    querySelectorAll: () => Array.from({ length: 4 }, createTarget),
  }, {
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
  });
  reducedNext.handlers.click[0]();
  assert.equal(reducedCarousel.lastScroll.behavior, "auto");
});

test("v2 app scrolls to the QR composition and moves focus without trapping it", () => {
  const source = readSource(v2AppUrl);
  const sandbox = loadV2App(source);

  assert.equal(typeof sandbox.resolveScrollBehavior, "function");
  assert.equal(typeof sandbox.installFocusTargetLinks, "function");
  assert.equal(sandbox.resolveScrollBehavior(true), "auto");
  assert.equal(sandbox.resolveScrollBehavior(false), "smooth");

  const smooth = createFakeEnvironment();
  sandbox.installFocusTargetLinks(smooth.document, smooth.window);
  const smoothEvent = { preventDefault() { smoothEvent.defaultPrevented = true; } };
  smooth.dispatchClick(smoothEvent);
  assert.deepEqual(
    smooth.scrollIntoViewCalls.map((call) => ({ ...call })),
    [{ behavior: "smooth", block: "center" }],
  );
  assert.deepEqual(
    smooth.focusCalls.map((call) => ({ ...call })),
    [{ preventScroll: true }],
  );
  assert.ok(smoothEvent.defaultPrevented);

  const reduced = createFakeEnvironment({ reducedMotion: true });
  sandbox.installFocusTargetLinks(reduced.document, reduced.window);
  reduced.dispatchClick();
  assert.deepEqual(
    reduced.scrollIntoViewCalls.map((call) => ({ ...call })),
    [{ behavior: "auto", block: "center" }],
  );
  assert.deepEqual(
    reduced.focusCalls.map((call) => ({ ...call })),
    [{ preventScroll: true }],
  );

  const missing = createFakeEnvironment({ hasTarget: false });
  sandbox.installFocusTargetLinks(missing.document, missing.window);
  const missingEvent = { preventDefault() { missingEvent.defaultPrevented = true; } };
  missing.dispatchClick(missingEvent);
  assert.equal(missingEvent.defaultPrevented, undefined);
  assert.deepEqual(missing.scrollIntoViewCalls, []);

  assert.doesNotMatch(
    source,
    /autoplay|setInterval|scrollBy|IntersectionObserver|requestAnimationFrame/,
  );
  assert.match(
    readSource(v2StylesUrl),
    /@media \(prefers-reduced-motion: reduce\)/,
  );
});

test("build:v2 produces a self-contained dist-v2 tree without touching dist/", async () => {
  await withBuildLock(async () => {
    if (!existsSync(new URL("dist/index.html", root))) {
      const baselineBuild = spawnSync("npm", ["run", "build"], {
        cwd: fileURLToPath(root),
        encoding: "utf8",
      });
      assert.equal(
        baselineBuild.status,
        0,
        `${baselineBuild.stdout}\n${baselineBuild.stderr}`,
      );
    }

    const v1IndexHash = await stableSha256(new URL("dist/index.html", root));

    const build = spawnSync("npm", ["run", "build:v2"], {
      cwd: fileURLToPath(root),
      encoding: "utf8",
    });

    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

    const v1IndexHashAfter = await stableSha256(new URL("dist/index.html", root));
    assert.equal(
      v1IndexHashAfter,
      v1IndexHash,
      "build:v2 must not change v1 dist output",
    );
  });

  const distV2 = new URL("dist-v2/", root);
  for (const path of [
    "index.html",
    "styles.css",
    "app.js",
    "go/ios/index.html",
    "go/android/index.html",
    "go/redirect.js",
    "go/styles.css",
    "public/fonts/manrope/manrope-cyrillic-variable.woff2",
    "public/logo-mark.png",
    "public/icons/chat-logo-96.png",
    "public/screenshots/food1.png",
    "public/screenshots/food2.png",
    "public/screenshots/doc1.png",
    "public/screenshots/doc2.png",
    "public/screenshots/integration1.png",
    "public/screenshots/habits1.png",
    "public/v2/download/ios-qr.png",
    "public/v2/download/android-qr.png",
    "public/v2/character/robot.webp",
    "public/v2/icons/advantage-anonymous.png",
    "public/v2/icons/privacy-data.png",
  ]) {
    assert.ok(existsSync(new URL(path, distV2)), `dist-v2/${path} should exist`);
  }

  const builtLanding = readFileSync(new URL("index.html", distV2), "utf8");
  assert.match(
    builtLanding,
    /<meta name="robots" content="noindex, nofollow" \/>/,
  );

  const svgEntries = readdirSync(distV2, { recursive: true })
    .map((entry) => String(entry))
    .filter((entry) => entry.toLowerCase().endsWith(".svg"));
  assert.deepEqual(svgEntries, [], "dist-v2 must not ship SVG assets");

  const buildScript = readFileSync(new URL("scripts/build-v2.mjs", root), "utf8");
  assert.match(buildScript, /dist-v2\//);
  assert.doesNotMatch(buildScript, /"\.\.\/dist\/"|'\.\.\/dist\/'/);
});
