<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
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
    <header><div><strong>Примеры ошибок</strong><small>{{ block.corrections?.length ?? 0 }} шт.</small></div><PrimeButton size="small" severity="secondary" outlined @click="addCorrection"><Plus />Добавить</PrimeButton></header>
    <div class="repeatable-list">
      <article v-for="(item, index) in block.corrections" :key="index" class="repeatable-card">
        <div class="repeatable-card-head"><span>Ошибка {{ index + 1 }}</span><button aria-label="Удалить пример" @click="removeCorrection(index)"><Trash2 /></button></div>
        <InputText v-model="item.incorrect" placeholder="Неправильный вариант" @update:model-value="emit('change')" />
        <InputText v-model="item.correct" placeholder="Правильный вариант" @update:model-value="emit('change')" />
        <Textarea v-model="item.explanation" rows="3" auto-resize placeholder="Почему это ошибка" @update:model-value="emit('change')" />
      </article>
    </div>
    <button v-if="!block.corrections?.length" class="repeatable-empty" @click="addCorrection"><Plus />Добавить первый пример</button>
  </section>
</template>
