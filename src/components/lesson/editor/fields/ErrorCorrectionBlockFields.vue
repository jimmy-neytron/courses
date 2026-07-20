<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import type { LessonBlock } from '@/types/course'

const props = defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ change: [] }>()

function addCorrection(): void {
  props.block.corrections ??= []
  props.block.corrections.push({ incorrect: '', correct: '', explanation: '' })
  emit('change')
}

function removeCorrection(index: number): void {
  props.block.corrections?.splice(index, 1)
  emit('change')
}
</script>

<template>
  <section class="block-fieldset">
    <header><div><strong>Примеры ошибок</strong><small>{{ block.corrections?.length ?? 0 }} шт.</small></div><UiButton size="small" severity="secondary" outlined @click="addCorrection"><Plus />Добавить</UiButton></header>
    <div class="repeatable-list">
      <article v-for="(item, index) in block.corrections" :key="index" class="repeatable-card">
        <div class="repeatable-card-head"><span>Ошибка {{ index + 1 }}</span><button aria-label="Удалить пример" @click="removeCorrection(index)"><Trash2 /></button></div>
        <UiInput v-model="item.incorrect" placeholder="Неправильный вариант" @update:model-value="emit('change')" />
        <UiInput v-model="item.correct" placeholder="Правильный вариант" @update:model-value="emit('change')" />
        <UiTextarea v-model="item.explanation" rows="3" auto-resize placeholder="Почему это ошибка" @update:model-value="emit('change')" />
      </article>
    </div>
    <button v-if="!block.corrections?.length" class="repeatable-empty" @click="addCorrection"><Plus />Добавить первый пример</button>
  </section>
</template>
