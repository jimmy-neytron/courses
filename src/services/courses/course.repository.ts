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

export interface CourseRepository {
  loadCourses(ownerId: string): Promise<Course[]>
  persistSnapshot(courses: Course[]): void

  createCourse(ownerId: string, draft: CourseDraft): Promise<Course>
  updateCourse(courseId: string, patch: CoursePatch): Promise<void>
  deleteCourse(courseId: string): Promise<void>
  publishCourse(courseId: string): Promise<void>

  createModule(courseId: string, draft: ModuleDraft, position: number): Promise<CourseModule>
  updateModule(moduleId: string, patch: Partial<ModuleDraft> & { position?: number }): Promise<void>
  deleteModule(moduleId: string): Promise<void>

  createLesson(courseId: string, moduleId: string, draft: LessonPatch, position: number): Promise<Lesson>
  updateLesson(lessonId: string, patch: LessonPatch): Promise<void>
  deleteLesson(lessonId: string): Promise<void>

  createBlock(courseId: string, lessonId: string, draft: BlockDraft, position: number): Promise<LessonBlock>
  updateBlock(blockId: string, patch: Partial<LessonBlock>): Promise<void>
  deleteBlock(blockId: string): Promise<void>
}
