import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { BlockType, Course, CourseCreateInput, CourseModule, Lesson, LessonBlock, LessonSectionConfig } from '@/types/course'
import { createLessonSectionConfig } from '@/composables/useCourseSections'
import { useAuthStore } from '@/stores/auth'
import { isSupabaseConfigured } from '@/services/supabase'
import { uploadLessonAudio } from '@/services/lesson-audio.service'
import { uploadLessonPdf } from '@/services/lesson-pdf.service'
import { deleteLessonAssets, releaseLessonObjectUrls } from '@/services/lesson-assets.service'
import { joinCourseByCode, regenerateCourseInvite } from '@/services/course-access.service'
import {
  clearDemoCourses,
  readCourseCache,
  readDemoCourses,
  writeCourseCache,
  writeDemoCourses,
} from '@/services/course-cache.service'
import { createLessonBlock } from '@/services/lesson-block-content.service'
import {
  createBlockRecord,
  createCourseRecord,
  createLessonRecord,
  createModuleRecord,
  deleteBlockRecord,
  deleteCourseRecord,
  deleteLessonRecords,
  listCourses,
  publishCourseRecord,
  saveBlockOrder,
  saveCourseOrder,
  saveSectionConfigRecord,
  updateBlockRecord,
  updateCourseRecord,
  updateLessonRecord,
} from '@/services/course-repository.service'

const demoCourses: Course[] = []

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
function duplicateTitle(title: string): string {
  return `${title} — копия`
}

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function duplicateBlockSource(source: LessonBlock, local = false): LessonBlock {
  const block = structuredClone(source)
  block.id = local ? localId('block') : ''
  if (block.audioPath || block.audioUrl?.startsWith('blob:')) {
    block.audioPath = undefined
    block.audioUrl = undefined
  }
  if (block.filePath || block.fileUrl?.startsWith('blob:')) {
    block.filePath = undefined
    block.fileUrl = undefined
    block.fileName = undefined
    block.fileSize = undefined
  }
  return block
}

function duplicateLocalLesson(source: Lesson, title = source.title): Lesson {
  return {
    ...structuredClone(source),
    id: localId('lesson'),
    title,
    status: 'Черновик',
    sectionConfigBlockId: undefined,
    blocks: source.blocks.map((block) => duplicateBlockSource(block, true)),
  }
}

async function duplicateLessonRecords(
  courseId: string,
  moduleId: string,
  source: Lesson,
  position: number,
  title = source.title,
): Promise<string> {
  const lessonId = await createLessonRecord(courseId, moduleId, title, position, source.duration)
  for (const [index, sourceBlock] of source.blocks.entries()) {
    const block = duplicateBlockSource(sourceBlock)
    await createBlockRecord(courseId, lessonId, block.type, index, block)
  }
  if (source.sectionConfig?.length) {
    await saveSectionConfigRecord({ courseId, lessonId, sections: structuredClone(source.sectionConfig) })
  }
  return lessonId
}

export const useCourseStore = defineStore('courses', () => {
  const cachedDemoCourses = readDemoCourses()
  const courses = ref<Course[]>(
    isSupabaseConfigured ? [] : (cachedDemoCourses.length ? cachedDemoCourses : demoCourses),
  )
  const loading = ref(false)
  const loadError = ref('')
  const hydrated = ref(!isSupabaseConfigured)

  let hydratedOrganizationId = ''
  let bootstrapPromise: Promise<void> | undefined
  let refreshPromise: Promise<void> | undefined

  if (!isSupabaseConfigured) {
    watch(courses, (value) => writeDemoCourses(value), { deep: true })
  }

  const totalLessons = computed(() => courses.value.reduce(
    (total, course) => total + course.modules.reduce(
      (courseTotal, module) => courseTotal + module.lessons.length,
      0,
    ),
    0,
  ))

  function findCourse(courseId: string) {
    return courses.value.find((course) => course.id === courseId)
  }

  function findLesson(lessonId: string) {
    for (const course of courses.value) {
      for (const module of course.modules) {
        const lesson = module.lessons.find((item) => item.id === lessonId)
        if (lesson) return { course, module, lesson }
      }
    }
  }

  function refreshCourses(organizationId: string, userId: string): Promise<void> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      loadError.value = ''
      if (!courses.value.length) loading.value = true

      try {
        courses.value = await listCourses(organizationId, userId)
        hydratedOrganizationId = organizationId
        hydrated.value = true
        writeCourseCache(organizationId, courses.value)
      } catch (error) {
        loadError.value = errorMessage(error, 'Не удалось загрузить курсы')
      } finally {
        loading.value = false
      }
    })().finally(() => {
      refreshPromise = undefined
    })

    return refreshPromise
  }

  function hydrate(force = false): Promise<void> {
    if (!isSupabaseConfigured) return Promise.resolve()

    const organizationId = useAuthStore().organization?.id
    if (!force && organizationId && hydratedOrganizationId === organizationId) return Promise.resolve()
    if (refreshPromise) return courses.value.length && !force ? Promise.resolve() : refreshPromise
    if (bootstrapPromise) return bootstrapPromise

    bootstrapPromise = (async () => {
      const auth = useAuthStore()
      if (!auth.organization) await auth.loadOrganization()

      if (!auth.organization || !auth.user) {
        courses.value = []
        hydrated.value = true
        return
      }
      if (!force && hydratedOrganizationId === auth.organization.id) return
      if (hydratedOrganizationId && hydratedOrganizationId !== auth.organization.id) courses.value = []

      if (!force && !courses.value.length) {
        const cached = readCourseCache(auth.organization.id)
        if (cached.length) {
          courses.value = cached
          hydratedOrganizationId = auth.organization.id
          hydrated.value = true
          loading.value = false
          void refreshCourses(auth.organization.id, auth.user.id)
          return
        }
      }

      await refreshCourses(auth.organization.id, auth.user.id)
    })()
      .catch((error) => {
        loadError.value = errorMessage(error, 'Не удалось загрузить курсы')
        loading.value = false
      })
      .finally(() => {
        bootstrapPromise = undefined
      })

    return bootstrapPromise
  }

  async function createCourse(input: CourseCreateInput): Promise<string> {
    if (!isSupabaseConfigured) {
      const id = `course-${Date.now()}`
      const hasPlan = Boolean(input.durationWeeks && input.lessonsPerWeek)
      courses.value.unshift({
        id,
        ownerId: 'demo-user',
        accessRole: 'creator',
        creator: { id: 'demo-user', name: 'Вы' },
        joinCode: `DEMO${String(Date.now()).slice(-6)}`,
        kind: input.kind,
        languageCode: input.languageCode,
        sourceLevel: input.sourceLevel,
        targetLevel: input.targetLevel,
        defaultLessonDuration: input.defaultLessonDuration,
        learningPlan: hasPlan ? {
          durationWeeks: input.durationWeeks!,
          sessionsPerWeek: input.lessonsPerWeek!,
          sessionMinutes: input.defaultLessonDuration,
          totalSessions: 0,
          checkpointCount: 0,
          cadence: `${input.lessonsPerWeek} занятий в неделю`,
          outcome: input.kind === 'language'
            ? `Путь от ${input.sourceLevel ?? 'начального уровня'} до ${input.targetLevel ?? 'целевого уровня'}`
            : `План освоения курса «${input.title}»`,
        } : undefined,
        title: input.title,
        description: input.description,
        cover: 'linear-gradient(135deg,#176452,#3ac3a6)',
        tag: input.kind === 'language' ? input.targetLevel ?? input.languageCode?.toUpperCase() ?? 'ЯЗЫК' : 'КУРС',
        status: 'Черновик',
        updated: 'Только что',
        modules: [],
      })
      return id
    }

    const auth = useAuthStore()
    if (!auth.organization || !auth.user) throw new Error('Организация пользователя не найдена')

    const id = await createCourseRecord(auth.organization.id, auth.user.id, input)
    await hydrate(true)
    return id
  }

  async function joinCourse(code: string): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Подключите Supabase, чтобы присоединяться к курсам')
    const courseId = await joinCourseByCode(code)
    await hydrate(true)
    return courseId
  }

  async function refreshJoinCode(courseId: string): Promise<string> {
    const course = findCourse(courseId)
    if (!course || course.accessRole !== 'creator') throw new Error('Только автор может менять код приглашения')
    if (!isSupabaseConfigured) {
      course.joinCode = `DEMO${String(Date.now()).slice(-6)}`
      return course.joinCode
    }

    course.joinCode = await regenerateCourseInvite(courseId)
    return course.joinCode
  }

  async function addModule(courseId: string, title = 'Новый модуль'): Promise<void> {
    const course = findCourse(courseId)
    if (!course) return

    if (!isSupabaseConfigured) {
      course.modules.push({ id: `module-${Date.now()}`, title, open: true, lessons: [] })
      return
    }

    await createModuleRecord(courseId, title, course.modules.length)
    await hydrate(true)
  }
  async function addLesson(courseId: string, moduleId: string, title = 'Новый урок'): Promise<string | undefined> {
    const course = findCourse(courseId)
    const module = course?.modules.find((item) => item.id === moduleId)
    if (!course || !module) return

    if (!isSupabaseConfigured) {
      const id = `lesson-${Date.now()}`
      module.lessons.push({
        id,
        title,
        duration: course.defaultLessonDuration,
        status: 'Черновик',
        blocks: [],
        sectionConfig: createLessonSectionConfig(undefined, course.kind),
      })
      return id
    }

    const id = await createLessonRecord(
      courseId,
      moduleId,
      title,
      module.lessons.length,
      course.defaultLessonDuration,
    )
    await hydrate(true)
    return id
  }
  async function duplicateLesson(courseId: string, moduleId: string, lessonId: string): Promise<string | undefined> {
    const course = findCourse(courseId)
    const module = course?.modules.find((item) => item.id === moduleId)
    const lessonIndex = module?.lessons.findIndex((item) => item.id === lessonId) ?? -1
    const sourceLesson = lessonIndex >= 0 ? module?.lessons[lessonIndex] : undefined
    if (!course || !module || !sourceLesson || course.accessRole !== 'creator') return

    const title = duplicateTitle(sourceLesson.title)
    const optimisticCopy = duplicateLocalLesson(sourceLesson, title)
    module.lessons.splice(lessonIndex + 1, 0, optimisticCopy)
    if (!isSupabaseConfigured) return optimisticCopy.id

    const remotePosition = module.lessons.length - 1
    try {
      const id = await duplicateLessonRecords(courseId, moduleId, sourceLesson, remotePosition, title)
      optimisticCopy.id = id
      await hydrate(true)
      const refreshedCourse = findCourse(courseId)
      const refreshedModule = refreshedCourse?.modules.find((item) => item.id === moduleId)
      const copyIndex = refreshedModule?.lessons.findIndex((item) => item.id === id) ?? -1
      if (refreshedCourse && refreshedModule && copyIndex >= 0) {
        const [copy] = refreshedModule.lessons.splice(copyIndex, 1)
        if (copy) refreshedModule.lessons.splice(lessonIndex + 1, 0, copy)
        await saveCourseOrder(refreshedCourse)
      }
      return id
    } catch (error) {
      const currentModule = findCourse(courseId)?.modules.find((item) => item.id === moduleId)
      if (currentModule) currentModule.lessons = currentModule.lessons.filter((item) => item !== optimisticCopy)
      throw error
    }
  }

  async function duplicateModule(courseId: string, moduleId: string): Promise<string | undefined> {
    const course = findCourse(courseId)
    const moduleIndex = course?.modules.findIndex((item) => item.id === moduleId) ?? -1
    const sourceModule = moduleIndex >= 0 ? course?.modules[moduleIndex] : undefined
    if (!course || !sourceModule || course.accessRole !== 'creator') return

    const optimisticCopy: CourseModule = {
      id: localId('module'),
      title: duplicateTitle(sourceModule.title),
      open: true,
      lessons: sourceModule.lessons.map((lesson) => duplicateLocalLesson(lesson)),
    }
    course.modules.splice(moduleIndex + 1, 0, optimisticCopy)
    if (!isSupabaseConfigured) return optimisticCopy.id

    try {
      const copiedModuleId = await createModuleRecord(courseId, optimisticCopy.title, course.modules.length - 1)
      optimisticCopy.id = copiedModuleId
      for (const [index, lesson] of sourceModule.lessons.entries()) {
        await duplicateLessonRecords(courseId, copiedModuleId, lesson, index)
      }
      await hydrate(true)
      const refreshedCourse = findCourse(courseId)
      const copyIndex = refreshedCourse?.modules.findIndex((item) => item.id === copiedModuleId) ?? -1
      if (refreshedCourse && copyIndex >= 0) {
        const [copy] = refreshedCourse.modules.splice(copyIndex, 1)
        if (copy) refreshedCourse.modules.splice(moduleIndex + 1, 0, copy)
        await saveCourseOrder(refreshedCourse)
      }
      return copiedModuleId
    } catch (error) {
      const currentCourse = findCourse(courseId)
      if (currentCourse) currentCourse.modules = currentCourse.modules.filter((item) => item !== optimisticCopy)
      throw error
    }
  }

  async function removeLessons(courseId: string, lessonIds: string[]): Promise<void> {
    const course = findCourse(courseId)
    if (!course || course.accessRole !== 'creator' || !lessonIds.length) return

    const selected = new Set(lessonIds)
    const lessons = course.modules.flatMap((module) => module.lessons.filter((lesson) => selected.has(lesson.id)))
    if (!lessons.length) return

    if (isSupabaseConfigured) {
      await deleteLessonAssets(lessons.flatMap((lesson) => lesson.blocks.flatMap((block) => [block.audioPath, block.filePath])))
      await deleteLessonRecords(lessons.map((lesson) => lesson.id))
    } else {
      releaseLessonObjectUrls(lessons.flatMap((lesson) => lesson.blocks.flatMap((block) => [block.audioUrl, block.fileUrl])))
    }

    for (const module of course.modules) {
      module.lessons = module.lessons.filter((lesson) => !selected.has(lesson.id))
    }
  }

  async function addBlock(lessonId: string, type: BlockType): Promise<void> {
    const found = findLesson(lessonId)
    if (!found) return

    const block = createLessonBlock('', type)
    if (!isSupabaseConfigured) {
      block.id = `block-${Date.now()}`
      found.lesson.blocks.push(block)
      return
    }

    await createBlockRecord(found.course.id, lessonId, type, found.lesson.blocks.length)
    await hydrate(true)
  }
  async function saveLesson(lessonId: string): Promise<void> {
    const lesson = findLesson(lessonId)?.lesson
    if (!lesson || !isSupabaseConfigured) return
    await updateLessonRecord(lessonId, lesson)
  }
  async function saveBlock(lessonId: string, blockId: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const block = findLesson(lessonId)?.lesson.blocks.find((item) => item.id === blockId)
    if (!block) return
    await updateBlockRecord(blockId, block)
  }
  async function saveLessonSections(lessonId: string, sections: LessonSectionConfig[]): Promise<void> {
    const found = findLesson(lessonId)
    if (!found) return

    found.lesson.sectionConfig = createLessonSectionConfig(sections, found.course.kind)
    if (!isSupabaseConfigured) return

    found.lesson.sectionConfigBlockId = await saveSectionConfigRecord({
      courseId: found.course.id,
      lessonId,
      sections: found.lesson.sectionConfig,
      blockId: found.lesson.sectionConfigBlockId,
    })
  }
  async function uploadAudio(lessonId: string, blockId: string, file: File): Promise<void> {
    const found = findLesson(lessonId)
    const block = found?.lesson.blocks.find((item) => item.id === blockId)
    if (!found || !block || block.type !== 'audio') throw new Error('Выберите аудиоблок')

    const uploaded = await uploadLessonAudio({
      organizationId: useAuthStore().organization?.id ?? 'demo',
      courseId: found.course.id,
      lessonId,
      blockId,
      file,
    })
    block.audioPath = uploaded.path
    block.audioUrl = uploaded.url
    await saveBlock(lessonId, blockId)
  }

  async function uploadPdf(lessonId: string, blockId: string, file: File): Promise<void> {
    const found = findLesson(lessonId)
    const block = found?.lesson.blocks.find((item) => item.id === blockId)
    if (!found || !block || block.type !== 'pdf') throw new Error('Выберите PDF-блок')

    const uploaded = await uploadLessonPdf({
      organizationId: useAuthStore().organization?.id ?? 'demo',
      courseId: found.course.id,
      lessonId,
      blockId,
      file,
    })
    block.filePath = uploaded.path
    block.fileUrl = uploaded.url
    block.fileName = uploaded.name
    block.fileSize = uploaded.size
    await saveBlock(lessonId, blockId)
  }

  async function removeBlock(lessonId: string, blockId: string): Promise<void> {
    const found = findLesson(lessonId)
    const block = found?.lesson.blocks.find((item) => item.id === blockId)
    if (!found || !block) return

    if (isSupabaseConfigured) {
      await deleteLessonAssets([block.audioPath, block.filePath])
      await deleteBlockRecord(blockId)
    } else {
      releaseLessonObjectUrls([block.audioUrl, block.fileUrl])
    }

    found.lesson.blocks = found.lesson.blocks.filter((item) => item.id !== blockId)
  }
  async function saveCourse(courseId: string): Promise<void> {
    const course = findCourse(courseId)
    if (!course || !isSupabaseConfigured) return
    await updateCourseRecord(course)
    course.updated = 'Только что'
  }
  async function deleteCourse(courseId: string): Promise<void> {
    const index = courses.value.findIndex((course) => course.id === courseId)
    if (index < 0) return

    if (isSupabaseConfigured) await deleteCourseRecord(courseId)
    courses.value.splice(index, 1)
  }
  async function publishCourse(courseId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const course = findCourse(courseId)
      if (course) course.status = 'Опубликован'
      return
    }

    await publishCourseRecord(courseId)
    await hydrate(true)
  }
  async function persistCourseOrder(courseId: string): Promise<void> {
    const course = findCourse(courseId)
    if (!course || !isSupabaseConfigured) return
    await saveCourseOrder(course)
  }
  async function persistBlockOrder(lessonId: string): Promise<void> {
    const blocks = findLesson(lessonId)?.lesson.blocks
    if (!blocks || !isSupabaseConfigured) return
    await saveBlockOrder(blocks)
  }
  function resetDemo(): void {
    if (isSupabaseConfigured) return
    courses.value = structuredClone(demoCourses)
    clearDemoCourses()
  }

  return {
    courses,
    hydrated,
    loading,
    loadError,
    totalLessons,
    findCourse,
    findLesson,
    hydrate,
    createCourse,
    joinCourse,
    refreshJoinCode,
    addModule,
    addLesson,
    duplicateLesson,
    duplicateModule,
    removeLessons,
    addBlock,
    saveLesson,
    saveBlock,
    saveLessonSections,
    uploadAudio,
    uploadPdf,
    removeBlock,
    saveCourse,
    deleteCourse,
    publishCourse,
    persistCourseOrder,
    persistBlockOrder,
    resetDemo,
  }
})
