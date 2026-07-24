<script setup lang="ts">
import { ArrowDown, ArrowUp, BookOpen, Circle, CircleCheckBig, Plus, Trash2 } from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import { lessonStatusLabel } from '@/constants/course-labels'
import type { CourseModule } from '@/types/course'

const props = defineProps<{
  module: CourseModule
  moduleIndex: number
  moduleCount: number
}>()

const emit = defineEmits<{
  moveModule: [direction: -1 | 1]
  deleteModule: []
  addLesson: []
  moveLesson: [lessonId: string, direction: -1 | 1]
  deleteLesson: [lessonId: string, title: string]
  toggleLessonComplete: [lessonId: string, isCompleted: boolean]
}>()
</script>

<template>
  <UiCard class="module-card" variant="outline" padding="lg">
    <header class="module-card__header">
      <div class="module-card__number">{{ String(moduleIndex + 1).padStart(2, '0') }}</div>
      <div class="module-card__copy">
        <h3>{{ module.title }}</h3>
        <p>{{ module.description || 'Описание модуля не заполнено.' }}</p>
      </div>
      <div class="module-card__actions">
        <UiButton variant="ghost" size="sm" :disabled="moduleIndex === 0" aria-label="Переместить модуль вверх" @click="emit('moveModule', -1)"><ArrowUp :size="16" /></UiButton>
        <UiButton variant="ghost" size="sm" :disabled="moduleIndex === moduleCount - 1" aria-label="Переместить модуль вниз" @click="emit('moveModule', 1)"><ArrowDown :size="16" /></UiButton>
        <UiButton variant="ghost" size="sm" aria-label="Удалить модуль" @click="emit('deleteModule')"><Trash2 :size="16" /></UiButton>
      </div>
    </header>

    <div v-if="module.lessons.length" class="lesson-list">
      <div v-for="(lesson, lessonIndex) in module.lessons" :key="lesson.id" :class="['lesson-row', { 'is-completed': lesson.isCompleted }]">
        <div class="lesson-row__index">{{ lessonIndex + 1 }}</div>
        <div class="lesson-row__copy">
          <RouterLink :to="{ name: 'lesson-editor', params: { lessonId: lesson.id } }">{{ lesson.title }}</RouterLink>
          <span>{{ lesson.durationMinutes }} мин · {{ lesson.blocks.length }} блоков</span>
        </div>
        <div class="lesson-row__state">
          <UiButton
            :variant="lesson.isCompleted ? 'secondary' : 'ghost'"
            size="sm"
            :aria-label="lesson.isCompleted ? 'Отметить урок как непройденный' : 'Отметить урок как пройденный'"
            @click="emit('toggleLessonComplete', lesson.id, !lesson.isCompleted)"
          >
            <template #leading>
              <CircleCheckBig v-if="lesson.isCompleted" :size="15" />
              <Circle v-else :size="15" />
            </template>
            {{ lesson.isCompleted ? 'Пройден' : 'Не пройден' }}
          </UiButton>
          <UiBadge :tone="lesson.status === 'published' ? 'success' : 'warning'" variant="soft">
            {{ lessonStatusLabel(lesson.status) }}
          </UiBadge>
        </div>
        <div class="lesson-row__actions">
          <UiButton variant="ghost" size="sm" :disabled="lessonIndex === 0" aria-label="Переместить урок вверх" @click="emit('moveLesson', lesson.id, -1)"><ArrowUp :size="15" /></UiButton>
          <UiButton variant="ghost" size="sm" :disabled="lessonIndex === module.lessons.length - 1" aria-label="Переместить урок вниз" @click="emit('moveLesson', lesson.id, 1)"><ArrowDown :size="15" /></UiButton>
          <UiButton variant="ghost" size="sm" aria-label="Удалить урок" @click="emit('deleteLesson', lesson.id, lesson.title)"><Trash2 :size="15" /></UiButton>
        </div>
      </div>
    </div>
    <div v-else class="module-card__empty"><BookOpen :size="18" />В модуле пока нет уроков.</div>

    <UiButton variant="secondary" size="sm" @click="emit('addLesson')">
      <template #leading><Plus :size="16" /></template>
      Добавить урок
    </UiButton>
  </UiCard>
</template>

<style scoped src="./curriculum-module-card.css"></style>
