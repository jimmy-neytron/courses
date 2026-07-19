import type { BlockType, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

export const defaultLessonSections: ReadonlyArray<LessonSectionConfig> = [
  { id: 'theory', label: 'Теория', visible: true, order: 0 },
  { id: 'conversation', label: 'Диалог', visible: true, order: 1 },
  { id: 'listening', label: 'Listening', visible: true, order: 2 },
  { id: 'cards', label: 'Карточки', visible: true, order: 3 },
  { id: 'errors', label: 'Ошибки', visible: true, order: 4 },
  { id: 'translation', label: 'Перевод', visible: true, order: 5 },
  { id: 'practice', label: 'Практика', visible: true, order: 6 },
  { id: 'test', label: 'Тест', visible: true, order: 7 },
]

export const sectionBlockTypes: Record<LessonSectionId, BlockType[]> = {
  theory: ['heading', 'grammar', 'callout', 'text', 'vocabulary', 'pdf'],
  conversation: ['conversation'],
  listening: ['audio'],
  cards: ['flashcards'],
  errors: ['error_correction'],
  translation: ['translation'],
  practice: ['practice'],
  test: ['single_choice'],
}

export function createLessonSectionConfig(source?: LessonSectionConfig[]): LessonSectionConfig[] {
  const savedSections = new Map((source ?? []).map((section) => [section.id, section]))
  return defaultLessonSections
    .map((fallback) => ({ ...fallback, ...savedSections.get(fallback.id) }))
    .sort((left, right) => left.order - right.order)
    .map((section, order) => ({ ...section, order }))
}

export function resolveLessonBlockSection(block: Pick<LessonBlock, 'type' | 'sectionId'>): LessonSectionId {
  if (block.sectionId && defaultLessonSections.some((section) => section.id === block.sectionId)) {
    return block.sectionId
  }

  return defaultLessonSections.find((section) => (
    sectionBlockTypes[section.id].includes(block.type)
  ))?.id ?? 'theory'
}
