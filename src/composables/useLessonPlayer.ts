import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import {
  createLessonSectionConfig,
  resolveLessonBlockSection,
} from '@/domain/lesson-sections'
import { useLearningProgress } from '@/composables/useLearningProgress'
import {
  checkLessonBlockAnswer,
  type QuizAnswerResult,
} from '@/services/quiz.service'
import { isSupabaseConfigured } from '@/services/supabase'
import { useCourseStore } from '@/stores/courses'
import type {
  Lesson,
  LessonBlock,
  LessonSectionId,
} from '@/types/course'

export interface LessonPlayerSection {
  id: LessonSectionId
  label: string
  visible: boolean
  order: number
  blocks: LessonBlock[]
}

export function useLessonPlayer(
  lessonSource: MaybeRefOrGetter<Lesson>,
  courseIdSource: MaybeRefOrGetter<string | undefined> = '',
) {
  const store = useCourseStore()
  const progress = useLearningProgress()

  const activeSectionId = ref<LessonSectionId>('content')
  const answers = ref<Record<string, number>>({})
  const answerResults = ref<Record<string, QuizAnswerResult>>({})
  const answerErrors = ref<Record<string, string>>({})
  const checkingAnswers = ref<Record<string, boolean>>({})
  const completedSections = ref<string[]>([])

  const lesson = computed(() => toValue(lessonSource))
  const found = computed(() => store.findLesson(lesson.value.id))
  const courseId = computed(() => (
    toValue(courseIdSource)
    || found.value?.course.id
    || ''
  ))
  const courseKind = computed(() => (
    found.value?.course.kind ?? 'general'
  ))

  const configuredSections = computed(() => (
    createLessonSectionConfig(
      lesson.value.sectionConfig,
      courseKind.value,
    )
  ))

  const sections = computed<LessonPlayerSection[]>(() => (
    configuredSections.value
      .filter((section) => section.visible)
      .map((section) => ({
        ...section,
        blocks: lesson.value.blocks.filter((block) => (
          resolveLessonBlockSection(
            block,
            configuredSections.value,
            courseKind.value,
          ) === section.id
        )),
      }))
      .filter((section) => section.blocks.length)
  ))

  const currentSection = computed(() => (
    sections.value.find(
      (section) => section.id === activeSectionId.value,
    )
    ?? sections.value[0]
  ))

  const questions = computed(() => (
    lesson.value.blocks.filter(
      (block) => block.type === 'single_choice',
    )
  ))

  const currentQuestions = computed(() => (
    currentSection.value?.blocks.filter(
      (block) => block.type === 'single_choice',
    )
    ?? []
  ))

  const answeredCount = computed(() => (
    questions.value.filter(
      (block) => answerResults.value[block.id] !== undefined,
    ).length
  ))

  const correctCount = computed(() => (
    questions.value.filter(
      (block) => answerResults.value[block.id]?.correct,
    ).length
  ))

  const courseTitle = computed(() => (
    found.value?.course.title ?? 'Учебный курс'
  ))

  const allLessons = computed(() => (
    found.value?.course.modules.flatMap(
      (module) => module.lessons,
    )
    ?? []
  ))

  const lessonIndex = computed(() => (
    allLessons.value.findIndex(
      (item) => item.id === lesson.value.id,
    )
  ))

  const previousLesson = computed(() => (
    allLessons.value[lessonIndex.value - 1]
  ))

  const nextLesson = computed(() => (
    allLessons.value[lessonIndex.value + 1]
  ))

  const canFinish = computed(() => (
    sections.value.every(
      (section) => completedSections.value.includes(section.id),
    )
    && answeredCount.value === questions.value.length
  ))

  watch(
    lesson,
    (currentLesson) => {
      activeSectionId.value = sections.value[0]?.id ?? 'content'
      answers.value = {}
      answerResults.value = {}
      answerErrors.value = {}
      checkingAnswers.value = {}
      completedSections.value = [
        ...progress.sections(currentLesson.id),
      ]
      syncLessonCompletion()
    },
    { immediate: true },
  )

  function syncLessonCompletion(): void {
    const allSectionsCompleted = sections.value.length > 0
      && sections.value.every(
        (section) => completedSections.value.includes(section.id),
      )

    progress.setLessonCompleted(
      lesson.value.id,
      allSectionsCompleted,
    )
  }

  function markSection(sectionId: string): void {
    if (!completedSections.value.includes(sectionId)) {
      completedSections.value.push(sectionId)
    }

    progress.markSection(lesson.value.id, sectionId)
    syncLessonCompletion()
  }

  function toggleSection(sectionId: string): void {
    completedSections.value = completedSections.value.includes(sectionId)
      ? completedSections.value.filter((id) => id !== sectionId)
      : [...completedSections.value, sectionId]

    progress.toggleSection(lesson.value.id, sectionId)
    syncLessonCompletion()
  }

  function localAnswerResult(
    block: LessonBlock,
    optionIndex: number,
  ): QuizAnswerResult {
    return {
      correct: optionIndex === block.correctOption,
      explanation: block.explanation ?? '',
    }
  }

  async function answerQuestion(
    block: LessonBlock,
    optionIndex: number,
    sectionId: LessonSectionId,
  ): Promise<void> {
    if (checkingAnswers.value[block.id]) return

    answers.value[block.id] = optionIndex
    delete answerResults.value[block.id]
    delete answerErrors.value[block.id]
    checkingAnswers.value[block.id] = true

    try {
      const result = isSupabaseConfigured
        ? await checkLessonBlockAnswer(block.id, optionIndex)
        : localAnswerResult(block, optionIndex)

      // Ignore an older response when the user has already chosen
      // another option.
      if (answers.value[block.id] !== optionIndex) return

      answerResults.value[block.id] = result

      const sectionQuestions = sections.value
        .find((section) => section.id === sectionId)
        ?.blocks.filter(
          (item) => item.type === 'single_choice',
        )
        ?? []

      if (
        sectionQuestions.length
        && sectionQuestions.every(
          (item) => answerResults.value[item.id] !== undefined,
        )
      ) {
        markSection(sectionId)
      }
    } catch (error) {
      answerErrors.value[block.id] = error instanceof Error
        ? error.message
        : 'Не удалось проверить ответ'
    } finally {
      checkingAnswers.value[block.id] = false
    }
  }

  function questionNumber(block: LessonBlock): number {
    return questions.value.findIndex(
      (item) => item.id === block.id,
    ) + 1
  }

  function finishLesson(): void {
    if (canFinish.value) {
      progress.completeLesson(lesson.value.id)
    }
  }

  function lessonHref(targetLesson: Lesson): string {
    return courseId.value
      ? `/preview/courses/${courseId.value}?lesson=${targetLesson.id}`
      : `/preview/lessons/${targetLesson.id}`
  }

  return {
    activeSectionId,
    answers,
    answerResults,
    answerErrors,
    checkingAnswers,
    completedSections,
    sections,
    currentSection,
    currentQuestions,
    questions,
    answeredCount,
    correctCount,
    courseTitle,
    previousLesson,
    nextLesson,
    canFinish,
    trackingEnabled: progress.enabled,
    isCompleted: computed(
      () => progress.isCompleted(lesson.value.id),
    ),
    markSection,
    toggleSection,
    answerQuestion,
    questionNumber,
    finishLesson,
    lessonHref,
  }
}
