import type { CourseRepository } from './course.repository'
import { LocalCourseRepository } from './local-course.repository'
import { SupabaseCourseRepository } from './supabase-course.repository'
import { isSupabaseConfigured } from '@/services/supabase/client'

export function createCourseRepository(): CourseRepository {
  return isSupabaseConfigured
    ? new SupabaseCourseRepository()
    : new LocalCourseRepository()
}
