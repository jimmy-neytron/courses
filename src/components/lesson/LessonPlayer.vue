<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  ListChecks,
  Sparkles,
} from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import LessonBlockRenderer from '@/components/lesson/LessonBlockRenderer.vue'
import LessonSectionNav from '@/components/lesson/player/LessonSectionNav.vue'
import {
  useLessonPreview,
  type LessonPreviewSectionId,
} from '@/composables/useLessonPreview'
import type { Lesson } from '@/types/course'

const props = withDefaults(defineProps<{
  lesson: Lesson
  authorPreview?: boolean
}>(), {
  authorPreview: false,
})

const {
  activeSectionId,
  canFinish,
  completedSections,
  currentSection,
  finishing,
  nextLesson,
  previousLesson,
  progressPercent,
  sections,
  finishLesson,
  markSection,
  selectSection,
} = useLessonPreview(() => props.lesson, () => props.authorPreview)

const sectionIcon = computed(() => {
  const icons = {
    theory: BookOpen,
    listening: Headphones,
    practice: Sparkles,
    test: ListChecks,
  }
  return icons[currentSection.value?.id ?? 'theory']
})

const currentSectionCompleted = computed(() => (
  currentSection.value
    ? completedSections.value.includes(currentSection.value.id)
    : false
))

function completeCurrentSection(): void {
  if (!currentSection.value) return
  markSection(currentSection.value.id)
}

function completeBlock(): void {
  completeCurrentSection()
}

function lessonRoute(lessonId: string): RouteLocationRaw {
  return {
    name: 'lesson-preview',
    params: { lessonId },
    query: props.authorPreview ? { mode: 'author' } : undefined,
  }
}

function sectionLabel(sectionId: LessonPreviewSectionId): string {
  return sections.value.find((section) => section.id === sectionId)?.label ?? sectionId
}
</script>

<template>
  <article class="engine-player">
    <header class="engine-lesson-header">
      <div>
        <span class="eyebrow">Урок · {{ lesson.durationMinutes }} мин</span>
        <h1>{{ lesson.title }}</h1>
        <p>{{ lesson.description || 'Описание урока пока не заполнено.' }}</p>
      </div>

      <UiBadge
        v-if="lesson.isCompleted"
        class="engine-complete"
        tone="success"
        variant="soft"
      >
        <CheckCircle2 :size="15" />
        Урок пройден
      </UiBadge>
      <div v-else class="engine-progress-status">
        <span>{{ progressPercent }}%</span>
        <small>пройдено</small>
      </div>
    </header>

    <section v-if="lesson.objectives.length" class="engine-objectives">
      <small>После урока вы сможете</small>
      <ul>
        <li v-for="objective in lesson.objectives" :key="objective">
          <Check :size="14" />
          {{ objective }}
        </li>
      </ul>
    </section>

    <LessonSectionNav
      v-if="sections.length > 1"
      :sections="sections"
      :active-id="activeSectionId"
      :completed-ids="completedSections"
      @select="selectSection"
    />

    <div v-if="currentSection" class="engine-lesson-body">
      <header class="engine-section-title">
        <component :is="sectionIcon" :size="18" />
        <div>
          <small>{{ currentSection.eyebrow }}</small>
          <h2>{{ currentSection.label }}</h2>
        </div>
        <span>{{ currentSection.blocks.length }} блоков</span>
      </header>

      <LessonBlockRenderer
        v-for="block in currentSection.blocks"
        :key="block.id"
        :block="block"
        @completed="completeBlock"
      />

      <UiButton
        class="engine-section-complete"
        :variant="currentSectionCompleted ? 'secondary' : undefined"
        size="sm"
        @click="completeCurrentSection"
      >
        <template #leading><Check :size="15" /></template>
        {{ currentSectionCompleted ? `${sectionLabel(currentSection.id)} пройден` : 'Отметить раздел пройденным' }}
      </UiButton>
    </div>

    <UiCard v-else variant="outline" padding="lg">
      В уроке пока нет блоков.
    </UiCard>

    <footer class="engine-lesson-footer">
      <RouterLink v-if="previousLesson" :to="lessonRoute(previousLesson.id)">
        <UiButton variant="ghost" size="sm">
          <template #leading><ArrowLeft :size="15" /></template>
          {{ previousLesson.title }}
        </UiButton>
      </RouterLink>
      <span v-else />

      <UiButton
        :disabled="!canFinish || finishing"
        :loading="finishing"
        size="sm"
        @click="finishLesson"
      >
        <template #leading><CheckCircle2 :size="15" /></template>
        {{ lesson.isCompleted ? 'Урок пройден' : 'Завершить урок' }}
      </UiButton>

      <RouterLink v-if="nextLesson" :to="lessonRoute(nextLesson.id)">
        <UiButton variant="ghost" size="sm">
          {{ nextLesson.title }}
          <template #trailing><ArrowRight :size="15" /></template>
        </UiButton>
      </RouterLink>
      <span v-else class="engine-course-end">
        <Clock3 :size="14" /> Последний урок курса
      </span>
    </footer>
  </article>
</template>

<style scoped src="./lesson-player.css"></style>
