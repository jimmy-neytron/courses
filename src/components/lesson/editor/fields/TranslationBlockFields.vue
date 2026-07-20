<script setup lang="ts">
import UiTextarea from '@/components/ui/UiTextarea.vue'
import type { LessonBlock } from '@/types/course'

const props = defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ change: [] }>()

function updateQuestions(value?: string): void {
  props.block.comprehensionQuestions = (value ?? '')
    .split('\n')
    .map((question) => question.trim())
    .filter(Boolean)
  emit('change')
}
</script>

<template>
  <section class="block-fieldset">
    <header><strong>Задание на перевод</strong><small>Исходный текст, эталон и вопросы на понимание</small></header>
    <label>Исходный текст<UiTextarea v-model="block.sourceText" rows="6" auto-resize @update:model-value="emit('change')" /></label>
    <label>Эталонный перевод<UiTextarea v-model="block.targetText" rows="6" auto-resize @update:model-value="emit('change')" /></label>
    <label>Вопросы — каждый с новой строки<UiTextarea :model-value="block.comprehensionQuestions?.join('\n')" rows="5" auto-resize @update:model-value="updateQuestions" /></label>
  </section>
</template>
