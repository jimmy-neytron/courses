import type { Course } from '@/types/course'

const SUPABASE_CACHE_PREFIX = 'course-platform-cache-v1-'
const DEMO_CACHE_KEY = 'cursor-courses-v3'

function parseCourses(value: string | null): Course[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed as Course[] : []
  } catch {
    return []
  }
}

export function readDemoCourses(): Course[] {
  return parseCourses(localStorage.getItem(DEMO_CACHE_KEY))
}

export function writeDemoCourses(courses: Course[]): void {
  localStorage.setItem(DEMO_CACHE_KEY, JSON.stringify(courses))
}

export function clearDemoCourses(): void {
  localStorage.removeItem(DEMO_CACHE_KEY)
}

export function readCourseCache(organizationId: string): Course[] {
  return parseCourses(sessionStorage.getItem(SUPABASE_CACHE_PREFIX + organizationId))
}

export function writeCourseCache(organizationId: string, courses: Course[]): void {
  try {
    sessionStorage.setItem(SUPABASE_CACHE_PREFIX + organizationId, JSON.stringify(courses))
  } catch {
    // Storage may be unavailable in private browsing. In-memory state still works.
  }
}
