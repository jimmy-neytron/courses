# Подключение Supabase

## 1. Создайте отдельный проект

Откройте https://supabase.com/dashboard, нажмите **New project** и создайте отдельный проект для Course Platform.

## 2. Примените схему

В проекте Supabase откройте **SQL Editor → New query**. Скопируйте и выполните содержимое файлов строго по порядку:

1. `supabase/sql/00_extensions_and_types.sql`
2. `supabase/sql/01_core.sql`
3. `supabase/sql/02_course_content.sql`
4. `supabase/sql/03_learning.sql`
5. `supabase/sql/04_integrations.sql`
6. `supabase/sql/05_functions_and_triggers.sql`
7. `supabase/sql/06_rls.sql`
8. `supabase/sql/07_storage.sql`
9. `supabase/sql/08_views.sql`

Для нового пустого проекта можно вместо этого один раз выполнить `supabase/ALL_IN_ONE.sql`.

## 3. Возьмите публичные параметры

Откройте **Project Settings → API** (в новом интерфейсе: **Connect**):

- Project URL;
- Publishable key (`anon` key в старом интерфейсе).

Никогда не помещайте `service_role` key во frontend.

## 4. Создайте `.env`

Скопируйте `.env.example` в `.env` и заполните:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_APP_URL=http://localhost:5173
VITE_DEFAULT_LOCALE=ru
```

После изменения `.env` перезапустите `pnpm dev`.

## 5. Настройте Auth

В **Authentication → URL Configuration** задайте:

- Site URL: `http://localhost:5173`;
- Redirect URLs: `http://localhost:5173/**`.

В production добавьте URL вашего домена. Email confirmation можно отключить только на время локальной разработки.

## 6. Проверка

После регистрации SQL-trigger автоматически создаст `profiles`, `learners`, личную `organizations` и membership с ролью `owner`. Проверьте эти таблицы в Table Editor.

## Важно

- Frontend использует только publishable key и RLS.
- Service role хранится только в Supabase Edge Functions.
- Внешние приложения не обращаются к таблицам напрямую.
- Raw API keys и embed tokens в базе не хранятся — только SHA-256 hash.
- Embed token передаётся через `postMessage`, не через URL.