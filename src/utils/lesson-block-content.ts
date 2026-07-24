import type { LessonBlockContent } from '@/types/course'

export interface LessonContentPair {
  left: string
  right: string
}

export function firstContentString(
  content: LessonBlockContent,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = content[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}

export function contentStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) return [item.trim()]
    if (typeof item === 'number') return [String(item)]
    if (!isRecord(item)) return []

    const label = firstRecordString(item, [
      'label', 'text', 'title', 'value', 'word', 'option', 'name',
    ])
    return label ? [label] : []
  })
}

export function contentPairs(
  value: unknown,
  leftKeys: readonly string[],
  rightKeys: readonly string[],
): LessonContentPair[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (Array.isArray(item) && item.length >= 2) {
      const left = toDisplayString(item[0])
      const right = toDisplayString(item[1])
      return left || right ? [{ left, right }] : []
    }

    if (!isRecord(item)) return []
    const left = firstRecordString(item, leftKeys)
    const right = firstRecordString(item, rightKeys)
    return left || right ? [{ left, right }] : []
  })
}

export function contentUrl(content: LessonBlockContent): string {
  return firstContentString(content, [
    'url', 'src', 'imageUrl', 'audioUrl', 'videoUrl', 'fileUrl',
  ])
}

export function contentText(content: LessonBlockContent): string {
  return firstContentString(content, [
    'text', 'content', 'prompt', 'question', 'instructions', 'description',
    'sentence', 'sourceText', 'transcript',
  ])
}

export function contentOptions(content: LessonBlockContent): string[] {
  return contentStringList(content.options ?? content.choices ?? content.answers ?? content.items)
}

export function contentCards(content: LessonBlockContent): LessonContentPair[] {
  return contentPairs(
    content.cards ?? content.items ?? content.entries,
    ['front', 'term', 'word', 'question', 'title', 'left'],
    ['back', 'definition', 'translation', 'answer', 'description', 'right'],
  )
}

export function contentMatchingPairs(content: LessonBlockContent): LessonContentPair[] {
  return contentPairs(
    content.pairs ?? content.items ?? content.matches,
    ['left', 'term', 'question', 'source', 'key'],
    ['right', 'definition', 'answer', 'target', 'value'],
  )
}

function firstRecordString(record: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = record[key]
    const resolved = toDisplayString(value)
    if (resolved) return resolved
  }
  return ''
}

function toDisplayString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
