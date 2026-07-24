import type { PostgrestError } from '@supabase/supabase-js'

import { mapBlock, mapCourse, mapLesson, mapModule } from './course.mapper'
import type { CourseRepository } from './course.repository'
import type {
  CourseModuleRow,
  CourseRow,
  LessonBlockRow,
  LessonRow,
} from '@/types/database'
import type {
  BlockDraft,
  Course,
  CourseDraft,
  CourseModule,
  CoursePatch,
  Lesson,
  LessonBlock,
  LessonPatch,
  ModuleDraft,
} from '@/types/course'
import { supabase } from '@/services/supabase/client'
import { createSlug } from '@/utils/id'

function requireClient() {
  if (!supabase) throw new Error('Supabase не настроен')
  return supabase
}

function assertNoError(error: PostgrestError | null): void {
  if (error) throw new Error(error.message)
}

export class SupabaseCourseRepository implements CourseRepository {
  async loadCourses(ownerId: string): Promise<Course[]> {
    const client = requireClient()
    const [coursesResult, modulesResult, lessonsResult, blocksResult] = await Promise.all([
      client.from('courses').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false }),
      client.from('course_modules').select('*').order('position'),
      client.from('lessons').select('*').order('position'),
      client.from('lesson_blocks').select('*').order('position'),
    ])

    assertNoError(coursesResult.error)
    assertNoError(modulesResult.error)
    assertNoError(lessonsResult.error)
    assertNoError(blocksResult.error)

    const courseRows = (coursesResult.data ?? []) as CourseRow[]
    const courseIds = new Set(courseRows.map((row) => row.id))
    const modules = ((modulesResult.data ?? []) as CourseModuleRow[])
      .filter((row) => courseIds.has(row.course_id))
    const lessons = ((lessonsResult.data ?? []) as LessonRow[])
      .filter((row) => courseIds.has(row.course_id))
    const blocks = ((blocksResult.data ?? []) as LessonBlockRow[])
      .filter((row) => courseIds.has(row.course_id))

    return courseRows.map((row) => mapCourse(row, modules, lessons, blocks))
  }

  persistSnapshot(_courses: Course[]): void {}

  async createCourse(ownerId: string, draft: CourseDraft): Promise<Course> {
    const { data, error } = await requireClient().from('courses').insert({
      owner_id: ownerId,
      slug: createSlug(draft.title),
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      language_code: draft.languageCode.trim() || 'und',
      source_level: draft.sourceLevel.trim() || null,
      target_level: draft.targetLevel.trim() || null,
      duration_weeks: draft.durationWeeks,
      lessons_per_week: draft.lessonsPerWeek,
      default_lesson_duration: draft.defaultLessonDuration,
      accent_color: draft.accentColor,
      visibility: draft.visibility,
      is_sequential: draft.isSequential,
    }).select('*').single()

    assertNoError(error)
    return mapCourse(data as CourseRow)
  }

  async updateCourse(courseId: string, patch: CoursePatch): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (patch.title !== undefined) payload.title = patch.title.trim()
    if (patch.description !== undefined) payload.description = patch.description.trim() || null
    if (patch.languageCode !== undefined) payload.language_code = patch.languageCode.trim() || 'und'
    if (patch.sourceLevel !== undefined) payload.source_level = patch.sourceLevel.trim() || null
    if (patch.targetLevel !== undefined) payload.target_level = patch.targetLevel.trim() || null
    if (patch.durationWeeks !== undefined) payload.duration_weeks = patch.durationWeeks
    if (patch.lessonsPerWeek !== undefined) payload.lessons_per_week = patch.lessonsPerWeek
    if (patch.defaultLessonDuration !== undefined) payload.default_lesson_duration = patch.defaultLessonDuration
    if (patch.accentColor !== undefined) payload.accent_color = patch.accentColor
    if (patch.visibility !== undefined) payload.visibility = patch.visibility
    if (patch.isSequential !== undefined) payload.is_sequential = patch.isSequential
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.publishedAt !== undefined) payload.published_at = patch.publishedAt

    const { error } = await requireClient().from('courses').update(payload).eq('id', courseId)
    assertNoError(error)
  }

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await requireClient().from('courses').delete().eq('id', courseId)
    assertNoError(error)
  }

  async publishCourse(courseId: string): Promise<void> {
    const { error } = await requireClient().rpc('publish_course', {
      target_course_id: courseId,
      release_changelog: 'Публикация из редактора',
    })
    assertNoError(error)
  }

  async createModule(courseId: string, draft: ModuleDraft, position: number): Promise<CourseModule> {
    const { data, error } = await requireClient().from('course_modules').insert({
      course_id: courseId,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      position,
    }).select('*').single()

    assertNoError(error)
    return mapModule(data as CourseModuleRow)
  }

  async updateModule(
    moduleId: string,
    patch: Partial<ModuleDraft> & { position?: number },
  ): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (patch.title !== undefined) payload.title = patch.title.trim()
    if (patch.description !== undefined) payload.description = patch.description.trim() || null
    if (patch.position !== undefined) payload.position = patch.position
    const { error } = await requireClient().from('course_modules').update(payload).eq('id', moduleId)
    assertNoError(error)
  }

  async deleteModule(moduleId: string): Promise<void> {
    const { error } = await requireClient().from('course_modules').delete().eq('id', moduleId)
    assertNoError(error)
  }

  async createLesson(
    courseId: string,
    moduleId: string,
    draft: LessonPatch,
    position: number,
  ): Promise<Lesson> {
    const { data, error } = await requireClient().from('lessons').insert({
      course_id: courseId,
      module_id: moduleId,
      slug: createSlug(draft.title ?? 'lesson'),
      title: draft.title?.trim() ?? '',
      description: draft.description?.trim() || null,
      objectives: draft.objectives ?? [],
      duration_minutes: draft.durationMinutes ?? 45,
      passing_score: draft.passingScore ?? 0,
      position,
      is_completed: false,
    }).select('*').single()

    assertNoError(error)
    return mapLesson(data as LessonRow)
  }

  async updateLesson(lessonId: string, patch: LessonPatch): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (patch.title !== undefined) payload.title = patch.title.trim()
    if (patch.description !== undefined) payload.description = patch.description.trim() || null
    if (patch.objectives !== undefined) payload.objectives = patch.objectives
    if (patch.durationMinutes !== undefined) payload.duration_minutes = patch.durationMinutes
    if (patch.passingScore !== undefined) payload.passing_score = patch.passingScore
    if (patch.status !== undefined) {
      payload.status = patch.status
      payload.published_at = patch.status === 'published' ? new Date().toISOString() : null
    }
    if (patch.position !== undefined) payload.position = patch.position
    if (patch.isCompleted !== undefined) payload.is_completed = patch.isCompleted

    const { error } = await requireClient().from('lessons').update(payload).eq('id', lessonId)
    assertNoError(error)
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const { error } = await requireClient().from('lessons').delete().eq('id', lessonId)
    assertNoError(error)
  }

  async createBlock(
    courseId: string,
    lessonId: string,
    draft: BlockDraft,
    position: number,
  ): Promise<LessonBlock> {
    const { data, error } = await requireClient().from('lesson_blocks').insert({
      course_id: courseId,
      lesson_id: lessonId,
      block_type: draft.blockType,
      position,
      title: draft.title.trim() || null,
      public_content: draft.publicContent,
      is_required: draft.isRequired,
      points: draft.points,
    }).select('*').single()

    assertNoError(error)
    return mapBlock(data as LessonBlockRow)
  }

  async updateBlock(blockId: string, patch: Partial<LessonBlock>): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (patch.blockType !== undefined) payload.block_type = patch.blockType
    if (patch.position !== undefined) payload.position = patch.position
    if (patch.title !== undefined) payload.title = patch.title.trim() || null
    if (patch.publicContent !== undefined) payload.public_content = patch.publicContent
    if (patch.privateContent !== undefined) payload.private_content = patch.privateContent
    if (patch.settings !== undefined) payload.settings = patch.settings
    if (patch.isRequired !== undefined) payload.is_required = patch.isRequired
    if (patch.points !== undefined) payload.points = patch.points
    const { error } = await requireClient().from('lesson_blocks').update(payload).eq('id', blockId)
    assertNoError(error)
  }

  async deleteBlock(blockId: string): Promise<void> {
    const { error } = await requireClient().from('lesson_blocks').delete().eq('id', blockId)
    assertNoError(error)
  }
}
