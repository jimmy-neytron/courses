import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import { useNotificationStore } from '@/stores/notifications'
import type { Course, CourseCreateInput, CourseStatus } from '@/types/course'

export type CourseStatusFilter = CourseStatus | 'Все'
export type CourseAccessFilter = 'Все курсы' | 'Созданные мной' | 'Я прохожу'

const text = {
  defaultDescription: '\u041d\u043e\u0432\u0430\u044f \u0443\u0447\u0435\u0431\u043d\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430',
  courseCreated: '\u041a\u0443\u0440\u0441 \u0441\u043e\u0437\u0434\u0430\u043d',
  createFailed: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0443\u0440\u0441',
  courseDeleted: '\u041a\u0443\u0440\u0441 \u0443\u0434\u0430\u043b\u0451\u043d',
  deleteFailed: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u0443\u0440\u0441',
  published: '\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d',
  draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
  publishFailed: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u0443\u0441 \u043a\u0443\u0440\u0441\u0430',
  coursePublished: '\u041a\u0443\u0440\u0441 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d',
  courseDrafted: '\u041a\u0443\u0440\u0441 \u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0451\u043d \u0432 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
  publishBeforeShare: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u0443\u0439\u0442\u0435 \u043a\u0443\u0440\u0441',
  linkCopied: '\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430',
  copyFailed: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443',
}

export function useCoursesPage() {
  const store = useCourseStore()
  const notifications = useNotificationStore()
  const router = useRouter()
  const query = ref('')
  const status = ref<CourseStatusFilter>('Все')
  const access = ref<CourseAccessFilter>('Все курсы')
  const createDialogOpen = ref(false)
  const selectedForDelete = ref<Course | null>(null)
  const deleting = ref(false)
  const deleteError = ref('')

  const statusOptions: CourseStatusFilter[] = ['Все', 'Опубликован', 'Черновик']
  const accessOptions: CourseAccessFilter[] = ['Все курсы', 'Созданные мной', 'Я прохожу']
  const filteredCourses = computed(() => {
    const normalizedQuery = query.value.trim().toLocaleLowerCase('ru-RU')
    return store.courses.filter((course) => (
      (!normalizedQuery || course.title.toLocaleLowerCase('ru-RU').includes(normalizedQuery))
      && (status.value === 'Все' || course.status === status.value)
      && (access.value === 'Все курсы'
        || (access.value === 'Созданные мной' && course.accessRole === 'creator')
        || (access.value === 'Я прохожу' && course.accessRole === 'learner'))
    ))
  })

  async function createCourse(input: CourseCreateInput): Promise<void> {
    try {
      const id = await store.createCourse({ ...input, description: input.description || text.defaultDescription })
      createDialogOpen.value = false
      notifications.success(text.courseCreated)
      await router.push('/app/courses/' + id)
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : text.createFailed)
    }
  }

  function openDeleteDialog(course: Course): void {
    selectedForDelete.value = course
    deleteError.value = ''
  }

  async function shareCourse(course: Course): Promise<void> {
    if (course.status !== text.published) {
      notifications.info(text.publishBeforeShare)
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.origin + '/preview/courses/' + course.id)
      notifications.success(text.linkCopied)
    } catch {
      notifications.error(text.copyFailed)
    }
  }

  async function toggleCourseStatus(course: Course): Promise<void> {
    const next = course.status === text.published ? text.draft : text.published
    try {
      await store.setCourseStatus(course.id, next as CourseStatus)
      notifications.success(next === text.published ? text.coursePublished : text.courseDrafted)
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : text.publishFailed)
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!selectedForDelete.value) return
    deleting.value = true
    deleteError.value = ''

    try {
      await store.deleteCourse(selectedForDelete.value.id)
      selectedForDelete.value = null
      notifications.success(text.courseDeleted)
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : text.deleteFailed
      notifications.error(deleteError.value)
    } finally {
      deleting.value = false
    }
  }

  return {
    query,
    status,
    access,
    statusOptions,
    accessOptions,
    createDialogOpen,
    selectedForDelete,
    deleting,
    deleteError,
    filteredCourses,
    createCourse,
    openDeleteDialog,
    shareCourse,
    toggleCourseStatus,
    confirmDelete,
  }
}
