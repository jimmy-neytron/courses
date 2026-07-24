<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BookOpen,
  Check,
  Download,
  FileText,
  Grip,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  PenLine,
  Sparkles,
} from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import LessonAudioPlayer from '@/components/lesson/player/LessonAudioPlayer.vue'
import LessonChoiceQuestion from '@/components/lesson/player/LessonChoiceQuestion.vue'
import LessonFlashcards from '@/components/lesson/player/LessonFlashcards.vue'
import LessonTranslationPractice from '@/components/lesson/player/LessonTranslationPractice.vue'
import { blockTypeLabel } from '@/constants/course-labels'
import type { LessonBlock } from '@/types/course'
import {
  contentCards,
  contentMatchingPairs,
  contentOptions,
  contentStringList,
  contentText,
  contentUrl,
  firstContentString,
} from '@/utils/lesson-block-content'

const props = defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ completed: [] }>()

const answer = ref('')
const answerSubmitted = ref(false)

const content = computed(() => props.block.publicContent)
const text = computed(() => contentText(content.value))
const url = computed(() => contentUrl(content.value))
const caption = computed(() => firstContentString(content.value, ['caption', 'alt', 'description']))
const transcript = computed(() => firstContentString(content.value, [
  'transcript', 'text', 'content', 'prompt', 'sentence',
]))
const language = computed(() => firstContentString(content.value, [
  'languageCode', 'language', 'lang',
]) || 'en-US')
const options = computed(() => contentOptions(content.value))
const cards = computed(() => contentCards(content.value))
const pairs = computed(() => contentMatchingPairs(content.value))
const orderedItems = computed(() => contentStringList(
  content.value.items ?? content.value.words ?? content.value.steps ?? content.value.sentences,
))
const sourceText = computed(() => firstContentString(content.value, [
  'sourceText', 'text', 'content', 'prompt', 'sentence',
]))
const targetText = computed(() => firstStringFromRecords([
  props.block.privateContent,
  content.value,
], ['targetText', 'translation', 'answer', 'exampleAnswer', 'sampleAnswer']))
const placeholder = computed(() => firstContentString(content.value, ['placeholder']) || 'Введите ответ')
const fileName = computed(() => firstContentString(content.value, ['fileName', 'name']) || props.block.title)
const questions = computed(() => contentStringList(
  content.value.questions ?? content.value.comprehensionQuestions,
))
const correctIndexes = computed(() => resolveCorrectIndexes(props.block))
const explanation = computed(() => firstStringFromRecords([
  props.block.privateContent,
  content.value,
], ['explanation', 'feedback', 'hint']))

watch(
  () => props.block.id,
  () => {
    answer.value = ''
    answerSubmitted.value = false
  },
)

function submitAnswer(): void {
  if (!answer.value.trim()) return
  answerSubmitted.value = true
  emit('completed')
}

function completeBlock(): void {
  emit('completed')
}

function firstStringFromRecords(
  records: Array<Record<string, unknown>>,
  keys: string[],
): string {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  return ''
}

function resolveCorrectIndexes(block: LessonBlock): number[] {
  const records = [block.privateContent, block.publicContent]

  for (const record of records) {
    const multiple = record.correctIndexes ?? record.correctOptions ?? record.correctAnswers
    if (Array.isArray(multiple)) {
      const indexes = multiple
        .map((value) => resolveOptionIndex(value, options.value))
        .filter((value): value is number => value !== null)
      if (indexes.length) return [...new Set(indexes)]
    }

    const single = record.correctIndex ?? record.correctOption ?? record.correctAnswer ?? record.answer
    const index = resolveOptionIndex(single, options.value)
    if (index !== null) return [index]
  }

  return []
}

function resolveOptionIndex(value: unknown, values: string[]): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value >= 0 && value < values.length ? value : null
  }

  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null

  const numeric = Number(normalized)
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < values.length) return numeric

  const optionIndex = values.findIndex((option) => option.trim() === normalized)
  return optionIndex >= 0 ? optionIndex : null
}
</script>

<template>
  <hr v-if="block.blockType === 'divider'" class="engine-divider" />

  <section v-else-if="block.blockType === 'heading'" class="engine-theory-block heading">
    <h2>{{ block.title || text || 'Раздел урока' }}</h2>
  </section>

  <LessonAudioPlayer
    v-else-if="block.blockType === 'audio' || block.blockType === 'listening'"
    :src="url"
    :title="block.title || blockTypeLabel(block.blockType)"
    :transcript="transcript"
    :language="language"
    @completed="completeBlock"
  />

  <LessonFlashcards
    v-else-if="block.blockType === 'flashcards'"
    :title="block.title || 'Карточки памяти'"
    :cards="cards"
    @completed="completeBlock"
  />

  <LessonChoiceQuestion
    v-else-if="block.blockType === 'single_choice' || block.blockType === 'multiple_choice'"
    :title="block.title || text || 'Выберите ответ'"
    :description="block.title ? text : ''"
    :options="options"
    :correct-indexes="correctIndexes"
    :explanation="explanation"
    :multiple="block.blockType === 'multiple_choice'"
    @completed="completeBlock"
  />

  <LessonTranslationPractice
    v-else-if="block.blockType === 'translation'"
    :title="block.title || 'Перевод смысловыми группами'"
    :source="sourceText"
    :target="targetText"
    :questions="questions"
    :placeholder="placeholder"
    @completed="completeBlock"
  />

  <section v-else-if="block.blockType === 'image'" class="engine-media-block">
    <header><span><ImageIcon :size="19" /></span><div><small>Иллюстрация</small><h3>{{ block.title || 'Изображение' }}</h3></div></header>
    <img v-if="url" :src="url" :alt="caption || block.title" loading="lazy" />
    <div v-else class="engine-media-empty"><ImageIcon :size="30" />Ссылка на изображение не указана</div>
    <p v-if="caption || text">{{ caption || text }}</p>
  </section>

  <section v-else-if="block.blockType === 'video'" class="engine-media-block">
    <header><span><Link2 :size="19" /></span><div><small>Видео</small><h3>{{ block.title || 'Видео урока' }}</h3></div></header>
    <video v-if="url" controls preload="metadata" :src="url" />
    <div v-else class="engine-media-empty"><Link2 :size="30" />Ссылка на видео не указана</div>
    <p v-if="text">{{ text }}</p>
  </section>

  <section v-else-if="block.blockType === 'file'" class="engine-file-block">
    <span><FileText :size="24" /></span>
    <div><small>Материал урока</small><h3>{{ block.title || fileName || 'Файл' }}</h3><p v-if="text">{{ text }}</p></div>
    <a v-if="url" :href="url" target="_blank" rel="noreferrer"><Download :size="15" />Открыть файл</a>
    <UiBadge v-else tone="neutral" variant="soft">Файл не прикреплён</UiBadge>
  </section>

  <section v-else-if="block.blockType === 'vocabulary'" class="engine-card vocabulary-block">
    <header><span><BookOpen :size="20" /></span><div><small>Vocabulary</small><h3>{{ block.title || 'Словарь урока' }}</h3><p v-if="text">{{ text }}</p></div></header>
    <div v-if="cards.length" class="vocabulary-grid">
      <article v-for="(card, index) in cards" :key="`${card.left}-${index}`"><strong>{{ card.left }}</strong><span>{{ card.right }}</span></article>
    </div>
    <p v-else class="engine-empty">Слова пока не добавлены.</p>
  </section>

  <section v-else-if="block.blockType === 'matching'" class="engine-card practice-block">
    <header><span><Sparkles :size="20" /></span><div><small>Matching</small><h3>{{ block.title || 'Соедините пары' }}</h3><p v-if="text">{{ text }}</p></div></header>
    <div v-if="pairs.length" class="engine-pair-list"><div v-for="(pair, index) in pairs" :key="index"><span>{{ pair.left }}</span><span>{{ pair.right }}</span></div></div>
    <p v-else class="engine-empty">Пары пока не заполнены.</p>
    <UiButton v-if="pairs.length" class="practice-complete" size="sm" @click="completeBlock"><template #leading><Check :size="14" /></template>Задание выполнено</UiButton>
  </section>

  <section v-else-if="block.blockType === 'ordering' || block.blockType === 'sentence_builder'" class="engine-card practice-block">
    <header><span><Grip :size="20" /></span><div><small>{{ blockTypeLabel(block.blockType) }}</small><h3>{{ block.title || 'Соберите правильный порядок' }}</h3><p v-if="text">{{ text }}</p></div></header>
    <div v-if="orderedItems.length" class="engine-chip-list"><span v-for="(item, index) in orderedItems" :key="`${item}-${index}`"><Grip :size="14" />{{ item }}</span></div>
    <p v-else class="engine-empty">Элементы задания пока не заполнены.</p>
    <UiButton v-if="orderedItems.length" class="practice-complete" size="sm" @click="completeBlock"><template #leading><Check :size="14" /></template>Готово</UiButton>
  </section>

  <section v-else-if="['text_input', 'fill_blanks', 'open_answer'].includes(block.blockType)" class="engine-card answer-block">
    <header><span><PenLine :size="20" /></span><div><small>{{ blockTypeLabel(block.blockType) }}</small><h3>{{ block.title || text || 'Введите ответ' }}</h3><p v-if="block.title && text">{{ text }}</p></div></header>
    <UiTextarea v-if="block.blockType === 'open_answer'" v-model="answer" :rows="6" :placeholder="placeholder" />
    <UiInput v-else v-model="answer" :placeholder="placeholder" />
    <div class="answer-actions"><span v-if="answerSubmitted">Ответ сохранён в текущем просмотре</span><UiButton size="sm" :disabled="!answer.trim()" @click="submitAnswer"><template #leading><Check :size="14" /></template>Проверить себя</UiButton></div>
  </section>

  <article v-else :class="['engine-theory-block', block.blockType]">
    <aside v-if="block.blockType === 'callout'"><MessageSquare :size="22" /><div><b>{{ block.title || 'Важно' }}</b><p>{{ text || 'Добавьте ключевую мысль.' }}</p></div></aside>
    <section v-else><small>{{ blockTypeLabel(block.blockType) }}</small><h3 v-if="block.title">{{ block.title }}</h3><p>{{ text || 'Содержимое блока пока не заполнено.' }}</p><UiButton v-if="block.blockType === 'homework'" class="practice-complete" size="sm" @click="completeBlock"><template #leading><Check :size="14" /></template>Домашняя работа выполнена</UiButton></section>
  </article>
</template>

<style scoped src="./lesson-block-renderer.css"></style>
