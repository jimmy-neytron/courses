import { createLessonSectionConfig } from '@/composables/useCourseSections'
import type {
  BlockType,
  Course,
  Lesson,
  LessonBlock,
  LessonSectionConfig,
  LessonSectionId,
} from '@/types/course'

type DatabaseRow = Record<string, unknown>

const defaultSectionIds = new Set<LessonSectionId>([
  'theory',
  'conversation',
  'listening',
  'cards',
  'errors',
  'translation',
  'practice',
  'test',
])

function asRecord(value: unknown): DatabaseRow {
  return value && typeof value === 'object' ? value as DatabaseRow : {}
}

function asRows(value: unknown): DatabaseRow[] {
  return Array.isArray(value) ? value.filter((item): item is DatabaseRow => Boolean(item) && typeof item === 'object') : []
}

function byPosition(left: DatabaseRow, right: DatabaseRow): number {
  return Number(left.position) - Number(right.position)
}

function parseSectionConfig(value: unknown): LessonSectionConfig[] {
  if (!Array.isArray(value)) return createLessonSectionConfig()

  const sections = value
    .filter((item): item is DatabaseRow => Boolean(item) && typeof item === 'object')
    .map((section, index) => ({
      id: String(section.id) as LessonSectionId,
      label: String(section.label ?? ''),
      visible: section.visible !== false,
      order: Number(section.order ?? index),
    }))

  return createLessonSectionConfig(sections)
}

function resolveBlockType(row: DatabaseRow, publicContent: DatabaseRow): BlockType {
  const databaseType = String(row.block_type)
  const kind = String(publicContent.kind ?? '')

  if (databaseType === 'rich_text') return 'text'
  if (databaseType === 'open_answer' && kind === 'conversation') return 'conversation'
  if (databaseType === 'grammar' && kind === 'error_correction') return 'error_correction'
  if (databaseType === 'homework') return 'practice'
  if (databaseType === 'file' && kind === 'pdf') return 'pdf'
  return databaseType as BlockType
}

function mapBlock(row: DatabaseRow): LessonBlock {
  const publicContent = asRecord(row.public_content)
  const privateContent = asRecord(row.private_content)
  const rawSectionId = String(publicContent.sectionId ?? '') as LessonSectionId

  return {
    id: String(row.id),
    type: resolveBlockType(row, publicContent),
    title: String(row.title ?? ''),
    content: String(publicContent.content ?? publicContent.text ?? publicContent.question ?? ''),
    required: Boolean(row.is_required),
    sectionId: defaultSectionIds.has(rawSectionId) ? rawSectionId : undefined,
    options: Array.isArray(publicContent.options)
      ? publicContent.options.map((option) => typeof option === 'string' ? option : String(asRecord(option).label ?? ''))
      : undefined,
    correctOption: typeof privateContent.correctOption === 'number' ? privateContent.correctOption : undefined,
    explanation: String(privateContent.explanation ?? ''),
    audioPath: String(publicContent.audioPath ?? ''),
    audioUrl: String(publicContent.audioUrl ?? ''),
    transcript: String(publicContent.transcript ?? ''),
    filePath: String(publicContent.filePath ?? ''),
    fileUrl: String(publicContent.fileUrl ?? ''),
    fileName: String(publicContent.fileName ?? ''),
    fileSize: typeof publicContent.fileSize === 'number' ? publicContent.fileSize : undefined,
    cards: Array.isArray(publicContent.cards)
      ? publicContent.cards.map((card) => {
          const value = asRecord(card)
          return { front: String(value.front ?? ''), back: String(value.back ?? ''), hint: String(value.hint ?? '') }
        })
      : undefined,
    role: String(publicContent.role ?? ''),
    prompt: String(publicContent.prompt ?? ''),
    starter: String(publicContent.starter ?? ''),
    sampleAnswer: String(publicContent.sampleAnswer ?? ''),
    corrections: Array.isArray(publicContent.items)
      ? publicContent.items.map((item) => {
          const value = asRecord(item)
          return {
            incorrect: String(value.incorrect ?? ''),
            correct: String(value.correct ?? ''),
            explanation: String(value.explanation ?? ''),
          }
        })
      : undefined,
    sourceText: String(publicContent.sourceText ?? ''),
    targetText: String(privateContent.targetText ?? ''),
    comprehensionQuestions: Array.isArray(publicContent.questions) ? publicContent.questions.map(String) : undefined,
  }
}

function mapLesson(row: DatabaseRow): Lesson {
  const blocks = asRows(row.lesson_blocks).sort(byPosition)
  const configBlock = blocks.find((block) => asRecord(block.public_content).kind === 'section_config')

  return {
    id: String(row.id),
    title: String(row.title),
    duration: Number(row.duration_minutes),
    status: row.status === 'published' ? 'Опубликован' : 'Черновик',
    blocks: blocks.filter((block) => asRecord(block.public_content).kind !== 'section_config').map(mapBlock),
    sectionConfig: parseSectionConfig(configBlock ? asRecord(configBlock.public_content).sections : undefined),
    sectionConfigBlockId: configBlock ? String(configBlock.id) : undefined,
  }
}

export function mapDatabaseCourse(row: DatabaseRow, currentUserId = ''): Course {
  const modules = asRows(row.course_modules).sort(byPosition).map((module) => ({
    id: String(module.id),
    title: String(module.title),
    open: true,
    lessons: asRows(module.lessons).sort(byPosition).map(mapLesson),
  }))

  const ownerId = String(row.owner_id ?? '')
  const owner = asRecord(row.owner)
  const invite = asRows(row.course_invites)[0]
  const totalSessions = modules.reduce((total, module) => total + module.lessons.length, 0)
  const checkpointCount = modules.reduce((total, module) => total + module.lessons.filter(
    (lesson) => lesson.blocks.filter((block) => block.type === 'single_choice').length >= 12,
  ).length, 0)
  const durationWeeks = Number(row.duration_weeks ?? 0)
  const sessionsPerWeek = Number(row.lessons_per_week ?? 0)
  const sessionMinutes = Number(row.default_lesson_duration ?? 0)

  return {
    id: String(row.id),
    ownerId,
    accessRole: !currentUserId || ownerId === currentUserId ? 'creator' : 'learner',
    creator: {
      id: ownerId,
      name: String(owner.display_name ?? (ownerId === currentUserId ? 'Вы' : 'Автор курса')),
      avatarUrl: String(owner.avatar_url ?? '') || undefined,
    },
    joinCode: invite ? String(invite.code ?? '') || undefined : undefined,
    learningPlan: durationWeeks && sessionsPerWeek && sessionMinutes ? {
      durationWeeks,
      sessionsPerWeek,
      sessionMinutes,
      totalSessions,
      checkpointCount,
      cadence: `${sessionsPerWeek} занятий в неделю`,
      outcome: `Путь от ${String(row.source_level ?? 'стартового уровня')} до ${String(row.target_level ?? 'целевого уровня')}`,
    } : undefined,
    title: String(row.title),
    description: String(row.description ?? ''),
    cover: `linear-gradient(135deg,${String(row.accent_color ?? '#3AC3A6')},#142d39)`,
    tag: String(row.target_level ?? 'КУРС'),
    status: row.status === 'published' ? 'Опубликован' : 'Черновик',
    updated: new Date(String(row.updated_at)).toLocaleDateString('ru-RU'),
    modules,
  }
}
