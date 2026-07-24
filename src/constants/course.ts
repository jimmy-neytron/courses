import type { CourseDraft, CourseVisibility, LessonBlockType } from '@/types/course'

const LEGACY_DEFAULT_COURSE_ACCENT = '#F5C542'

export const DEFAULT_COURSE_ACCENT = '#00DC82'
export const DEFAULT_LESSON_DURATION = 45

export function normalizeCourseAccent(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase()

  if (!normalized || normalized === LEGACY_DEFAULT_COURSE_ACCENT) {
    return DEFAULT_COURSE_ACCENT
  }

  return normalized
}

export const COURSE_VISIBILITY_OPTIONS: ReadonlyArray<{
  label: string
  value: CourseVisibility
  description: string
}> = [
  { label: 'Приватный', value: 'private', description: 'Курс доступен только автору' },
  { label: 'По ссылке', value: 'unlisted', description: 'Открывается по прямой ссылке' },
  { label: 'Публичный', value: 'public', description: 'Доступен всем пользователям' },
]

export const LESSON_BLOCK_TYPES: readonly LessonBlockType[] = [
  'heading', 'rich_text', 'callout', 'image', 'audio', 'video', 'file',
  'vocabulary', 'flashcards', 'grammar', 'example', 'single_choice',
  'multiple_choice', 'text_input', 'fill_blanks', 'matching', 'ordering',
  'sentence_builder', 'translation', 'listening', 'open_answer', 'divider',
  'summary', 'homework',
]

export function createEmptyCourseDraft(): CourseDraft {
  return {
    title: '',
    description: '',
    languageCode: 'und',
    sourceLevel: '',
    targetLevel: '',
    durationWeeks: null,
    lessonsPerWeek: null,
    defaultLessonDuration: DEFAULT_LESSON_DURATION,
    accentColor: DEFAULT_COURSE_ACCENT,
    visibility: 'private',
    isSequential: true,
  }
}
