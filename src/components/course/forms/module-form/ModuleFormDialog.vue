<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import type { ModuleDraft } from '@/types/course'
import { AppDialog, FormField } from '@/components/ui'

const props = withDefaults(defineProps<{ open: boolean; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ close: []; submit: [draft: ModuleDraft] }>()
const form = reactive<ModuleDraft>({ title: '', description: '' })

watch(() => props.open, (open) => {
  if (open) Object.assign(form, { title: '', description: '' })
})
</script>

<template>
  <AppDialog :open="open" title="Новый модуль" eyebrow="Программа" max-width="560px" @close="emit('close')">
    <div class="module-form">
      <FormField label="Название"><UiInput v-model="form.title" placeholder="Например, Введение" /></FormField>
      <FormField label="Описание"><UiTextarea v-model="form.description" :rows="4" /></FormField>
    </div>
    <template #footer>
      <UiButton variant="ghost" :disabled="loading" @click="emit('close')">Отмена</UiButton>
      <UiButton :loading="loading" :disabled="!form.title.trim()" @click="emit('submit', structuredClone(form))">Добавить</UiButton>
    </template>
  </AppDialog>
</template>

<style scoped src="./module-form-dialog.css"></style>
