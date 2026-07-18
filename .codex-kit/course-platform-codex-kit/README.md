# Course Platform — комплект для Codex

Готовая спецификация независимой платформы создания и прохождения курсов.

## Состав

- `CODEX_SPEC.md` — полное техническое задание.
- `INTEGRATION_PROTOCOL.md` — API, iframe, postMessage и webhooks.
- `SUPABASE_SETUP.md` — порядок настройки Supabase.
- `SUPABASE_SCHEMA.md` — описание таблиц и связей.
- `.env.example` — переменные окружения frontend.
- `supabase/sql/*.sql` — SQL-файлы для последовательного запуска в Supabase SQL Editor.

## Порядок SQL

1. `00_extensions_and_types.sql`
2. `01_core.sql`
3. `02_course_content.sql`
4. `03_learning.sql`
5. `04_integrations.sql`
6. `05_functions_and_triggers.sql`
7. `06_rls.sql`
8. `07_storage.sql`
9. `08_views.sql`

## Архитектурный принцип

Course Platform полностью независима от Calendar и других продуктов. Внешние приложения работают только через Edge Functions, короткоживущие embed-сессии, iframe, postMessage и webhooks. Прямой доступ внешних приложений к таблицам Supabase запрещён.
