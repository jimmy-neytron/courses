<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, BookOpen, Clock3, Layers3 } from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import { courseStatusLabel } from '@/constants/course-labels'
import type { Course } from '@/types/course'
import { pluralize } from '@/utils/text'

const props = defineProps<{ course: Course }>()
const router = useRouter()
const lessonCount = computed(() => props.course.modules.reduce(
  (total, module) => total + module.lessons.length,
  0,
))
const completedLessonCount = computed(() => props.course.modules.reduce(
  (total, module) => total + module.lessons.filter((lesson) => lesson.isCompleted).length,
  0,
))
const progressPercent = computed(() => lessonCount.value
  ? Math.round((completedLessonCount.value / lessonCount.value) * 100)
  : 0)
</script>

<template>
  <UiCard
    class="course-card"
    variant="outline"
    padding="lg"
    :style="{ '--course-card-accent': course.accentColor }"
  >
    <div class="course-card__glow" aria-hidden="true" />
    <div class="course-card__topline">
      <div class="course-card__mark"><BookOpen :size="21" /></div>
      <UiBadge :tone="course.status === 'published' ? 'success' : 'warning'" variant="soft">
        {{ courseStatusLabel(course.status) }}
      </UiBadge>
      <span class="course-card__language">{{ course.languageCode === 'und' ? 'Общий' : course.languageCode.toUpperCase() }}</span>
    </div>

    <div class="course-card__body">
      <h2>{{ course.title }}</h2>
      <p>{{ course.description || 'Описание курса пока не заполнено.' }}</p>
    </div>

    <div class="course-card__meta">
      <span><Layers3 :size="16" /><strong>{{ course.modules.length }}</strong>{{ pluralize(course.modules.length, ['модуль', 'модуля', 'модулей']) }}</span>
      <span><BookOpen :size="16" /><strong>{{ lessonCount }}</strong>{{ pluralize(lessonCount, ['урок', 'урока', 'уроков']) }}</span>
      <span><Clock3 :size="16" /><strong>{{ course.defaultLessonDuration }}</strong>мин</span>
    </div>

    <div class="course-card__progress">
      <span>{{ completedLessonCount }} из {{ lessonCount }} пройдено</span>
      <strong>{{ progressPercent }}%</strong>
      <div><i :style="{ width: `${progressPercent}%` }" /></div>
    </div>

    <UiButton class="course-card__action" block @click="router.push({ name: 'course-details', params: { courseId: course.id } })">
      Открыть курс
      <template #trailing><ArrowRight :size="17" /></template>
    </UiButton>
  </UiCard>
</template>

<style scoped src="./course-card.css"></style>
