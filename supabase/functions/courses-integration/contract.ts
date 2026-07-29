export interface IntegrationCourseRow {
  id: string
  title: string
  description?: string | null
  cover_path?: string | null
  accent_color?: string | null
  duration_weeks?: number | null
  lessons_per_week?: number | null
  default_lesson_duration?: number | null
  updated_at?: string | null
  current_release_id: string
}

export interface IntegrationReleaseRow {
  id: string
  course_id: string
  version: number
  lesson_count: number
  published_at: string
  snapshot?: unknown
}

export interface CourseListItem {
  id: string
  releaseId: string
  title: string
  description: string
  coverUrl: string | null
  accentColor: string
  lessonCount: number
  durationWeeks: number | null
  lessonsPerWeek: number | null
  defaultLessonDuration: number
  status: 'active'
  updatedAt: string
}

export interface CourseManifestLesson {
  id: string
  moduleId: string
  moduleTitle: string
  modulePosition: number
  title: string
  lessonPosition: number
  durationMinutes: number
  url: string
}

export interface CourseManifest {
  schemaVersion: 1
  course: {
    id: string
    releaseId: string
    releaseVersion: number
    title: string
    coverUrl: string | null
    accentColor: string
    defaultLessonDuration: number
  }
  lessons: CourseManifestLesson[]
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object'
    ? value as JsonRecord
    : {}
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord => (
          Boolean(item)
          && typeof item === 'object'
        ),
      )
    : []
}

function positiveInteger(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isInteger(number) && number > 0
    ? number
    : fallback
}

function position(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
    ? number
    : Number.MAX_SAFE_INTEGER
}

function safeExternalUrl(
  publicAppUrl: string,
  lessonId: string,
): string {
  const base = new URL(publicAppUrl)
  const url = new URL(
    `/preview/lessons/${encodeURIComponent(lessonId)}`,
    base,
  )

  if (url.origin !== base.origin) {
    throw new Error('invalid_lesson_url_origin')
  }

  return url.toString()
}

export function buildCourseListItem(
  course: IntegrationCourseRow,
  release: IntegrationReleaseRow,
): CourseListItem {
  const releaseCourse = asRecord(
    asRecord(release.snapshot).course,
  )

  return {
    id: course.id,
    releaseId: release.id,
    title: String(releaseCourse.title ?? course.title),
    description: String(
      releaseCourse.description
      ?? course.description
      ?? '',
    ),
    coverUrl: String(
      releaseCourse.cover_path
      ?? course.cover_path
      ?? '',
    ) || null,
    accentColor: String(
      releaseCourse.accent_color
      ?? course.accent_color
      ?? '#00DC82',
    ),
    lessonCount: Math.max(0, Number(release.lesson_count) || 0),
    durationWeeks: course.duration_weeks ?? null,
    lessonsPerWeek: course.lessons_per_week ?? null,
    defaultLessonDuration: positiveInteger(
      releaseCourse.default_lesson_duration
        ?? course.default_lesson_duration,
      45,
    ),
    status: 'active',
    updatedAt: release.published_at,
  }
}

export function buildCourseManifest(
  course: IntegrationCourseRow,
  release: IntegrationReleaseRow,
  publicAppUrl: string,
): CourseManifest {
  const snapshot = asRecord(release.snapshot)
  const snapshotCourse = asRecord(snapshot.course)
  const defaultDuration = positiveInteger(
    snapshotCourse.default_lesson_duration
      ?? course.default_lesson_duration,
    45,
  )

  const lessons = asRecords(snapshotCourse.course_modules)
    .flatMap((module, moduleIndex) => {
      if (module.is_published === false) return []

      return asRecords(module.lessons)
        .filter((lesson) => lesson.status === 'published')
        .map((lesson, lessonIndex) => ({
          id: String(lesson.id ?? ''),
          moduleId: String(module.id ?? ''),
          moduleTitle: String(module.title ?? ''),
          modulePosition: position(
            module.position,
          ),
          title: String(lesson.title ?? ''),
          lessonPosition: position(
            lesson.position,
          ),
          durationMinutes: positiveInteger(
            lesson.duration_minutes,
            defaultDuration,
          ),
          url: safeExternalUrl(
            publicAppUrl,
            String(lesson.id ?? ''),
          ),
          sourceIndex: (
            moduleIndex * 1_000_000
            + lessonIndex
          ),
        }))
        .filter((lesson) => (
          lesson.id
          && lesson.moduleId
          && lesson.title
        ))
    })
    .sort((left, right) => (
      left.modulePosition - right.modulePosition
      || left.lessonPosition - right.lessonPosition
      || left.sourceIndex - right.sourceIndex
    ))
    .map(({ sourceIndex: _sourceIndex, ...lesson }) => lesson)

  return {
    schemaVersion: 1,
    course: {
      id: course.id,
      releaseId: release.id,
      releaseVersion: positiveInteger(
        release.version,
        1,
      ),
      title: String(snapshotCourse.title ?? course.title),
      coverUrl: String(
        snapshotCourse.cover_path
        ?? course.cover_path
        ?? '',
      ) || null,
      accentColor: String(
        snapshotCourse.accent_color
        ?? course.accent_color
        ?? '#00DC82',
      ),
      defaultLessonDuration: defaultDuration,
    },
    lessons,
  }
}
