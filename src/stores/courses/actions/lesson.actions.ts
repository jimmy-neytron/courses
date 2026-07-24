import type { CourseStoreContext } from '@/stores/courses/context'
import type { Lesson, LessonDraft, LessonPatch } from '@/types/course'
import { findLesson, findCourse } from '@/utils/course-lookup'
import { createIsoTimestamp } from '@/utils/date'

export async function createLesson(
  context: CourseStoreContext,
  courseId: string,
  moduleId: string,
  draft: LessonDraft,
): Promise<Lesson> {
  const course = findCourse(context.courses.value, courseId)
  const module = course?.modules.find((item) => item.id === moduleId)
  if (!course || !module) throw new Error('Модуль не найден')

  const lesson = await context.repository.createLesson(
    courseId,
    moduleId,
    draft,
    module.lessons.length,
  )
  module.lessons.push(lesson)
  touch(course)
  context.persist()
  return lesson
}

export async function updateLesson(
  context: CourseStoreContext,
  lessonId: string,
  patch: LessonPatch,
): Promise<void> {
  const location = findLesson(context.courses.value, lessonId)
  if (!location) return

  await context.repository.updateLesson(lessonId, patch)
  const { lesson, course } = location
  if (patch.title !== undefined) lesson.title = patch.title.trim()
  if (patch.description !== undefined) lesson.description = patch.description.trim()
  if (patch.objectives !== undefined) lesson.objectives = [...patch.objectives]
  if (patch.durationMinutes !== undefined) lesson.durationMinutes = patch.durationMinutes
  if (patch.passingScore !== undefined) lesson.passingScore = patch.passingScore
  if (patch.status !== undefined) {
    lesson.status = patch.status
    lesson.publishedAt = patch.status === 'published' ? createIsoTimestamp() : null
  }
  if (patch.position !== undefined) lesson.position = patch.position
  if (patch.isCompleted !== undefined) lesson.isCompleted = patch.isCompleted
  lesson.updatedAt = createIsoTimestamp()
  touch(course)
  context.persist()
}

export async function deleteLesson(context: CourseStoreContext, lessonId: string): Promise<void> {
  const location = findLesson(context.courses.value, lessonId)
  if (!location) return

  await context.repository.deleteLesson(lessonId)
  location.module.lessons = location.module.lessons.filter((lesson) => lesson.id !== lessonId)
  await normalizeLessonPositions(context, location.module.lessons)
  touch(location.course)
  context.persist()
}

export async function moveLesson(
  context: CourseStoreContext,
  lessonId: string,
  direction: -1 | 1,
): Promise<void> {
  const location = findLesson(context.courses.value, lessonId)
  if (!location) return

  const lessons = location.module.lessons
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= lessons.length) return

  const [lesson] = lessons.splice(index, 1)
  if (!lesson) return
  lessons.splice(targetIndex, 0, lesson)

  await normalizeLessonPositions(context, lessons)
  touch(location.course)
  context.persist()
}

async function normalizeLessonPositions(
  context: CourseStoreContext,
  lessons: Lesson[],
): Promise<void> {
  await Promise.all(lessons.map(async (lesson, position) => {
    lesson.position = position
    await context.repository.updateLesson(lesson.id, { position })
  }))
}

function touch(course: { updatedAt: string }): void {
  course.updatedAt = createIsoTimestamp()
}
