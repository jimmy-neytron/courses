<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Brain, Check, RotateCcw } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

import type { LessonContentPair } from '@/utils/lesson-block-content'

const props = defineProps<{
  title: string
  cards: LessonContentPair[]
}>()

const emit = defineEmits<{
  completed: []
}>()

const index = ref(0)
const flipped = ref(false)
const known = ref<number[]>([])
const review = ref<number[]>([])

const card = computed(() => props.cards[index.value])

watch(
  () => props.cards,
  () => restart(),
  { deep: true },
)

function rate(value: 'known' | 'review'): void {
  const target = value === 'known' ? known : review
  if (!target.value.includes(index.value)) {
    target.value = [...target.value, index.value]
  }

  if (index.value < props.cards.length - 1) {
    index.value += 1
    flipped.value = false
  } else {
    emit('completed')
  }
}

function restart(): void {
  index.value = 0
  flipped.value = false
  known.value = []
  review.value = []
}
</script>

<template>
  <section class="engine-card flashcard-deck">
    <header>
      <span><Brain :size="20" /></span>
      <div>
        <small>Spaced repetition</small>
        <h3>{{ props.title || 'Карточки памяти' }}</h3>
        <p>{{ index + 1 }} из {{ props.cards.length }} · знаю {{ known.length }} · повторить {{ review.length }}</p>
      </div>
    </header>

    <UiButton
      v-if="card"
      class="flashcard"
      variant="ghost"
      @click="flipped = !flipped"
    >
      <span class="flashcard__content">
        <small>{{ flipped ? 'Перевод и подсказка' : 'Термин' }}</small>
        <strong>{{ flipped ? card.right : card.left }}</strong>
        <span>{{ flipped ? 'Оцените, насколько хорошо вы запомнили карточку' : 'Нажмите, чтобы перевернуть' }}</span>
      </span>
    </UiButton>

    <p v-else class="flashcard-empty">Карточки пока не заполнены.</p>

    <div v-if="card" class="engine-actions">
      <UiButton variant="secondary" size="sm" @click="restart">
        <template #leading><RotateCcw :size="14" /></template>
        Сначала
      </UiButton>
      <UiButton :disabled="!flipped" variant="secondary" size="sm" @click="rate('review')">
        Повторить
      </UiButton>
      <UiButton :disabled="!flipped" size="sm" @click="rate('known')">
        <template #leading><Check :size="14" /></template>
        Знаю
      </UiButton>
    </div>
  </section>
</template>

<style scoped src="./lesson-flashcards.css"></style>
