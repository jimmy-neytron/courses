import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { BlockType, Course, LessonSectionConfig } from '@/types/course'
import { createLessonSectionConfig } from '@/composables/useCourseSections'
import { useAuthStore } from '@/stores/auth'
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase'
import { buildEnglishEngineDemoCourse, seedEnglishEngineCourse } from '@/services/seed-english-engine'
import { createLessonAudioUrl, uploadLessonAudio } from '@/services/lesson-audio.service'
import { createLessonPdfUrl, uploadLessonPdf } from '@/services/lesson-pdf.service'
import { deleteLessonAssets, releaseLessonObjectUrls } from '@/services/lesson-assets.service'
import { mapDatabaseCourse } from '@/services/course-mapper.service'
import { joinCourseByCode, regenerateCourseInvite } from '@/services/course-access.service'
import {
  clearDemoCourses,
  readCourseCache,
  readDemoCourses,
  writeCourseCache,
  writeDemoCourses,
} from '@/services/course-cache.service'
import {
  createLessonBlock,
  serializePrivateBlockContent,
  serializePublicBlockContent,
  toDatabaseBlockType,
} from '@/services/lesson-block-content.service'
import { slugify } from '@/utils/slugify'

const demoCourses: Course[] = [buildEnglishEngineDemoCourse()]

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

  async function resolveAssetUrls(): Promise<void> {
    const blocks = courses.value.flatMap((course) => course.modules.flatMap(
      (module) => module.lessons.flatMap((lesson) => lesson.blocks),
    ))

    await Promise.all(blocks.map(async (block) => {
      try {
        if (block.audioPath) block.audioUrl = await createLessonAudioUrl(block.audioPath)
        if (block.filePath) block.fileUrl = await createLessonPdfUrl(block.filePath)
      } catch {
        if (block.audioPath) block.audioUrl = ''
        if (block.filePath) block.fileUrl = ''
      }
    }))
  }

  function refreshCourses(organizationId: string, userId: string): Promise<void> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      loadError.value = ''
      if (!courses.value.length) loading.value = true

      try {
        const seedKey = `english-engine-seeded-v1-${organizationId}`
        if (localStorage.getItem(seedKey) !== 'true') {
          await seedEnglishEngineCourse(organizationId, userId)
          localStorage.setItem(seedKey, 'true')
        }

        const database = requireSupabase()
        let { data, error } = await database
          .from('courses')
          .select('id,owner_id,title,description,status,target_level,accent_color,updated_at,owner:profiles!courses_owner_id_fkey(id,display_name,avatar_url),course_memberships(user_id,role),course_invites(code),course_modules(id,title,position,lessons(id,title,duration_minutes,status,position,lesson_blocks(id,block_type,title,public_content,private_content,is_required,position)))')
          .order('updated_at', { ascending: false })

        if (error && ['42P01', 'PGRST200', 'PGRST205'].includes(error.code ?? '')) {
          const fallback = await database
            .from('courses')
            .select('id,owner_id,title,description,status,target_level,accent_color,updated_at,course_modules(id,title,position,lessons(id,title,duration_minutes,status,position,lesson_blocks(id,block_type,title,public_content,private_content,is_required,position)))')
            .eq('organization_id', organizationId)
            .order('updated_at', { ascending: false })
          data = fallback.data as unknown as typeof data
          error = fallback.error
        }

        if (error) throw error

        courses.value = ((data ?? []) as unknown as Record<string, unknown>[])
          .map((row) => mapDatabaseCourse(row, userId))
        await resolveAssetUrls()
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

    const { data, error } = await requireSupabase().from('courses').insert({
      organization_id: auth.organization.id,
      owner_id: auth.user.id,
      title,
      description,
      slug: slugify(title, 'course'),
      language_code: 'en',
      source_level: 'A0',
      target_level: 'B2',
    }).select('id').single()

    if (error) throw error
    await hydrate(true)
    return String(data.id)
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

    const { error } = await requireSupabase().from('course_modules').insert({
      course_id: courseId,
      title,
      position: course.modules.length,
    })
    if (error) throw error
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

    const { data, error } = await requireSupabase().from('lessons').insert({
      course_id: courseId,
      module_id: moduleId,
      title,
      slug: slugify(title, 'lesson'),
      duration_minutes: 45,
      position: module.lessons.length,
    }).select('id').single()

    if (error) throw error
    await hydrate(true)
    return String(data.id)
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

    const { error } = await requireSupabase().from('lesson_blocks').insert({
      course_id: found.course.id,
      lesson_id: lessonId,
      block_type: toDatabaseBlockType(type),
      title: block.title,
      public_content: serializePublicBlockContent(block),
      private_content: serializePrivateBlockContent(block),
      position: found.lesson.blocks.length,
    })
    if (error) throw error
    await hydrate(true)
  }

  async function saveLesson(lessonId: string): Promise<void> {
    const found = findLesson(lessonId)
    if (!found || !isSupabaseConfigured) return

    const { error } = await requireSupabase().from('lessons').update({
      title: found.lesson.title,
      duration_minutes: found.lesson.duration,
      status: found.lesson.status === 'Опубликован' ? 'published' : 'draft',
    }).eq('id', lessonId)
    if (error) throw error
  }

  async function saveBlock(lessonId: string, blockId: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const block = findLesson(lessonId)?.lesson.blocks.find((item) => item.id === blockId)
    if (!block) return

    const { error } = await requireSupabase().from('lesson_blocks').update({
      title: block.title,
      public_content: serializePublicBlockContent(block),
      private_content: serializePrivateBlockContent(block),
      is_required: block.required,
    }).eq('id', blockId)
    if (error) throw error
  }

  async function saveLessonSections(lessonId: string, sections: LessonSectionConfig[]): Promise<void> {
    const found = findLesson(lessonId)
    if (!found) return

    found.lesson.sectionConfig = createLessonSectionConfig(sections)
    if (!isSupabaseConfigured) return

    const payload = { kind: 'section_config', sections: found.lesson.sectionConfig }
    if (found.lesson.sectionConfigBlockId) {
      const { error } = await requireSupabase().from('lesson_blocks')
        .update({ public_content: payload })
        .eq('id', found.lesson.sectionConfigBlockId)
      if (error) throw error
      return
    }

    const { data, error } = await requireSupabase().from('lesson_blocks').insert({
      course_id: found.course.id,
      lesson_id: lessonId,
      block_type: 'summary',
      title: 'Настройки разделов',
      public_content: payload,
      private_content: {},
      is_required: false,
      position: 9999,
    }).select('id').single()

    if (error) throw error
    found.lesson.sectionConfigBlockId = String(data.id)
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
      const { error } = await requireSupabase().from('lesson_blocks').delete().eq('id', blockId)
      if (error) throw error
    } else {
      releaseLessonObjectUrls([block.audioUrl, block.fileUrl])
    }

    found.lesson.blocks = found.lesson.blocks.filter((item) => item.id !== blockId)
  }

  async function saveCourse(courseId: string): Promise<void> {
    const course = findCourse(courseId)
    if (!course || !isSupabaseConfigured) return

    const { error } = await requireSupabase().from('courses').update({
      title: course.title,
      description: course.description,
    }).eq('id', courseId)
    if (error) throw error
    course.updated = 'Только что'
  }

  async function deleteCourse(courseId: string): Promise<void> {
    const index = courses.value.findIndex((course) => course.id === courseId)
    if (index < 0) return

    if (isSupabaseConfigured) {
      const { error } = await requireSupabase().from('courses').delete().eq('id', courseId)
      if (error) throw error
    }
    courses.value.splice(index, 1)
  }

  async function publishCourse(courseId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const course = findCourse(courseId)
      if (course) course.status = 'Опубликован'
      return
    }

    const { error } = await requireSupabase().rpc('publish_course', {
      p_course_id: courseId,
      p_changelog: 'Published from Course Platform',
    })
    if (error) throw error
    await hydrate(true)
  }

  async function persistCourseOrder(courseId: string): Promise<void> {
    const course = findCourse(courseId)
    if (!course || !isSupabaseConfigured) return

    const moduleResults = await Promise.all(course.modules.map((module, position) => (
      requireSupabase().from('course_modules').update({ position }).eq('id', module.id)
    )))
    const moduleError = moduleResults.find((result) => result.error)?.error
    if (moduleError) throw moduleError

    const lessonResults = await Promise.all(course.modules.flatMap((module) => (
      module.lessons.map((lesson, position) => requireSupabase().from('lessons')
        .update({ module_id: module.id, position })
        .eq('id', lesson.id))
    )))
    const lessonError = lessonResults.find((result) => result.error)?.error
    if (lessonError) throw lessonError
  }

  async function persistBlockOrder(lessonId: string): Promise<void> {
    const found = findLesson(lessonId)
    if (!found || !isSupabaseConfigured) return

    const results = await Promise.all(found.lesson.blocks.map((block, position) => (
      requireSupabase().from('lesson_blocks').update({ position }).eq('id', block.id)
    )))
    const error = results.find((result) => result.error)?.error
    if (error) throw error
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
