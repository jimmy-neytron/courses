import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { createLessonSectionConfig, resolveLessonBlockSection } from '@/composables/useCourseSections'
import { useLearningProgress } from '@/composables/useLearningProgress'
import { useCourseStore } from '@/stores/courses'
import type { Lesson, LessonBlock, LessonSectionId } from '@/types/course'

export interface LessonPlayerSection {
  id: LessonSectionId
  label: string
  visible: boolean
  order: number
  blocks: LessonBlock[]
}

export function useLessonPlayer(lessonSource: MaybeRefOrGetter<Lesson>) {
  const store = useCourseStore()
  const progress = useLearningProgress()
  const activeSectionId = ref<LessonSectionId>('theory')
  const answers = ref<Record<string, number>>({})
  const completedSections = ref<string[]>([])
  const lesson = computed(() => toValue(lessonSource))

  const sections = computed<LessonPlayerSection[]>(() => createLessonSectionConfig(lesson.value.sectionConfig)
    .filter((section) => section.visible)
    .map((section) => ({
      ...section,
      blocks: lesson.value.blocks.filter((block) => resolveLessonBlockSection(block) === section.id),
    }))
    .filter((section) => section.blocks.length))

  const currentSection = computed(() => (
    sections.value.find((section) => section.id === activeSectionId.value) ?? sections.value[0]
  ))
  const questions = computed(() => lesson.value.blocks.filter((block) => block.type === 'single_choice'))
  const currentQuestions = computed(() => currentSection.value?.blocks.filter((block) => block.type === 'single_choice') ?? [])
  const answeredCount = computed(() => questions.value.filter((block) => answers.value[block.id] !== undefined).length)
  const correctCount = computed(() => questions.value.filter((block) => answers.value[block.id] === block.correctOption).length)
  const found = computed(() => store.findLesson(lesson.value.id))
  const courseTitle = computed(() => found.value?.course.title ?? 'Учебный курс')
  const allLessons = computed(() => found.value?.course.modules.flatMap((module) => module.lessons) ?? [])
  const lessonIndex = computed(() => allLessons.value.findIndex((item) => item.id === lesson.value.id))
  const previousLesson = computed(() => allLessons.value[lessonIndex.value - 1])
  const nextLesson = computed(() => allLessons.value[lessonIndex.value + 1])
  const canFinish = computed(() => (
    sections.value.every((section) => completedSections.value.includes(section.id))
    && answeredCount.value === questions.value.length
  ))

  watch(lesson, (currentLesson) => {
    activeSectionId.value = sections.value[0]?.id ?? 'theory'
    answers.value = {}
    completedSections.value = [...progress.sections(currentLesson.id)]
  }, { immediate: true })

  function markSection(sectionId: string): void {
    if (!completedSections.value.includes(sectionId)) completedSections.value.push(sectionId)
    progress.markSection(lesson.value.id, sectionId)
  }

  function answerQuestion(block: LessonBlock, optionIndex: number, sectionId: LessonSectionId): void {
    answers.value[block.id] = optionIndex
    const sectionQuestions = sections.value
      .find((section) => section.id === sectionId)
      ?.blocks.filter((item) => item.type === 'single_choice') ?? []

    if (sectionQuestions.length && sectionQuestions.every((item) => answers.value[item.id] !== undefined)) {
      markSection(sectionId)
    }
  }

  function questionNumber(block: LessonBlock): number {
    return questions.value.findIndex((item) => item.id === block.id) + 1
  }

  function finishLesson(): void {
    if (canFinish.value) progress.completeLesson(lesson.value.id)
  }

  return {
    activeSectionId,
    answers,
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
    isCompleted: computed(() => progress.isCompleted(lesson.value.id)),
    markSection,
    answerQuestion,
    questionNumber,
    finishLesson,
  }
}
