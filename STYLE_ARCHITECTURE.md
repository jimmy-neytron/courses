# Архитектура CSS

## Глобальные стили

В `src/main.ts` подключаются только шесть глобальных файлов из `src/assets/styles`:

- `tokens.css` — design tokens приложения и переменные Compact UI;
- `reset.css` — минимальный reset браузера;
- `theme.css` — фон документа и глобальная тёмная тема;
- `typography.css` — базовая типографика;
- `accessibility.css` — focus, selection и reduced motion;
- `compact-ui-overrides.css` — только глобальная настройка `.cui-*` компонентов.

Глобальные файлы не содержат селекторов страниц или доменных компонентов. Агрегирующего `index.css` и цепочек CSS `@import` нет.

## Стили компонентов

Каждый Vue-компонент владеет своим stylesheet и загружает его рядом:

```text
components/course/
├── CourseCard.vue
└── course-card.css
```

```vue
<style scoped src="./course-card.css"></style>
```

Такой подход:

- исключает утечки селекторов;
- сохраняет явную связь компонента и стилей;
- позволяет Vite загружать CSS вместе с лениво загружаемой страницей;
- не создаёт общий тяжёлый bundle со стилями всех страниц.

## Design tokens

Компоненты используют semantic tokens, а не дублируют hex-значения:

```css
color: var(--app-text);
background: var(--app-surface);
border-color: var(--app-accent-border);
```

Основной акцент — `--app-accent: #00DC82`. Прозрачные варианты строятся через `--app-accent-rgb`, поэтому оттенок можно изменить в одном месте.

## Ограничения производительности

- нет runtime CSS-in-JS;
- нет Sass-зависимости для простого набора токенов;
- нет CSS `@import`;
- Compact UI CSS подключается один раз;
- стили страниц и компонентов остаются рядом с lazy-loaded Vue-модулями;
- анимации отключаются через `prefers-reduced-motion`;
- backdrop blur используется только в ограниченном количестве оболочек и диалогов.
