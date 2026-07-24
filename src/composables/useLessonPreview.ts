import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'

import { useCoursesStore } from '@/stores/courses'
import type { Lesson, LessonBlock, LessonBlockType } from '@/types/course'

export type LessonPreviewSectionId = 'theory' | 'listening' | 'practice' | 'test'

export interface LessonPreviewSection {
  id: LessonPreviewSectionId
  label: string
  eyebrow: string
  blocks: LessonBlock[]
}

const SECTION_DEFINITIONS: ReadonlyArray<Omit<LessonPreviewSection, 'blocks'>> = [
  { id: 'theory', label: 'Теория', eyebrow: 'Материалы урока' },
  { id: 'listening', label: 'Аудирование', eyebrow: 'Listening practice' },
  { id: 'practice', label: 'Практика', eyebrow: 'Закрепление материала' },
  { id: 'test', label: 'Проверка', eyebrow: 'Проверка знаний' },
]

const THEORY_TYPES = new Set<LessonBlockType>([
  'heading',
  'rich_text',
  'callout',
  'image',
  'video',
  'file',
  'vocabulary',
  'flashcards',
  'grammar',
  'example',
  'divider',
  'summary',
])

const LISTENING_TYPES = new Set<LessonBlockType>(['audio', 'listening'])
const TEST_TYPES = new Set<LessonBlockType>(['single_choice', 'multiple_choice'])

export function useLessonPreview(
  lessonSource: MaybeRefOrGetter<Lesson>,
  authorPreviewSource: MaybeRefOrGetter<boolean> = false,
) {
  const courses = useCoursesStore()
  const activeSectionId = ref<LessonPreviewSectionId>('theory')
  const completedSections = ref<LessonPreviewSectionId[]>([])
  const finishing = ref(false)

  const lesson = computed(() => toValue(lessonSource))
  const authorPreview = computed(() => toValue(authorPreviewSource))
  const course = computed(() => courses.courseByLessonId(lesson.value.id))

  const sections = computed<LessonPreviewSection[]>(() => SECTION_DEFINITIONS
    .map((definition) => ({
      ...definition,
      blocks: lesson.value.blocks
        .filter((block) => resolveSection(block) === definition.id)
        .sort((left, right) => left.position - right.position),
    }))
    .filter((section) => section.blocks.length > 0))

  const currentSection = computed(() => (
    sections.value.find((section) => section.id === activeSectionId.value)
    ?? sections.value[0]
  ))

  const availableLessons = computed(() => course.value?.modules
    .flatMap((module) => module.lessons)
    .filter((item) => authorPreview.value || item.status === 'published')
    .sort((left, right) => left.position - right.position) ?? [])

  const currentLessonIndex = computed(() => availableLessons.value.findIndex(
    (item) => item.id === lesson.value.id,
  ))

  const previousLesson = computed(() => availableLessons.value[currentLessonIndex.value - 1])
  const nextLesson = computed(() => availableLessons.value[currentLessonIndex.value + 1])
  const canFinish = computed(() => (
    sections.value.length > 0
    && sections.value.every((section) => completedSections.value.includes(section.id))
  ))
  const progressPercent = computed(() => {
    if (!sections.value.length) return 0
    return Math.round((completedSections.value.length / sections.value.length) * 100)
  })

  watch(
    () => [lesson.value.id, lesson.value.isCompleted, sections.value.map((section) => section.id).join(':')],
    () => {
      activeSectionId.value = sections.value[0]?.id ?? 'theory'
      completedSections.value = lesson.value.isCompleted
        ? sections.value.map((section) => section.id)
        : []
    },
    { immediate: true },
  )

  function selectSection(sectionId: LessonPreviewSectionId): void {
    if (sections.value.some((section) => section.id === sectionId)) {
      activeSectionId.value = sectionId
    }
  }

  function markSection(sectionId: LessonPreviewSectionId): void {
    if (!completedSections.value.includes(sectionId)) {
      completedSections.value = [...completedSections.value, sectionId]
    }
  }

  async function finishLesson(): Promise<void> {
    if (!canFinish.value || finishing.value) return
    finishing.value = true
    try {
      await courses.setLessonCompleted(lesson.value.id, true)
    } finally {
      finishing.value = false
    }
  }

  return {
    activeSectionId,
    authorPreview,
    canFinish,
    completedSections,
    course,
    currentSection,
    finishing,
    lesson,
    nextLesson,
    previousLesson,
    progressPercent,
    sections,
    finishLesson,
    markSection,
    selectSection,
  }
}

function resolveSection(block: LessonBlock): LessonPreviewSectionId {
  const explicitSection = normalizeSectionId(block.publicContent.sectionId)
  if (explicitSection) return explicitSection
  if (LISTENING_TYPES.has(block.blockType)) return 'listening'
  if (TEST_TYPES.has(block.blockType)) return 'test'
  if (THEORY_TYPES.has(block.blockType)) return 'theory'
  return 'practice'
}

function normalizeSectionId(value: unknown): LessonPreviewSectionId | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (['content', 'theory', 'materials'].includes(normalized)) return 'theory'
  if (['listening', 'audio'].includes(normalized)) return 'listening'
  if (['practice', 'interactive'].includes(normalized)) return 'practice'
  if (['test', 'quiz', 'assessment'].includes(normalized)) return 'test'
  return null
}
