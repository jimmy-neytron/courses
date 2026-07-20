import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { BlockType, Course, LessonSectionConfig } from '@/types/course'
import { createLessonSectionConfig } from '@/composables/useCourseSections'
import { useAuthStore } from '@/stores/auth'
import { isSupabaseConfigured } from '@/services/supabase'
import { buildEnglish90DayDemoCourse, seedEnglish90DayCourse } from '@/services/seed-english-90-day-course'
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
  listCourses,
  publishCourseRecord,
  saveBlockOrder,
  saveCourseOrder,
  saveSectionConfigRecord,
  updateBlockRecord,
  updateCourseRecord,
  updateLessonRecord,
} from '@/services/course-repository.service'

const demoCourses: Course[] = [buildEnglish90DayDemoCourse()]

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
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
        const seedKey = `english-90-days-seeded-v1-${organizationId}`
        if (localStorage.getItem(seedKey) !== 'true') {
          await seedEnglish90DayCourse(organizationId, userId)
          localStorage.setItem(seedKey, 'true')
        }

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

  async function createCourse(title: string, description: string): Promise<string> {
    if (!isSupabaseConfigured) {
      const id = `course-${Date.now()}`
      courses.value.unshift({
        id,
        ownerId: 'demo-user',
        accessRole: 'creator',
        creator: { id: 'demo-user', name: 'Вы' },
        joinCode: `DEMO${String(Date.now()).slice(-6)}`,
        title,
        description,
        cover: 'linear-gradient(135deg,#176452,#3ac3a6)',
        tag: 'EN',
        status: 'Черновик',
        updated: 'Только что',
        modules: [],
      })
      return id
    }

    const auth = useAuthStore()
    if (!auth.organization || !auth.user) throw new Error('Организация пользователя не найдена')

    const id = await createCourseRecord(auth.organization.id, auth.user.id, title, description)
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
    const module = findCourse(courseId)?.modules.find((item) => item.id === moduleId)
    if (!module) return

    if (!isSupabaseConfigured) {
      const id = `lesson-${Date.now()}`
      module.lessons.push({
        id,
        title,
        duration: 45,
        status: 'Черновик',
        blocks: [],
        sectionConfig: createLessonSectionConfig(),
      })
      return id
    }

    const id = await createLessonRecord(courseId, moduleId, title, module.lessons.length)
    await hydrate(true)
    return id
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

    found.lesson.sectionConfig = createLessonSectionConfig(sections)
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
