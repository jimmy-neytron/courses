import type { BlockType, LessonBlock } from '@/types/course'

type BlockPreset = [title: string, content: string, extra?: Partial<LessonBlock>]

const blockPresets: Record<BlockType, BlockPreset> = {
  heading: ['Заголовок', 'Новый раздел'],
  text: ['Текст', 'Добавьте объяснение и примеры.'],
  callout: ['Важно', 'Добавьте ключевую мысль.'],
  grammar: ['Теория', 'Подробно объясните материал.'],
  vocabulary: ['Словарь', 'Добавьте термины и примеры.'],
  practice: ['Практика', 'Добавьте активное задание.'],
  audio: ['Аудирование', 'Прослушайте запись.', { transcript: 'Add the transcript here.' }],
  pdf: ['Теория в PDF', 'Откройте документ и изучите материал.', { fileName: 'lesson.pdf' }],
  conversation: ['Диалог', 'Опишите ситуацию разговора.', {
    role: 'Собеседник',
    starter: 'Начните разговор.',
    sampleAnswer: 'Sample answer',
  }],
  flashcards: ['Карточки', 'Добавьте карточки.', { cards: [] }],
  error_correction: ['Разбор ошибок', 'Добавьте типичные ошибки.', { corrections: [] }],
  translation: ['Перевод', 'Переведите текст.', {
    sourceText: 'Исходный текст',
    targetText: 'Model translation',
  }],
  single_choice: ['Вопрос', 'Введите вопрос', {
    options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
    correctOption: 0,
    explanation: 'Объяснение ответа.',
  }],
}

const databaseBlockTypes: Partial<Record<BlockType, string>> = {
  text: 'rich_text',
  conversation: 'open_answer',
  error_correction: 'grammar',
  practice: 'homework',
  pdf: 'file',
}

export function createLessonBlock(id: string, type: BlockType): LessonBlock {
  const [title, content, extra = {}] = blockPresets[type]
  return { id, type, title, content, required: true, ...extra }
}

export function toDatabaseBlockType(type: BlockType): string {
  return databaseBlockTypes[type] ?? type
}

export function serializePublicBlockContent(block: LessonBlock): Record<string, unknown> {
  const common = { sectionId: block.sectionId, content: block.content }

  switch (block.type) {
    case 'single_choice':
      return {
        question: block.content,
        sectionId: block.sectionId,
        options: block.options?.map((label, index) => ({ id: String(index), label })),
      }
    case 'conversation':
      return { kind: 'conversation', ...common, role: block.role, prompt: block.prompt, starter: block.starter, sampleAnswer: block.sampleAnswer }
    case 'flashcards':
      return { kind: 'flashcards', ...common, cards: block.cards }
    case 'error_correction':
      return { kind: 'error_correction', ...common, items: block.corrections }
    case 'translation':
      return { kind: 'translation', ...common, sourceText: block.sourceText, questions: block.comprehensionQuestions }
    case 'pdf':
      return {
        kind: 'pdf',
        ...common,
        filePath: block.filePath,
        fileUrl: block.filePath ? undefined : block.fileUrl,
        fileName: block.fileName,
        fileSize: block.fileSize,
      }
    default:
      return {
        kind: block.type,
        ...common,
        audioPath: block.audioPath,
        audioUrl: block.audioPath ? undefined : block.audioUrl,
        transcript: block.transcript,
      }
  }
}

export function serializePrivateBlockContent(block: LessonBlock): Record<string, unknown> {
  if (block.type === 'single_choice') {
    return { correctOption: block.correctOption ?? 0, explanation: block.explanation ?? '' }
  }
  if (block.type === 'translation') return { targetText: block.targetText }
  return {}
}
