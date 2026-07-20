import type { CourseCreateInput, CourseKind, CourseTemplateId } from '@/types/course'

export interface CourseTemplateDefinition {
  id: CourseTemplateId
  label: string
  description: string
  kind: CourseKind
  defaults: CourseCreateInput
}

export const courseTemplates: CourseTemplateDefinition[] = [
  {
    id: 'blank-general',
    label: 'Пустой курс',
    description: 'Курс на любую тему со своей программой и уроками',
    kind: 'general',
    defaults: {
      templateId: 'blank-general',
      kind: 'general',
      title: '',
      description: '',
      durationWeeks: 8,
      lessonsPerWeek: 2,
      defaultLessonDuration: 45,
    },
  },
  {
    id: 'blank-language',
    label: 'Языковой курс',
    description: 'Программа изучения языка с уровнями и языковыми упражнениями',
    kind: 'language',
    defaults: {
      templateId: 'blank-language',
      kind: 'language',
      title: '',
      description: '',
      languageCode: 'en',
      sourceLevel: 'A0',
      targetLevel: 'B1',
      durationWeeks: 12,
      lessonsPerWeek: 3,
      defaultLessonDuration: 45,
    },
  },
]

export function getCourseTemplate(id: CourseTemplateId): CourseTemplateDefinition {
  return courseTemplates.find((template) => template.id === id) ?? courseTemplates[0]!
}

export const languageOptions = [
  { label: 'Английский', value: 'en' },
  { label: 'Испанский', value: 'es' },
  { label: 'Немецкий', value: 'de' },
  { label: 'Французский', value: 'fr' },
  { label: 'Итальянский', value: 'it' },
  { label: 'Русский', value: 'ru' },
]

export const languageLevelOptions = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']