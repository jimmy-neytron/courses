<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import { LESSON_BLOCK_TYPES } from '@/constants/course'
import { blockTypeLabel } from '@/constants/course-labels'
import type { BlockDraft, LessonBlockType } from '@/types/course'
import { AppDialog, AppSelect, FormField, type AppSelectOption } from '@/components/ui'

const props = withDefaults(defineProps<{ open: boolean; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ close: []; submit: [draft: BlockDraft] }>()
const form = reactive<BlockDraft>({
  blockType: 'rich_text',
  title: '',
  publicContent: { text: '' },
  isRequired: true,
  points: 0,
})

const blockTypeOptions: AppSelectOption<LessonBlockType>[] = LESSON_BLOCK_TYPES.map((type) => ({
  label: blockTypeLabel(type),
  value: type,
}))

const selectedType = computed({
  get: () => form.blockType,
  set: (value: LessonBlockType) => { form.blockType = value },
})

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, {
    blockType: 'rich_text',
    title: '',
    publicContent: { text: '' },
    isRequired: true,
    points: 0,
  })
})
</script>

<template>
  <AppDialog :open="open" title="Новый блок" eyebrow="Урок" max-width="620px" @close="emit('close')">
    <div class="lesson-block-create-form">
      <FormField as="div" label="Тип блока"><AppSelect v-model="selectedType" :options="blockTypeOptions" /></FormField>
      <FormField label="Заголовок"><UiInput v-model="form.title" /></FormField>
      <FormField v-if="form.blockType !== 'divider'" label="Начальный текст"><UiTextarea v-model="form.publicContent.text" :rows="4" /></FormField>
    </div>
    <template #footer>
      <UiButton variant="ghost" :disabled="loading" @click="emit('close')">Отмена</UiButton>
      <UiButton :loading="loading" @click="emit('submit', structuredClone(form))">Добавить</UiButton>
    </template>
  </AppDialog>
</template>

<style scoped src="./lesson-block-create-dialog.css"></style>
