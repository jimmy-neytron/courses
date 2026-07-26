# Комплексный патч Course Platform

Пакет рассчитан на ветку `master` после коммита
`3d7ca8af50a340ce80f4dfa4113f28bc5664b9f4`.

## Что исправляется

- ученик и гость больше не получают `lesson_blocks.private_content`;
- правильный ответ проверяется через Supabase RPC;
- публикация и возврат в черновик выполняются транзакционно;
- дублирование модулей и уроков выполняется транзакционно;
- сортировка курса и блоков выполняется одним RPC;
- удаление сначала фиксируется в БД, затем очищается Storage;
- неудачная очистка Storage остаётся в `storage_cleanup_queue`;
- чистая логика разделов переносится из composable в domain;
- Supabase-кэш больше не сохраняет детальные блоки;
- добавляются ESLint, Prettier, Vitest и GitHub Actions;
- добавляются базовые unit-тесты persistence и sections.

## Применение

1. Создайте резервную копию Supabase.
2. Положите `apply-courses-comprehensive-fix.mjs` в корень проекта.
3. Выполните:

```bash
node apply-courses-comprehensive-fix.mjs
npm install
npm run format
npm run check
```

4. Откройте Supabase → SQL Editor.
5. Выполните целиком файл:

```text
supabase/sql/15_security_transactions_and_quiz.sql
```

6. Перезапустите приложение и выполните ручные проверки из вывода скрипта.

## Важно

Frontend-патч и SQL должны быть применены в одном релизе. Новый frontend
использует RPC, создаваемые миграцией `15`.
