<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import type { LessonBlock } from '@/types/course'

const props = defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ change: [] }>()

function addCard(): void {
  props.block.cards ??= []
  props.block.cards.push({ front: '', back: '', hint: '' })
  emit('change')
}

function removeCard(index: number): void {
  props.block.cards?.splice(index, 1)
  emit('change')
}
</script>

<template>
  <section class="block-fieldset">
    <header><div><strong>Карточки</strong><small>{{ block.cards?.length ?? 0 }} шт.</small></div><UiButton size="small" severity="secondary" outlined @click="addCard"><Plus />Добавить</UiButton></header>
    <div class="repeatable-list">
      <article v-for="(card, index) in block.cards" :key="index" class="repeatable-card">
        <div class="repeatable-card-head"><span>Карточка {{ index + 1 }}</span><button aria-label="Удалить карточку" @click="removeCard(index)"><Trash2 /></button></div>
        <UiInput v-model="card.front" placeholder="Слово или вопрос" @update:model-value="emit('change')" />
        <UiInput v-model="card.back" placeholder="Перевод или ответ" @update:model-value="emit('change')" />
        <UiInput v-model="card.hint" placeholder="Подсказка для запоминания" @update:model-value="emit('change')" />
      </article>
    </div>
    <button v-if="!block.cards?.length" class="repeatable-empty" @click="addCard"><Plus />Добавить первую карточку</button>
  </section>
</template>
