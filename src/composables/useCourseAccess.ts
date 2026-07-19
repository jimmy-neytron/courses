import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Course } from '@/types/course'

export function useCourseAccess(course: MaybeRefOrGetter<Course | undefined>) {
  const role = computed(() => toValue(course)?.accessRole)
  const isCreator = computed(() => role.value === 'creator')
  const isLearner = computed(() => role.value === 'learner')

  return {
    role,
    isCreator,
    isLearner,
    canManage: isCreator,
  }
}
