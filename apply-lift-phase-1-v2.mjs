#!/usr/bin/env node

/**
 * LIFT Phase 1 v2
 *
 * Исправляет архитектуру сохранения редактора:
 * - dirty-state сравнивает фактический Supabase payload;
 * - в запрос отправляется тот же immutable payload, который fingerprint'ится;
 * - внешние audioUrl/fileUrl учитываются сериализатором корректно;
 * - repository и editor больше не дублируют состав сохраняемых полей;
 * - патч ищет функции по имени и границам тела, а не по точному форматированию.
 *
 * Совместим с ранее применёнными:
 * - course-state-fix.mjs
 * - apply-manual-lesson-save.mjs
 * - fix-plain-block-html.mjs
 * - fix-editor-dirty-state.mjs
 *
 * Запуск:
 *   node apply-lift-phase-1-v2.mjs
 *
 * Или:
 *   node apply-lift-phase-1-v2.mjs /path/to/courses
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? process.cwd())

const paths = {
  editor: 'src/composables/useLessonEditor.ts',
  store: 'src/stores/courses.ts',
  repository: 'src/services/course-repository.service.ts',
  persistence: 'src/services/lesson-persistence.service.ts',
}

const persistenceService = `import type {
  Lesson,
  LessonBlock,
} from '@/types/course'
import {
  serializePrivateBlockContent,
  serializePublicBlockContent,
} from '@/services/lesson-block-content.service'

export interface LessonUpdatePayload {
  title: string
  duration_minutes: number
  status: 'published' | 'draft'
}

export interface LessonBlockUpdatePayload {
  title: string
  public_content: Record<string, unknown>
  private_content: Record<string, unknown>
  is_required: boolean
  schema_version: number
}

/**
 * Единственный источник истины для обновления урока.
 */
export function createLessonUpdatePayload(
  lesson: Lesson,
): LessonUpdatePayload {
  return {
    title: lesson.title,
    duration_minutes: lesson.duration,
    status: lesson.status === 'Опубликован'
      ? 'published'
      : 'draft',
  }
}

/**
 * Единственный источник истины для обновления блока.
 *
 * Сериализаторы самостоятельно:
 * - сохраняют external audioUrl/fileUrl при отсутствии storage path;
 * - не сохраняют временный signed URL при наличии storage path.
 */
export function createLessonBlockUpdatePayload(
  block: LessonBlock,
): LessonBlockUpdatePayload {
  return {
    title: block.title,
    public_content: serializePublicBlockContent(block),
    private_content: serializePrivateBlockContent(block),
    is_required: block.required,
    schema_version: block.schemaVersion ?? 1,
  }
}

function normalizeSerializable(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeSerializable)
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>

    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>(
        (result, key) => {
          const normalized = normalizeSerializable(
            source[key],
          )

          if (normalized !== undefined) {
            result[key] = normalized
          }

          return result
        },
        {},
      )
  }

  return value
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeSerializable(value))
}

export function fingerprintLessonPayload(
  payload: LessonUpdatePayload,
): string {
  return stableSerialize(payload)
}

export function fingerprintLessonBlockPayload(
  payload: LessonBlockUpdatePayload,
): string {
  return stableSerialize(payload)
}

export function fingerprintLesson(
  lesson: Lesson,
): string {
  return fingerprintLessonPayload(
    createLessonUpdatePayload(lesson),
  )
}

export function fingerprintLessonBlock(
  block: LessonBlock,
): string {
  return fingerprintLessonBlockPayload(
    createLessonBlockUpdatePayload(block),
  )
}
`

const saveChangesFunction = `  async function saveChanges(): Promise<boolean> {
    if (!found.value) return false
    if (!dirty.value) return true
    if (saving.value) return false

    const lessonId = found.value.lesson.id
    const jobs: SaveJob[] = []

    if (
      currentLessonSnapshot.value
      !== savedLessonSnapshot.value
    ) {
      const payload = createLessonUpdatePayload(
        found.value.lesson,
      )
      const snapshot = fingerprintLessonPayload(payload)

      jobs.push({
        kind: 'lesson',
        snapshot,
        run: () => store.saveLesson(
          lessonId,
          payload,
        ),
      })
    }

    for (const blockId of dirtyBlockIds.value) {
      const block = blocks.value.find(
        (item) => item.id === blockId,
      )

      if (!block) continue

      const payload = createLessonBlockUpdatePayload(block)
      const snapshot = fingerprintLessonBlockPayload(
        payload,
      )

      jobs.push({
        kind: 'block',
        blockId,
        snapshot,
        run: () => store.saveBlock(
          lessonId,
          blockId,
          payload,
        ),
      })
    }

    if (!jobs.length) return true

    saving.value = true
    editorError.value = ''

    try {
      const results = await Promise.allSettled(
        jobs.map((job) => job.run()),
      )

      const failedResults: PromiseRejectedResult[] = []

      results.forEach((result, index) => {
        const job = jobs[index]

        if (!job) return

        if (result.status === 'rejected') {
          failedResults.push(result)
          return
        }

        if (job.kind === 'lesson') {
          savedLessonSnapshot.value = job.snapshot
        } else {
          savedBlockSnapshots.set(
            job.blockId,
            job.snapshot,
          )
        }
      })

      if (failedResults.length) {
        setError(
          failedResults[0]?.reason,
          failedResults.length === jobs.length
            ? 'Не удалось сохранить изменения'
            : 'Часть изменений не удалось сохранить',
        )

        return false
      }

      showSaved()
      notifications.success('Изменения сохранены')

      return true
    } finally {
      saving.value = false
    }
  }`

const toggleLessonStatusFunction = `  async function toggleLessonStatus(): Promise<void> {
    if (!found.value) return

    if (dirty.value) {
      const successfullySaved = await saveChanges()

      if (!successfullySaved) return
    }

    const previousStatus = found.value.lesson.status

    found.value.lesson.status = (
      previousStatus === 'Опубликован'
        ? 'Черновик'
        : 'Опубликован'
    )

    const payload = createLessonUpdatePayload(
      found.value.lesson,
    )
    const statusSnapshot = fingerprintLessonPayload(
      payload,
    )

    try {
      await store.saveLesson(
        found.value.lesson.id,
        payload,
      )

      savedLessonSnapshot.value = statusSnapshot

      showSaved()

      notifications.success(
        found.value.lesson.status === 'Опубликован'
          ? 'Урок опубликован'
          : 'Урок возвращён в черновик',
      )
    } catch (error) {
      found.value.lesson.status = previousStatus
      setError(error, 'Не удалось изменить статус урока')
    }
  }`

const storeSaveLessonFunction = `  async function saveLesson(
    lessonId: string,
    payload?: LessonUpdatePayload,
  ): Promise<void> {
    if (!isSupabaseConfigured) return

    const lesson = findLesson(lessonId)?.lesson
    const updatePayload = payload
      ?? (lesson
        ? createLessonUpdatePayload(lesson)
        : undefined)

    if (!updatePayload) return

    await updateLessonRecord(
      lessonId,
      updatePayload,
    )
  }`

const storeSaveBlockFunction = `  async function saveBlock(
    lessonId: string,
    blockId: string,
    payload?: LessonBlockUpdatePayload,
  ): Promise<void> {
    if (!isSupabaseConfigured) return

    const block = findLesson(lessonId)
      ?.lesson.blocks.find(
        (item) => item.id === blockId,
      )

    const updatePayload = payload
      ?? (block
        ? createLessonBlockUpdatePayload(block)
        : undefined)

    if (!updatePayload) return

    await updateBlockRecord(
      blockId,
      updatePayload,
    )
  }`

const repositoryUpdateLessonFunction = `export async function updateLessonRecord(
  lessonId: string,
  payload: LessonUpdatePayload,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lessons')
    .update(payload)
    .eq('id', lessonId)

  if (error) throw error
}`

const repositoryUpdateBlockFunction = `export async function updateBlockRecord(
  blockId: string,
  payload: LessonBlockUpdatePayload,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .update(payload)
    .eq('id', blockId)

  if (error) throw error
}`

function normalize(value) {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
}

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function fail(message) {
  console.error(`\nОшибка: ${message}`)
  process.exit(1)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Возвращает конец тела функции с учётом строк и комментариев.
 */
function findFunctionEnd(source, bodyStart) {
  let depth = 0
  let quote = ''
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === quote) {
        quote = ''
      }

      continue
    }

    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }

    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return index + 1
      }
    }
  }

  throw new Error(
    'Не удалось определить конец функции',
  )
}

function replaceNamedFunction(
  source,
  functionName,
  replacement,
) {
  const pattern = new RegExp(
    `(?:export\\s+)?async\\s+function\\s+${escapeRegExp(functionName)}\\b`,
  )

  const match = pattern.exec(source)

  if (!match) {
    if (source.includes(replacement.trim())) {
      return source
    }

    throw new Error(
      `Не найдена функция ${functionName}`,
    )
  }

  const start = match.index
  const bodyStart = source.indexOf('{', start)

  if (bodyStart === -1) {
    throw new Error(
      `Не найдено тело функции ${functionName}`,
    )
  }

  const end = findFunctionEnd(source, bodyStart)

  return (
    source.slice(0, start)
    + replacement
    + source.slice(end)
  )
}

function insertImportBefore(
  source,
  marker,
  importText,
) {
  if (source.includes(importText.trim())) {
    return source
  }

  const index = source.indexOf(marker)

  if (index === -1) {
    throw new Error(
      `Не найден импорт-маркер: ${marker}`,
    )
  }

  return (
    source.slice(0, index)
    + importText
    + source.slice(index)
  )
}

function removeEditorSnapshotHelpers(source) {
  const start = source.indexOf(
    'function normalizeSnapshotValue',
  )
  const end = source.indexOf(
    'export function useLessonEditor()',
  )

  if (start === -1 || end === -1 || end <= start) {
    if (
      source.includes('fingerprintLessonBlock')
      && !source.includes('serializeBlock(')
    ) {
      return source
    }

    throw new Error(
      'Не найден блок локальных snapshot helpers',
    )
  }

  return source.slice(0, start) + source.slice(end)
}

function writeAtomic(filePath, content) {
  const temporaryPath = `${filePath}.lift-v2.tmp`

  writeFileSync(temporaryPath, content, 'utf8')

  try {
    renameSync(temporaryPath, filePath)
  } catch (error) {
    rmSync(temporaryPath, { force: true })
    throw error
  }
}

const packagePath = join(root, 'package.json')

if (!existsSync(packagePath)) {
  fail(
    'Не найден package.json. Запусти скрипт '
    + 'из корня проекта или передай путь первым аргументом.',
  )
}

for (const key of ['editor', 'store', 'repository']) {
  const absolutePath = join(root, paths[key])

  if (!existsSync(absolutePath)) {
    fail(`Не найден файл: ${paths[key]}`)
  }
}

const current = {
  editor: normalize(
    readFileSync(join(root, paths.editor), 'utf8'),
  ),
  store: normalize(
    readFileSync(join(root, paths.store), 'utf8'),
  ),
  repository: normalize(
    readFileSync(join(root, paths.repository), 'utf8'),
  ),
  persistence: existsSync(join(root, paths.persistence))
    ? normalize(
        readFileSync(
          join(root, paths.persistence),
          'utf8',
        ),
      )
    : '',
}

const alreadyApplied = (
  current.persistence.includes(
    'fingerprintLessonBlockPayload',
  )
  && current.editor.includes(
    'createLessonBlockUpdatePayload',
  )
  && current.store.includes(
    'payload?: LessonBlockUpdatePayload',
  )
  && current.repository.includes(
    'payload: LessonBlockUpdatePayload',
  )
)

if (alreadyApplied) {
  console.log('LIFT Phase 1 v2 уже применён.')
  process.exit(0)
}

const supportedVersion = (
  current.editor.includes('savedLessonSnapshot')
  && current.editor.includes('dirtyBlockIds')
  && current.editor.includes('Promise.allSettled')
  && current.store.includes(
    'async function saveLesson',
  )
  && current.repository.includes(
    'export async function updateBlockRecord',
  )
)

if (!supportedVersion) {
  fail(
    'Текущие файлы не похожи на ожидаемую версию '
    + 'после предыдущих исправлений. Ничего не изменено.',
  )
}

const next = { ...current }

try {
  // Editor imports.
  next.editor = next.editor.replace(
    /import\s*\{\s*normalizeRichText,\s*richTextToPlainText,\s*\}\s*from\s*['"]@\/components\/common\/richText['"]\s*\n/,
    '',
  )

  next.editor = insertImportBefore(
    next.editor,
    "import { useCourseStore } from '@/stores/courses'",
    `import {
  createLessonBlockUpdatePayload,
  createLessonUpdatePayload,
  fingerprintLesson,
  fingerprintLessonBlock,
  fingerprintLessonBlockPayload,
  fingerprintLessonPayload,
} from '@/services/lesson-persistence.service'
`,
  )

  // Lesson type was only needed by removed local serializer.
  next.editor = next.editor.replace(
    /^\s*Lesson,\s*\n/m,
    '',
  )

  next.editor = removeEditorSnapshotHelpers(
    next.editor,
  )

  next.editor = next.editor
    .replaceAll(
      'serializeLesson(',
      'fingerprintLesson(',
    )
    .replaceAll(
      'serializeBlock(',
      'fingerprintLessonBlock(',
    )

  next.editor = replaceNamedFunction(
    next.editor,
    'saveChanges',
    saveChangesFunction,
  )

  next.editor = replaceNamedFunction(
    next.editor,
    'toggleLessonStatus',
    toggleLessonStatusFunction,
  )

  // Store imports and functions.
  next.store = insertImportBefore(
    next.store,
    "import { useAuthStore } from '@/stores/auth'",
    `import {
  createLessonBlockUpdatePayload,
  createLessonUpdatePayload,
  type LessonBlockUpdatePayload,
  type LessonUpdatePayload,
} from '@/services/lesson-persistence.service'
`,
  )

  next.store = replaceNamedFunction(
    next.store,
    'saveLesson',
    storeSaveLessonFunction,
  )

  next.store = replaceNamedFunction(
    next.store,
    'saveBlock',
    storeSaveBlockFunction,
  )

  // Repository imports and functions.
  next.repository = insertImportBefore(
    next.repository,
    "import { requireSupabase } from '@/services/supabase'",
    `import type {
  LessonBlockUpdatePayload,
  LessonUpdatePayload,
} from '@/services/lesson-persistence.service'
`,
  )

  next.repository = replaceNamedFunction(
    next.repository,
    'updateLessonRecord',
    repositoryUpdateLessonFunction,
  )

  next.repository = replaceNamedFunction(
    next.repository,
    'updateBlockRecord',
    repositoryUpdateBlockFunction,
  )

  // Lesson type is no longer used by repository update.
  next.repository = next.repository.replace(
    /^\s*Lesson,\s*\n/m,
    '',
  )

  next.persistence = persistenceService
} catch (error) {
  fail(
    `${error instanceof Error ? error.message : String(error)}\n`
    + 'Скрипт ничего не изменил.',
  )
}

const changed = Object.keys(next).filter(
  (key) => next[key] !== current[key],
)

if (!changed.length) {
  console.log('Изменения не требуются.')
  process.exit(0)
}

const backupDirectory = join(
  root,
  `.lift-phase-1-v2-backup-${timestamp()}`,
)

mkdirSync(backupDirectory, {
  recursive: true,
})

for (const key of changed) {
  const relativePath = paths[key]
  const sourcePath = join(root, relativePath)

  if (!existsSync(sourcePath)) continue

  const backupPath = join(
    backupDirectory,
    relativePath,
  )

  mkdirSync(dirname(backupPath), {
    recursive: true,
  })

  copyFileSync(sourcePath, backupPath)
}

try {
  for (const key of changed) {
    const targetPath = join(root, paths[key])

    mkdirSync(dirname(targetPath), {
      recursive: true,
    })

    writeAtomic(targetPath, next[key])
  }
} catch (error) {
  console.error(
    '\nОшибка записи. Восстанавливаю резервные копии.',
  )

  for (const key of changed) {
    const relativePath = paths[key]
    const backupPath = join(
      backupDirectory,
      relativePath,
    )
    const targetPath = join(root, relativePath)

    if (existsSync(backupPath)) {
      copyFileSync(backupPath, targetPath)
    } else {
      rmSync(targetPath, { force: true })
    }
  }

  throw error
}

console.log('\nГотово. LIFT Phase 1 v2 применён.')
console.log('\nИзменены файлы:')

for (const key of changed) {
  console.log(`  - ${paths[key]}`)
}

console.log(`\nРезервная копия: ${backupDirectory}`)
console.log('\nПроверь проект:')
console.log('  npm run typecheck')
console.log('  npm run build')
console.log('\nПроверка поведения:')
console.log('  1. Напиши текст и верни исходное значение.')
console.log('  2. Измени внешний audioUrl/fileUrl.')
console.log('  3. Меняй блок во время выполняющегося save.')
console.log('  4. Проверь частичную ошибку одного запроса.')
