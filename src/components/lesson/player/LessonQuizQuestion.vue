<script setup lang="ts">
import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from 'lucide-vue-next'
import { richTextToPlainText } from '@/components/common/richText'
import type { QuizAnswerResult } from '@/services/quiz.service'
import type { LessonBlock } from '@/types/course'

defineProps<{
  block: LessonBlock
  number: number
  answer?: number
  result?: QuizAnswerResult
  error?: string
  pending?: boolean
  theoryAvailable: boolean
}>()

const emit = defineEmits<{
  answer: [optionIndex: number]
  theory: []
}>()
</script>

<template>
  <section class="engine-test-question">
    <small>{{ block.title }}</small>

    <h3>
      {{ number }}.
      {{ richTextToPlainText(block.content ?? '') }}
    </h3>

    <button
      v-for="(option, optionIndex) in block.options"
      :key="`${option}-${optionIndex}`"
      :disabled="pending"
      :class="{
        selected: answer === optionIndex,
        correct: result?.correct && answer === optionIndex,
        wrong: result && !result.correct && answer === optionIndex,
      }"
      @click="emit('answer', optionIndex)"
    >
      {{ option }}

      <LoaderCircle
        v-if="pending && answer === optionIndex"
        class="spin"
      />

      <CheckCircle2
        v-else-if="result?.correct && answer === optionIndex"
      />

      <XCircle
        v-else-if="result && !result.correct && answer === optionIndex"
      />
    </button>

    <p
      v-if="error"
      class="form-error"
    >
      {{ error }}
    </p>

    <div
      v-if="result"
      class="engine-test-explanation"
    >
      <b>{{ result.correct ? 'Верно' : 'Ошибка разобрана' }}</b>
      <p>{{ result.explanation }}</p>

      <button
        v-if="theoryAvailable"
        @click="emit('theory')"
      >
        <BookOpen />
        Перейти к теории
      </button>
    </div>
  </section>
</template>
