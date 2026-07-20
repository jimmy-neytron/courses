import type { Course } from '@/types/course'

const SUPABASE_CACHE_PREFIX = 'course-platform-cache-v2-'
const DEMO_CACHE_KEY = 'cursor-courses-v4'

function inferCourseKind(course: Course): Course['kind'] {
  if (course.kind) return course.kind
  if (course.sourceLevel || course.targetLevel) return 'language'
  const languageTypes = new Set(['vocabulary', 'conversation', 'flashcards', 'error_correction', 'translation'])
  return course.modules.some((module) => module.lessons.some((lesson) => (
    lesson.blocks.some((block) => languageTypes.has(block.type))
  ))) ? 'language' : 'general'
}
function normalizeCachedCourse(course: Course): Course {
  const ownerId = course.ownerId || 'legacy-owner'
  return {
    ...course,
    ownerId,
    accessRole: course.accessRole || 'creator',
    kind: inferCourseKind(course),
    languageCode: course.languageCode || (inferCourseKind(course) === 'language' ? 'en' : undefined),
    defaultLessonDuration: course.defaultLessonDuration || 45,
    creator: course.creator || { id: ownerId, name: 'Вы' },
  }
}

function parseCourses(value: string | null): Course[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as Course[]).map(normalizeCachedCourse) : []
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
