import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import { useTransientFlag } from '@/composables/useTransientFlag'
import type { CourseModule } from '@/types/course'

export type CourseDetailsTab = 'overview' | 'curriculum' | 'settings'

export function useCourseDetails() {
  const route = useRoute()
  const router = useRouter()
  const store = useCourseStore()
  const course = computed(() => store.findCourse(String(route.params.courseId)))
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
  const moduleTitle = ref('')
  const lessonTitle = ref('')
  const lessonModuleId = ref('')
  const orderSaving = ref(false)
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
    if (!course.value) return
    orderSaving.value = true
    await run(async () => {
      await store.persistCourseOrder(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить порядок')
    orderSaving.value = false
  }

  async function createModule() {
    const title = moduleTitle.value.trim()
    if (!course.value || !title) return
    await run(async () => {
      await store.addModule(course.value!.id, title)
      moduleTitle.value = ''
      moduleDialogOpen.value = false
    }, 'Не удалось создать модуль')
  }

  function openLessonDialog(moduleId: string) {
    lessonModuleId.value = moduleId
    lessonDialogOpen.value = true
  }

  async function createLesson() {
    const title = lessonTitle.value.trim()
    if (!course.value || !title) return
    await run(async () => {
      const id = await store.addLesson(course.value!.id, lessonModuleId.value, title)
      lessonTitle.value = ''
      lessonDialogOpen.value = false
      if (id) await router.push(`/app/lessons/${id}/editor`)
    }, 'Не удалось создать урок')
  }

  async function saveSettings() {
    if (!course.value) return
    await run(async () => {
      await store.saveCourse(course.value!.id)
      showSaved()
    }, 'Не удалось сохранить курс')
  }

  async function publishCourse() {
    if (!course.value) return
    await run(async () => {
      await store.publishCourse(course.value!.id)
      showSaved()
    }, 'Не удалось опубликовать курс')
  }

  async function deleteCourse() {
    if (!course.value) return
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

  return {
    store,
    course,
    modules,
    totalLessons,
    totalMinutes,
    tab,
    moduleDialogOpen,
    lessonDialogOpen,
    deleteDialogOpen,
    moduleTitle,
    lessonTitle,
    orderSaving,
    deleting,
    saved,
    actionError,
    deleteError,
    persistOrder,
    createModule,
    openLessonDialog,
    createLesson,
    saveSettings,
    publishCourse,
    deleteCourse,
  }
}
