import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import type { Course, CourseCreateInput, CourseStatus } from '@/types/course'

export type CourseStatusFilter = CourseStatus | 'Все'
export type CourseAccessFilter = 'Все курсы' | 'Созданные мной' | 'Я прохожу'

export function useCoursesPage() {
  const store = useCourseStore()
  const router = useRouter()
  const query = ref('')
  const status = ref<CourseStatusFilter>('Все')
  const access = ref<CourseAccessFilter>('Все курсы')
  const createDialogOpen = ref(false)
  const joinDialogOpen = ref(false)
  const joining = ref(false)
  const joinError = ref('')
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
    const id = await store.createCourse({
      ...input,
      description: input.description || 'Новая учебная программа',
    })
    createDialogOpen.value = false
    await router.push(`/app/courses/${id}`)
  }

  async function joinCourse(code: string): Promise<void> {
    joining.value = true
    joinError.value = ''
    try {
      const id = await store.joinCourse(code)
      joinDialogOpen.value = false
      access.value = 'Я прохожу'
      await router.push(`/preview/courses/${id}`)
    } catch (error) {
      joinError.value = error instanceof Error ? error.message : 'Не удалось присоединиться к курсу'
    } finally {
      joining.value = false
    }
  }

  function openDeleteDialog(course: Course): void {
    selectedForDelete.value = course
    deleteError.value = ''
  }

  async function confirmDelete(): Promise<void> {
    if (!selectedForDelete.value) return
    deleting.value = true
    deleteError.value = ''

    try {
      await store.deleteCourse(selectedForDelete.value.id)
      selectedForDelete.value = null
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : 'Не удалось удалить курс'
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
    joinDialogOpen,
    joining,
    joinError,
    selectedForDelete,
    deleting,
    deleteError,
    filteredCourses,
    createCourse,
    joinCourse,
    openDeleteDialog,
    confirmDelete,
  }
}
