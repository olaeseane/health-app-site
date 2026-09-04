# V2 Install Landing Specification

## Status

Implemented product and interaction specification for the install-focused landing page. Final verification is tracked in the pull request.

This document supplements [`site-versions.md`](site-versions.md). If the two documents conflict, `site-versions.md` governs architecture and this document governs v2 page content and presentation.

## Scope and isolation

- V1 ordinary and portal outputs remain unchanged.
- V2 sources live under `v2/` and build independently into `dist-v2/`.
- Ordinary v2 is served at `/install/` and includes `noindex, nofollow`.
- Portal v2 is a separate single-file build without Yandex Metrika.
- The stack remains zero-dependency static HTML/CSS/JavaScript with Node.js build scripts and `node:test` contracts.

## Page order

1. Header
2. Install-focused hero with QR composition
3. “С чего начать”
4. “Простота использования” horizontal carousel
5. “Что в итоге?” with character
6. “Анонимность”
7. “Скачать приложение”
8. Footer

The v1 “Интеграции” section does not appear in v2.

## Header

Use the current v1 header design and responsive behavior. In v2, replace the removed navigation item:

- `Интеграции` → `Что в итоге?`
- target: `#outcome`

The resulting navigation is:

- `С чего начать` → `#first-route`
- `Простота` → `#simplicity`
- `Что в итоге?` → `#outcome`
- `Анонимность` → `#privacy`
- chat image/link unchanged
- `Скачать` → `#download`

## Hero

### Copy

Use the mockup copy verbatim:

- Heading: `Начните с понятного первого шага`
- Lead: `Предикс.Здоровье собирает данные о питании, активности, анализах и привычках в единый портрет здоровья и помогает понять, что делать дальше`
- CTA: `Скачать Предикс.Здоровье`
- QR instruction: `Сканируйте QR-код`
- Platform labels: `iPhone`, `Android`

Advantages beneath the main hero row:

1. `Используйте анонимно`
2. `Ваши данные под вашим контролем`
3. `Начните с минимума информации`

Use restrained branded line icons for the three advantages. Do not include the circular comment/avatar artifact shown over the CTA in the wireframe.

### Layout

- Desktop: copy and CTA on the left; two offset QR cards on the right, with iPhone higher and Android lower/right; instruction and a restrained directional arrow above the codes.
- Mobile: copy first, then CTA, QR composition, then advantages; no horizontal overflow.
- QR images are 160×160 with rounded corners.
- The hero CTA points to `#download-qr`, smoothly scrolls to the hero QR composition, and moves programmatic focus to it.
- Respect `prefers-reduced-motion: reduce` by disabling animated scrolling.

### QR and analytics destinations

Create v2-specific QR images with the same visual treatment as v1:

- iOS QR → `https://predix-health.ru/install/go/ios/`
- Android QR → `https://predix-health.ru/install/go/android/`

Ordinary v2 QR cards are links. Portal v2 QR cards are images only: no anchor, hover state, or navigation.

The redirect destinations remain:

- iOS → `https://testflight.apple.com/join/KCJxFcV1`
- Android → `https://predix-health.ru/download/predix-health-app.apk`

## “С чего начать”

Carry the current v1 `#first-route` section into v2 unchanged:

- copy;
- four steps;
- visual hierarchy;
- desktop and mobile layout;
- accessibility semantics.

## “Простота использования”

### Content

- Kicker: `Простота использования`
- Heading: `Здоровье не нужно собирать вручную`

Cards in this exact horizontal order:

1. **Питание**
   - Heading: `Фотографируйте еду`
   - Body: `ИИ распознает блюдо, рассчитает КБЖУ и сам создаст запись в дневнике`
   - Screenshots: `food1.png`, then `food2.png`
2. **Анализы**
   - Heading: `Добавляйте анализы`
   - Body: `Просто загрузите фото, PDF или отсканируйте QR`
   - Screenshots: `doc1.png`, then `doc2.png`
3. **Трекеры**
   - Heading: `Подключайте трекеры`
   - Body: `Устройства и приложения синхронизируются автоматически`
   - Screenshot: `integration1.png`
4. **Привычки**
   - Heading: `Отмечайте привычки`
   - Body: `Создайте их один раз, а история и прогресс сохранятся навсегда`
   - Screenshot: `habits1.png`

Static closing line after the carousel:

`Всё это дополняет ваш портрет`

### Interaction

- Native horizontal scrolling with CSS scroll snap.
- No autoplay and no arrow controls in the first implementation.
- Preserve touch, trackpad, mouse-wheel/shift-wheel, and keyboard usability.
- The closing line stays outside the scroll container.
- Cards remain readable at 200% zoom and do not create page-level horizontal overflow.

## “Что в итоге?”

### Copy

Use the mockup copy verbatim:

- Kicker: `Что в итоге?`
- Heading: `Не просто данные, а понимание, что делать дальше`
- Lead: `Мы поможем вам увидеть главное и понять следующий шаг`
- CTA: `Скачать Предикс.Здоровье`

### Character and layout

- Use the supplied character extracted from `robot.svg.zip`; do not ship the SVG wrapper.
- Ordinary asset: optimized transparent WebP.
- Portal asset: separately optimized raster version sized to keep the inline artifact below 1 MB.
- Treat the character as decorative: `alt=""`.
- Desktop: character at the right, aligned to the bottom of the section.
- Mobile: character follows the CTA, centered and width-limited.
- CTA uses the same `#download-qr` target and focus behavior as the hero CTA.

## Removed “Интеграции” section

Do not render the v1 `#integrations` section, integration list, or its standalone navigation target in v2. Do not remove it from v1 or delete shared integration assets needed by v1.

## “Анонимность”

Carry the current v1 `#privacy` section into v2 unchanged, including:

- copy and four principles;
- icons;
- 2×2 desktop grid;
- single-column mobile layout;
- visual styling and semantics.

## “Скачать приложение”

Carry the current v1 section into v2, including its QR composition and ordinary/portal variants, with one approved copy addition below the heading:

- Kicker: `Скачать приложение`
- Heading: `Ваш первый осознанный шаг`
- New supporting line: `Начните с того, что уже знаете о себе`

Do not add a final period to the supporting line.

Ordinary v2:

- use the same v2-specific iOS and Android redirect paths as the hero;
- show `Скачать iOS` and `Скачать Android` buttons;
- QR images and buttons for the same platform produce the same platform goal.

Portal v2:

- QR images only;
- no download buttons;
- no clickable QR links;
- no Metrika.

## Footer

Keep the corresponding v1 footer unchanged.

Ordinary v2:

- logo, disclaimer, `В начало`, and chat image/link unchanged;
- no `Документация` link.

Portal v2:

- preserve the portal footer with `В начало`, `Документация` linking to `doc.pdf`, and the existing chat image/link;
- preserve current portal-only sizing and styling.

## Analytics

Ordinary v2 uses Yandex Metrika counter `112104449`.

V2 redirects emit only these goals:

- `v2_download_ios`
- `v2_download_android`

Each redirect keeps the existing timeout fallback and manual continuation behavior. The person managing Metrika must create the two JavaScript goals before production attribution is expected.

Portal v2 must contain none of the following:

- `mc.yandex.ru`
- counter ID `112104449`
- `ym(`
- v2 goal IDs

## Portal requirements

`npm run build:v2:portal-inline` must produce:

`dist-v2/portal-inline-ascii.html`

The artifact must be:

- one self-contained HTML file;
- ASCII-safe;
- under 1,000,000 bytes;
- free of SVG content and external local asset references;
- free of Metrika;
- compatible with the established portal host-shell overrides;
- fixed-header compatible using direct `.site-header--portal` selectors with `!important`, not `body[data-portal-build]`.

PDF is not inlined; the portal documentation link remains `doc.pdf`.

## Accessibility and responsive acceptance

- Skip-link behavior remains valid in ordinary v2.
- Heading hierarchy and landmarks are valid.
- Interactive QR cards and buttons have visible focus states.
- Programmatic focus after CTA scrolling is announced without trapping focus.
- All motion honors reduced-motion preferences.
- The carousel can be used without pointer input.
- No page-level horizontal overflow at mobile widths or 200% zoom.
- Decorative line icons and the character use empty alternative text or `aria-hidden="true"`.

## Explicit non-goals

- No changes to v1 sources or observable v1 build output.
- No `/install/` link from v1 and no sitemap entry.
- No carousel autoplay.
- No carousel arrow controls in the first release.
- No portal analytics.
- No deployment or production Nginx changes as part of implementation until separately approved.
