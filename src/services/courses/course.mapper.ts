import { normalizeCourseAccent } from '@/constants/course'
import type {
  Course,
  CourseModule,
  Lesson,
  LessonBlock,
  LessonBlockContent,
  LessonBlockType,
} from '@/types/course'
import type { CourseModuleRow, CourseRow, LessonBlockRow, LessonRow } from '@/types/database'

export function mapBlock(row: LessonBlockRow): LessonBlock {
  return {
    id: row.id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    blockType: row.block_type as LessonBlockType,
    position: row.position,
    title: row.title ?? '',
    publicContent: (row.public_content ?? {}) as LessonBlockContent,
    privateContent: row.private_content ?? {},
    settings: row.settings ?? {},
    isRequired: row.is_required,
    points: Number(row.points),
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLesson(row: LessonRow, blocks: LessonBlockRow[] = []): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    objectives: row.objectives ?? [],
    durationMinutes: row.duration_minutes,
    passingScore: Number(row.passing_score),
    position: row.position,
    status: row.status,
    isPreview: row.is_preview,
    isCompleted: row.is_completed ?? false,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks: blocks
      .filter((block) => block.lesson_id === row.id)
      .sort((left, right) => left.position - right.position)
      .map(mapBlock),
  }
}

export function mapModule(
  row: CourseModuleRow,
  lessons: LessonRow[] = [],
  blocks: LessonBlockRow[] = [],
): CourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description ?? '',
    position: row.position,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lessons: lessons
      .filter((lesson) => lesson.module_id === row.id)
      .sort((left, right) => left.position - right.position)
      .map((lesson) => mapLesson(lesson, blocks)),
  }
}

export function mapCourse(
  row: CourseRow,
  modules: CourseModuleRow[] = [],
  lessons: LessonRow[] = [],
  blocks: LessonBlockRow[] = [],
): Course {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    languageCode: row.language_code,
    sourceLevel: row.source_level ?? '',
    targetLevel: row.target_level ?? '',
    durationWeeks: row.duration_weeks,
    lessonsPerWeek: row.lessons_per_week,
    defaultLessonDuration: row.default_lesson_duration,
    coverPath: row.cover_path,
    accentColor: normalizeCourseAccent(row.accent_color),
    status: row.status,
    visibility: row.visibility,
    isSequential: row.is_sequential,
    currentReleaseId: row.current_release_id,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    modules: modules
      .filter((module) => module.course_id === row.id)
      .sort((left, right) => left.position - right.position)
      .map((module) => mapModule(module, lessons, blocks)),
  }
}
