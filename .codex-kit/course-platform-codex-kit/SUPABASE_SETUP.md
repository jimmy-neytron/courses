# Настройка Supabase

## 1. Проект

Создай отдельный Supabase-проект для Course Platform. Не используй проект основного Calendar.

## 2. SQL

В Supabase открой **SQL Editor** и выполни файлы строго по порядку:

1. `00_extensions_and_types.sql`
2. `01_core.sql`
3. `02_course_content.sql`
4. `03_learning.sql`
5. `04_integrations.sql`
6. `05_functions_and_triggers.sql`
7. `06_rls.sql`
8. `07_storage.sql`
9. `08_views.sql`

Если какой-либо файл уже применён, последующие изменения оформляй новым migration-файлом, а не редактированием применённого SQL.

## 3. Auth

Настрой:

- Site URL;
- разрешённые Redirect URLs;
- подтверждение email;
- восстановление пароля;
- SMTP при переходе из разработки в production.

После регистрации триггер создаёт профиль, learner-профиль, личную организацию и membership с ролью `owner`.

## 4. Storage

Создаются приватные buckets:

- `course-covers` — максимум 10 МБ;
- `lesson-assets` — максимум 200 МБ.

Путь должен начинаться с UUID организации:

```text
<organizationId>/<courseId>/<fileId>.<ext>
<organizationId>/<courseId>/<lessonId>/<fileId>.<ext>
```

Ученики во внешнем iframe не получают прямого доступа к Storage. Edge Function выдаёт короткоживущие signed URLs.

## 5. Frontend environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_APP_URL=http://localhost:5173
VITE_DEFAULT_LOCALE=ru
```

## 6. Edge Functions secrets

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COURSE_APP_URL=
WEBHOOK_SIGNING_PEPPER=
```

Service role запрещено передавать во frontend.

## 7. Edge Functions, которые должен реализовать Codex

- `integration-courses`;
- `integration-course`;
- `embed-session-create`;
- `embed-session-exchange`;
- `lesson-answer-submit`;
- `lesson-progress-get`;
- `lesson-progress-save`;
- `lesson-complete`;
- `storage-signed-url`;
- `webhook-dispatch`.

## 8. Smoke-check после установки

1. Зарегистрировать тестового пользователя.
2. Проверить записи в `profiles`, `learners`, `organizations`, `organization_members`.
3. Создать курс, модуль, урок и блок.
4. Убедиться, что другой пользователь не видит данные организации.
5. Опубликовать курс через `publish_course`.
6. Создать интеграцию и API-ключ.
7. Проверить, что raw API-key показывается только один раз.
