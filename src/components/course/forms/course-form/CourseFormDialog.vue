<script setup lang="ts">
import { computed, toRef } from 'vue'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import { COURSE_VISIBILITY_OPTIONS } from '@/constants/course'
import type { CourseDraft, CourseVisibility } from '@/types/course'
import { AppDialog, AppSelect, FormField, type AppSelectOption } from '@/components/ui'
import { useCourseForm } from '@/composables/useCourseForm'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  initial?: CourseDraft
  loading?: boolean
}>(), {
  title: 'Новый курс',
  initial: undefined,
  loading: false,
})

const emit = defineEmits<{ close: []; submit: [draft: CourseDraft] }>()
const { form, getDraft } = useCourseForm(toRef(props, 'open'), toRef(props, 'initial'))
const visibilityOptions = COURSE_VISIBILITY_OPTIONS as AppSelectOption<CourseVisibility>[]
const canSubmit = computed(() => Boolean(form.title.trim()) && !props.loading)

function submit(): void {
  if (canSubmit.value) emit('submit', getDraft())
}
</script>

<template>
  <AppDialog :open="open" :title="title" eyebrow="Курс" max-width="760px" @close="emit('close')">
    <div class="course-form">
      <FormField label="Название" wide><UiInput v-model="form.title" placeholder="Например, Основы системного анализа" /></FormField>
      <FormField label="Описание" wide><UiTextarea v-model="form.description" :rows="4" placeholder="Что получит автор или ученик после курса" /></FormField>
      <FormField label="Код языка"><UiInput v-model="form.languageCode" placeholder="und или ru" /></FormField>
      <FormField label="Длительность урока"><UiInput v-model.number="form.defaultLessonDuration" type="number" min="1" /></FormField>
      <FormField label="Начальный уровень"><UiInput v-model="form.sourceLevel" placeholder="Например, A1" /></FormField>
      <FormField label="Целевой уровень"><UiInput v-model="form.targetLevel" placeholder="Например, B1" /></FormField>
      <FormField label="Недель"><UiInput v-model.number="form.durationWeeks" type="number" min="1" /></FormField>
      <FormField label="Уроков в неделю"><UiInput v-model.number="form.lessonsPerWeek" type="number" min="1" /></FormField>
      <FormField label="Цвет курса"><UiInput v-model="form.accentColor" class="color-control" type="color" /></FormField>
      <FormField as="div" label="Видимость"><AppSelect v-model="form.visibility" :options="visibilityOptions" /></FormField>
    </div>

    <template #footer>
      <UiButton variant="ghost" :disabled="loading" @click="emit('close')">Отмена</UiButton>
      <UiButton :loading="loading" :disabled="!canSubmit" @click="submit">Сохранить</UiButton>
    </template>
  </AppDialog>
</template>

<style scoped src="./course-form-dialog.css"></style>
