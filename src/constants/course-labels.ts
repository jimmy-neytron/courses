import type { CourseStatus, LessonBlockType, LessonStatus } from '@/types/course'

const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'В архиве',
}

const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'В архиве',
}

const BLOCK_TYPE_LABELS: Record<LessonBlockType, string> = {
  heading: 'Заголовок',
  rich_text: 'Текст',
  callout: 'Акцент',
  image: 'Изображение',
  audio: 'Аудио',
  video: 'Видео',
  file: 'Файл',
  vocabulary: 'Словарь',
  flashcards: 'Карточки',
  grammar: 'Грамматика',
  example: 'Пример',
  single_choice: 'Один вариант',
  multiple_choice: 'Несколько вариантов',
  text_input: 'Текстовый ответ',
  fill_blanks: 'Заполнить пропуски',
  matching: 'Сопоставление',
  ordering: 'Порядок',
  sentence_builder: 'Сборка предложения',
  translation: 'Перевод',
  listening: 'Аудирование',
  open_answer: 'Открытый ответ',
  divider: 'Разделитель',
  summary: 'Итоги',
  homework: 'Домашнее задание',
}

export const courseStatusLabel = (status: CourseStatus): string => COURSE_STATUS_LABELS[status]
export const lessonStatusLabel = (status: LessonStatus): string => LESSON_STATUS_LABELS[status]
export const blockTypeLabel = (type: LessonBlockType): string => BLOCK_TYPE_LABELS[type]
