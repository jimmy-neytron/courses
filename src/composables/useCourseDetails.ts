import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import { useNotificationStore } from '@/stores/notifications'
import { useTransientFlag } from '@/composables/useTransientFlag'
import { useCourseAccess } from '@/composables/useCourseAccess'
import type { CourseModule } from '@/types/course'

export type CourseDetailsTab = 'overview' | 'curriculum' | 'settings'

export function useCourseDetails() {
  const route = useRoute()
  const router = useRouter()
  const store = useCourseStore()
  const notifications = useNotificationStore()
  const course = computed(() => store.findCourse(String(route.params.courseId)))
  const { isCreator, isLearner, canManage } = useCourseAccess(course)
  const modules = computed<CourseModule[]>({
    get: () => course.value?.modules ?? [],
    set: (value) => { if (course.value) course.value.modules = value },
  })
  const totalLessons = computed(() => modules.value.reduce((sum, module) => sum + module.lessons.length, 0))
  const totalMinutes = computed(() => modules.value.reduce(
    (sum, module) => sum + module.lessons.reduce((minutes, lesson) => minutes + lesson.duration, 0),
    0,
  ))

  const tab = ref<CourseDetailsTab>('curriculum')
  const moduleDialogOpen = ref(false)
  const lessonDialogOpen = ref(false)
  const deleteDialogOpen = ref(false)
  const deleteLessonsDialogOpen = ref(false)
  const inviteDialogOpen = ref(false)
  const inviteRefreshing = ref(false)
  const inviteError = ref('')
  const moduleTitle = ref('')
  const lessonTitle = ref('')
  const lessonModuleId = ref('')
  const orderSaving = ref(false)
  const duplicatingId = ref('')
  const deleting = ref(false)
  const deletingLessons = ref(false)
  const selectionMode = ref(false)
  const selectedLessonIds = ref<string[]>([])
  const selectionAnchorId = ref('')
  const actionError = ref('')
  const deleteError = ref('')
  const { value: saved, show: showSaved } = useTransientFlag()

  async function run(action: () => Promise<void>, fallback: string, success?: string): Promise<boolean> {
    actionError.value = ''
    try {
      await action()
      if (success) notifications.success(success)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : fallback
      actionError.value = message
      notifications.error(message)
      return false
    }
  }

  async function persistOrder() {
    if (!course.value || !canManage.value) return
    orderSaving.value = true
    await run(async () => {
      await store.persistCourseOrder(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить порядок', 'Порядок уроков сохранён')
    orderSaving.value = false
  }

  async function createModule() {
    const title = moduleTitle.value.trim()
    if (!course.value || !canManage.value || !title) return
    await run(async () => {
      await store.addModule(course.value!.id, title)
      moduleTitle.value = ''
      moduleDialogOpen.value = false
    }, 'Не удалось создать модуль', 'Модуль добавлен')
  }

  function openLessonDialog(moduleId: string) {
    if (!canManage.value) return
    lessonModuleId.value = moduleId
    lessonDialogOpen.value = true
  }

  async function createLesson() {
    const title = lessonTitle.value.trim()
    if (!course.value || !canManage.value || !title) return
    let createdId: string | undefined
    const created = await run(async () => {
      createdId = await store.addLesson(course.value!.id, lessonModuleId.value, title)
      lessonTitle.value = ''
      lessonDialogOpen.value = false
    }, 'Не удалось создать урок', 'Урок создан')
    if (created && createdId) await router.push(`/app/lessons/${createdId}/editor`)
  }

  async function duplicateLesson(moduleId: string, lessonId: string) {
    if (!course.value || !canManage.value || duplicatingId.value) return
    duplicatingId.value = lessonId
    await run(async () => {
      await store.duplicateLesson(course.value!.id, moduleId, lessonId)
      showSaved()
    }, 'Не удалось дублировать урок', 'Копия урока добавлена')
    duplicatingId.value = ''
  }

  async function duplicateModule(moduleId: string) {
    if (!course.value || !canManage.value || duplicatingId.value) return
    duplicatingId.value = moduleId
    await run(async () => {
      await store.duplicateModule(course.value!.id, moduleId)
      showSaved()
    }, 'Не удалось дублировать модуль', 'Копия модуля добавлена')
    duplicatingId.value = ''
  }

  function toggleSelectionMode(): void {
    selectionMode.value = !selectionMode.value
    if (!selectionMode.value) {
      selectedLessonIds.value = []
      selectionAnchorId.value = ''
    }
  }

  function toggleLessonSelection(lessonId: string, extendRange = false, forceSelect = false): void {
    if (!selectionMode.value) selectionMode.value = true
    const selected = new Set(selectedLessonIds.value)
    const lessonIds = modules.value.flatMap((module) => module.lessons.map((lesson) => lesson.id))
    const anchorIndex = lessonIds.indexOf(selectionAnchorId.value)
    const lessonIndex = lessonIds.indexOf(lessonId)

    if (extendRange && anchorIndex >= 0 && lessonIndex >= 0) {
      const start = Math.min(anchorIndex, lessonIndex)
      const end = Math.max(anchorIndex, lessonIndex)
      lessonIds.slice(start, end + 1).forEach((id) => selected.add(id))
    } else if (forceSelect) selected.add(lessonId)
    else if (selected.has(lessonId)) selected.delete(lessonId)
    else selected.add(lessonId)

    selectedLessonIds.value = [...selected]
    selectionAnchorId.value = lessonId
  }

  function toggleModuleLessons(moduleId: string): void {
    const lessonIds = modules.value.find((module) => module.id === moduleId)?.lessons.map((lesson) => lesson.id) ?? []
    const selected = new Set(selectedLessonIds.value)
    const allSelected = lessonIds.length > 0 && lessonIds.every((id) => selected.has(id))
    lessonIds.forEach((id) => allSelected ? selected.delete(id) : selected.add(id))
    selectedLessonIds.value = [...selected]
    selectionAnchorId.value = lessonIds.at(-1) ?? ''
  }

  function requestDeleteSelectedLessons(): void {
    if (selectedLessonIds.value.length) deleteLessonsDialogOpen.value = true
  }

  async function deleteSelectedLessons(): Promise<void> {
    if (!course.value || !canManage.value || !selectedLessonIds.value.length) return
    const lessonIds = [...selectedLessonIds.value]
    const count = lessonIds.length
    deletingLessons.value = true
    const deleted = await run(
      () => store.removeLessons(course.value!.id, lessonIds),
      'Не удалось удалить выбранные уроки',
      count === 1 ? 'Урок удалён' : `Удалено уроков: ${count}`,
    )
    deletingLessons.value = false
    if (deleted) {
      selectedLessonIds.value = []
      selectionMode.value = false
      selectionAnchorId.value = ''
      deleteLessonsDialogOpen.value = false
    }
  }

  async function saveSettings() {
    if (!course.value || !canManage.value) return
    await run(async () => {
      await store.saveCourse(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить курс', 'Настройки курса сохранены')
  }

  async function publishCourse() {
    if (!course.value || !canManage.value) return
    await run(async () => {
      await store.publishCourse(course.value!.id)
      showSaved()
    }, 'Не удалось опубликовать курс', 'Курс опубликован')
  }

  async function deleteCourse() {
    if (!course.value || !canManage.value) return
    deleting.value = true
    deleteError.value = ''
    try {
      await store.deleteCourse(course.value.id)
      deleteDialogOpen.value = false
      notifications.success('Курс удалён')
      await router.push('/app/courses')
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : 'Не удалось удалить курс'
      notifications.error(deleteError.value)
    } finally {
      deleting.value = false
    }
  }

  async function refreshInviteCode() {
    if (!course.value || !canManage.value) return
    inviteRefreshing.value = true
    inviteError.value = ''
    try {
      await store.refreshJoinCode(course.value.id)
      notifications.success('Код приглашения обновлён')
    } catch (error) {
      inviteError.value = error instanceof Error ? error.message : 'Не удалось обновить код приглашения'
      notifications.error(inviteError.value)
    } finally {
      inviteRefreshing.value = false
    }
  }

  return {
    store,
    course,
    isCreator,
    isLearner,
    canManage,
    modules,
    totalLessons,
    totalMinutes,
    tab,
    moduleDialogOpen,
    lessonDialogOpen,
    deleteDialogOpen,
    deleteLessonsDialogOpen,
    inviteDialogOpen,
    inviteRefreshing,
    inviteError,
    moduleTitle,
    lessonTitle,
    orderSaving,
    duplicatingId,
    deleting,
    deletingLessons,
    selectionMode,
    selectedLessonIds,
    saved,
    actionError,
    deleteError,
    persistOrder,
    createModule,
    openLessonDialog,
    createLesson,
    duplicateLesson,
    duplicateModule,
    toggleSelectionMode,
    toggleLessonSelection,
    toggleModuleLessons,
    requestDeleteSelectedLessons,
    deleteSelectedLessons,
    saveSettings,
    publishCourse,
    deleteCourse,
    refreshInviteCode,
  }
}