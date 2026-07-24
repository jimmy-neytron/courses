import type { Course, CourseModule, Lesson, LessonBlock } from '@/types/course'

export interface LessonLocation {
  course: Course
  module: CourseModule
  lesson: Lesson
}

export interface BlockLocation extends LessonLocation {
  block: LessonBlock
}

export function findCourse(courses: Course[], courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId)
}

export function findLesson(courses: Course[], lessonId: string): LessonLocation | undefined {
  for (const course of courses) {
    for (const module of course.modules) {
      const lesson = module.lessons.find((item) => item.id === lessonId)
      if (lesson) return { course, module, lesson }
    }
  }
  return undefined
}

export function findBlock(courses: Course[], blockId: string): BlockLocation | undefined {
  for (const course of courses) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        const block = lesson.blocks.find((item) => item.id === blockId)
        if (block) return { course, module, lesson, block }
      }
    }
  }
  return undefined
}
