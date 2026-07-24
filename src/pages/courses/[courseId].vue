<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit3, Eye, Plus, Send, Trash2 } from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'

import { courseStatusLabel } from '@/constants/course-labels'
import { useCoursesStore } from '@/stores/courses'
import type { CourseDraft, LessonDraft, ModuleDraft } from '@/types/course'
import { CurriculumModuleCard } from '@/components/course'
import CourseFormDialog from '@/components/course/forms/course-form/CourseFormDialog.vue'
import LessonFormDialog from '@/components/course/forms/lesson-form/LessonFormDialog.vue'
import ModuleFormDialog from '@/components/course/forms/module-form/ModuleFormDialog.vue'
import { getErrorMessage } from '@/utils/error'
import { pluralize } from '@/utils/text'
import { useNotificationsStore } from '@/stores/notifications'
import { ConfirmDialog, LoadingSkeleton, PageContainer, PageState, SectionHeading } from '@/components/ui'
import { useDeleteTarget } from '@/composables/useDeleteTarget'

const route = useRoute()
const router = useRouter()
const courses = useCoursesStore()
const notifications = useNotificationsStore()
const courseId = computed(() => String(route.params.courseId))
const course = computed(() => courses.courseById(courseId.value))
const editCourseOpen = ref(false)
const moduleDialogOpen = ref(false)
const lessonDialogOpen = ref(false)
const selectedModuleId = ref('')
const saving = ref(false)
const deleting = ref(false)
const deleteTarget = useDeleteTarget()

const courseDraft = computed<CourseDraft | undefined>(() => course.value ? ({
  title: course.value.title,
  description: course.value.description,
  languageCode: course.value.languageCode,
  sourceLevel: course.value.sourceLevel,
  targetLevel: course.value.targetLevel,
  durationWeeks: course.value.durationWeeks,
  lessonsPerWeek: course.value.lessonsPerWeek,
  defaultLessonDuration: course.value.defaultLessonDuration,
  accentColor: course.value.accentColor,
  visibility: course.value.visibility,
  isSequential: course.value.isSequential,
}) : undefined)
const lessonCount = computed(() => course.value?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0)
const completedLessonCount = computed(() => course.value?.modules.reduce(
  (total, module) => total + module.lessons.filter((lesson) => lesson.isCompleted).length,
  0,
) ?? 0)

onMounted(() => loadCourse())

async function loadCourse(force = false): Promise<void> {
  try { await courses.load(force) }
  catch (error) { notifications.push(getErrorMessage(error, 'Не удалось загрузить курс'), 'danger') }
}

async function saveCourse(draft: CourseDraft): Promise<void> {
  saving.value = true
  try {
    await courses.updateCourse(courseId.value, draft)
    editCourseOpen.value = false
    notifications.push('Настройки курса сохранены', 'success')
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось сохранить курс'), 'danger') }
  finally { saving.value = false }
}

async function createModule(draft: ModuleDraft): Promise<void> {
  saving.value = true
  try {
    await courses.createModule(courseId.value, draft)
    moduleDialogOpen.value = false
    notifications.push('Модуль добавлен', 'success')
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось добавить модуль'), 'danger') }
  finally { saving.value = false }
}

function openLessonDialog(moduleId: string): void {
  selectedModuleId.value = moduleId
  lessonDialogOpen.value = true
}

async function createLesson(draft: LessonDraft): Promise<void> {
  saving.value = true
  try {
    const lesson = await courses.createLesson(courseId.value, selectedModuleId.value, draft)
    lessonDialogOpen.value = false
    notifications.push('Урок добавлен', 'success')
    await router.push({ name: 'lesson-editor', params: { lessonId: lesson.id } })
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось добавить урок'), 'danger') }
  finally { saving.value = false }
}

async function publish(): Promise<void> {
  if (!course.value) return
  try {
    await courses.publishCourse(course.value.id)
    notifications.push('Курс опубликован', 'success')
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось опубликовать курс'), 'danger') }
}

async function setLessonCompleted(lessonId: string, isCompleted: boolean): Promise<void> {
  try {
    await courses.setLessonCompleted(lessonId, isCompleted)
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось изменить прогресс урока'), 'danger')
  }
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.target.value
  if (!target) return
  deleting.value = true
  try {
    if (target.kind === 'course') {
      await courses.deleteCourse(target.id)
      notifications.push('Курс удалён', 'success')
      deleteTarget.clear()
      await router.replace({ name: 'courses' })
      return
    }
    if (target.kind === 'module') await courses.deleteModule(courseId.value, target.id)
    else await courses.deleteLesson(target.id)
    notifications.push(target.kind === 'module' ? 'Модуль удалён' : 'Урок удалён', 'success')
    deleteTarget.clear()
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось удалить элемент'), 'danger') }
  finally { deleting.value = false }
}
</script>

<template>
  <LoadingSkeleton v-if="!courses.loaded || courses.loading" variant="detail" />
  <PageContainer v-else-if="course">
    <header class="course-header" :style="{ '--course-accent': course.accentColor }">
      <div class="course-header__copy">
        <div class="course-header__badges"><UiBadge :tone="course.status === 'published' ? 'success' : 'warning'" variant="soft">{{ courseStatusLabel(course.status) }}</UiBadge><UiBadge tone="neutral" variant="soft">{{ course.visibility }}</UiBadge></div>
        <h1>{{ course.title }}</h1><p>{{ course.description || 'Описание курса пока не заполнено.' }}</p>
        <div class="course-header__stats"><span>{{ course.modules.length }} {{ pluralize(course.modules.length, ['модуль', 'модуля', 'модулей']) }}</span><span>{{ lessonCount }} {{ pluralize(lessonCount, ['урок', 'урока', 'уроков']) }}</span><span>{{ course.defaultLessonDuration }} мин на урок</span><span>{{ completedLessonCount }} из {{ lessonCount }} пройдено</span></div>
      </div>
      <div class="course-header__actions">
        <RouterLink :to="{ name: 'course-preview', params: { courseId: course.id } }"><UiButton variant="ghost"><template #leading><Eye :size="17" /></template>Предпросмотр</UiButton></RouterLink>
        <UiButton variant="secondary" @click="editCourseOpen = true"><template #leading><Edit3 :size="17" /></template>Настройки</UiButton>
        <UiButton @click="publish"><template #leading><Send :size="17" /></template>Опубликовать</UiButton>
        <UiButton variant="ghost" aria-label="Удалить курс" @click="deleteTarget.request('course', course.id, course.title)"><Trash2 :size="17" /></UiButton>
      </div>
    </header>

    <SectionHeading eyebrow="Структура" title="Программа курса" description="Основной экран для модулей, уроков и материалов курса.">
      <template #action>
        <UiButton @click="moduleDialogOpen = true"><template #leading><Plus :size="17" /></template>Добавить модуль</UiButton>
      </template>
    </SectionHeading>

    <div v-if="course.modules.length" class="curriculum-list">
      <CurriculumModuleCard
        v-for="(module, moduleIndex) in course.modules"
        :key="module.id"
        :module="module"
        :module-index="moduleIndex"
        :module-count="course.modules.length"
        @move-module="courses.moveModule(course.id, module.id, $event)"
        @delete-module="deleteTarget.request('module', module.id, module.title)"
        @add-lesson="openLessonDialog(module.id)"
        @move-lesson="courses.moveLesson"
        @delete-lesson="(lessonId, title) => deleteTarget.request('lesson', lessonId, title)"
        @toggle-lesson-complete="setLessonCompleted"
      />
    </div>
    <PageState v-else title="Программа пока пустая" description="Добавьте первый модуль, затем создайте уроки."><UiButton @click="moduleDialogOpen = true"><template #leading><Plus :size="17" /></template>Добавить модуль</UiButton></PageState>

    <CourseFormDialog :open="editCourseOpen" title="Настройки курса" :initial="courseDraft" :loading="saving" @close="editCourseOpen = false" @submit="saveCourse" />
    <ModuleFormDialog :open="moduleDialogOpen" :loading="saving" @close="moduleDialogOpen = false" @submit="createModule" />
    <LessonFormDialog :open="lessonDialogOpen" :default-duration="course.defaultLessonDuration" :loading="saving" @close="lessonDialogOpen = false" @submit="createLesson" />
    <ConfirmDialog :open="Boolean(deleteTarget.target.value)" :title="deleteTarget.title.value" :description="deleteTarget.description.value" :loading="deleting" @close="deleteTarget.clear" @confirm="confirmDelete" />
  </PageContainer>
  <PageContainer v-else-if="courses.error"><PageState title="Не удалось загрузить курс" :description="courses.error" action-label="Повторить" retry @action="loadCourse(true)" /></PageContainer>
  <PageContainer v-else><PageState title="Курс не найден" description="Возможно, он был удалён или ссылка больше не актуальна."><RouterLink :to="{ name: 'courses' }"><UiButton>Вернуться к курсам</UiButton></RouterLink></PageState></PageContainer>
</template>

<style scoped src="./course-details-page.css"></style>
