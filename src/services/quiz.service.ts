import { requireSupabase } from '@/services/supabase'

export interface QuizAnswerResult {
  correct: boolean
  explanation: string
}

interface QuizAnswerRow {
  correct?: unknown
  explanation?: unknown
}

function firstResult(value: unknown): QuizAnswerRow | undefined {
  if (Array.isArray(value)) {
    const first = value[0]

    return first && typeof first === 'object'
      ? first as QuizAnswerRow
      : undefined
  }

  return value && typeof value === 'object'
    ? value as QuizAnswerRow
    : undefined
}

export async function checkLessonBlockAnswer(
  blockId: string,
  optionIndex: number,
): Promise<QuizAnswerResult> {
  const { data, error } = await requireSupabase().rpc(
    'check_lesson_block_answer',
    {
      p_block_id: blockId,
      p_option_index: optionIndex,
    },
  )

  if (error) throw error

  const result = firstResult(data)

  if (!result || typeof result.correct !== 'boolean') {
    throw new Error('Сервер вернул некорректный результат проверки')
  }

  return {
    correct: result.correct,
    explanation: typeof result.explanation === 'string'
      ? result.explanation
      : '',
  }
}
