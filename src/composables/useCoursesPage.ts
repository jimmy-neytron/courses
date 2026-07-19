import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courses'
import type { Course, CourseStatus } from '@/types/course'

export type CourseStatusFilter = CourseStatus | 'Все'

export function useCoursesPage() {
  const store = useCourseStore()
  const router = useRouter()
  const query = ref('')
  const status = ref<CourseStatusFilter>('Все')
  const createDialogOpen = ref(false)
  const selectedForDelete = ref<Course | null>(null)
  const deleting = ref(false)
  const deleteError = ref('')

  const statusOptions: CourseStatusFilter[] = ['Все', 'Опубликован', 'Черновик']
  const filteredCourses = computed(() => {
    const normalizedQuery = query.value.trim().toLocaleLowerCase('ru-RU')
    return store.courses.filter((course) => (
      (!normalizedQuery || course.title.toLocaleLowerCase('ru-RU').includes(normalizedQuery))
      && (status.value === 'Все' || course.status === status.value)
    ))
  })

  async function createCourse(input: { title: string; description: string }): Promise<void> {
    const id = await store.createCourse(
      input.title,
      input.description || 'Новая учебная программа',
    )
    createDialogOpen.value = false
    await router.push(`/app/courses/${id}`)
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
    statusOptions,
    createDialogOpen,
    selectedForDelete,
    deleting,
    deleteError,
    filteredCourses,
    createCourse,
    openDeleteDialog,
    confirmDelete,
  }
}
