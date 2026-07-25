<script setup lang="ts">
import { BookOpen, CheckCircle2, XCircle } from 'lucide-vue-next'
import type { LessonBlock } from '@/types/course'

defineProps<{
  block: LessonBlock
  number: number
  answer?: number
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
    <h3>{{ number }}. {{ block.content }}</h3>
    <button
      v-for="(option, optionIndex) in block.options"
      :key="`${option}-${optionIndex}`"
      :class="{
        selected: answer === optionIndex,
        correct: answer !== undefined && optionIndex === block.correctOption,
        wrong: answer === optionIndex && optionIndex !== block.correctOption,
      }"
      @click="emit('answer', optionIndex)"
    >
      {{ option }}
      <CheckCircle2 v-if="answer !== undefined && optionIndex === block.correctOption" />
      <XCircle v-else-if="answer === optionIndex" />
    </button>
    <div v-if="answer !== undefined" class="engine-test-explanation">
      <b>{{ answer === block.correctOption ? 'Верно' : 'Ошибка разобрана' }}</b>
      <p>{{ block.explanation }}</p>
      <button v-if="theoryAvailable" @click="emit('theory')"><BookOpen />Перейти к теории</button>
    </div>
  </section>
</template>
