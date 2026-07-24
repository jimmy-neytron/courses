import type { Ref } from 'vue'

import type { CourseRepository } from '@/services/courses/course.repository'
import type { Course } from '@/types/course'

export interface CourseStoreContext {
  courses: Ref<Course[]>
  repository: CourseRepository
  persist(): void
}
