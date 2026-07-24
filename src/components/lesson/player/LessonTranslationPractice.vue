<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircle2, Languages, RotateCcw, Sparkles } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiTextarea } from '@neytron/compact-ui/textarea'

const props = withDefaults(defineProps<{
  title: string
  source: string
  target?: string
  questions?: string[]
  placeholder?: string
}>(), {
  target: '',
  questions: () => [],
  placeholder: 'Ваш перевод…',
})

const emit = defineEmits<{
  completed: []
}>()

const answer = ref('')
const revealed = ref(false)
const canCheck = computed(() => answer.value.trim().split(/\s+/).filter(Boolean).length >= 2)

watch(
  () => props.source,
  () => reset(),
)

function check(): void {
  if (!canCheck.value) return
  revealed.value = true
  emit('completed')
}

function reset(): void {
  answer.value = ''
  revealed.value = false
}
</script>

<template>
  <section class="engine-card translation-practice">
    <header>
      <span><Languages :size="20" /></span>
      <div>
        <small>Language practice</small>
        <h3>{{ props.title || 'Перевод смысловыми группами' }}</h3>
        <p>Сохраняйте смысл и естественный порядок слов.</p>
      </div>
    </header>

    <blockquote>{{ props.source || 'Исходный текст пока не заполнен.' }}</blockquote>
    <UiTextarea v-model="answer" :rows="7" :placeholder="props.placeholder" />

    <div class="engine-actions">
      <span>Сначала выполните задание самостоятельно</span>
      <UiButton variant="secondary" size="sm" @click="reset">
        <template #leading><RotateCcw :size="14" /></template>
        Сначала
      </UiButton>
      <UiButton size="sm" :disabled="!canCheck" @click="check">
        <template #leading><Sparkles :size="14" /></template>
        Сравнить с примером
      </UiButton>
    </div>

    <div v-if="revealed" class="engine-feedback">
      <CheckCircle2 :size="20" />
      <div>
        <b>Пример естественного ответа</b>
        <p>{{ props.target || 'Пример ответа автором не заполнен.' }}</p>
      </div>
    </div>

    <div v-if="revealed && props.questions.length" class="translation-questions">
      <b>Проверьте понимание</b>
      <ol>
        <li v-for="question in props.questions" :key="question">{{ question }}</li>
      </ol>
    </div>
  </section>
</template>

<style scoped src="./lesson-translation-practice.css"></style>
