import type { CourseStoreContext } from '@/stores/courses/context'
import type { CourseModule, ModuleDraft } from '@/types/course'
import { findCourse } from '@/utils/course-lookup'
import { createIsoTimestamp } from '@/utils/date'

export async function createModule(
  context: CourseStoreContext,
  courseId: string,
  draft: ModuleDraft,
): Promise<CourseModule> {
  const course = findCourse(context.courses.value, courseId)
  if (!course) throw new Error('Курс не найден')

  const module = await context.repository.createModule(courseId, draft, course.modules.length)
  course.modules.push(module)
  touch(course)
  context.persist()
  return module
}

export async function updateModule(
  context: CourseStoreContext,
  courseId: string,
  moduleId: string,
  draft: ModuleDraft,
): Promise<void> {
  const course = findCourse(context.courses.value, courseId)
  const module = course?.modules.find((item) => item.id === moduleId)
  if (!course || !module) return

  await context.repository.updateModule(moduleId, draft)
  module.title = draft.title.trim()
  module.description = draft.description.trim()
  module.updatedAt = createIsoTimestamp()
  touch(course)
  context.persist()
}

export async function deleteModule(
  context: CourseStoreContext,
  courseId: string,
  moduleId: string,
): Promise<void> {
  const course = findCourse(context.courses.value, courseId)
  if (!course) return

  await context.repository.deleteModule(moduleId)
  course.modules = course.modules.filter((module) => module.id !== moduleId)
  await normalizeModulePositions(context, course.modules)
  touch(course)
  context.persist()
}

export async function moveModule(
  context: CourseStoreContext,
  courseId: string,
  moduleId: string,
  direction: -1 | 1,
): Promise<void> {
  const course = findCourse(context.courses.value, courseId)
  if (!course) return

  const index = course.modules.findIndex((module) => module.id === moduleId)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= course.modules.length) return

  const [module] = course.modules.splice(index, 1)
  if (!module) return
  course.modules.splice(targetIndex, 0, module)

  await normalizeModulePositions(context, course.modules)
  touch(course)
  context.persist()
}

async function normalizeModulePositions(
  context: CourseStoreContext,
  modules: CourseModule[],
): Promise<void> {
  await Promise.all(modules.map(async (module, position) => {
    module.position = position
    await context.repository.updateModule(module.id, { position })
  }))
}

function touch(course: { updatedAt: string }): void {
  course.updatedAt = createIsoTimestamp()
}
