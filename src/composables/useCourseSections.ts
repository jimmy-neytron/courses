import type {
  BlockType,
  CourseKind,
  LessonBlock,
  LessonSectionConfig,
  LessonSectionId,
} from '@/types/course'

export const languageLessonSections: ReadonlyArray<LessonSectionConfig> = [
  { id: 'theory', label: 'Теория', visible: true, order: 0 },
  { id: 'conversation', label: 'Диалог', visible: true, order: 1 },
  { id: 'listening', label: 'Listening', visible: true, order: 2 },
  { id: 'cards', label: 'Карточки', visible: true, order: 3 },
  { id: 'errors', label: 'Ошибки', visible: true, order: 4 },
  { id: 'translation', label: 'Перевод', visible: true, order: 5 },
  { id: 'practice', label: 'Практика', visible: true, order: 6 },
  { id: 'test', label: 'Тест', visible: true, order: 7 },
]

export const generalLessonSections: ReadonlyArray<LessonSectionConfig> = [
  { id: 'content', label: 'Материалы', visible: true, order: 0 },
  { id: 'practice', label: 'Практика', visible: true, order: 1 },
  { id: 'test', label: 'Проверка знаний', visible: true, order: 2 },
]

const languageSectionBlockTypes: Record<string, BlockType[]> = {
  theory: ['heading', 'grammar', 'callout', 'text', 'vocabulary', 'pdf'],
  conversation: ['conversation'],
  listening: ['audio'],
  cards: ['flashcards'],
  errors: ['error_correction'],
  translation: ['translation'],
  practice: ['practice'],
  test: ['single_choice'],
}

const generalSectionBlockTypes: Record<string, BlockType[]> = {
  content: ['heading', 'grammar', 'callout', 'text', 'pdf', 'audio'],
  practice: ['practice'],
  test: ['single_choice'],
}

export function getDefaultLessonSections(kind: CourseKind): ReadonlyArray<LessonSectionConfig> {
  return kind === 'language' ? languageLessonSections : generalLessonSections
}

export function createLessonSectionConfig(
  source?: LessonSectionConfig[],
  kind: CourseKind = 'language',
): LessonSectionConfig[] {
  const defaults = getDefaultLessonSections(kind)
  const savedSections = new Map((source ?? []).map((section) => [section.id, section]))
  const defaultIds = new Set(defaults.map((section) => section.id))
  const sections = [
    ...defaults.map((fallback) => ({ ...fallback, ...savedSections.get(fallback.id) })),
    ...(source ?? []).filter((section) => !defaultIds.has(section.id)),
  ]

  return sections
    .sort((left, right) => left.order - right.order)
    .map((section, order) => ({ ...section, order }))
}

export function resolveLessonBlockSection(
  block: Pick<LessonBlock, 'type' | 'sectionId'>,
  sections?: LessonSectionConfig[],
  kind: CourseKind = 'language',
): LessonSectionId {
  const available = createLessonSectionConfig(sections, kind)
  if (block.sectionId && available.some((section) => section.id === block.sectionId)) {
    return block.sectionId
  }

  const blockTypes = kind === 'language' ? languageSectionBlockTypes : generalSectionBlockTypes
  return available.find((section) => blockTypes[section.id]?.includes(block.type))?.id
    ?? available[0]?.id
    ?? 'content'
}