# Схема Supabase

## Ядро

- `profiles` — профиль Supabase Auth пользователя.
- `organizations` — независимое пространство автора/команды.
- `organization_members` — membership и роли.
- `audit_logs` — журнал значимых административных действий.

## Контент

- `courses` — редактируемый черновик курса.
- `course_modules` — модули.
- `lessons` — уроки.
- `lesson_blocks` — блоки урока; публичная и приватная части разделены.
- `course_releases` — неизменяемые snapshots опубликованных версий.

## Обучение

- `learners` — внутренние и внешние ученики.
- `course_enrollments` — запись на курс и общий прогресс.
- `lesson_attempts` — попытки прохождения урока.
- `lesson_block_progress` — ответы и прогресс по блокам.
- `learner_notes` — личные заметки внутреннего ученика.

## Интеграции

- `integration_clients` — внешние приложения.
- `integration_course_access` — какие курсы доступны клиенту.
- `integration_api_keys` — только prefix и SHA-256 hash API-ключа.
- `learner_external_identities` — связь external user с learner.
- `embed_sessions` — короткоживущие iframe-сессии; только token hash.
- `idempotency_keys` — защита mutation API от повторной обработки.
- `webhook_events` — очередь событий.
- `webhook_deliveries` — история попыток доставки.

## Основные связи

```text
organization
  ├── members
  ├── courses
  │    ├── modules
  │    │    └── lessons
  │    │         └── lesson_blocks
  │    └── course_releases
  └── integration_clients
       ├── integration_course_access ── course
       ├── integration_api_keys
       ├── learner_external_identities ── learner
       ├── embed_sessions ── learner/course/release/lesson
       └── webhook_events
             └── webhook_deliveries

learner
  └── course_enrollments
       └── lesson_attempts
            └── lesson_block_progress
```

## Защита правильных ответов

`lesson_blocks.private_content` и приватная часть release snapshot доступны только участникам авторской организации и service role. Внешний Player получает данные только через Edge Function, которая удаляет `privateContent`.

## Публикация

`courses`, `course_modules`, `lessons`, `lesson_blocks` — изменяемый draft.

`course_releases` — immutable snapshot. Для него намеренно отсутствуют update/delete RLS policies.

## Важное ограничение

SQL создаёт базу, функции и RLS, но безопасную выдачу learner payload, проверку ответов, rate limiting, API-key validation, шифрование webhook secret и signed URLs должен реализовать Codex в Edge Functions.
