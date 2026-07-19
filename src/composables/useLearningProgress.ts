import { computed, ref } from 'vue'

interface LessonProgress {
  sections: string[]
  completed: boolean
  updatedAt: string
}

type ProgressMap = Record<string, LessonProgress>

const STORAGE_KEY = 'english-engine-progress-v1'

function readProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as ProgressMap
  } catch {
    return {}
  }
}

export function useLearningProgress() {
  const state = ref<ProgressMap>(readProgress())
  const completedIds = computed(() => Object.entries(state.value)
    .filter(([, progress]) => progress.completed)
    .map(([lessonId]) => lessonId))

  function persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  function updateLesson(lessonId: string, update: (progress: LessonProgress) => void): void {
    const progress = state.value[lessonId] ?? { sections: [], completed: false, updatedAt: '' }
    update(progress)
    progress.updatedAt = new Date().toISOString()
    state.value = { ...state.value, [lessonId]: progress }
    persist()
  }

  function markSection(lessonId: string, sectionId: string): void {
    updateLesson(lessonId, (progress) => {
      if (!progress.sections.includes(sectionId)) progress.sections.push(sectionId)
    })
  }

  function completeLesson(lessonId: string): void {
    updateLesson(lessonId, (progress) => {
      progress.completed = true
    })
  }

  return {
    state,
    completedIds,
    markSection,
    completeLesson,
    isCompleted: (lessonId: string) => Boolean(state.value[lessonId]?.completed),
    sections: (lessonId: string) => state.value[lessonId]?.sections ?? [],
  }
}
