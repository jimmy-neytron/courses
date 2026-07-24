<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import { DEFAULT_LESSON_DURATION } from '@/constants/course'
import type { LessonDraft } from '@/types/course'
import { linesToList } from '@/utils/text'
import { AppDialog, FormField } from '@/components/ui'

const props = withDefaults(defineProps<{
  open: boolean
  defaultDuration?: number
  loading?: boolean
}>(), {
  defaultDuration: DEFAULT_LESSON_DURATION,
  loading: false,
})
const emit = defineEmits<{ close: []; submit: [draft: LessonDraft] }>()
const objectivesText = ref('')
const form = reactive<LessonDraft>({
  title: '',
  description: '',
  objectives: [],
  durationMinutes: props.defaultDuration,
  passingScore: 0,
})

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, {
    title: '',
    description: '',
    objectives: [],
    durationMinutes: props.defaultDuration,
    passingScore: 0,
  })
  objectivesText.value = ''
})

function submit(): void {
  if (!form.title.trim()) return
  emit('submit', {
    ...structuredClone(form),
    objectives: linesToList(objectivesText.value),
  })
}
</script>

<template>
  <AppDialog :open="open" title="Новый урок" eyebrow="Программа" max-width="620px" @close="emit('close')">
    <div class="lesson-form">
      <FormField label="Название"><UiInput v-model="form.title" /></FormField>
      <FormField label="Описание"><UiTextarea v-model="form.description" :rows="3" /></FormField>
      <FormField label="Цели, каждая с новой строки"><UiTextarea v-model="objectivesText" :rows="4" /></FormField>
      <FormField label="Длительность, минут"><UiInput v-model.number="form.durationMinutes" type="number" min="1" /></FormField>
      <FormField label="Проходной балл"><UiInput v-model.number="form.passingScore" type="number" min="0" max="100" /></FormField>
    </div>
    <template #footer>
      <UiButton variant="ghost" :disabled="loading" @click="emit('close')">Отмена</UiButton>
      <UiButton :loading="loading" :disabled="!form.title.trim()" @click="submit">Создать урок</UiButton>
    </template>
  </AppDialog>
</template>

<style scoped src="./lesson-form-dialog.css"></style>
