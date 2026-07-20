import type { BlockType, Course, CourseCreateInput, Lesson, LessonBlock, LessonSectionConfig } from '@/types/course'
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

const courseSelect = 'id,owner_id,title,description,status,language_code,source_level,target_level,duration_weeks,lessons_per_week,default_lesson_duration,accent_color,updated_at,owner:profiles!courses_owner_id_fkey(id,display_name,avatar_url),course_memberships(user_id,role),course_invites(code),course_modules(id,title,position,lessons(id,title,duration_minutes,status,position,lesson_blocks(id,block_type,title,public_content,private_content,is_required,schema_version,position)))'
const fallbackCourseSelect = 'id,owner_id,title,description,status,language_code,source_level,target_level,duration_weeks,lessons_per_week,default_lesson_duration,accent_color,updated_at,course_modules(id,title,position,lessons(id,title,duration_minutes,status,position,lesson_blocks(id,block_type,title,public_content,private_content,is_required,schema_version,position)))'

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

export async function listCourses(organizationId: string, userId: string): Promise<Course[]> {
  const database = requireSupabase()
  let { data, error } = await database
    .from('courses')
    .select(courseSelect)
    .order('updated_at', { ascending: false })

  if (error && ['42P01', 'PGRST200', 'PGRST205'].includes(error.code ?? '')) {
    const fallback = await database
      .from('courses')
      .select(fallbackCourseSelect)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
    data = fallback.data as unknown as typeof data
    error = fallback.error
  }

  if (error) throw error

  const courses = ((data ?? []) as unknown as Record<string, unknown>[])
    .map((row) => mapDatabaseCourse(row, userId))
  await resolveAssetUrls(courses)
  return courses
}

export async function createCourseRecord(
  organizationId: string,
  ownerId: string,
  input: CourseCreateInput,
): Promise<string> {
  const { data, error } = await requireSupabase().from('courses').insert({
    organization_id: organizationId,
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
  }).select('id').single()
  if (error) throw error
  return String(data.id)
}

export async function createModuleRecord(courseId: string, title: string, position: number): Promise<string> {
  const { data, error } = await requireSupabase().from('course_modules')
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
  const { data, error } = await requireSupabase().from('lessons').insert({
    course_id: courseId,
    module_id: moduleId,
    title,
    slug: slugify(title, 'lesson'),
    duration_minutes: durationMinutes,
    position,
  }).select('id').single()
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
  const { data, error } = await requireSupabase().from('lesson_blocks').insert({
    course_id: courseId,
    lesson_id: lessonId,
    block_type: toDatabaseBlockType(type),
    title: block.title,
    public_content: serializePublicBlockContent(block),
    private_content: serializePrivateBlockContent(block),
    is_required: block.required,
    position,
    schema_version: block.schemaVersion ?? 1,
  }).select('id').single()
  if (error) throw error
  return String(data.id)
}

export async function updateLessonRecord(lessonId: string, lesson: Lesson): Promise<void> {
  const { error } = await requireSupabase().from('lessons').update({
    title: lesson.title,
    duration_minutes: lesson.duration,
    status: lesson.status === 'Опубликован' ? 'published' : 'draft',
  }).eq('id', lessonId)
  if (error) throw error
}

export async function updateBlockRecord(blockId: string, block: LessonBlock): Promise<void> {
  const { error } = await requireSupabase().from('lesson_blocks').update({
    title: block.title,
    public_content: serializePublicBlockContent(block),
    private_content: serializePrivateBlockContent(block),
    is_required: block.required,
    schema_version: block.schemaVersion ?? 1,
  }).eq('id', blockId)
  if (error) throw error
}

interface SaveSectionConfigInput {
  courseId: string
  lessonId: string
  sections: LessonSectionConfig[]
  blockId?: string
}

export async function saveSectionConfigRecord(input: SaveSectionConfigInput): Promise<string | undefined> {
  const publicContent = { kind: 'section_config', sections: input.sections }
  if (input.blockId) {
    const { error } = await requireSupabase().from('lesson_blocks')
      .update({ public_content: publicContent })
      .eq('id', input.blockId)
    if (error) throw error
    return input.blockId
  }

  const { data, error } = await requireSupabase().from('lesson_blocks').insert({
    course_id: input.courseId,
    lesson_id: input.lessonId,
    block_type: 'summary',
    title: 'Настройки разделов',
    public_content: publicContent,
    private_content: {},
    is_required: false,
    position: 9999,
    schema_version: 1,
  }).select('id').single()
  if (error) throw error
  return String(data.id)
}

export async function deleteBlockRecord(blockId: string): Promise<void> {
  const { error } = await requireSupabase().from('lesson_blocks').delete().eq('id', blockId)
  if (error) throw error
}

export async function updateCourseRecord(course: Course): Promise<void> {
  const { error } = await requireSupabase().from('courses').update({
    title: course.title,
    description: course.description,
    language_code: course.kind === 'language' ? course.languageCode || 'und' : 'und',
    source_level: course.kind === 'language' ? course.sourceLevel : null,
    target_level: course.kind === 'language' ? course.targetLevel : null,
    default_lesson_duration: course.defaultLessonDuration,
  }).eq('id', course.id)
  if (error) throw error
}

export async function deleteCourseRecord(courseId: string): Promise<void> {
  const { error } = await requireSupabase().from('courses').delete().eq('id', courseId)
  if (error) throw error
}

export async function publishCourseRecord(courseId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('publish_course', {
    p_course_id: courseId,
    p_changelog: 'Published from Course Platform',
  })
  if (error) throw error
}

export async function saveCourseOrder(course: Course): Promise<void> {
  const database = requireSupabase()
  const moduleResults = await Promise.all(course.modules.map((module, position) => (
    database.from('course_modules').update({ position }).eq('id', module.id)
  )))
  const moduleError = moduleResults.find((result) => result.error)?.error
  if (moduleError) throw moduleError

  const lessonResults = await Promise.all(course.modules.flatMap((module) => (
    module.lessons.map((lesson, position) => database.from('lessons')
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
