import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface LessonProgress { sections: string[]; completed: boolean; updatedAt: string }
type ProgressMap = Record<string, LessonProgress>
const STORAGE_KEY = 'english-engine-progress-v1'
const state = ref<ProgressMap>({})
let loaded = false

function readProgress(): ProgressMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as ProgressMap } catch { return {} }
}

function ensureLoaded(enabled: boolean): void {
  if (!enabled) {
    state.value = {}
    loaded = false
    return
  }
  if (!loaded) {
    state.value = readProgress()
    loaded = true
  }
}

export function useLearningProgress() {
  const auth = useAuthStore()
  const enabled = computed(() => auth.isAuthenticated)
  ensureLoaded(enabled.value)
  const completedIds = computed(() => enabled.value ? Object.entries(state.value).filter(([, progress]) => progress.completed).map(([lessonId]) => lessonId) : [])

  function updateLesson(lessonId: string, update: (progress: LessonProgress) => void): void {
    if (!enabled.value) return
    ensureLoaded(true)
    const progress = state.value[lessonId] ?? { sections: [], completed: false, updatedAt: '' }
    update(progress)
    progress.updatedAt = new Date().toISOString()
    state.value = { ...state.value, [lessonId]: progress }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }
  function markSection(lessonId: string, sectionId: string): void { updateLesson(lessonId, (progress) => { if (!progress.sections.includes(sectionId)) progress.sections.push(sectionId) }) }
  function toggleSection(lessonId: string, sectionId: string): void { updateLesson(lessonId, (progress) => { progress.sections = progress.sections.includes(sectionId) ? progress.sections.filter((id) => id !== sectionId) : [...progress.sections, sectionId] }) }
  function completeLesson(lessonId: string): void { updateLesson(lessonId, (progress) => { progress.completed = true }) }
  function setLessonCompleted(lessonId: string, completed: boolean): void { updateLesson(lessonId, (progress) => { progress.completed = completed }) }
  function toggleLesson(lessonId: string): void { updateLesson(lessonId, (progress) => { progress.completed = !progress.completed }) }

  return {
    enabled,
    state,
    completedIds,
    markSection,
    toggleSection,
    completeLesson,
    setLessonCompleted,
    toggleLesson,
    isCompleted: (lessonId: string) => enabled.value && Boolean(state.value[lessonId]?.completed),
    sections: (lessonId: string) => enabled.value ? state.value[lessonId]?.sections ?? [] : [],
  }
}