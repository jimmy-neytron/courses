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
import type { BlockType } from '@/types/course'

export type LessonBlockGroup = 'Материалы' | 'Интерактив' | 'Проверка знаний'

export interface LessonBlockCatalogItem {
  type: BlockType
  label: string
  description: string
  group: LessonBlockGroup
  icon: Component
}

export const lessonBlockCatalog: LessonBlockCatalogItem[] = [
  { type: 'heading', label: 'Заголовок', description: 'Название раздела', group: 'Материалы', icon: Heading },
  { type: 'grammar', label: 'Теория', description: 'Материал и объяснение', group: 'Материалы', icon: BookOpen },
  { type: 'pdf', label: 'PDF-теория', description: 'Документ внутри урока', group: 'Материалы', icon: FileText },
  { type: 'vocabulary', label: 'Лексика', description: 'Слова и примеры', group: 'Материалы', icon: Languages },
  { type: 'text', label: 'Текст', description: 'Дополнительное объяснение', group: 'Материалы', icon: Text },
  { type: 'callout', label: 'Акцент', description: 'Важная мысль', group: 'Материалы', icon: MessageSquare },
  { type: 'conversation', label: 'Диалог', description: 'Разговорная практика', group: 'Интерактив', icon: MessageCircle },
  { type: 'audio', label: 'Listening', description: 'Файл или озвучка', group: 'Интерактив', icon: Music2 },
  { type: 'flashcards', label: 'Карточки', description: 'Интервальное повторение', group: 'Интерактив', icon: Brain },
  { type: 'error_correction', label: 'Ошибки', description: 'Разбор типичных ошибок', group: 'Интерактив', icon: ShieldAlert },
  { type: 'translation', label: 'Перевод', description: 'Работа со смыслом', group: 'Интерактив', icon: Languages },
  { type: 'practice', label: 'Практика', description: 'Активное задание', group: 'Проверка знаний', icon: Dumbbell },
  { type: 'single_choice', label: 'Вопрос теста', description: 'Варианты и объяснение', group: 'Проверка знаний', icon: ListChecks },
]

export const lessonBlockLabels = Object.fromEntries(
  lessonBlockCatalog.map((item) => [item.type, item.label]),
) as Record<BlockType, string>

export function getLessonBlockCatalogItem(type: BlockType): LessonBlockCatalogItem {
  return lessonBlockCatalog.find((item) => item.type === type) ?? lessonBlockCatalog[0]!
}

export function filterLessonBlockCatalog(query: string): LessonBlockCatalogItem[] {
  const normalized = query.trim().toLocaleLowerCase('ru')
  if (!normalized) return lessonBlockCatalog
  return lessonBlockCatalog.filter((item) => (
    `${item.label} ${item.description} ${item.group}`.toLocaleLowerCase('ru').includes(normalized)
  ))
}

export function groupLessonBlockCatalog(items: LessonBlockCatalogItem[]) {
  const groups = new Map<LessonBlockGroup, LessonBlockCatalogItem[]>()
  items.forEach((item) => groups.set(item.group, [...(groups.get(item.group) ?? []), item]))
  return [...groups].map(([label, blocks]) => ({ label, blocks }))
}
