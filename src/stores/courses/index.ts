import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createCourseRepository } from '@/services/courses/create-course-repository'
import {
  createBlock as createBlockAction,
  deleteBlock as deleteBlockAction,
  moveBlock as moveBlockAction,
  updateBlock as updateBlockAction,
} from './actions/block.actions'
import {
  createCourse as createCourseAction,
  deleteCourse as deleteCourseAction,
  publishCourse as publishCourseAction,
  updateCourse as updateCourseAction,
} from './actions/course.actions'
import {
  createLesson as createLessonAction,
  deleteLesson as deleteLessonAction,
  moveLesson as moveLessonAction,
  updateLesson as updateLessonAction,
} from './actions/lesson.actions'
import {
  createModule as createModuleAction,
  deleteModule as deleteModuleAction,
  moveModule as moveModuleAction,
  updateModule as updateModuleAction,
} from './actions/module.actions'
import { findBlock, findCourse, findLesson } from '@/utils/course-lookup'
import type {
  BlockDraft,
  Course,
  CourseDraft,
  CoursePatch,
  LessonBlock,
  LessonDraft,
  LessonPatch,
  ModuleDraft,
} from '@/types/course'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'

export const useCoursesStore = defineStore('courses', () => {
  const repository = createCourseRepository()
  const courses = ref<Course[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const context = {
    courses,
    repository,
    persist: () => repository.persistSnapshot(courses.value),
  }

  const courseCount = computed(() => courses.value.length)

  function courseById(courseId: string): Course | undefined {
    return findCourse(courses.value, courseId)
  }

  function lessonById(lessonId: string) {
    return findLesson(courses.value, lessonId)?.lesson
  }

  function moduleByLessonId(lessonId: string) {
    return findLesson(courses.value, lessonId)?.module
  }

  function courseByLessonId(lessonId: string) {
    return findLesson(courses.value, lessonId)?.course
  }

  function blockById(blockId: string) {
    return findBlock(courses.value, blockId)?.block
  }

  async function load(force = false): Promise<void> {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    error.value = null
    try {
      courses.value = await repository.loadCourses(useAuthStore().userId)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, 'Не удалось загрузить курсы')
      throw caughtError
    } finally {
      loaded.value = true
      loading.value = false
    }
  }

  function reset(): void {
    courses.value = []
    loading.value = false
    loaded.value = false
    error.value = null
  }

  return {
    courses,
    loading,
    loaded,
    error,
    courseCount,
    courseById,
    lessonById,
    moduleByLessonId,
    courseByLessonId,
    blockById,
    load,
    reset,
    createCourse: (draft: CourseDraft) => createCourseAction(context, useAuthStore().userId, draft),
    updateCourse: (courseId: string, patch: CoursePatch) => updateCourseAction(context, courseId, patch),
    deleteCourse: (courseId: string) => deleteCourseAction(context, courseId),
    publishCourse: (courseId: string) => publishCourseAction(context, courseId),
    createModule: (courseId: string, draft: ModuleDraft) => createModuleAction(context, courseId, draft),
    updateModule: (courseId: string, moduleId: string, draft: ModuleDraft) => updateModuleAction(context, courseId, moduleId, draft),
    deleteModule: (courseId: string, moduleId: string) => deleteModuleAction(context, courseId, moduleId),
    moveModule: (courseId: string, moduleId: string, direction: -1 | 1) => moveModuleAction(context, courseId, moduleId, direction),
    createLesson: (courseId: string, moduleId: string, draft: LessonDraft) => createLessonAction(context, courseId, moduleId, draft),
    updateLesson: (lessonId: string, patch: LessonPatch) => updateLessonAction(context, lessonId, patch),
    setLessonCompleted: (lessonId: string, isCompleted: boolean) => (
      updateLessonAction(context, lessonId, { isCompleted })
    ),
    setLessonStatus: (lessonId: string, status: LessonPatch['status']) => (
      status ? updateLessonAction(context, lessonId, { status }) : Promise.resolve()
    ),
    deleteLesson: (lessonId: string) => deleteLessonAction(context, lessonId),
    moveLesson: (lessonId: string, direction: -1 | 1) => moveLessonAction(context, lessonId, direction),
    createBlock: (lessonId: string, draft: BlockDraft) => createBlockAction(context, lessonId, draft),
    updateBlock: (blockId: string, patch: Partial<LessonBlock>) => updateBlockAction(context, blockId, patch),
    deleteBlock: (blockId: string) => deleteBlockAction(context, blockId),
    moveBlock: (blockId: string, direction: -1 | 1) => moveBlockAction(context, blockId, direction),
  }
})
