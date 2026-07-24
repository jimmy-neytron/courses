import type { CourseRepository } from './course.repository'
import { normalizeCourseAccent } from '@/constants/course'
import {
  createLocalBlock,
  createLocalCourse,
  createLocalLesson,
  createLocalModule,
} from '@/services/courses/course.factory'
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

const STORAGE_KEY = 'courses-only-platform:courses'

export class LocalCourseRepository implements CourseRepository {
  async loadCourses(): Promise<Course[]> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    try {
      const courses = JSON.parse(raw) as Course[]
      return courses.map((course) => ({
        ...course,
        accentColor: normalizeCourseAccent(course.accentColor),
        modules: course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            isCompleted: lesson.isCompleted ?? false,
          })),
        })),
      }))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  persistSnapshot(courses: Course[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
  }

  async createCourse(ownerId: string, draft: CourseDraft): Promise<Course> {
    return createLocalCourse(ownerId, draft)
  }

  async updateCourse(_courseId: string, _patch: CoursePatch): Promise<void> {}
  async deleteCourse(_courseId: string): Promise<void> {}
  async publishCourse(_courseId: string): Promise<void> {}

  async createModule(courseId: string, draft: ModuleDraft, position: number): Promise<CourseModule> {
    return createLocalModule(courseId, draft, position)
  }

  async updateModule(_moduleId: string, _patch: Partial<ModuleDraft> & { position?: number }): Promise<void> {}
  async deleteModule(_moduleId: string): Promise<void> {}

  async createLesson(
    courseId: string,
    moduleId: string,
    draft: LessonPatch,
    position: number,
  ): Promise<Lesson> {
    return createLocalLesson(courseId, moduleId, {
      title: draft.title ?? '',
      description: draft.description ?? '',
      objectives: draft.objectives ?? [],
      durationMinutes: draft.durationMinutes ?? 45,
      passingScore: draft.passingScore ?? 0,
    }, position)
  }

  async updateLesson(_lessonId: string, _patch: LessonPatch): Promise<void> {}
  async deleteLesson(_lessonId: string): Promise<void> {}

  async createBlock(
    courseId: string,
    lessonId: string,
    draft: BlockDraft,
    position: number,
  ): Promise<LessonBlock> {
    return createLocalBlock(courseId, lessonId, draft, position)
  }

  async updateBlock(_blockId: string, _patch: Partial<LessonBlock>): Promise<void> {}
  async deleteBlock(_blockId: string): Promise<void> {}
}
