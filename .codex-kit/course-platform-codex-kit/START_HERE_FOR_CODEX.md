# Стартовая инструкция для Codex

Используй этот текст как первый запрос в Codex:

```text
Создай новый production-ready проект Course Platform по документу CODEX_SPEC.md.

Перед началом обязательно прочитай:
- README.md
- CODEX_SPEC.md
- INTEGRATION_PROTOCOL.md
- SUPABASE_SETUP.md
- SUPABASE_SCHEMA.md
- PACKAGE_STACK.md

SQL-файлы находятся в supabase/sql и должны применяться строго по порядку. Не меняй уже применённые migration-файлы: для исправлений создавай новые.

Критические ограничения:
1. Платформа полностью независима от Calendar.
2. Внешние приложения не имеют прямого доступа к Supabase Data API.
3. Service role запрещён во frontend.
4. Правильные ответы не должны попадать в learner/embed payload.
5. API-key и embed token хранятся только в виде hash.
6. Embed token нельзя передавать через URL.
7. iframe инициализируется через postMessage protocol 1.0.
8. Авторский server state хранится в TanStack Query, а Pinia используется только для client/UI state.
9. Сначала реализуй foundation и auth, затем course CRUD, lesson builder, publishing, learning, integrations и webhooks.
10. После каждого этапа выполняй lint, typecheck, tests и build.

Начни с:
- создания Vite + Vue 3 + TypeScript проекта;
- установки пакетов из PACKAGE_STACK.md;
- настройки архитектуры каталогов;
- подключения Supabase;
- генерации database types;
- реализации auth и organization context.

Не пытайся реализовать весь продукт одним большим компонентом или одним коммитом. Разделяй работу по этапам из ТЗ и документируй архитектурные решения.
```
