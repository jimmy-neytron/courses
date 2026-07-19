import type { BlockType, Course, LessonBlock } from '@/types/course'
import { buildSpacedCards, englishEngineDays, englishEnginePhases } from '@/data/english-engine-curriculum'
import { requireSupabase } from '@/services/supabase'

const examQuestions = (dayIndex: number) => {
  const day = englishEngineDays[dayIndex]!
  if (!day.exam) return day.questions
  return englishEngineDays
    .slice(Math.max(0, dayIndex - 3), dayIndex + 1)
    .flatMap((item) => item.questions)
    .slice(-10)
}

function dayBlocks(dayIndex: number): LessonBlock[] {
  const day = englishEngineDays[dayIndex]!
  const base = `engine-d${day.day}`
  const blocks: LessonBlock[] = [
    { id: `${base}-goal`, type: 'heading', title: `День ${day.day} · ${day.level}`, content: day.title, required: true },
    { id: `${base}-theory`, type: 'grammar', title: '30-минутный урок · Подробная теория', content: day.theory, required: true },
    { id: `${base}-formula`, type: 'callout', title: 'Языковая формула', content: day.formula, required: true },
    {
      id: `${base}-conversation`, type: 'conversation', title: 'Разговор с носителем', content: day.conversation,
      role: 'Житель США и дружелюбный собеседник', prompt: day.conversation,
      starter: 'Начните ответ на английском. Дайте 4–6 реплик и задайте встречный вопрос.',
      sampleAnswer: day.transcript, required: true,
    },
    {
      id: `${base}-audio`, type: 'audio', title: 'Listening · речь носителя',
      content: 'Прослушайте без транскрипта, затем повторите методом shadowing.',
      transcript: day.transcript, required: true,
    },
    {
      id: `${base}-cards`, type: 'flashcards', title: '20 карточек · интервальное повторение',
      content: 'Новая лексика смешана с материалом предыдущих дней.', cards: buildSpacedCards(dayIndex), required: true,
    },
    {
      id: `${base}-errors`, type: 'error_correction', title: 'Клиника ошибок',
      content: 'Найдите закономерность, назовите правило и создайте свой пример.', corrections: day.errors, required: true,
    },
    {
      id: `${base}-translation`, type: 'translation', title: 'Language Engine · перевод и понимание',
      content: 'Переведите смысловыми группами, затем сравните с эталоном.',
      sourceText: day.translation.source, targetText: day.translation.answer,
      comprehensionQuestions: [
        'Какое правило дня здесь используется?',
        'Какие два выражения стоит запомнить целиком?',
        'Как сказать ту же мысль более естественно?',
      ],
      required: true,
    },
    {
      id: `${base}-practice`, type: 'practice', title: 'Активная практика',
      content: 'Произнесите 8 собственных примеров. Затем запишите голосовой ответ на 60–90 секунд по теме разговора и исправьте минимум одну неточность.',
      required: true,
    },
  ]

  examQuestions(dayIndex).forEach((item, index) => blocks.push({
    id: `${base}-q${index + 1}`,
    type: 'single_choice',
    title: day.exam ? `Экзамен ${day.exam} · вопрос ${index + 1} из 10` : `Мини-тест · вопрос ${index + 1} из 4`,
    content: item.question,
    options: item.options,
    correctOption: item.correct,
    explanation: item.explanation,
    required: true,
  }))

  return blocks
}

export function buildEnglishEngineDemoCourse(): Course {
  return {
    id: 'english-engine-33',
    ownerId: 'demo-user',
    accessRole: 'creator',
    creator: { id: 'demo-user', name: 'Вы' },
    joinCode: 'ENGLISH33',
    title: 'English Engine · с нуля до B2 за 33 дня',
    description: 'Интенсив по шести языковым механизмам: 33 ежедневных урока, разговор, listening, 20 карточек в день, клиника ошибок, перевод и 10 экзаменов.',
    cover: 'linear-gradient(135deg,#142d39,#3ac3a6)',
    tag: '33',
    status: 'Опубликован',
    updated: 'Сегодня',
    modules: englishEnginePhases.map((phase, moduleIndex) => ({
      id: `engine-phase-${moduleIndex + 1}`,
      title: phase.title,
      open: moduleIndex === 0,
      lessons: englishEngineDays
        .filter((day) => day.day >= phase.range[0]! && day.day <= phase.range[1]!)
        .map((day) => ({
          id: `english-engine-day-${day.day}`,
          title: `День ${day.day} · ${day.title}`,
          duration: day.exam ? 120 : 90,
          status: 'Опубликован',
          blocks: dayBlocks(day.day - 1),
        })),
    })),
  }
}

const publicContent = (block: LessonBlock): Record<string, unknown> => {
  switch (block.type) {
    case 'single_choice': return { question: block.content, options: block.options?.map((label, index) => ({ id: String(index), label })) }
    case 'conversation': return { kind: 'conversation', content: block.content, role: block.role, prompt: block.prompt, starter: block.starter, sampleAnswer: block.sampleAnswer }
    case 'flashcards': return { kind: 'flashcards', content: block.content, cards: block.cards }
    case 'error_correction': return { kind: 'error_correction', content: block.content, items: block.corrections }
    case 'translation': return { kind: 'translation', content: block.content, sourceText: block.sourceText, questions: block.comprehensionQuestions }
    default: return { kind: block.type, content: block.content, transcript: block.transcript }
  }
}

const privateContent = (block: LessonBlock): Record<string, unknown> => {
  if (block.type === 'single_choice') return { correctOption: block.correctOption, explanation: block.explanation }
  if (block.type === 'translation') return { targetText: block.targetText }
  return {}
}

const dbType = (type: BlockType) => ({
  text: 'rich_text', conversation: 'open_answer', error_correction: 'grammar', practice: 'homework',
} as Partial<Record<BlockType, string>>)[type] ?? type

export async function seedEnglishEngineCourse(organizationId: string, userId: string): Promise<void> {
  const db = requireSupabase()
  const slug = 'english-engine-33-days'
  const { data: existing, error: findError } = await db
    .from('courses')
    .select('id,status,course_modules(id,title,lessons(id))')
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .maybeSingle()
  if (findError) throw findError

  let courseId: string
  if (existing) {
    courseId = String(existing.id)
    const modules = (existing.course_modules ?? []) as Array<{ title: string; lessons?: unknown[] }>
    const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0)
    if (modules.some((module) => module.title === englishEnginePhases[0]!.title) && lessonCount === 33) {
      if (existing.status !== 'published') {
        const { error: publishError } = await db.rpc('publish_course', { p_course_id: courseId, p_changelog: 'Published English Engine curriculum' })
        if (publishError) throw publishError
      }
      return
    }

    const { error: deleteError } = await db.from('course_modules').delete().eq('course_id', courseId)
    if (deleteError) throw deleteError
    const { error: updateError } = await db.from('courses').update({
      title: 'English Engine · с нуля до B2 за 33 дня',
      description: '33 ежедневных урока по шести языковым механизмам, 20 карточек в день и 10 накопительных экзаменов.',
      source_level: 'A0', target_level: 'B2', duration_weeks: 5, lessons_per_week: 7,
      default_lesson_duration: 90, accent_color: '#3AC3A6',
    }).eq('id', courseId)
    if (updateError) throw updateError
  } else {
    const { data, error } = await db.from('courses').insert({
      organization_id: organizationId,
      owner_id: userId,
      slug,
      title: 'English Engine · с нуля до B2 за 33 дня',
      description: '33 ежедневных урока по шести языковым механизмам, 20 карточек в день и 10 накопительных экзаменов.',
      language_code: 'en', source_level: 'A0', target_level: 'B2', duration_weeks: 5,
      lessons_per_week: 7, default_lesson_duration: 90, accent_color: '#3AC3A6',
      visibility: 'private', is_sequential: true,
    }).select('id').single()
    if (error) throw error
    courseId = String(data.id)
  }

  for (let moduleIndex = 0; moduleIndex < englishEnginePhases.length; moduleIndex++) {
    const phase = englishEnginePhases[moduleIndex]!
    const { data: module, error: moduleError } = await db.from('course_modules').insert({
      course_id: courseId,
      title: phase.title,
      description: `${phase.level} · дни ${phase.range[0]}–${phase.range[1]}`,
      position: moduleIndex,
    }).select('id').single()
    if (moduleError) throw moduleError

    const days = englishEngineDays.filter((day) => day.day >= phase.range[0]! && day.day <= phase.range[1]!)
    for (let lessonIndex = 0; lessonIndex < days.length; lessonIndex++) {
      const day = days[lessonIndex]!
      const { data: lesson, error: lessonError } = await db.from('lessons').insert({
        course_id: courseId,
        module_id: module.id,
        slug: `day-${day.day}-lesson`,
        title: `День ${day.day} · ${day.title}`,
        description: day.goal,
        objectives: [day.goal],
        duration_minutes: day.exam ? 120 : 90,
        passing_score: 75,
        position: lessonIndex,
        status: 'published',
      }).select('id').single()
      if (lessonError) throw lessonError

      const rows = dayBlocks(day.day - 1).map((block, position) => ({
        course_id: courseId,
        lesson_id: lesson.id,
        block_type: dbType(block.type),
        position,
        title: block.title,
        public_content: publicContent(block),
        private_content: privateContent(block),
        points: block.type === 'single_choice' ? 1 : 0,
      }))
      const { error: blockError } = await db.from('lesson_blocks').insert(rows)
      if (blockError) throw blockError
    }
  }
  const { error: publishError } = await db.rpc('publish_course', {
    p_course_id: courseId,
    p_changelog: 'Published English Engine curriculum',
  })
  if (publishError) throw publishError
}
