# Курсор

Самодостаточное веб-приложение для создания, публикации и прохождения курсов на любую тему. Языковые курсы — один из профилей продукта, а не отдельная сущность или отдельная база.

Этот `README.md` — единственный актуальный источник документации проекта. Схема ниже описывает фактические таблицы текущего Supabase-проекта. SQL из выгрузки Supabase, помеченный как context only, нельзя выполнять как миграцию.

## Что уже работает

- Каталог собственных и доступных пользователю курсов.
- Универсальный пустой курс и языковой профиль с уровнями.
- Создание, настройка, публикация и удаление курса.
- Приглашение ученика по коду курса.
- Модули и уроки с drag-and-drop сортировкой.
- Мгновенное дублирование уроков и модулей.
- Массовое выделение уроков: удержание включает выбор, `Shift + клик` выбирает диапазон.
- Редактор урока из блоков, настройка разделов и живой предпросмотр.
- Текст, теория, PDF, аудио, карточки, диалоги, практика и тестовые блоки.
- Отдельный полноэкранный режим прохождения курса и урока.
- Глобальные уведомления о действиях.
- Локальный режим без Supabase для разработки интерфейса.

Календарь и расписание пока не реализованы. Существующая модель интеграций позволяет позже выдать внешней системе доступ к курсу и запускать урок по стабильному URL, не добавляя календарные таблицы в само приложение раньше времени.

## Технологии

- Vue 3 и Composition API
- TypeScript
- Vite 7
- Pinia
- Vue Router
- Supabase Auth, Postgres и Storage
- `vue-draggable-plus`
- Lucide icons
- Собственные UI-компоненты и CSS без UI-фреймворка

## Быстрый запуск

Требуется Node.js 20.19+.

```bash
npm install
npm run dev
```

Приложение откроется на [http://localhost:5173](http://localhost:5173).

Без переменных Supabase приложение запускается в локальном режиме. Курсы сохраняются в `localStorage`; авторизация и серверные роли в этом режиме отключены.

### Команды

```bash
npm run dev        # локальный Vite-сервер
npm run typecheck  # проверка TypeScript
npm run build      # typecheck и production-сборка в dist/
```

## Настройка окружения

Создайте `.env` из `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Используется только публичный publishable/anon key. `service_role` нельзя помещать во frontend или коммитить в репозиторий.

После изменения `.env` перезапустите Vite.

## Маршруты приложения

| Маршрут | Назначение |
|---|---|
| `/app/courses` | каталог курсов |
| `/app/courses/:courseId` | программа и настройки курса |
| `/app/lessons/:lessonId/editor` | редактор урока |
| `/preview/courses/:courseId` | прохождение курса |
| `/preview/lessons/:lessonId` | прохождение отдельного урока |
| `/app/integrations` | состояние подключения Supabase |
| `/app/settings` | профиль и настройки рабочего пространства |
| `/auth` | вход и регистрация |

`/` и `/app` перенаправляются на `/app/courses`. Если Supabase настроен, закрытые маршруты требуют авторизованную сессию.

## Структура проекта

```text
src/
├─ assets/styles/  глобальные стили и стили экранов
├─ components/     UI, курс, редактор и проигрыватель урока
├─ composables/    сценарии экранов и переиспользуемое состояние
├─ data/           небольшие определения шаблонов
├─ layouts/        обычный и полноэкранный layout
├─ pages/          страницы, соответствующие маршрутам
├─ router/         маршруты и auth guard
├─ services/       Supabase, mapper, файлы и persistence
├─ stores/         Pinia: auth, курсы, layout, уведомления
├─ types/          доменные TypeScript-типы
└─ utils/          чистые вспомогательные функции
```

Границы ответственности следуют LIFT:

- Экран собирает готовые компоненты и вызывает composable.
- Composable хранит состояние пользовательского сценария.
- Store координирует реактивные данные приложения.
- Service выполняет запросы и инфраструктурные операции.
- Mapper переводит строки базы в универсальную доменную модель.
- UI-компоненты не знают о Supabase.

## Модель курса

Основная иерархия одинакова для любых направлений:

```text
Course
└─ CourseModule[]
   └─ Lesson[]
      └─ LessonBlock[]
```

Тип курса не требует отдельной таблицы:

- `general` — универсальный курс; в БД `language_code` хранит техническое значение `und`, уровни пустые.
- `language` — языковой курс; заполнены язык и, при необходимости, начальный/целевой уровни.

Шаблоны создают только начальные настройки. Контент курса всегда хранится в обычных `courses`, `course_modules`, `lessons` и `lesson_blocks`.

## Supabase

### Подключение существующего проекта

1. В Supabase откройте **Project Settings → API** или **Connect**.
2. Перенесите Project URL и publishable key в `.env`.
3. В **Authentication → URL Configuration** задайте локальный Site URL `http://localhost:5173` и Redirect URL `http://localhost:5173/**`.
4. Убедитесь, что включены RLS-политики и доступны RPC, перечисленные ниже.
5. Перезапустите `npm run dev`.

### Разворачивание пустого проекта

Исполняемые SQL-файлы находятся в `supabase/sql/`. Применяйте их по порядку:

1. `00_extensions_and_types.sql`
2. `01_core.sql`
3. `02_course_content.sql`
4. `03_learning.sql`
5. `04_integrations.sql`
6. `05_functions_and_triggers.sql`
7. `06_rls.sql`
8. `07_storage.sql`
9. `08_views.sql`
10. `09_remove_learners_and_analytics.sql`
11. `10_course_access_roles.sql`

Файлы `03` и `09` отражают историю перехода от расширенной learner-модели к текущей компактной базе; для новой базы применяется вся цепочка. Не запускайте эту цепочку поверх рабочего production-проекта без резервной копии и просмотра diff схемы.

### RPC, необходимые frontend

| RPC | Использование |
|---|---|
| `publish_course(course_id, changelog)` | создаёт release и публикует курс |
| `join_course_by_code(code)` | добавляет текущего пользователя в курс как ученика |
| `regenerate_course_invite(course_id)` | обновляет код приглашения автора |

Регистрация пользователя также должна создавать `profiles`, личную организацию и membership организации через trigger базы.

### Storage

Frontend использует приватный bucket `lesson-assets` для аудио и PDF. Путь имеет форму:

```text
{organizationId}/{courseId}/{lessonId}/{blockId}/{fileName}
```

Чтение выполняется через временные signed URL. Допустимые аудиофайлы: MP3, M4A, OGG и WAV до 50 МБ. PDF проверяется по MIME/расширению и ограничен 100 МБ.

## Фактическая база данных

Текущий Supabase содержит 17 прикладных таблиц. `auth.users` принадлежит Supabase Auth и не входит в это число.

```mermaid
flowchart LR
  AU["auth.users"] --> P["profiles"]
  P --> O["organizations"]
  O --> OM["organization_members"]
  P --> OM
  O --> C["courses"]
  P --> C
  C --> M["course_modules"]
  M --> L["lessons"]
  L --> B["lesson_blocks"]
  C --> R["course_releases"]
  C --> CM["course_memberships"]
  P --> CM
  C --> CI["course_invites"]
  O --> IC["integration_clients"]
  IC --> ICA["integration_course_access"]
  C --> ICA
  IC --> K["integration_api_keys"]
  IC --> IK["idempotency_keys"]
  IC --> WE["webhook_events"]
  WE --> WD["webhook_deliveries"]
  O --> AL["audit_logs"]
```

### Пользователи и организации

| Таблица | Назначение | Основные поля и связи |
|---|---|---|
| `profiles` | профиль пользователя приложения | `id → auth.users`, `email`, `display_name`, `avatar_url`, `locale`, `timezone` |
| `organizations` | рабочее пространство | `owner_id → profiles`, уникальный `slug`, `logo_path`, JSON `settings` |
| `organization_members` | участники организации | `organization_id`, `user_id`, enum `role` |
| `audit_logs` | журнал значимых действий | организация, пользователь, действие, тип/ID сущности, JSON `metadata` |

Роли организации: `owner`, `admin`, `editor`, `viewer`.

### Курсы и уроки

| Таблица | Назначение | Основные поля и связи |
|---|---|---|
| `courses` | корень курса | организация, автор, slug, название, язык/уровни, учебный темп, статус, видимость, текущий release |
| `course_modules` | упорядоченные разделы курса | `course_id`, `title`, `description`, `position`, `is_published` |
| `lessons` | упорядоченные уроки модуля | `course_id`, `module_id`, slug, цели, длительность, проходной балл, статус, preview-флаг |
| `lesson_blocks` | содержимое урока | `lesson_id`, тип, позиция, публичный/приватный JSON, настройки, обязательность, баллы, версия схемы |
| `course_releases` | неизменяемые снимки публикаций | курс, версия, JSON `snapshot`, счётчики, changelog, автор и дата публикации |

Статусы курса: `draft`, `published`, `archived`. Видимость: `private`, `unlisted`, `public`. Статусы урока: `draft`, `published`, `archived`.

`lesson_blocks.public_content` содержит данные, доступные ученику. `private_content` хранит правильные ответы и другую авторскую часть. `settings` предназначен для параметров отображения/поведения. Изменение формата сопровождается увеличением `schema_version`.

Типы блоков, разрешённые текущим constraint базы:

```text
heading, rich_text, callout, image, audio, video, file,
vocabulary, flashcards, grammar, example,
single_choice, multiple_choice, text_input, fill_blanks,
matching, ordering, sentence_builder, translation, listening,
open_answer, divider, summary, homework
```

Frontend сейчас предоставляет подмножество этих форматов и отображает их через доменные типы `heading`, `text`, `callout`, `audio`, `pdf`, `grammar`, `vocabulary`, `practice`, `conversation`, `flashcards`, `error_correction`, `translation`, `single_choice`. Преобразование в значения БД централизовано в `lesson-block-content.service.ts`.

### Доступ к курсам

| Таблица | Назначение | Основные поля и связи |
|---|---|---|
| `course_memberships` | участие ученика в курсе | `course_id`, `user_id`, фиксированная роль `learner`, `joined_at` |
| `course_invites` | код присоединения | один код на курс, `created_by`, даты создания/обновления |

Автор определяется через `courses.owner_id`; отдельная membership автора не нужна. Один пользователь может быть автором своих курсов и учеником в чужих.

### Интеграции

| Таблица | Назначение | Основные поля и связи |
|---|---|---|
| `integration_clients` | внешняя система организации | имя, slug, статус, allowed origins, webhook, зашифрованный secret, JSON settings |
| `integration_course_access` | разрешённые интеграции и курсы | `integration_id`, `course_id`, доступ `read` или `launch` |
| `integration_api_keys` | ключи интеграции | prefix, уникальный hash, срок, отзыв, последнее использование; raw key не хранится |
| `idempotency_keys` | защита повторных запросов | scope, request key/hash, сохранённый ответ, блокировка и срок жизни |
| `webhook_events` | очередь исходящих событий | тип, context ID, JSON payload, статус, попытки, даты, последняя ошибка |
| `webhook_deliveries` | история попыток webhook | событие, номер попытки, HTTP-ответ, ошибка и длительность |

Статусы интеграции: `active`, `disabled`. Статусы webhook: `pending`, `processing`, `delivered`, `failed`, `cancelled`.

Сейчас экран интеграций показывает подключение Supabase. API-ключи, webhook delivery worker и календарный адаптер — инфраструктура следующего этапа, а не завершённый пользовательский сценарий.

## Доступ и безопасность

- Все прикладные таблицы должны быть защищены Row Level Security.
- Создатель курса управляет своим курсом, модулями, уроками, блоками, публикациями и приглашением.
- Ученик читает только доступный опубликованный курс и не имеет доступа к редактору.
- Роли организации управляют административными возможностями рабочего пространства и интеграций.
- Правильные ответы не должны попадать в `public_content`.
- В базе хранятся hash API-ключа и зашифрованный webhook secret, но не исходные секреты.
- Storage закрыт; клиент получает signed URL.
- Любые изменения схемы выполняются миграцией и проверяются на тестовом Supabase-проекте до production.

## Как приложение работает с данными

1. `auth.ts` восстанавливает Supabase-сессию и загружает организацию пользователя.
2. `courses.ts` гидратирует Pinia store из Supabase или локального кэша.
3. `course-repository.service.ts` выполняет CRUD и сортировку.
4. `course-mapper.service.ts` переводит строки Supabase в доменные `Course`, `CourseModule`, `Lesson`, `LessonBlock`.
5. Редактор изменяет реактивную модель и сохраняет узкие операции через store/service.
6. Публикация вызывает `publish_course`, который создаёт snapshot в `course_releases`.
7. Проигрыватель использует опубликованный или доступный пользователю курс.

Дублирование сначала оптимистично вставляет копию в UI, затем сохраняет её в Supabase и откатывает временный элемент при ошибке. Массовое удаление уроков удаляет связанные assets и записи уроков; зависимые блоки и прогресс должны обрабатываться внешними ключами текущей схемы.

## Интеграция с календарём в будущем

Само приложение остаётся владельцем курса и контента. Календарь должен хранить расписание у себя и передавать стабильную ссылку:

```text
/preview/lessons/{lessonId}
```

Для встраивания через `iframe` потребуется отдельный launch flow: проверка origin из `integration_clients.allowed_origins`, короткоживущая серверная сессия/токен и политика `Content-Security-Policy frame-ancestors`. Нельзя передавать постоянные API-ключи или секреты в URL. Таблицы расписания в текущей базе отсутствуют и не нужны, пока календарь остаётся внешней системой.

## Проверка перед изменениями

```bash
npm run typecheck
npm run build
```

Перед изменением SQL сделайте резервную копию Supabase и сравните фактическую схему с ожидаемой. Приложенная выгрузка схемы предназначена только для документации: порядок таблиц и constraints в ней не гарантирует исполняемость.