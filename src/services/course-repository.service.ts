import type {
  BlockType,
  Course,
  CourseCreateInput,
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
import type {
  LessonBlockUpdatePayload,
  LessonUpdatePayload,
} from '@/services/lesson-persistence.service'
import { requireSupabase } from '@/services/supabase'
import { slugify } from '@/utils/slugify'

const courseListSelect = `
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
      position,
      status
    )
  )
`

type DatabaseRow = Record<string, unknown>

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
 * RLS returns the current user's drafts plus every published public course.
 * The user id is used only to map each result to creator/learner access.
 */
export async function listCourses(_organizationId: string, userId: string): Promise<Course[]> {
  const { data, error } = await requireSupabase()
    .from('courses')
    .select(courseListSelect)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const courses = ((data ?? []) as unknown as DatabaseRow[]).map((row) => (
    mapDatabaseCourse(row, userId)
  ))

  await resolveAssetUrls(courses)
  return courses
}

export async function getCourseRecord(
  courseId: string,
  userId: string,
): Promise<Course | undefined> {
  const { data, error } = await requireSupabase().rpc(
    'get_course_tree',
    { p_course_id: courseId },
  )

  if (error) throw error
  if (!data) return undefined

  const row = Array.isArray(data)
    ? data[0]
    : data

  if (!row || typeof row !== 'object') return undefined

  const course = mapDatabaseCourse(
    row as DatabaseRow,
    userId,
  )

  await resolveAssetUrls([course])

  return course
}

export async function getCourseIdForLessonRecord(lessonId: string): Promise<string | undefined> {
  const { data, error } = await requireSupabase()
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) throw error
  return data?.course_id ? String(data.course_id) : undefined
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

export async function updateLessonRecord(
  lessonId: string,
  payload: LessonUpdatePayload,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lessons')
    .update(payload)
    .eq('id', lessonId)

  if (error) throw error
}

export async function updateBlockRecord(
  blockId: string,
  payload: LessonBlockUpdatePayload,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('lesson_blocks')
    .update(payload)
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

export async function deleteBlockRecord(
  blockId: string,
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'delete_lesson_block',
    { p_block_id: blockId },
  )

  if (error) throw error
}

/**
 * The supplied schema does not declare cascade deletion. Remove dependent
 * progress and block rows before lessons so bulk deletion keeps working.
 */
export async function deleteLessonRecords(
  courseId: string,
  lessonIds: string[],
): Promise<void> {
  if (!lessonIds.length) return

  const { error } = await requireSupabase().rpc(
    'delete_lessons',
    {
      p_course_id: courseId,
      p_lesson_ids: lessonIds,
    },
  )

  if (error) throw error
}

export async function deleteModuleRecord(
  courseId: string,
  moduleId: string,
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'delete_course_module',
    {
      p_course_id: courseId,
      p_module_id: moduleId,
    },
  )

  if (error) throw error
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
export async function deleteCourseRecord(
  courseId: string,
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'delete_course',
    { p_course_id: courseId },
  )

  if (error) throw error
}

/**
 * Replacement for the deleted publish_course RPC. It creates an immutable
 * release snapshot and then points courses.current_release_id at that release.
 */
export async function publishCourseRecord(
  courseId: string,
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'publish_course',
    {
      p_course_id: courseId,
      p_changelog: 'Published from Course Platform',
    },
  )

  if (error) throw error
}

export async function updateModuleStatusRecord(moduleId: string, status: Course['status']): Promise<void> {
  const { error } = await requireSupabase()
    .from('course_modules')
    .update({ is_published: status === 'Опубликован' })
    .eq('id', moduleId)
  if (error) throw error
}

export async function draftCourseRecord(
  courseId: string,
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'draft_course',
    { p_course_id: courseId },
  )

  if (error) throw error
}
export async function saveCourseOrder(
  course: Course,
): Promise<void> {
  const modules = course.modules.map(
    (module, position) => ({
      id: module.id,
      position,
    }),
  )

  const lessons = course.modules.flatMap(
    (module) => module.lessons.map(
      (lesson, position) => ({
        id: lesson.id,
        module_id: module.id,
        position,
      }),
    ),
  )

  const { error } = await requireSupabase().rpc(
    'reorder_course_tree',
    {
      p_course_id: course.id,
      p_modules: modules,
      p_lessons: lessons,
    },
  )

  if (error) throw error
}

export async function saveBlockOrder(
  lessonId: string,
  blocks: LessonBlock[],
): Promise<void> {
  const { error } = await requireSupabase().rpc(
    'reorder_lesson_blocks',
    {
      p_lesson_id: lessonId,
      p_blocks: blocks.map(
        (block, position) => ({
          id: block.id,
          position,
        }),
      ),
    },
  )

  if (error) throw error
}


export async function duplicateLessonRecord(
  lessonId: string,
  targetModuleId: string,
  position: number,
  title: string,
): Promise<string> {
  const { data, error } = await requireSupabase().rpc(
    'duplicate_lesson',
    {
      p_lesson_id: lessonId,
      p_target_module_id: targetModuleId,
      p_position: position,
      p_title: title,
    },
  )

  if (error) throw error
  if (!data) throw new Error('Сервер не вернул ID копии урока')

  return String(data)
}

export async function duplicateModuleRecord(
  moduleId: string,
  position: number,
  title: string,
): Promise<string> {
  const { data, error } = await requireSupabase().rpc(
    'duplicate_module',
    {
      p_module_id: moduleId,
      p_position: position,
      p_title: title,
    },
  )

  if (error) throw error
  if (!data) throw new Error('Сервер не вернул ID копии модуля')

  return String(data)
}

export async function acknowledgeStorageCleanup(
  paths: string[],
): Promise<void> {
  const validPaths = paths.filter(Boolean)

  if (!validPaths.length) return

  const { error } = await requireSupabase().rpc(
    'ack_storage_cleanup',
    { p_paths: validPaths },
  )

  if (error) throw error
}
