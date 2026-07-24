import type { CourseStoreContext } from '@/stores/courses/context'
import type { Course, CourseDraft, CoursePatch } from '@/types/course'
import { findCourse } from '@/utils/course-lookup'
import { createIsoTimestamp } from '@/utils/date'

export async function createCourse(
  context: CourseStoreContext,
  ownerId: string,
  draft: CourseDraft,
): Promise<Course> {
  const course = await context.repository.createCourse(ownerId, draft)
  context.courses.value.unshift(course)
  context.persist()
  return course
}

export async function updateCourse(
  context: CourseStoreContext,
  courseId: string,
  patch: CoursePatch,
): Promise<void> {
  const course = findCourse(context.courses.value, courseId)
  if (!course) return

  await context.repository.updateCourse(courseId, patch)

  if (patch.title !== undefined) course.title = patch.title.trim()
  if (patch.description !== undefined) course.description = patch.description.trim()
  if (patch.languageCode !== undefined) course.languageCode = patch.languageCode.trim() || 'und'
  if (patch.sourceLevel !== undefined) course.sourceLevel = patch.sourceLevel.trim()
  if (patch.targetLevel !== undefined) course.targetLevel = patch.targetLevel.trim()
  if (patch.durationWeeks !== undefined) course.durationWeeks = patch.durationWeeks
  if (patch.lessonsPerWeek !== undefined) course.lessonsPerWeek = patch.lessonsPerWeek
  if (patch.defaultLessonDuration !== undefined) course.defaultLessonDuration = patch.defaultLessonDuration
  if (patch.accentColor !== undefined) course.accentColor = patch.accentColor
  if (patch.visibility !== undefined) course.visibility = patch.visibility
  if (patch.isSequential !== undefined) course.isSequential = patch.isSequential
  if (patch.status !== undefined) course.status = patch.status
  if (patch.publishedAt !== undefined) course.publishedAt = patch.publishedAt
  course.updatedAt = createIsoTimestamp()
  context.persist()
}

export async function deleteCourse(context: CourseStoreContext, courseId: string): Promise<void> {
  await context.repository.deleteCourse(courseId)
  context.courses.value = context.courses.value.filter((course) => course.id !== courseId)
  context.persist()
}

export async function publishCourse(context: CourseStoreContext, courseId: string): Promise<void> {
  const course = findCourse(context.courses.value, courseId)
  if (!course) return

  await context.repository.publishCourse(courseId)
  const timestamp = createIsoTimestamp()
  course.status = 'published'
  course.publishedAt = timestamp
  course.updatedAt = timestamp

  for (const module of course.modules) {
    module.isPublished = true
    for (const lesson of module.lessons) {
      lesson.status = 'published'
      lesson.publishedAt = timestamp
    }
  }
  context.persist()
}
