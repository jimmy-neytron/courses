import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import { useTransientFlag } from '@/composables/useTransientFlag'
import { useCourseAccess } from '@/composables/useCourseAccess'
import type { CourseModule } from '@/types/course'

export type CourseDetailsTab = 'overview' | 'curriculum' | 'settings'

export function useCourseDetails() {
  const route = useRoute()
  const router = useRouter()
  const store = useCourseStore()
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
  const inviteDialogOpen = ref(false)
  const inviteRefreshing = ref(false)
  const inviteError = ref('')
  const moduleTitle = ref('')
  const lessonTitle = ref('')
  const lessonModuleId = ref('')
  const orderSaving = ref(false)
  const duplicatingId = ref('')
  const deleting = ref(false)
  const actionError = ref('')
  const deleteError = ref('')
  const { value: saved, show: showSaved } = useTransientFlag()

  async function run(action: () => Promise<void>, fallback: string) {
    actionError.value = ''
    try {
      await action()
    } catch (error) {
      actionError.value = error instanceof Error ? error.message : fallback
    }
  }

  async function persistOrder() {
    if (!course.value || !canManage.value) return
    orderSaving.value = true
    await run(async () => {
      await store.persistCourseOrder(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить порядок')
    orderSaving.value = false
  }

  async function createModule() {
    const title = moduleTitle.value.trim()
    if (!course.value || !canManage.value || !title) return
    await run(async () => {
      await store.addModule(course.value!.id, title)
      moduleTitle.value = ''
      moduleDialogOpen.value = false
    }, 'Не удалось создать модуль')
  }

  function openLessonDialog(moduleId: string) {
    if (!canManage.value) return
    lessonModuleId.value = moduleId
    lessonDialogOpen.value = true
  }

  async function createLesson() {
    const title = lessonTitle.value.trim()
    if (!course.value || !canManage.value || !title) return
    await run(async () => {
      const id = await store.addLesson(course.value!.id, lessonModuleId.value, title)
      lessonTitle.value = ''
      lessonDialogOpen.value = false
      if (id) await router.push(`/app/lessons/${id}/editor`)
    }, 'Не удалось создать урок')
  }

  async function duplicateLesson(moduleId: string, lessonId: string) {
    if (!course.value || !canManage.value || duplicatingId.value) return
    duplicatingId.value = lessonId
    await run(async () => {
      await store.duplicateLesson(course.value!.id, moduleId, lessonId)
      showSaved()
    }, 'Не удалось дублировать урок')
    duplicatingId.value = ''
  }

  async function duplicateModule(moduleId: string) {
    if (!course.value || !canManage.value || duplicatingId.value) return
    duplicatingId.value = moduleId
    await run(async () => {
      await store.duplicateModule(course.value!.id, moduleId)
      showSaved()
    }, 'Не удалось дублировать модуль')
    duplicatingId.value = ''
  }

  async function saveSettings() {
    if (!course.value || !canManage.value) return
    await run(async () => {
      await store.saveCourse(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить курс')
  }

  async function publishCourse() {
    if (!course.value || !canManage.value) return
    await run(async () => {
      await store.publishCourse(course.value!.id)
      showSaved()
    }, 'Не удалось опубликовать курс')
  }

  async function deleteCourse() {
    if (!course.value || !canManage.value) return
    deleting.value = true
    deleteError.value = ''
    try {
      await store.deleteCourse(course.value.id)
      deleteDialogOpen.value = false
      await router.push('/app/courses')
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : 'Не удалось удалить курс'
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
    } catch (error) {
      inviteError.value = error instanceof Error ? error.message : 'Не удалось обновить код приглашения'
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
    inviteDialogOpen,
    inviteRefreshing,
    inviteError,
    moduleTitle,
    lessonTitle,
    orderSaving,
    duplicatingId,
    deleting,
    saved,
    actionError,
    deleteError,
    persistOrder,
    createModule,
    openLessonDialog,
    createLesson,
    duplicateLesson,
    duplicateModule,
    saveSettings,
    publishCourse,
    deleteCourse,
    refreshInviteCode,
  }
}
