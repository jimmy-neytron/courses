import type { Component } from 'vue'
import {
  BookOpen,
  Brain,
  Dumbbell,
  FileText,
  Heading,
  Languages,
  ListChecks,
  MessageCircle,
  MessageSquare,
  Music2,
  ShieldAlert,
  Text,
} from 'lucide-vue-next'
import type { BlockType, CourseKind } from '@/types/course'

export type LessonBlockGroup = 'Материалы' | 'Интерактив' | 'Проверка знаний'

export interface LessonBlockCatalogItem {
  type: BlockType
  label: string
  description: string
  group: LessonBlockGroup
  icon: Component
  audience: 'all' | 'language'
}

export const lessonBlockCatalog: LessonBlockCatalogItem[] = [
  { type: 'heading', label: 'Заголовок', description: 'Название раздела', group: 'Материалы', icon: Heading, audience: 'all' },
  { type: 'grammar', label: 'Теория', description: 'Материал и объяснение', group: 'Материалы', icon: BookOpen, audience: 'all' },
  { type: 'pdf', label: 'PDF-теория', description: 'Документ внутри урока', group: 'Материалы', icon: FileText, audience: 'all' },
  { type: 'vocabulary', label: 'Лексика', description: 'Слова и примеры', group: 'Материалы', icon: Languages, audience: 'language' },
  { type: 'text', label: 'Текст', description: 'Дополнительное объяснение', group: 'Материалы', icon: Text, audience: 'all' },
  { type: 'callout', label: 'Акцент', description: 'Важная мысль', group: 'Материалы', icon: MessageSquare, audience: 'all' },
  { type: 'conversation', label: 'Диалог', description: 'Разговорная практика', group: 'Интерактив', icon: MessageCircle, audience: 'language' },
  { type: 'audio', label: 'Аудио', description: 'Файл, лекция или listening', group: 'Интерактив', icon: Music2, audience: 'all' },
  { type: 'flashcards', label: 'Карточки', description: 'Интервальное повторение', group: 'Интерактив', icon: Brain, audience: 'language' },
  { type: 'error_correction', label: 'Ошибки', description: 'Разбор типичных ошибок', group: 'Интерактив', icon: ShieldAlert, audience: 'language' },
  { type: 'translation', label: 'Перевод', description: 'Работа со смыслом', group: 'Интерактив', icon: Languages, audience: 'language' },
  { type: 'practice', label: 'Практика', description: 'Активное задание', group: 'Проверка знаний', icon: Dumbbell, audience: 'all' },
  { type: 'single_choice', label: 'Вопрос теста', description: 'Варианты и объяснение', group: 'Проверка знаний', icon: ListChecks, audience: 'all' },
]

export const lessonBlockLabels = Object.fromEntries(
  lessonBlockCatalog.map((item) => [item.type, item.label]),
) as Record<BlockType, string>

export function getLessonBlockCatalogItem(type: BlockType): LessonBlockCatalogItem {
  return lessonBlockCatalog.find((item) => item.type === type) ?? lessonBlockCatalog[0]!
}

export function filterLessonBlockCatalog(
  query: string,
  kind: CourseKind = 'language',
): LessonBlockCatalogItem[] {
  const normalized = query.trim().toLocaleLowerCase('ru')
  return lessonBlockCatalog.filter((item) => (
    (item.audience === 'all' || kind === 'language')
    && (!normalized || `${item.label} ${item.description} ${item.group}`.toLocaleLowerCase('ru').includes(normalized))
  ))
}

export function groupLessonBlockCatalog(items: LessonBlockCatalogItem[]) {
  const groups = new Map<LessonBlockGroup, LessonBlockCatalogItem[]>()
  items.forEach((item) => groups.set(item.group, [...(groups.get(item.group) ?? []), item]))
  return [...groups].map(([label, blocks]) => ({ label, blocks }))
}