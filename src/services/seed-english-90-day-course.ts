import type { BlockType, Course, LessonBlock } from '@/types/course'
import {
  buildSpacedCards,
  english90Days,
  english90Modules,
  examDays,
  getCourseQuestionBank,
  type CourseQuestion,
} from '@/data/english-90-day-curriculum'
import { requireSupabase } from '@/services/supabase'

const COURSE_SLUG = 'english-90-days'
const LEGACY_COURSE_SLUG = 'english-engine-33-days'
const COURSE_TITLE = 'Английский за 90 дней · теория и практика'
const COURSE_DESCRIPTION = 'Версия программы PDF 90: ежедневные занятия по 45–60 минут, теория, разговор, listening, 20 интервальных карточек, перевод, дневник ошибок и 10 накопительных экзаменов.'

function examQuestionCount(exam?: number): number {
  if (!exam) return 4
  if (exam === 1) return 12
  if (exam === 2) return 18
  if (exam === 10) return 50
  return 20
}

function selectExamQuestions(dayIndex: number): CourseQuestion[] {
  const day = english90Days[dayIndex]!
  if (!day.exam) return day.questions

  const bank = getCourseQuestionBank(day.day)
  const count = examQuestionCount(day.exam)
  return bank.slice(Math.max(0, bank.length - count))
}

function lessonRoute(dayIndex: number): string {
  const day = english90Days[dayIndex]!
  if (day.exam) {
    return [
      `Цель дня: ${day.goal}`,
      '',
      'Маршрут контрольного дня:',
      '1. Разминка и карточки без подсказок — 10 минут.',
      '2. Грамматика и активная лексика — 20 минут.',
      '3. Reading и listening без транскрипта — 20 минут.',
      '4. Письменное задание — 20–30 минут.',
      '5. Монолог и диалог с уточняющими вопросами — 10–15 минут.',
      '6. Проверка, классификация ошибок и план повторения — 15 минут.',
    ].join('\n')
  }

  return [
    `Цель дня: ${day.goal}`,
    '',
    'Основной режим · 45–60 минут:',
    '1. Повторение карточек — 10 минут.',
    '2. Теория и три собственных примера — 10–15 минут.',
    '3. Listening в три прохода — 10 минут.',
    '4. Разговор, письмо, перевод или пересказ — 15–20 минут.',
    '5. Дневник ошибок — 5 минут.',
    '',
    'Загруженный день · 30 минут: 5 минут карточек, 10 минут теории, 10 минут активной практики и 5 минут дневника.',
  ].join('\n')
}

function detailedTheory(dayIndex: number): string {
  const day = english90Days[dayIndex]!
  return [
    day.theory,
    '',
    `Опорная модель: ${day.formula}`,
    '',
    `Фокус сегодняшнего дня: ${day.task}`,
    '',
    'Алгоритм применения:',
    '• определите смысл: привычка, процесс, завершённое событие, план, условие или пересказ;',
    '• найдите подлежащее и выберите форму вспомогательного глагола;',
    '• соберите утверждение, отрицание и вопрос;',
    '• произнесите три личных примера без чтения;',
    '• сравните себя с типичной ошибкой и объясните исправление своими словами.',
  ].join('\n')
}

function listeningGuide(dayIndex: number): string {
  const day = english90Days[dayIndex]!
  return [
    `Тема: ${day.title}.`,
    'Первый проход: не открывайте текст; запишите главную мысль одним предложением.',
    'Второй проход: выпишите имена, числа, причины, решения и последовательность событий.',
    'Третий проход: откройте транскрипт, отметьте незнакомые сочетания и повторите 3–5 фраз методом shadowing.',
    'После прослушивания перескажите материал и ответьте: что произошло, почему это важно и что вы думаете об этом?',
  ].join('\n')
}

function dailyPractice(dayIndex: number): string {
  const day = english90Days[dayIndex]!
  return [
    day.task,
    '',
    'Обязательный результат:',
    '• используйте минимум пять новых выражений и одну опорную конструкцию;',
    '• говорите или пишите сначала без подсказок, затем улучшите формулировку;',
    '• не останавливайтесь из-за одной ошибки — закончите мысль и исправьте её после;',
    '• сохраните лучший ответ и одну ошибку для следующего повторения.',
    '',
    'Дневник урока:',
    'Дата: …',
    `Тема: ${day.title}`,
    'Новые выражения: …',
    'Мои ошибки и правильные варианты: …',
    'Что я уже могу сказать лучше: …',
  ].join('\n')
}

function examSpecification(dayIndex: number): string {
  const day = english90Days[dayIndex]!
  const specs: Record<number, string> = {
    1: '15 заданий по базовой грамматике; короткий текст; listening 2–3 минуты; рассказ о себе 2 минуты; письмо 80–100 слов.',
    2: 'Настоящее и прошедшее время; восстановление событий на слух; интервью о выходных; письменная история.',
    3: 'Настоящее, прошлое и будущее; письмо-приглашение; listening о планах; пятиминутный монолог первого месяца.',
    4: 'Модальные глаголы; просьбы и правила; устная ситуация с советом человеку, который хочет изменить жизнь.',
    5: 'Simple tenses и Present Perfect; жизненный опыт; различие опыта и завершённого события.',
    6: 'Условные предложения; реальная и воображаемая ситуация; аргументированное решение.',
    7: 'Пассивный залог; преобразование предложений; устное описание процесса.',
    8: 'Понимание и пересказ информации; say/tell; краткое содержание интервью или видео.',
    9: 'Естественность речи; фразовые глаголы; разговорные связки; перевод с последующим улучшением формулировки.',
    10: '30 заданий по грамматике; 20 по лексике; текст 500–700 слов и 10 вопросов; listening 5–7 минут; письмо 180–220 слов; пятиминутный монолог и диалог.',
  }

  return [
    `Пробный экзамен №${day.exam}`,
    specs[day.exam!] ?? '',
    '',
    'Сначала выполните всё без ответов. После проверки выпишите пять повторяющихся ошибок, исправьте их и запланируйте повторение через 1, 3, 7 и 14 дней.',
  ].join('\n')
}

function dayBlocks(dayIndex: number): LessonBlock[] {
  const day = english90Days[dayIndex]!
  const base = `english90-d${day.day}`
  const blocks: LessonBlock[] = [
    { id: `${base}-goal`, type: 'heading', title: `День ${day.day} · ${day.level}`, content: day.title, required: true },
    { id: `${base}-route`, type: 'callout', title: day.exam ? 'Контрольный день · расширенный режим' : 'Маршрут занятия · 45–60 минут', content: lessonRoute(dayIndex), required: true },
    { id: `${base}-theory`, type: 'grammar', title: 'Теория · правило, выбор формы и алгоритм', content: detailedTheory(dayIndex), required: true },
    { id: `${base}-formula`, type: 'callout', title: 'Языковая формула', content: day.formula, required: true },
    {
      id: `${base}-conversation`, type: 'conversation', title: 'Разговорная практика', content: day.conversation,
      role: 'Дружелюбный собеседник из США', prompt: day.conversation,
      starter: 'Начните на английском, отвечайте по 3–5 предложений и задавайте встречные вопросы.',
      sampleAnswer: day.translation.answer, required: true,
    },
    {
      id: `${base}-audio`, type: 'audio', title: 'Listening · три прохода и shadowing', content: listeningGuide(dayIndex),
      transcript: day.transcript, required: true,
    },
    {
      id: `${base}-cards`, type: 'flashcards', title: '20 карточек · повторение 0–1–3–7–14',
      content: 'Учите выражения целиком, произносите личный пример и отмечайте типичную ошибку.',
      cards: buildSpacedCards(dayIndex), required: true,
    },
    {
      id: `${base}-errors`, type: 'error_correction', title: 'Дневник ошибок',
      content: 'Исправьте, назовите правило и составьте по два правильных личных примера.',
      corrections: day.errors, required: true,
    },
    {
      id: `${base}-translation`, type: 'translation', title: 'Перевод → естественная речь',
      content: 'Сначала передайте смысл простыми словами, затем сравните с эталоном и улучшите формулировку.',
      sourceText: day.translation.source, targetText: day.translation.answer,
      comprehensionQuestions: [
        'Какие выражения нельзя переводить дословно?',
        'Какая грамматическая модель использована?',
        'Как выразить ту же мысль проще и как — естественнее?',
      ],
      required: true,
    },
    {
      id: `${base}-practice`, type: 'practice', title: day.exam ? `Практическая часть экзамена №${day.exam}` : 'Активная практика и дневник',
      content: day.exam ? examSpecification(dayIndex) : dailyPractice(dayIndex), required: true,
    },
  ]

  selectExamQuestions(dayIndex).forEach((item, index, questions) => blocks.push({
    id: `${base}-q${index + 1}`,
    type: 'single_choice',
    title: day.exam ? `Экзамен ${day.exam} · вопрос ${index + 1} из ${questions.length}` : `Мини-тест · вопрос ${index + 1} из 4`,
    content: item.question,
    options: item.options,
    correctOption: item.correct,
    explanation: item.explanation,
    required: true,
  }))

  return blocks
}

function lessonDuration(dayIndex: number): number {
  const exam = english90Days[dayIndex]!.exam
  if (exam === 10) return 180
  if (exam) return 120
  return 60
}

export function buildEnglish90DayDemoCourse(): Course {
  const course: Course = {
    id: 'english-90-days',
    ownerId: 'demo-user',
    accessRole: 'creator',
    creator: { id: 'demo-user', name: 'Вы' },
    joinCode: 'ENGLISH90',
    kind: 'language',
    languageCode: 'en',
    sourceLevel: 'A0',
    targetLevel: 'B1',
    defaultLessonDuration: 60,
    learningPlan: {
      durationWeeks: 13,
      sessionsPerWeek: 7,
      sessionMinutes: 60,
      totalSessions: 90,
      checkpointCount: 10,
      cadence: 'Каждый день по 45–60 минут; сокращённый режим — 30 минут',
      outcome: 'Увереннее говорить на повседневные темы, понимать основную мысль живой речи и самостоятельно исправлять типичные ошибки',
    },
    title: COURSE_TITLE,
    description: COURSE_DESCRIPTION,
    cover: 'linear-gradient(135deg,#07130e,#157347 55%,#42d392)',
    tag: '90',
    status: 'Опубликован',
    updated: 'Сегодня',
    modules: english90Modules.map((module, moduleIndex) => ({
      id: `english90-${module.id}`,
      title: module.title,
      open: moduleIndex === 0,
      lessons: english90Days
        .filter((day) => day.day >= module.range[0] && day.day <= module.range[1])
        .map((day) => ({
          id: `english-90-day-${day.day}`,
          title: `День ${day.day} · ${day.title}`,
          duration: lessonDuration(day.day - 1),
          status: 'Опубликован',
          blocks: dayBlocks(day.day - 1),
        })),
    })),
  }

  validateEnglish90DayCourse(course)
  return course
}

export interface English90DayAudit {
  lessonCount: number
  blockCount: number
  questionCount: number
  checkpointCount: number
  flashcardCount: number
  issues: string[]
}

export function auditEnglish90DayCourse(course: Course): English90DayAudit {
  const lessons = course.modules.flatMap((module) => module.lessons)
  const requiredTypes: BlockType[] = ['grammar', 'conversation', 'audio', 'flashcards', 'error_correction', 'translation', 'practice']
  const issues: string[] = []
  let questionCount = 0
  let checkpointCount = 0
  let flashcardCount = 0

  lessons.forEach((lesson, index) => {
    const dayNumber = index + 1
    const prefix = `День ${dayNumber}`
    const blockTypes = new Set(lesson.blocks.map((block) => block.type))
    requiredTypes.forEach((type) => {
      if (!blockTypes.has(type)) issues.push(`${prefix}: отсутствует блок ${type}`)
    })

    const theory = lesson.blocks.find((block) => block.type === 'grammar')
    if (!theory || theory.content.length < 700) issues.push(`${prefix}: теория недостаточно подробная`)

    const audio = lesson.blocks.find((block) => block.type === 'audio')
    if (!audio?.transcript || audio.transcript.length < 140) issues.push(`${prefix}: listening-транскрипт слишком короткий`)

    const cards = lesson.blocks.find((block) => block.type === 'flashcards')?.cards ?? []
    flashcardCount += cards.length
    if (cards.length !== 20) issues.push(`${prefix}: ожидалось 20 карточек, получено ${cards.length}`)

    const questions = lesson.blocks.filter((block) => block.type === 'single_choice')
    const exam = examDays.get(dayNumber)
    const expectedQuestions = examQuestionCount(exam)
    questionCount += questions.length
    if (exam) checkpointCount += 1
    if (questions.length !== expectedQuestions) issues.push(`${prefix}: ожидалось ${expectedQuestions} вопросов, получено ${questions.length}`)

    questions.forEach((question) => {
      if (!question.options?.length || question.correctOption === undefined || !question.explanation) {
        issues.push(`${prefix}: тестовый вопрос заполнен не полностью`)
      }
    })
  })

  if (course.modules.length !== 12) issues.push(`Ожидалось 12 тематических модулей, получено ${course.modules.length}`)
  if (lessons.length !== 90) issues.push(`Ожидалось 90 уроков, получено ${lessons.length}`)
  if (new Set(lessons.map((lesson) => lesson.title)).size !== 90) issues.push('Названия уроков должны быть уникальными')
  if (checkpointCount !== 10) issues.push(`Ожидалось 10 экзаменов, получено ${checkpointCount}`)

  return {
    lessonCount: lessons.length,
    blockCount: lessons.reduce((total, lesson) => total + lesson.blocks.length, 0),
    questionCount,
    checkpointCount,
    flashcardCount,
    issues,
  }
}

function validateEnglish90DayCourse(course: Course): void {
  const audit = auditEnglish90DayCourse(course)
  if (audit.issues.length) throw new Error(`English 90-day curriculum is invalid:\n${audit.issues.join('\n')}`)
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

type ExistingCourse = {
  id: string
  slug: string
  status: string
  description: string | null
  course_modules?: Array<{ title: string; lessons?: unknown[] }>
}

async function findExistingCourse(organizationId: string): Promise<ExistingCourse | null> {
  const db = requireSupabase()
  const select = 'id,slug,status,description,course_modules(id,title,lessons(id))'
  const { data: current, error: currentError } = await db.from('courses').select(select)
    .eq('organization_id', organizationId).eq('slug', COURSE_SLUG).maybeSingle()
  if (currentError) throw currentError
  if (current) return current as ExistingCourse

  const { data: legacy, error: legacyError } = await db.from('courses').select(select)
    .eq('organization_id', organizationId).eq('slug', LEGACY_COURSE_SLUG).maybeSingle()
  if (legacyError) throw legacyError
  return legacy as ExistingCourse | null
}

export async function seedEnglish90DayCourse(organizationId: string, userId: string): Promise<string> {
  const db = requireSupabase()
  const existing = await findExistingCourse(organizationId)
  let courseId: string

  if (existing) {
    courseId = String(existing.id)
    const modules = existing.course_modules ?? []
    const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0)
    const isCurrentVersion = String(existing.description ?? '').includes('Версия программы PDF 90')
    if (lessonCount === 90 && modules.length === 12 && isCurrentVersion) {
      if (existing.status !== 'published') {
        const { error } = await db.rpc('publish_course', { p_course_id: courseId, p_changelog: 'Published English 90-day curriculum' })
        if (error) throw error
      }
      return courseId
    }

    const { error: deleteError } = await db.from('course_modules').delete().eq('course_id', courseId)
    if (deleteError) throw deleteError
    const { error: updateError } = await db.from('courses').update({
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      description: COURSE_DESCRIPTION,
      language_code: 'en', source_level: 'A0', target_level: 'B1', duration_weeks: 13, lessons_per_week: 7,
      default_lesson_duration: 60, accent_color: '#42D392',
    }).eq('id', courseId)
    if (updateError) throw updateError
  } else {
    const { data, error } = await db.from('courses').insert({
      organization_id: organizationId,
      owner_id: userId,
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      description: COURSE_DESCRIPTION,
      language_code: 'en', source_level: 'A0', target_level: 'B1', duration_weeks: 13,
      lessons_per_week: 7, default_lesson_duration: 60, accent_color: '#42D392',
      visibility: 'private', is_sequential: true,
    }).select('id').single()
    if (error) throw error
    courseId = String(data.id)
  }

  for (let moduleIndex = 0; moduleIndex < english90Modules.length; moduleIndex++) {
    const moduleDefinition = english90Modules[moduleIndex]!
    const { data: module, error: moduleError } = await db.from('course_modules').insert({
      course_id: courseId,
      title: moduleDefinition.title,
      description: `${moduleDefinition.level} · дни ${moduleDefinition.range[0]}–${moduleDefinition.range[1]}`,
      position: moduleIndex,
    }).select('id').single()
    if (moduleError) throw moduleError

    const days = english90Days.filter((day) => day.day >= moduleDefinition.range[0] && day.day <= moduleDefinition.range[1])
    for (let lessonIndex = 0; lessonIndex < days.length; lessonIndex++) {
      const day = days[lessonIndex]!
      const { data: lesson, error: lessonError } = await db.from('lessons').insert({
        course_id: courseId,
        module_id: module.id,
        slug: `day-${day.day}`,
        title: `День ${day.day} · ${day.title}`,
        description: day.goal,
        objectives: [day.goal],
        duration_minutes: lessonDuration(day.day - 1),
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
        schema_version: block.schemaVersion ?? 1,
      }))
      const { error: blockError } = await db.from('lesson_blocks').insert(rows)
      if (blockError) throw blockError
    }
  }

  const { error: publishError } = await db.rpc('publish_course', {
    p_course_id: courseId,
    p_changelog: 'English 90-day curriculum v1 based on the supplied PDF program',
  })
  if (publishError) throw publishError
  return courseId
}
