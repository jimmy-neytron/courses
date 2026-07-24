<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, FilePenLine, Plus, Save, Send } from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'

import { lessonStatusLabel } from '@/constants/course-labels'
import { useCoursesStore } from '@/stores/courses'
import type { BlockDraft, LessonDraft } from '@/types/course'
import LessonBlockCreateDialog from '@/components/lesson/editor/block-create/LessonBlockCreateDialog.vue'
import LessonBlockEditor from '@/components/lesson/editor/block-editor/LessonBlockEditor.vue'
import LessonSettingsCard from '@/components/lesson/editor/settings/LessonSettingsCard.vue'
import { getErrorMessage } from '@/utils/error'
import { linesToList } from '@/utils/text'
import { useNotificationsStore } from '@/stores/notifications'
import { LoadingSkeleton, PageContainer, PageState, SectionHeading } from '@/components/ui'

const route = useRoute()
const courses = useCoursesStore()
const notifications = useNotificationsStore()
const lessonId = computed(() => String(route.params.lessonId))
const lesson = computed(() => courses.lessonById(lessonId.value))
const course = computed(() => courses.courseByLessonId(lessonId.value))
const module = computed(() => courses.moduleByLessonId(lessonId.value))
const blockDialogOpen = ref(false)
const saving = ref(false)
const creatingBlock = ref(false)
const changingStatus = ref(false)
const objectivesText = ref('')
const lessonForm = reactive<LessonDraft>({ title: '', description: '', objectives: [], durationMinutes: 45, passingScore: 0 })

watch(lesson, (value) => {
  if (!value) return
  Object.assign(lessonForm, {
    title: value.title,
    description: value.description,
    objectives: [...value.objectives],
    durationMinutes: value.durationMinutes,
    passingScore: value.passingScore,
  })
  objectivesText.value = value.objectives.join('\n')
}, { immediate: true })

onMounted(() => loadLesson())

async function loadLesson(force = false): Promise<void> {
  try { await courses.load(force) }
  catch (error) { notifications.push(getErrorMessage(error, 'Не удалось загрузить урок'), 'danger') }
}

async function saveLesson(): Promise<void> {
  if (!lesson.value) return
  saving.value = true
  try {
    await courses.updateLesson(lesson.value.id, { ...lessonForm, objectives: linesToList(objectivesText.value) })
    notifications.push('Урок сохранён', 'success')
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось сохранить урок'), 'danger') }
  finally { saving.value = false }
}

async function publishLesson(): Promise<void> {
  if (!lesson.value) return
  changingStatus.value = true
  try {
    await courses.updateLesson(lesson.value.id, {
      ...lessonForm,
      objectives: linesToList(objectivesText.value),
      status: 'published',
    })
    notifications.push('Урок опубликован', 'success')
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось опубликовать урок'), 'danger')
  } finally {
    changingStatus.value = false
  }
}

async function moveLessonToDraft(): Promise<void> {
  if (!lesson.value) return
  changingStatus.value = true
  try {
    await courses.setLessonStatus(lesson.value.id, 'draft')
    notifications.push('Урок возвращён в черновики и скрыт из предпросмотра курса', 'success')
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось вернуть урок в черновики'), 'danger')
  } finally {
    changingStatus.value = false
  }
}

async function createBlock(draft: BlockDraft): Promise<void> {
  if (!lesson.value) return
  creatingBlock.value = true
  try {
    await courses.createBlock(lesson.value.id, draft)
    blockDialogOpen.value = false
    notifications.push('Блок добавлен', 'success')
  } catch (error) { notifications.push(getErrorMessage(error, 'Не удалось добавить блок'), 'danger') }
  finally { creatingBlock.value = false }
}
</script>

<template>
  <LoadingSkeleton v-if="!courses.loaded || courses.loading" variant="editor" />
  <section v-else-if="lesson && course" class="editor-page">
    <header class="editor-header">
      <div><div class="editor-header__breadcrumbs"><RouterLink :to="{ name: 'course-details', params: { courseId: course.id } }">{{ course.title }}</RouterLink><span>/</span><span>{{ module?.title }}</span></div><div class="editor-header__title"><h1>{{ lesson.title }}</h1><UiBadge :tone="lesson.status === 'published' ? 'success' : 'warning'" variant="soft">{{ lessonStatusLabel(lesson.status) }}</UiBadge></div></div>
      <div class="editor-header__actions">
        <RouterLink :to="{ name: 'lesson-preview', params: { lessonId: lesson.id }, query: { mode: 'author' } }"><UiButton variant="ghost"><template #leading><Eye :size="17" /></template>Предпросмотр</UiButton></RouterLink>
        <UiButton variant="secondary" :loading="saving" @click="saveLesson"><template #leading><Save :size="17" /></template>Сохранить</UiButton>
        <UiButton
          v-if="lesson.status === 'published'"
          variant="secondary"
          :loading="changingStatus"
          @click="moveLessonToDraft"
        >
          <template #leading><FilePenLine :size="17" /></template>
          Вернуть в черновик
        </UiButton>
        <UiButton v-else :loading="changingStatus" @click="publishLesson">
          <template #leading><Send :size="17" /></template>
          Опубликовать
        </UiButton>
      </div>
    </header>

    <div class="editor-layout">
      <aside class="editor-settings"><LessonSettingsCard v-model="lessonForm" v-model:objectives-text="objectivesText" /></aside>
      <main class="editor-canvas">
        <SectionHeading eyebrow="Содержимое" title="Блоки урока" description="Добавляйте текст, акценты, медиа, итоги и домашние задания.">
          <template #action>
            <UiButton @click="blockDialogOpen = true"><template #leading><Plus :size="17" /></template>Добавить блок</UiButton>
          </template>
        </SectionHeading>
        <div v-if="lesson.blocks.length" class="block-list">
          <LessonBlockEditor v-for="(block, index) in lesson.blocks" :key="block.id" :block="block" :first="index === 0" :last="index === lesson.blocks.length - 1" @update="courses.updateBlock(block.id, $event)" @delete="courses.deleteBlock(block.id)" @move="courses.moveBlock(block.id, $event)" />
        </div>
        <PageState v-else title="Урок пока пустой" description="Добавьте первый блок содержимого."><UiButton @click="blockDialogOpen = true"><template #leading><Plus :size="17" /></template>Добавить блок</UiButton></PageState>
      </main>
    </div>
    <LessonBlockCreateDialog :open="blockDialogOpen" :loading="creatingBlock" @close="blockDialogOpen = false" @submit="createBlock" />
  </section>
  <PageContainer v-else-if="courses.error"><PageState title="Не удалось загрузить урок" :description="courses.error" action-label="Повторить" retry @action="loadLesson(true)" /></PageContainer>
  <PageContainer v-else><PageState title="Урок не найден" description="Возможно, он был удалён или ссылка больше не актуальна."><RouterLink :to="{ name: 'courses' }"><UiButton>Вернуться к курсам</UiButton></RouterLink></PageState></PageContainer>
</template>

<style scoped src="./lesson-editor-page.css"></style>
