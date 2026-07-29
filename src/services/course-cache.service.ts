import type { Course } from '@/types/course'

const SUPABASE_CACHE_PREFIX = 'course-platform-cache-v4-'
const SUPABASE_CACHE_VERSION = 3
const SUPABASE_CACHE_TTL_MS = 10 * 60 * 1000
const DEMO_CACHE_KEY = 'cursor-courses-v4'

interface CourseCacheEnvelope {
  version: number
  storedAt: number
  courses: Course[]
}

function inferCourseKind(course: Course): Course['kind'] {
  if (course.kind) return course.kind
  if (course.sourceLevel || course.targetLevel) return 'language'

  const languageTypes = new Set([
    'vocabulary',
    'conversation',
    'flashcards',
    'error_correction',
    'translation',
  ])

  return course.modules.some((module) => (
    module.lessons.some((lesson) => (
      lesson.blocks.some(
        (block) => languageTypes.has(block.type),
      )
    ))
  ))
    ? 'language'
    : 'general'
}

function normalizeCachedCourse(course: Course): Course {
  const ownerId = course.ownerId || 'legacy-owner'
  const kind = inferCourseKind(course)

  return {
    ...course,
    ownerId,
    accessRole: course.accessRole || 'creator',
    kind,
    languageCode: course.languageCode
      || (kind === 'language' ? 'en' : undefined),
    defaultLessonDuration: course.defaultLessonDuration || 45,
    creator: course.creator || {
      id: ownerId,
      name: 'Вы',
    },
  }
}

function parseDemoCourses(value: string | null): Course[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown

    return Array.isArray(parsed)
      ? (parsed as Course[]).map(normalizeCachedCourse)
      : []
  } catch {
    return []
  }
}

function cacheKey(workspaceId: string): string {
  return `${SUPABASE_CACHE_PREFIX}${workspaceId}`
}

function toSafeSummary(course: Course): Course {
  return {
    ...course,
    // Detailed blocks may contain author-only data. The Supabase cache stores
    // only catalogue summaries.
    modules: [],
  }
}

export function readDemoCourses(): Course[] {
  if (typeof localStorage === 'undefined') return []

  return parseDemoCourses(
    localStorage.getItem(DEMO_CACHE_KEY),
  )
}

export function writeDemoCourses(courses: Course[]): void {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    DEMO_CACHE_KEY,
    JSON.stringify(courses),
  )
}

export function clearDemoCourses(): void {
  if (typeof localStorage === 'undefined') return

  localStorage.removeItem(DEMO_CACHE_KEY)
}

export function readCourseCache(
  workspaceId: string,
): Course[] {
  if (typeof sessionStorage === 'undefined') return []

  try {
    const raw = sessionStorage.getItem(
      cacheKey(workspaceId),
    )

    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<CourseCacheEnvelope>

    if (
      parsed.version !== SUPABASE_CACHE_VERSION
      || typeof parsed.storedAt !== 'number'
      || !Array.isArray(parsed.courses)
      || Date.now() - parsed.storedAt > SUPABASE_CACHE_TTL_MS
    ) {
      sessionStorage.removeItem(cacheKey(workspaceId))
      return []
    }

    return parsed.courses.map(normalizeCachedCourse)
  } catch {
    sessionStorage.removeItem(cacheKey(workspaceId))
    return []
  }
}

export function writeCourseCache(
  workspaceId: string,
  courses: Course[],
): void {
  if (typeof sessionStorage === 'undefined') return

  const envelope: CourseCacheEnvelope = {
    version: SUPABASE_CACHE_VERSION,
    storedAt: Date.now(),
    courses: courses.map(toSafeSummary),
  }

  try {
    sessionStorage.setItem(
      cacheKey(workspaceId),
      JSON.stringify(envelope),
    )
  } catch {
    // Storage may be unavailable in private browsing.
    // In-memory Pinia state remains the source of truth.
  }
}
