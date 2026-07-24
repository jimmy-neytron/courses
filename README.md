# Courses

Vue 3 приложение для создания курсов, модулей, уроков и учебных блоков. Архитектура организована в стиле Nuxt, но проект продолжает работать на Vite и Vue Router.

## Стек

- Vue 3 + TypeScript + Vite;
- Pinia;
- Vue Router;
- Supabase Auth/Postgres;
- `@neytron/compact-ui`;
- локальный режим через `localStorage`.

## Запуск

Требуется Node.js 24 или новее.

```bash
npm install
cp .env.example .env
npm run dev
```

Без переменных Supabase приложение запускается в локальном режиме.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

## Nuxt-like структура

```text
src/
├── app.vue
├── assets/styles/
├── components/
├── composables/
├── config/
├── constants/
├── layouts/
├── pages/
├── plugins/
├── router/
├── services/
├── stores/
├── types/
└── utils/
```

Файлы страниц повторяют Nuxt-соглашения (`index.vue`, `[courseId].vue`, `[lessonId]/editor.vue`), но маршруты явно зарегистрированы в `src/router/routes.ts`.

Подробности находятся в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Зелёная тема

Тёмная тема и compact density включаются в `src/plugins/compact-ui-theme.ts`.
Основной зелёный акцент `#00DC82` и все производные semantic tokens находятся в `src/assets/styles/tokens.css`.

Стили конкретного компонента лежат рядом с его `.vue`-файлом и подключаются через внешний scoped stylesheet:

```vue
<style scoped src="./component-name.css"></style>
```

Правила стилей описаны в [STYLE_ARCHITECTURE.md](./STYLE_ARCHITECTURE.md).

## Проверки

```bash
npm run verify
npm run typecheck
npm run build
```

`verify` проверяет:

- Nuxt-like структуру директорий;
- отсутствие импортов из удалённых старых слоёв;
- корректность внутренних импортов;
- отсутствие нативных form-controls;
- загрузочные состояния страниц;
- архитектуру CSS;
- наличие зелёных design tokens.

## Supabase

Для нового проекта выполните SQL-файлы `supabase/sql/00...05` по порядку.

Для существующей базы сначала сделайте резервную копию, затем выполните:

```text
supabase/sql/90_migrate_existing_to_courses_only.sql
supabase/sql/91_migrate_accent_to_green.sql
supabase/sql/92_add_lesson_completion.sql
```

Миграция `91` меняет стандартный цвет новых курсов и заменяет прежний стандартный цвет у существующих записей. Миграция `92` добавляет отметку прохождения урока (`is_completed`).

## Loading states

Страницы показывают skeleton до завершения первого запроса. Состояние «не найдено» отображается только после `courses.loaded === true`; ошибки загрузки показываются отдельно с повторным запросом.


## Статусы уроков и прохождение

- Опубликованный урок можно вернуть в черновик из редактора.
- В предпросмотре курса отображаются только уроки со статусом `published`.
- Авторский предпросмотр черновика открывается из редактора с query-параметром `mode=author`.
- Отметка «Пройден» хранится в поле `lessons.is_completed` и показывается в карточке курса и в программе.
- Все типы блоков рендерятся через `LessonBlockRenderer`, который безопасно обрабатывает текстовые, медиа- и интерактивные структуры `public_content`.
