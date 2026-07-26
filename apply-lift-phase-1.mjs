#!/usr/bin/env node

/**
 * LIFT Phase 1: делает dirty-state и сохранение редактора корректными.
 *
 * Основано на courses/master commit:
 * 0afc4d175d796128e9f9a4a050aa265d10dc8dc7
 *
 * Что меняется:
 * 1. Один источник истины для payload и fingerprint сохранения.
 * 2. Dirty-state сравнивает именно те данные, которые уходят в Supabase.
 * 3. Внешние audioUrl/fileUrl больше не теряются при сравнении.
 * 4. Сохранение использует immutable snapshot, а не изменяемый Pinia-объект.
 * 5. Repository и редактор используют одинаковые builders.
 *
 * Совместим с ранее применёнными скриптами:
 * - course-state-fix.mjs
 * - apply-manual-lesson-save.mjs
 * - fix-plain-block-html.mjs
 * - fix-editor-dirty-state.mjs
 *
 * Запуск:
 *   node apply-lift-phase-1.mjs
 *   node apply-lift-phase-1.mjs /path/to/courses
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
 * Создаёт точный payload обновления урока.
 *
 * Этот builder должен использоваться одновременно:
 * - repository при отправке данных;
 * - editor dirty-state при сравнении с сохранённым состоянием.
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
 * Создаёт точный payload обновления блока.
 *
 * В fingerprint входят только реально сохраняемые поля.
 * Подписанные временные URL исключаются сериализатором, а внешние
 * audioUrl/fileUrl сохраняются, если storage path отсутствует.
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

export function fingerprintLesson(
  lesson: Lesson,
): string {
  return stableSerialize(
    createLessonUpdatePayload(lesson),
  )
}

export function fingerprintLessonBlock(
  block: LessonBlock,
): string {
  return stableSerialize(
    createLessonBlockUpdatePayload(block),
  )
}
`

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

function replaceOnce(
  content,
  before,
  after,
  description,
) {
  if (content.includes(after)) {
    return content
  }

  const first = content.indexOf(before)

  if (first === -1) {
    throw new Error(
      `Не найден ожидаемый фрагмент: ${description}`,
    )
  }

  const second = content.indexOf(
    before,
    first + before.length,
  )

  if (second !== -1) {
    throw new Error(
      `Фрагмент найден несколько раз: ${description}`,
    )
  }

  return (
    content.slice(0, first)
    + after
    + content.slice(first + before.length)
  )
}

function removeBetween(
  content,
  startMarker,
  endMarker,
  description,
) {
  const start = content.indexOf(startMarker)
  const end = content.indexOf(endMarker, start)

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Не найден диапазон: ${description}`,
    )
  }

  return content.slice(0, start) + content.slice(end)
}

function writeAtomic(filePath, content) {
  const temporaryPath = `${filePath}.lift-phase-1.tmp`

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
    'Не найден package.json. Запусти скрипт из корня '
    + 'проекта или передай путь первым аргументом.',
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
  current.editor.includes(
    'fingerprintLessonBlock',
  )
  && current.store.includes(
    'source?: LessonBlock',
  )
  && current.repository.includes(
    'createLessonBlockUpdatePayload',
  )
  && current.persistence.includes(
    'createLessonUpdatePayload',
  )
)

if (alreadyApplied) {
  console.log('LIFT Phase 1 уже применён.')
  process.exit(0)
}

const supportedVersion = (
  current.editor.includes('savedLessonSnapshot')
  && current.editor.includes('dirtyBlockIds')
  && current.editor.includes('Promise.allSettled')
  && current.store.includes(
    'async function saveLesson(lessonId: string)',
  )
  && current.repository.includes(
    'export async function updateBlockRecord',
  )
)

if (!supportedVersion) {
  fail(
    'Локальные файлы не соответствуют ожидаемой версии '
    + 'после предыдущих скриптов. Ничего не изменено.',
  )
}

const next = { ...current }

try {
  next.editor = replaceOnce(
    next.editor,
    `import {
  normalizeRichText,
  richTextToPlainText,
} from '@/components/common/richText'
`,
    '',
    'удаление локальной rich-text fingerprint логики',
  )

  next.editor = replaceOnce(
    next.editor,
    `import { filterLessonBlockCatalog } from '@/data/lesson-block-catalog'
`,
    `import { filterLessonBlockCatalog } from '@/data/lesson-block-catalog'
import {
  fingerprintLesson,
  fingerprintLessonBlock,
} from '@/services/lesson-persistence.service'
`,
    'импорт persistence fingerprints',
  )

  next.editor = removeBetween(
    next.editor,
    'function normalizeSnapshotValue',
    'export function useLessonEditor()',
    'локальные serialize/fingerprint helpers',
  )

  next.editor = next.editor
    .replaceAll('serializeLesson(', 'fingerprintLesson(')
    .replaceAll(
      'serializeBlock(',
      'fingerprintLessonBlock(',
    )

  next.editor = replaceOnce(
    next.editor,
    `      const snapshot = currentLessonSnapshot.value

      jobs.push({
        kind: 'lesson',
        snapshot,
        run: () => store.saveLesson(lessonId),
      })`,
    `      const source = structuredClone(
        found.value.lesson,
      )
      const snapshot = fingerprintLesson(source)

      jobs.push({
        kind: 'lesson',
        snapshot,
        run: () => store.saveLesson(
          lessonId,
          source,
        ),
      })`,
    'immutable snapshot урока',
  )

  next.editor = replaceOnce(
    next.editor,
    `      const snapshot = fingerprintLessonBlock(block)

      jobs.push({
        kind: 'block',
        blockId,
        snapshot,
        run: () => store.saveBlock(lessonId, blockId),
      })`,
    `      const source = structuredClone(block)
      const snapshot = fingerprintLessonBlock(source)

      jobs.push({
        kind: 'block',
        blockId,
        snapshot,
        run: () => store.saveBlock(
          lessonId,
          blockId,
          source,
        ),
      })`,
    'immutable snapshot блока',
  )

  next.editor = replaceOnce(
    next.editor,
    `    const statusSnapshot = fingerprintLesson(
      found.value.lesson,
    )

    try {
      await store.saveLesson(found.value.lesson.id)`,
    `    const statusSource = structuredClone(
      found.value.lesson,
    )
    const statusSnapshot = fingerprintLesson(
      statusSource,
    )

    try {
      await store.saveLesson(
        found.value.lesson.id,
        statusSource,
      )`,
    'immutable snapshot статуса урока',
  )

  next.store = replaceOnce(
    next.store,
    `  async function saveLesson(lessonId: string): Promise<void> {
    const lesson = findLesson(lessonId)?.lesson
    if (!lesson || !isSupabaseConfigured) return
    await updateLessonRecord(lessonId, lesson)
  }
  async function saveBlock(lessonId: string, blockId: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const block = findLesson(lessonId)?.lesson.blocks.find((item) => item.id === blockId)
    if (!block) return
    await updateBlockRecord(blockId, block)
  }`,
    `  async function saveLesson(
    lessonId: string,
    source?: Lesson,
  ): Promise<void> {
    const lesson = source
      ?? findLesson(lessonId)?.lesson

    if (!lesson || !isSupabaseConfigured) return

    await updateLessonRecord(lessonId, lesson)
  }

  async function saveBlock(
    lessonId: string,
    blockId: string,
    source?: LessonBlock,
  ): Promise<void> {
    if (!isSupabaseConfigured) return

    const block = source
      ?? findLesson(lessonId)?.lesson.blocks.find(
        (item) => item.id === blockId,
      )

    if (!block) return

    await updateBlockRecord(blockId, block)
  }`,
    'store saveLesson/saveBlock snapshot parameters',
  )

  next.repository = replaceOnce(
    next.repository,
    `import { requireSupabase } from '@/services/supabase'
`,
    `import {
  createLessonBlockUpdatePayload,
  createLessonUpdatePayload,
} from '@/services/lesson-persistence.service'
import { requireSupabase } from '@/services/supabase'
`,
    'repository persistence payload imports',
  )

  next.repository = replaceOnce(
    next.repository,
    `export async function updateLessonRecord(lessonId: string, lesson: Lesson): Promise<void> {
  const { error } = await requireSupabase()
    .from('lessons')
    .update({
      title: lesson.title,
      duration_minutes: lesson.duration,
      status: lesson.status === 'Опубликован' ? 'published' : 'draft',
    })
    .eq('id', lessonId)

  if (error) throw error
}
export async function updateBlockRecord(blockId: string, block: LessonBlock): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .update({
      title: block.title,
      public_content: serializePublicBlockContent(block),
      private_content: serializePrivateBlockContent(block),
      is_required: block.required,
      schema_version: block.schemaVersion ?? 1,
    })
    .eq('id', blockId)

  if (error) throw error
}`,
    `export async function updateLessonRecord(
  lessonId: string,
  lesson: Lesson,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lessons')
    .update(createLessonUpdatePayload(lesson))
    .eq('id', lessonId)

  if (error) throw error
}

export async function updateBlockRecord(
  blockId: string,
  block: LessonBlock,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .update(createLessonBlockUpdatePayload(block))
    .eq('id', blockId)

  if (error) throw error
}`,
    'repository update payload builders',
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
  `.lift-phase-1-backup-${timestamp()}`,
)

mkdirSync(backupDirectory, { recursive: true })

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

    if (existsSync(backupPath)) {
      copyFileSync(
        backupPath,
        join(root, relativePath),
      )
    } else {
      rmSync(join(root, relativePath), {
        force: true,
      })
    }
  }

  throw error
}

console.log('\nГотово. LIFT Phase 1 применён.')
console.log('\nИзменены файлы:')

for (const key of changed) {
  console.log(`  - ${paths[key]}`)
}

console.log(`\nРезервная копия: ${backupDirectory}`)
console.log('\nПроверь проект:')
console.log('  npm run typecheck')
console.log('  npm run build')
console.log('\nРекомендуемая ручная проверка:')
console.log('  1. Изменить текст и вернуть исходное значение.')
console.log('  2. Изменить внешний audioUrl/fileUrl.')
console.log('  3. Изменить блок во время сохранения.')
console.log('  4. Имитировать ошибку одного из запросов.')
