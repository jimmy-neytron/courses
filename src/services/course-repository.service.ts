import type {
  BlockType,
  Course,
  CourseCreateInput,
  Lesson,
  LessonBlock,
  LessonSectionConfig,
} from '@/types/course'
import { mapDatabaseCourse } from '@/services/course-mapper.service'
import { createLessonAudioUrl } from '@/services/lesson-audio.service'
import { createLessonPdfUrl } from '@/services/lesson-pdf.service'
import {
  createLessonBlock,
  serializePrivateBlockContent,
  serializePublicBlockContent,
  toDatabaseBlockType,
} from '@/services/lesson-block-content.service'
import { requireSupabase } from '@/services/supabase'
import { slugify } from '@/utils/slugify'

const courseSelect = `
  id,
  owner_id,
  title,
  description,
  status,
  visibility,
  language_code,
  source_level,
  target_level,
  duration_weeks,
  lessons_per_week,
  default_lesson_duration,
  accent_color,
  updated_at,
  owner:profiles!courses_owner_id_fkey(id,display_name,avatar_url),
  course_modules(
    id,
    title,
    position,
    is_published,
    lessons(
      id,
      title,
      duration_minutes,
      status,
      position,
      lesson_blocks(
        id,
        block_type,
        title,
        public_content,
        private_content,
        settings,
        is_required,
        points,
        schema_version,
        position
      )
    )
  )
`

const publishSelect = `
  id,
  owner_id,
  slug,
  title,
  description,
  language_code,
  source_level,
  target_level,
  duration_weeks,
  lessons_per_week,
  default_lesson_duration,
  cover_path,
  accent_color,
  status,
  visibility,
  is_sequential,
  created_at,
  updated_at,
  course_modules(
    id,
    title,
    description,
    position,
    is_published,
    lessons(
      id,
      slug,
      title,
      description,
      objectives,
      duration_minutes,
      passing_score,
      position,
      status,
      is_preview,
      lesson_blocks(
        id,
        block_type,
        position,
        title,
        public_content,
        private_content,
        settings,
        is_required,
        points,
        schema_version
      )
    )
  )
`

type DatabaseRow = Record<string, unknown>

function throwIfError(error: { message?: string } | null): void {
  if (error) throw new Error(error.message || 'Ошибка базы данных')
}

function rows(value: unknown): DatabaseRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is DatabaseRow => Boolean(item) && typeof item === 'object')
    : []
}

async function resolveAssetUrls(courses: Course[]): Promise<void> {
  const blocks = courses.flatMap((course) => course.modules.flatMap(
    (module) => module.lessons.flatMap((lesson) => lesson.blocks),
  ))

  await Promise.all(blocks.map(async (block) => {
    try {
      if (block.audioPath) block.audioUrl = await createLessonAudioUrl(block.audioPath)
      if (block.filePath) block.fileUrl = await createLessonPdfUrl(block.filePath)
    } catch {
      if (block.audioPath) block.audioUrl = ''
      if (block.filePath) block.fileUrl = ''
    }
  }))
}

/**
 * organizationId remains in the signature because the old store passes it.
 * The current schema has no organizations, so courses are scoped by owner_id.
 */
export async function listCourses(_organizationId: string, userId: string): Promise<Course[]> {
  const { data, error } = await requireSupabase()
    .from('courses')
    .select(courseSelect)
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const courses = ((data ?? []) as unknown as DatabaseRow[]).map((row) => (
    mapDatabaseCourse(row, userId)
  ))

  await resolveAssetUrls(courses)
  return courses
}

export async function createCourseRecord(
  _organizationId: string,
  ownerId: string,
  input: CourseCreateInput,
): Promise<string> {
  const { data, error } = await requireSupabase()
    .from('courses')
    .insert({
      owner_id: ownerId,
      title: input.title,
      description: input.description,
      slug: slugify(input.title, 'course'),
      language_code: input.kind === 'language' ? input.languageCode || 'und' : 'und',
      source_level: input.kind === 'language' ? input.sourceLevel : null,
      target_level: input.kind === 'language' ? input.targetLevel : null,
      duration_weeks: input.durationWeeks,
      lessons_per_week: input.lessonsPerWeek,
      default_lesson_duration: input.defaultLessonDuration,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function createModuleRecord(
  courseId: string,
  title: string,
  position: number,
): Promise<string> {
  const { data, error } = await requireSupabase()
    .from('course_modules')
    .insert({ course_id: courseId, title, position })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function createLessonRecord(
  courseId: string,
  moduleId: string,
  title: string,
  position: number,
  durationMinutes: number,
): Promise<string> {
  const { data, error } = await requireSupabase()
    .from('lessons')
    .insert({
      course_id: courseId,
      module_id: moduleId,
      title,
      slug: slugify(title, 'lesson'),
      duration_minutes: durationMinutes,
      position,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function createBlockRecord(
  courseId: string,
  lessonId: string,
  type: BlockType,
  position: number,
  source?: LessonBlock,
): Promise<string> {
  const block = source ? structuredClone(source) : createLessonBlock('', type)
  const { data, error } = await requireSupabase()
    .from('lesson_blocks')
    .insert({
      course_id: courseId,
      lesson_id: lessonId,
      block_type: toDatabaseBlockType(type),
      title: block.title,
      public_content: serializePublicBlockContent(block),
      private_content: serializePrivateBlockContent(block),
      settings: {},
      is_required: block.required,
      points: 0,
      position,
      schema_version: block.schemaVersion ?? 1,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function updateLessonRecord(lessonId: string, lesson: Lesson): Promise<void> {
  const { error } = await requireSupabase()
    .from('lessons')
    .update({
      title: lesson.title,
      duration_minutes: lesson.duration,
      status: lesson.status === 'Опубликован' ? 'published' : 'draft',
    })
    .eq('id', lessonId)

  if (error) throw error
}

export async function updateBlockRecord(blockId: string, block: LessonBlock): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .update({
      title: block.title,
      public_content: serializePublicBlockContent(block),
      private_content: serializePrivateBlockContent(block),
      is_required: block.required,
      schema_version: block.schemaVersion ?? 1,
    })
    .eq('id', blockId)

  if (error) throw error
}

interface SaveSectionConfigInput {
  courseId: string
  lessonId: string
  sections: LessonSectionConfig[]
  blockId?: string
}

export async function saveSectionConfigRecord(input: SaveSectionConfigInput): Promise<string> {
  const publicContent = { kind: 'section_config', sections: input.sections }

  if (input.blockId) {
    const { error } = await requireSupabase()
      .from('lesson_blocks')
      .update({ public_content: publicContent })
      .eq('id', input.blockId)

    if (error) throw error
    return input.blockId
  }

  const { data, error } = await requireSupabase()
    .from('lesson_blocks')
    .insert({
      course_id: input.courseId,
      lesson_id: input.lessonId,
      block_type: 'summary',
      title: 'Настройки разделов',
      public_content: publicContent,
      private_content: {},
      settings: {},
      is_required: false,
      points: 0,
      position: 9999,
      schema_version: 1,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function deleteBlockRecord(blockId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .delete()
    .eq('id', blockId)

  if (error) throw error
}

/**
 * The supplied schema does not declare cascade deletion. Remove dependent
 * progress and block rows before lessons so bulk deletion keeps working.
 */
export async function deleteLessonRecords(lessonIds: string[]): Promise<void> {
  if (!lessonIds.length) return
  const database = requireSupabase()

  const progressResult = await database
    .from('lesson_progress')
    .delete()
    .in('lesson_id', lessonIds)
  throwIfError(progressResult.error)

  const blocksResult = await database
    .from('lesson_blocks')
    .delete()
    .in('lesson_id', lessonIds)
  throwIfError(blocksResult.error)

  const lessonsResult = await database
    .from('lessons')
    .delete()
    .in('id', lessonIds)
  throwIfError(lessonsResult.error)
}

export async function updateCourseRecord(course: Course): Promise<void> {
  const { error } = await requireSupabase()
    .from('courses')
    .update({
      title: course.title,
      description: course.description,
      language_code: course.kind === 'language' ? course.languageCode || 'und' : 'und',
      source_level: course.kind === 'language' ? course.sourceLevel : null,
      target_level: course.kind === 'language' ? course.targetLevel : null,
      default_lesson_duration: course.defaultLessonDuration,
    })
    .eq('id', course.id)

  if (error) throw error
}

/** Delete a complete course without relying on ON DELETE CASCADE. */
export async function deleteCourseRecord(courseId: string): Promise<void> {
  const database = requireSupabase()

  const progressResult = await database
    .from('lesson_progress')
    .delete()
    .eq('course_id', courseId)
  throwIfError(progressResult.error)

  const blocksResult = await database
    .from('lesson_blocks')
    .delete()
    .eq('course_id', courseId)
  throwIfError(blocksResult.error)

  const lessonsResult = await database
    .from('lessons')
    .delete()
    .eq('course_id', courseId)
  throwIfError(lessonsResult.error)

  const modulesResult = await database
    .from('course_modules')
    .delete()
    .eq('course_id', courseId)
  throwIfError(modulesResult.error)

  const detachReleaseResult = await database
    .from('courses')
    .update({ current_release_id: null })
    .eq('id', courseId)
  throwIfError(detachReleaseResult.error)

  const releasesResult = await database
    .from('course_releases')
    .delete()
    .eq('course_id', courseId)
  throwIfError(releasesResult.error)

  const courseResult = await database
    .from('courses')
    .delete()
    .eq('id', courseId)
  throwIfError(courseResult.error)
}

/**
 * Replacement for the deleted publish_course RPC. It creates an immutable
 * release snapshot and then points courses.current_release_id at that release.
 */
export async function publishCourseRecord(courseId: string): Promise<void> {
  const database = requireSupabase()
  const { data: authData, error: authError } = await database.auth.getUser()
  if (authError) throw authError
  if (!authData.user) throw new Error('Для публикации необходимо войти в аккаунт')

  const { data: courseData, error: courseError } = await database
    .from('courses')
    .select(publishSelect)
    .eq('id', courseId)
    .single()

  if (courseError) throw courseError

  const course = courseData as unknown as DatabaseRow
  if (String(course.owner_id) !== authData.user.id) {
    throw new Error('Публиковать курс может только его автор')
  }

  const modules = rows(course.course_modules)
  const lessonCount = modules.reduce(
    (total, module) => total + rows(module.lessons).length,
    0,
  )

  const { data: latestRelease, error: latestReleaseError } = await database
    .from('course_releases')
    .select('version')
    .eq('course_id', courseId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestReleaseError) throw latestReleaseError

  const publishedAt = new Date().toISOString()
  const nextVersion = Number(latestRelease?.version ?? 0) + 1
  const { data: release, error: releaseError } = await database
    .from('course_releases')
    .insert({
      course_id: courseId,
      version: nextVersion,
      snapshot: {
        schemaVersion: 1,
        publishedAt,
        course,
      },
      module_count: modules.length,
      lesson_count: lessonCount,
      changelog: 'Published from Course Platform',
      published_by: authData.user.id,
      published_at: publishedAt,
    })
    .select('id')
    .single()

  if (releaseError) throw releaseError

  const lessonsResult = await database
    .from('lessons')
    .update({ status: 'published', published_at: publishedAt })
    .eq('course_id', courseId)
  throwIfError(lessonsResult.error)

  const modulesResult = await database
    .from('course_modules')
    .update({ is_published: true })
    .eq('course_id', courseId)
  throwIfError(modulesResult.error)

  const courseResult = await database
    .from('courses')
    .update({
      status: 'published',
      current_release_id: String(release.id),
      published_at: publishedAt,
    })
    .eq('id', courseId)
  throwIfError(courseResult.error)
}

export async function updateModuleStatusRecord(moduleId: string, status: Course['status']): Promise<void> {
  const { error } = await requireSupabase()
    .from('course_modules')
    .update({ is_published: status === 'Опубликован' })
    .eq('id', moduleId)
  if (error) throw error
}

export async function draftCourseRecord(courseId: string): Promise<void> {
  const database = requireSupabase()
  const lessonsResult = await database.from('lessons').update({ status: 'draft', published_at: null }).eq('course_id', courseId)
  throwIfError(lessonsResult.error)
  const modulesResult = await database.from('course_modules').update({ is_published: false }).eq('course_id', courseId)
  throwIfError(modulesResult.error)
  const courseResult = await database.from('courses').update({ status: 'draft', current_release_id: null, published_at: null }).eq('id', courseId)
  throwIfError(courseResult.error)
}
export async function saveCourseOrder(course: Course): Promise<void> {
  const database = requireSupabase()
  const moduleResults = await Promise.all(course.modules.map((module, position) => (
    database.from('course_modules').update({ position }).eq('id', module.id)
  )))
  const moduleError = moduleResults.find((result) => result.error)?.error
  if (moduleError) throw moduleError

  const lessonResults = await Promise.all(course.modules.flatMap((module) => (
    module.lessons.map((lesson, position) => database
      .from('lessons')
      .update({ module_id: module.id, position })
      .eq('id', lesson.id))
  )))
  const lessonError = lessonResults.find((result) => result.error)?.error
  if (lessonError) throw lessonError
}

export async function saveBlockOrder(blocks: LessonBlock[]): Promise<void> {
  const database = requireSupabase()
  const results = await Promise.all(blocks.map((block, position) => (
    database.from('lesson_blocks').update({ position }).eq('id', block.id)
  )))
  const error = results.find((result) => result.error)?.error
  if (error) throw error
}
