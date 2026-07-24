# Архитектура frontend

Проект остаётся приложением на Vue 3 + Vite, но структура `src` приведена к знакомым соглашениям Nuxt: `pages`, `layouts`, `components`, `composables`, `stores`, `services`, `types`, `utils`, `plugins` и `assets`.

Это именно **Nuxt-like архитектура**, а не переход на Nuxt runtime. Маршруты по-прежнему явно описаны в `src/router/routes.ts`, поэтому поведение приложения не зависит от магии автоимпортов и файлового роутинга.

## Структура

```text
src/
├── app.vue                         # корневой компонент
├── main.ts                         # bootstrap Vue, Pinia и Router
├── assets/styles/                  # только глобальная тема и design tokens
├── components/                     # переиспользуемые UI и доменные компоненты
│   ├── common/
│   ├── course/
│   ├── lesson/
│   └── ui/
├── composables/                    # переиспользуемая реактивная логика
├── config/                         # конфигурация окружения
├── constants/                      # неизменяемые значения и подписи
├── layouts/                        # оболочки страниц
├── pages/                          # страницы в Nuxt-подобной файловой структуре
├── plugins/                        # инициализация внешних библиотек
├── router/                         # явная конфигурация Vue Router
├── services/                       # Supabase, repositories и работа с API
├── stores/                         # Pinia stores и их action-модули
├── types/                          # общие TypeScript-типы
└── utils/                          # чистые функции без состояния
```

## Страницы и маршруты

Файлы страниц повторяют Nuxt-соглашения:

```text
pages/
├── auth.vue
├── courses/
│   ├── index.vue
│   └── [courseId].vue
├── lessons/
│   └── [lessonId]/editor.vue
└── preview/
    ├── courses/[courseId].vue
    └── lessons/[lessonId].vue
```

Файл с квадратными скобками обозначает динамический параметр маршрута. Vue Router связывает эти страницы с URL в `src/router/routes.ts`.

## Ответственность директорий

- `pages` координирует сценарий страницы, но не содержит API-реализации.
- `layouts` отвечает только за общую оболочку, навигацию и `RouterView`.
- `components` содержит отображение и локальное пользовательское взаимодействие.
- `composables` содержит реактивную логику, которую можно использовать более чем в одном компоненте.
- `stores` управляет состоянием приложения и вызывает services.
- `services` изолирует Supabase, localStorage и преобразование DTO.
- `types`, `constants` и `utils` не зависят от Vue-компонентов.

## Курсы и хранение данных

`src/stores/courses/index.ts` предоставляет публичный API Pinia store. Действия разбиты по агрегатам:

```text
stores/courses/actions/
├── course.actions.ts
├── module.actions.ts
├── lesson.actions.ts
└── block.actions.ts
```

Доступ к данным скрыт за `CourseRepository`:

```text
services/courses/
├── course.repository.ts
├── local-course.repository.ts
├── supabase-course.repository.ts
├── create-course-repository.ts
├── course.mapper.ts
└── course.factory.ts
```

Благодаря этому страницы и store не знают, используется Supabase или локальный режим.

## Compact UI

Базовые контролы берутся из `@neytron/compact-ui`. Составное поведение приложения находится в `src/components/ui`:

- `AppDialog`;
- `AppSelect`;
- `ConfirmDialog`;
- `FormField`;
- `LoadingSkeleton`;
- `PageContainer`;
- `PageState`;
- `SectionHeading`.

Нативные `button`, `input`, `textarea` и `select` в Vue-шаблонах не используются.

## Тема

Основной цвет темы — зелёный `#00DC82` в стиле Nuxt. Все производные значения задаются semantic tokens в `src/assets/styles/tokens.css`, поэтому компоненты не зависят от конкретного оттенка.

Старый стандартный цвет курса автоматически нормализуется к новому зелёному значению при чтении данных. Для уже существующей Supabase-базы добавлена миграция `supabase/sql/91_migrate_accent_to_green.sql`.


## Предпросмотр уроков

`src/components/lesson/LessonPlayer.vue` отвечает за оболочку урока, а отдельный `LessonBlockRenderer.vue` — за отображение каждого типа блока. Нормализация гибкого JSON `public_content` вынесена в `src/utils/lesson-block-content.ts`, поэтому компонент не содержит преобразований DTO и не падает на частично заполненных старых данных.

Публичный предпросмотр курса фильтрует уроки по `status === 'published'`. Черновики доступны только через авторскую ссылку из редактора.
