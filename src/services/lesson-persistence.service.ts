import type {
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
