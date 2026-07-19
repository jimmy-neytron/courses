<script setup lang="ts">
import { toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2 } from 'lucide-vue-next'
import LessonBlockContent from '@/components/lesson/LessonBlockContent.vue'
import LessonQuizQuestion from '@/components/lesson/LessonQuizQuestion.vue'
import LessonSectionNav from '@/components/lesson/LessonSectionNav.vue'
import { lessonSectionIcons } from '@/components/lesson/lessonSectionIcons'
import { useLessonPlayer } from '@/composables/useLessonPlayer'
import type { Lesson } from '@/types/course'

const props = defineProps<{ lesson: Lesson }>()
const {
  activeSectionId,
  answers,
  completedSections,
  sections,
  currentSection,
  currentQuestions,
  questions,
  answeredCount,
  correctCount,
  courseTitle,
  previousLesson,
  nextLesson,
  canFinish,
  isCompleted,
  markSection,
  answerQuestion,
  questionNumber,
  finishLesson,
} = useLessonPlayer(toRef(props, 'lesson'))
</script>

<template>
  <div class="engine-player">
    <header class="engine-lesson-header">
      <div>
        <p class="eyebrow">{{ courseTitle }} · {{ lesson.duration }} минут</p>
        <h1>{{ lesson.title }}</h1>
        <p>{{ sections.length }} разделов · {{ questions.length }} вопросов</p>
      </div>
      <span v-if="isCompleted" class="engine-complete"><CheckCircle2 />Урок завершён</span>
    </header>

    <LessonSectionNav
      v-if="sections.length"
      :sections="sections"
      :active-id="activeSectionId"
      :completed-ids="completedSections"
      @select="activeSectionId = $event"
    />

    <main v-if="currentSection" class="engine-lesson-body">
      <div class="engine-section-title">
        <component :is="lessonSectionIcons[currentSection.id]" />
        <div><small>Раздел урока</small><h2>{{ currentSection.label }}</h2></div>
        <span>{{ currentSection.blocks.length }} блоков</span>
      </div>

      <template v-for="block in currentSection.blocks" :key="block.id">
        <LessonQuizQuestion
          v-if="block.type === 'single_choice'"
          :block="block"
          :number="questionNumber(block)"
          :answer="answers[block.id]"
          :theory-available="sections.some((section) => section.id === 'theory')"
          @answer="answerQuestion(block, $event, currentSection.id)"
          @theory="activeSectionId = 'theory'"
        />
        <LessonBlockContent v-else :block="block" @complete="markSection(currentSection.id)" />
      </template>

      <div v-if="currentQuestions.length && answeredCount" class="engine-test-result">
        <span>Результат</span>
        <strong>{{ correctCount }} из {{ questions.length }}</strong>
        <p v-if="answeredCount < questions.length">Осталось ответить: {{ questions.length - answeredCount }}</p>
        <p v-else>{{ correctCount === questions.length ? 'Все ответы верны' : 'Изучите объяснения и попробуйте ещё раз' }}</p>
      </div>
      <button v-if="!currentQuestions.length" class="engine-section-complete" @click="markSection(currentSection.id)">
        <Check />{{ completedSections.includes(currentSection.id) ? 'Раздел изучен' : 'Я изучил этот раздел' }}
      </button>
    </main>

    <section v-else class="product-empty compact">
      <BookOpen />
      <h3>В уроке пока нет доступных разделов</h3>
      <p>Автор может включить разделы и добавить материалы в редакторе.</p>
    </section>

    <footer class="engine-lesson-footer">
      <RouterLink v-if="previousLesson" :to="`/preview/lessons/${previousLesson.id}`"><ArrowLeft />{{ previousLesson.title }}</RouterLink>
      <span v-else />
      <button :disabled="!canFinish" @click="finishLesson"><CheckCircle2 />Завершить урок</button>
      <RouterLink v-if="nextLesson" :to="`/preview/lessons/${nextLesson.id}`">Следующий урок<ArrowRight /></RouterLink>
      <span v-else />
    </footer>
  </div>
</template>
