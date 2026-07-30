# Предварительный вариант для Liferay / корпоративного портала

Цель: дать портальной команде fallback-артефакт, если они не могут принять обычную папку `dist/` с отдельными CSS/JS/assets.

## Артефакт

Команда:

```sh
npm run build:portal-inline
```

Создаёт:

```text
dist/portal-inline.html
```

Это один HTML-файл, в котором встроены:

- HTML-разметка лендинга;
- CSS внутри `<style data-portal-inline="styles">`;
- JS внутри `<script data-portal-inline="app" defer>`;
- изображения, логотип и шрифты как `data:` URLs.

## Для чего подходит

Использовать как предварительный вариант для HTML widget / fragment / контейнера внутри Liferay, если портал принимает один HTML-фрагмент.

## Ограничения

Интерактивный блок “Выберите, что хотите сделать” требует JavaScript. Если портал удаляет `<script>` или запрещает inline JS через CSP, смена скриншотов по клику работать не будет.

Если портал запрещает `data:` URLs, нужно заменить встроенные изображения/шрифты на URL файлов, загруженных в Documents and Media / Media Library портала.

## Что спросить у портальной команды

- Разрешены ли inline `<style>` и `<script>`?
- Разрешены ли `data:` URLs для `img-src` и `font-src`?
- Есть ли лимит размера HTML-вставки?
- Нужен ли вместо этого Liferay Custom Element Client Extension?
