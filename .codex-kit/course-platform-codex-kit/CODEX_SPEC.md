# Полное техническое задание для Codex
## Course Platform — независимая платформа создания и прохождения курсов

## 1. Задача

Создай production-ready MVP отдельного веб-приложения для создания, публикации и прохождения учебных курсов.

Платформа должна быть максимально независимой от Calendar и любых будущих клиентов. Calendar будет одним из внешних приложений, которое:

- получает доступные курсы через API;
- связывает lessonId со своим событием;
- создаёт короткоживущую embed-сессию;
- открывает урок в iframe;
- получает мгновенный прогресс через `postMessage`;
- получает надёжное подтверждение через webhook.

Запрещено связывать внутренние таблицы, пользователей, роли, frontend-компоненты или роуты Course Platform со структурой Calendar.

---

## 2. Границы ответственности

### Course Platform владеет

- организациями авторов;
- курсами, модулями и уроками;
- блоками уроков;
- правильными ответами и проверкой упражнений;
- опубликованными версиями;
- учениками;
- enrollments;
- попытками уроков;
- прогрессом и результатами;
- интеграциями;
- API-ключами;
- embed-сессиями;
- webhook queue.

### Внешнее приложение владеет

- календарём и расписанием;
- своими пользователями и ролями;
- внешним событием или задачей;
- напоминаниями;
- UI вокруг iframe;
- локальной кэш-копией статуса урока.

Внешнее приложение не обращается напрямую к Supabase Data API Course Platform.

---

## 3. Стек

### Обязательный

- Vue 3;
- TypeScript strict;
- Vite;
- Vue Router;
- Pinia;
- TanStack Query for Vue;
- Supabase JS;
- Supabase Auth;
- Supabase PostgreSQL;
- Supabase Storage;
- Supabase Edge Functions;
- Zod;
- VeeValidate;
- `@vee-validate/zod`;
- Tailwind CSS;
- shadcn-vue;
- Reka UI;
- Lucide Vue;
- Tiptap;
- VueDraggablePlus;
- VueUse;
- date-fns;
- vue-i18n;
- vue-sonner.

### Тестирование и качество

- Vitest;
- Vue Test Utils;
- Playwright;
- MSW;
- ESLint;
- Prettier;
- vue-tsc;
- Husky;
- lint-staged.

Выбирай актуальные стабильные совместимые версии пакетов. Не используй experimental API без необходимости.

---

## 4. Правила состояния

### Pinia

Используй только для клиентского состояния:

- auth context;
- выбранная организация;
- UI preferences;
- состояние конструктора;
- несохранённые изменения;
- preview mode;
- embed runtime state.

### TanStack Query

Используй для server state:

- courses;
- modules;
- lessons;
- releases;
- integrations;
- learners;
- enrollments;
- analytics.

Не храни одну серверную коллекцию одновременно в Pinia и TanStack Query.

---

## 5. Режимы приложения

Один frontend поддерживает три изолированных режима.

### 5.1 Authoring App

Полный интерфейс автора:

- dashboard;
- курсы;
- curriculum builder;
- lesson builder;
- preview;
- публикации;
- интеграции;
- ученики;
- аналитика;
- настройки.

### 5.2 Standalone Learner

Минимальный самостоятельный интерфейс:

- доступные курсы;
- продолжить обучение;
- пройти урок;
- увидеть свой прогресс.

### 5.3 Embed Player

Отдельный bundle и layout:

- без sidebar;
- без административных компонентов;
- без Tiptap;
- без доступа к другим курсам;
- только один разрешённый урок;
- токен только в памяти;
- обмен через протокол 1.0.

---

## 6. Структура frontend

```text
src/
  app/
    main.ts
    App.vue
    router/
    providers/
    layouts/
    styles/

  shared/
    api/
    config/
    constants/
    errors/
    lib/
    types/
    ui/
    validation/

  entities/
    auth/
    organization/
    course/
    course-release/
    module/
    lesson/
    lesson-block/
    learner/
    enrollment/
    progress/
    integration/

  features/
    auth/
    organization-switcher/
    course-create/
    course-publish/
    curriculum-edit/
    lesson-builder/
    lesson-preview/
    asset-upload/
    integration-create/
    api-key-create/
    learner-progress/
    embed-session/

  widgets/
    app-sidebar/
    app-header/
    course-card/
    curriculum-tree/
    lesson-editor/
    lesson-player/
    progress-summary/
    integration-panel/

  pages/
    auth/
    dashboard/
    courses/
    course-details/
    lesson-editor/
    integrations/
    learners/
    analytics/
    settings/
    learner/
    embed/

  stores/
  composables/
```

### Архитектурные ограничения

- Pages не содержат прямых Supabase-запросов.
- API/repository слой возвращает типизированные DTO.
- UI не знает устройство базы.
- Zod валидирует формы, JSONB и API payload.
- Никакого `any`.
- Ошибки приводятся к `AppError`.
- Компоненты крупнее 300–400 строк декомпозировать.
- Route-level code splitting обязателен.
- Tiptap и editor dependencies не должны попадать в embed bundle.

---

## 7. Авторизация и организации

### Auth

Поддержать:

- email/password;
- email confirmation;
- forgot password;
- reset password;
- logout;
- session restore;
- profile update.

OAuth должен добавляться позже без изменения модели данных.

### Автоматическое создание

После регистрации backend trigger создаёт:

- `profiles`;
- `learners`;
- личную `organizations`;
- `organization_members` с ролью `owner`.

### Роли

- `owner`;
- `admin`;
- `editor`;
- `viewer`.

| Возможность | owner | admin | editor | viewer |
|---|---:|---:|---:|---:|
| Читать курсы | Да | Да | Да | Да |
| Создавать и редактировать | Да | Да | Да | Нет |
| Публиковать | Да | Да | Да | Нет |
| Управлять участниками | Да | Да | Нет | Нет |
| Управлять интеграциями | Да | Да | Нет | Нет |
| Удалять организацию | Да | Нет | Нет | Нет |

---

## 8. Роуты

### Публичные

```text
/login
/register
/forgot-password
/reset-password
```

### Authoring

```text
/app
/app/courses
/app/courses/new
/app/courses/:courseId
/app/courses/:courseId/curriculum
/app/courses/:courseId/releases
/app/courses/:courseId/learners
/app/courses/:courseId/analytics
/app/courses/:courseId/settings
/app/lessons/:lessonId/editor
/app/lessons/:lessonId/preview
/app/integrations
/app/integrations/new
/app/integrations/:integrationId
/app/learners
/app/learners/:learnerId
/app/analytics
/app/settings/profile
/app/settings/organization
```

### Learner

```text
/learn
/learn/courses/:courseId
/learn/courses/:courseId/lessons/:lessonId
```

### Embed

```text
/embed/lessons/:lessonId
```

Embed token запрещено передавать в query string или hash.

---

## 9. Экраны

### 9.1 Dashboard

Показать:

- всего курсов;
- опубликовано;
- активных учеников;
- средний прогресс;
- последние курсы;
- последние публикации;
- последние активности;
- быстрые действия.

### 9.2 Курсы

Фильтры:

- поиск;
- статус;
- язык;
- visibility;
- сортировка.

Карточка:

- cover;
- title;
- language;
- source/target level;
- module count;
- lesson count;
- status;
- updatedAt;
- context menu.

### 9.3 Создание курса

Поля:

- title;
- slug;
- description;
- languageCode;
- sourceLevel;
- targetLevel;
- durationWeeks;
- lessonsPerWeek;
- defaultLessonDuration;
- cover;
- accentColor;
- visibility;
- sequential mode.

### 9.4 Course Details

Вкладки:

- Обзор;
- Программа;
- Релизы;
- Ученики;
- Аналитика;
- Интеграции;
- Настройки.

### 9.5 Curriculum Builder

Поддержать:

- создание модуля;
- inline rename;
- создание урока;
- drag-and-drop модулей;
- drag-and-drop уроков;
- перемещение урока между модулями;
- duplicate;
- archive;
- status;
- collapse all;
- пустые состояния;
- transactional reorder.

### 9.6 Lesson Builder

Desktop — три колонки:

1. Список блоков.
2. Canvas урока.
3. Настройки блока.

На ширине ниже 1024 px settings открываются drawer.

Функции:

- добавить блок;
- редактировать;
- duplicate;
- delete;
- drag-and-drop;
- insert between blocks;
- collapse;
- validate;
- autosave;
- undo/redo для локальных изменений;
- preview.

### 9.7 Preview

Режимы:

- desktop;
- tablet;
- mobile;
- embed;
- light;
- dark.

### 9.8 Integrations

Показать:

- integration name;
- status;
- allowed origins;
- разрешённые курсы;
- API keys;
- webhook URL;
- webhook status;
- последние deliveries;
- code examples.

### 9.9 Embed Player

Показать:

- course title;
- lesson title;
- progress;
- current section;
- content;
- exercises;
- feedback;
- previous/next;
- complete;
- restore state.

Не показывать административные компоненты.

---

## 10. Современная стилистика

### Визуальное направление

- светлый нейтральный фон;
- белые поверхности;
- основной акцент — современный фиолетовый/индиго;
- ясная иерархия;
- умеренные скругления 10–16 px;
- тонкие границы;
- минимальные тени;
- много воздуха;
- лаконичная иконография Lucide;
- аккуратные empty states;
- responsive layout от 320 px.

Не использовать повсеместно glassmorphism, тяжёлые градиенты, неон, чрезмерные тени и декоративные анимации.

### Токены

```css
:root {
  --background: 250 250 252;
  --foreground: 24 24 27;
  --surface: 255 255 255;
  --surface-muted: 246 246 249;
  --border: 228 228 231;
  --primary: 109 94 252;
  --primary-foreground: 255 255 255;
  --success: 22 163 74;
  --warning: 217 119 6;
  --danger: 220 38 38;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

Поддержать dark mode классом `dark`.

### Accessibility

Минимум WCAG 2.1 AA:

- keyboard navigation;
- visible focus;
- labels;
- aria-live;
- sufficient contrast;
- status не только цветом;
- reduced motion;
- loading/error/empty/disabled states.

---

## 11. Модель контента урока

Каждый блок имеет:

- `blockType`;
- `position`;
- `title`;
- `publicContent`;
- `privateContent`;
- `settings`;
- `isRequired`;
- `points`.

### Контентные типы

- `heading`;
- `rich_text`;
- `callout`;
- `image`;
- `audio`;
- `video`;
- `file`;
- `grammar`;
- `example`;
- `divider`;
- `summary`;
- `homework`.

### Словарь

- `vocabulary`;
- `flashcards`.

Элемент словаря:

- original;
- translation;
- transcription;
- pinyin;
- example;
- audioPath;
- note.

### Упражнения

- `single_choice`;
- `multiple_choice`;
- `text_input`;
- `fill_blanks`;
- `matching`;
- `ordering`;
- `sentence_builder`;
- `translation`;
- `listening`;
- `open_answer`.

Правильные ответы и grading rules хранятся только в `privateContent`.

Embed Player никогда не получает `privateContent`. Проверка выполняется Edge Function.

---

## 12. TypeScript и JSONB

Создай discriminated union:

```ts
type LessonBlock =
  | RichTextBlock
  | ImageBlock
  | AudioBlock
  | VocabularyBlock
  | SingleChoiceBlock
  | MultipleChoiceBlock
  | TextInputBlock
  | MatchingBlock
  | OpenAnswerBlock
```

Для каждого типа:

- TypeScript interface;
- Zod schema;
- editor component;
- player component;
- default factory;
- validation function;
- migration/version field в JSON при необходимости.

Пример public payload:

```ts
interface SingleChoicePublicContent {
  question: string
  options: Array<{ id: string; label: string }>
  explanationBefore?: string
}
```

Private payload:

```ts
interface SingleChoicePrivateContent {
  correctOptionId: string
  explanationAfter?: string
}
```

---

## 13. Автосохранение

- debounce 800 ms;
- AbortController для устаревших запросов;
- dirty tracking;
- status: idle/saving/saved/error;
- batch update блоков;
- retry;
- before-route-leave только при реально несохранённых данных;
- optimistic reorder с rollback;
- серверная проверка revision для защиты от конфликтов.

Добавь `updated_at` или revision token в mutation payload. При конфликте показывай диалог сравнения/перезагрузки.

---

## 14. Публикация

Рабочие таблицы содержат draft.

При публикации RPC `publish_course`:

1. Проверяет права.
2. Проверяет валидность курса.
3. Собирает snapshot.
4. Создаёт неизменяемый `course_releases`.
5. Увеличивает version.
6. Обновляет `current_release_id`.
7. Не изменяет старые releases.

Попытка ученика хранит `release_id`, с которым она началась.

Для production доработать SQL-функцию дополнительной JSON-schema/Zod-валидацией на Edge Function перед RPC.

---

## 15. Ученики и прогресс

### Learner

Может быть:

- внутренним пользователем Supabase Auth;
- внешним пользователем интеграции без Supabase Auth.

Связь внешнего пользователя:

```text
integration_id + external_user_id -> learner_id
```

### Enrollment

Один learner имеет не более одного активного enrollment на course в MVP.

### Lesson Attempt

Хранит:

- release;
- lesson;
- learner;
- attempt number;
- progress;
- score;
- externalContextId;
- timestamps.

### Block Progress

Хранит ответ, correctness и score. Не хранить секретные grading rules.

---

## 16. Интеграционный API

Реализовать через Edge Functions.

### API-key

```http
Authorization: Bearer cp_live_<secret>
```

В базе хранить только:

- key prefix;
- SHA-256 hash;
- createdAt;
- expiresAt;
- revokedAt;
- lastUsedAt.

Raw key показывается один раз после создания.

### Endpoints

```text
GET  /functions/v1/integration-courses
GET  /functions/v1/integration-course
POST /functions/v1/embed-session-create
POST /functions/v1/embed-session-exchange
POST /functions/v1/lesson-answer-submit
GET  /functions/v1/lesson-progress-get
POST /functions/v1/lesson-progress-save
POST /functions/v1/lesson-complete
POST /functions/v1/storage-signed-url
```

### Требования

- Zod validation;
- rate limiting;
- CORS только для allowed origins;
- единый error format;
- requestId/idempotency;
- privateContent не возвращать;
- service role использовать только внутри functions.

---

## 17. Embed-сессия

Embed session создаётся сервер-сервером.

Параметры:

- integration;
- learner;
- course;
- release;
- lesson;
- allowed origin;
- external context;
- permissions;
- expiration;
- token hash.

Raw token:

- криптографически случайный;
- показывается только в ответе create;
- не записывается в БД;
- не передаётся в URL;
- хранится parent и Player только в памяти;
- действует 10–30 минут;
- может быть отозван.

Player получает token через postMessage и обменивает его на безопасный runtime context.

---

## 18. postMessage

Используй `INTEGRATION_PROTOCOL.md`.

Обязательно:

- protocol version;
- namespace;
- Zod schema;
- точный targetOrigin;
- проверка event.source;
- никакого `*`;
- graceful handling несовместимой версии;
- height event через ResizeObserver с throttling;
- theme и locale updates.

---

## 19. Webhooks

Webhook events:

- learner.created;
- enrollment.created;
- lesson.started;
- lesson.progress;
- lesson.completed;
- course.completed.

Требования:

- HMAC SHA-256;
- timestamp;
- event id;
- retries;
- идемпотентность;
- delivery status;
- last error;
- ручной retry из UI;
- disable после систематических ошибок не делать автоматически в MVP, только показывать warning.

---

## 20. Storage

Private buckets:

- `course-covers`;
- `lesson-assets`.

Ограничения:

- image 10 MB;
- audio 50 MB;
- video 200 MB;
- pdf 25 MB.

Frontend автора загружает файлы через authenticated Supabase client и RLS.

Embed Player получает signed URL через Edge Function после проверки session.

Проверять extension, MIME, size и путь.

---

## 21. Безопасность

Обязательно:

- RLS на всех таблицах;
- service role отсутствует во frontend;
- sanitize Tiptap HTML;
- whitelist nodes/marks;
- запрет arbitrary script/style/iframe;
- correct answers только server-side;
- API-key hash;
- token hash;
- allowed origins;
- secure webhook signature;
- CSP;
- security headers;
- rate limiting;
- audit-friendly timestamps;
- no sensitive data in logs;
- signed Storage URLs;
- session expiry handling.

---

## 22. Аналитика MVP

Показать:

- active learners;
- enrollments;
- completion rate;
- average progress;
- average score;
- completed lessons;
- recent activities;
- breakdown by course.

Использовать views/RPC, не загружать все attempts в frontend для агрегации.

---

## 23. Ошибки

```ts
interface AppError {
  code: string
  message: string
  details?: unknown
  retryable: boolean
}
```

Поддержать:

- loading;
- skeleton;
- empty;
- forbidden;
- not found;
- validation error;
- conflict;
- offline;
- expired embed session;
- integration disabled;
- origin forbidden;
- rate limited.

Player отправляет `COURSE_LESSON_ERROR` родителю.

---

## 24. Тестирование

### Unit

- Zod block schemas;
- grading;
- publish validation;
- postMessage validation;
- API auth helpers;
- stores;
- utilities.

### Component

- CourseCard;
- CurriculumTree;
- LessonBlockEditor;
- LessonPlayer;
- IntegrationForm;
- ApiKeyDialog.

### E2E

1. Register.
2. Auto-create organization.
3. Create course.
4. Add module.
5. Add lesson.
6. Add content and exercise.
7. Upload asset.
8. Preview.
9. Publish.
10. Create integration.
11. Add origin.
12. Grant course access.
13. Create API-key.
14. Create embed session.
15. Open iframe.
16. Initialize by postMessage.
17. Submit answer.
18. Save progress.
19. Complete lesson.
20. Queue webhook.
21. Restore progress after reload.
22. Verify cross-organization access is denied.

---

## 25. Производительность

- lazy routes;
- separate author/player chunks;
- no editor code in embed;
- query staleTime by domain;
- image lazy loading;
- media on demand;
- autosave batching;
- virtualize only genuinely long lists;
- indexes from SQL kit;
- avoid N+1 queries;
- use release snapshot for player read model.

---

## 26. Этапы разработки

### Этап 1 — foundation

- scaffold;
- auth;
- router;
- providers;
- design system;
- organization context;
- generated DB types.

### Этап 2 — course CRUD

- courses;
- modules;
- lessons;
- curriculum;
- permissions.

### Этап 3 — lesson builder

- block registry;
- Tiptap;
- exercises;
- assets;
- autosave;
- preview.

### Этап 4 — publishing

- validation;
- release snapshot;
- history;
- current release.

### Этап 5 — learning

- learner;
- enrollment;
- attempt;
- progress;
- grading;
- standalone player.

### Этап 6 — integrations

- integration clients;
- API keys;
- origins;
- course access;
- Edge Functions;
- embed player;
- postMessage.

### Этап 7 — webhooks and analytics

- queue;
- signing;
- retry;
- dashboard metrics.

---

## 27. Не входит в MVP

- payments;
- subscriptions;
- marketplace;
- certificates;
- live video;
- chat;
- AI generation;
- speech recognition;
- teacher review workflow;
- advanced gamification;
- native mobile app;
- SCORM/xAPI;
- full offline mode.

---

## 28. Definition of Done

MVP готов, когда:

1. Пользователь регистрируется.
2. Создаётся личная организация.
3. Пользователь создаёт курс.
4. Создаёт модули и уроки.
5. Использует минимум пять типов блоков.
6. Создаёт автоматически проверяемое упражнение.
7. Загружает asset.
8. Предпросматривает desktop/mobile/embed.
9. Публикует immutable release.
10. Редактирование draft не меняет release.
11. Создаётся integration client.
12. Настраивается allowed origin.
13. Выдаётся course access.
14. API-key показывается один раз.
15. В базе хранится только hash.
16. Внешний backend создаёт embed session.
17. Token не находится в URL.
18. iframe инициализируется postMessage.
19. Player не получает privateContent.
20. Ответ проверяется server-side.
21. Прогресс сохраняется.
22. Parent получает progress.
23. Урок завершается.
24. Создаётся webhook event.
25. Прогресс восстанавливается.
26. RLS блокирует чужую организацию.
27. External app не имеет прямого DB access.
28. UI работает от 320 px.
29. Есть dark mode.
30. lint, typecheck, unit, E2E и build проходят.

---

## 29. Правила работы Codex

1. Сначала прочитать все документы комплекта.
2. Применить SQL в указанном порядке.
3. После применения не редактировать migration; создавать новую.
4. Не добавлять Calendar-specific поля без универсального назначения.
5. Не использовать service role во frontend.
6. Не передавать embed token в URL.
7. Не возвращать privateContent ученику.
8. Не хранить raw API-key или raw embed token.
9. Не обходить API внешней интеграцией.
10. Документировать значимые решения в `docs/decisions`.
11. После каждого этапа запускать lint, typecheck, tests, build.
12. При неоднозначности выбирать безопасную и расширяемую реализацию, не ломая независимость платформы.
