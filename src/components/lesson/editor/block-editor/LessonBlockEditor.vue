<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import { blockTypeLabel } from '@/constants/course-labels'
import type { LessonBlock } from '@/types/course'
import { EyebrowText, FormField } from '@/components/ui'

const props = defineProps<{ block: LessonBlock; first: boolean; last: boolean }>()
const emit = defineEmits<{
  update: [patch: Partial<LessonBlock>]
  delete: []
  move: [direction: -1 | 1]
}>()

const title = ref(props.block.title)
const text = ref(props.block.publicContent.text ?? '')
const url = ref(props.block.publicContent.url ?? '')
const acceptsUrl = computed(() => ['image', 'audio', 'listening', 'video', 'file'].includes(props.block.blockType))
const isAudioBlock = computed(() => ['audio', 'listening'].includes(props.block.blockType))
const contentLabel = computed(() => isAudioBlock.value ? 'Текст для озвучки / транскрипт' : 'Содержимое')
const urlLabel = computed(() => isAudioBlock.value ? 'Ссылка на аудиофайл (необязательно)' : 'Ссылка на материал')

watch(() => props.block, (block) => {
  title.value = block.title
  text.value = block.publicContent.text ?? ''
  url.value = block.publicContent.url ?? ''
}, { deep: true })

function save(): void {
  emit('update', {
    title: title.value,
    publicContent: { ...props.block.publicContent, text: text.value, url: url.value },
  })
}
</script>

<template>
  <UiCard class="block-editor" variant="outline" padding="md">
    <header class="block-editor__header">
      <div><EyebrowText>{{ blockTypeLabel(block.blockType) }}</EyebrowText><strong>{{ block.title || 'Без заголовка' }}</strong></div>
      <div class="block-editor__actions">
        <UiButton variant="ghost" size="sm" :disabled="first" aria-label="Переместить вверх" @click="emit('move', -1)"><ArrowUp :size="16" /></UiButton>
        <UiButton variant="ghost" size="sm" :disabled="last" aria-label="Переместить вниз" @click="emit('move', 1)"><ArrowDown :size="16" /></UiButton>
        <UiButton variant="ghost" size="sm" aria-label="Удалить блок" @click="emit('delete')"><Trash2 :size="16" /></UiButton>
      </div>
    </header>
    <div class="block-editor__fields">
      <FormField label="Заголовок блока"><UiInput v-model="title" @blur="save" /></FormField>
      <FormField v-if="block.blockType !== 'divider'" :label="contentLabel"><UiTextarea v-model="text" :rows="5" @blur="save" /></FormField>
      <FormField v-if="acceptsUrl" :label="urlLabel"><UiInput v-model="url" type="url" placeholder="https://..." @blur="save" /></FormField>
    </div>
  </UiCard>
</template>

<style scoped src="./lesson-block-editor.css"></style>
