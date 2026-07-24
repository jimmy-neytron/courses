<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, BookOpen, Clock3 } from 'lucide-vue-next'
import { UiBadge } from '@neytron/compact-ui/badge'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import { useCoursesStore } from '@/stores/courses'
import { pluralize } from '@/utils/text'
import { EyebrowText, LoadingSkeleton, PageState } from '@/components/ui'

const route = useRoute()
const courses = useCoursesStore()
const course = computed(() => courses.courseById(String(route.params.courseId)))
const publishedModules = computed(() => (course.value?.modules ?? [])
  .map((module) => ({
    ...module,
    lessons: module.lessons.filter((lesson) => lesson.status === 'published'),
  }))
  .filter((module) => module.lessons.length > 0))
const publishedLessonCount = computed(() => publishedModules.value.reduce(
  (total, module) => total + module.lessons.length,
  0,
))
onMounted(() => loadCourse())
async function loadCourse(force = false): Promise<void> { try { await courses.load(force) } catch {} }
</script>

<template>
  <LoadingSkeleton v-if="!courses.loaded || courses.loading" variant="preview" />
  <article v-else-if="course" :style="{ '--course-accent': course.accentColor }">
    <header class="course-preview__hero"><UiBadge tone="success" variant="soft">Предпросмотр автора</UiBadge><h1>{{ course.title }}</h1><p>{{ course.description || 'Описание курса не заполнено.' }}</p><div class="course-preview__meta"><span><BookOpen :size="17" />{{ publishedModules.length }} {{ pluralize(publishedModules.length, ['модуль', 'модуля', 'модулей']) }}</span><span><Clock3 :size="17" />{{ course.defaultLessonDuration }} мин на урок</span><span><BookOpen :size="17" />{{ publishedLessonCount }} {{ pluralize(publishedLessonCount, ['урок', 'урока', 'уроков']) }}</span></div></header>
    <section v-if="publishedModules.length" class="course-preview__program">
      <UiCard v-for="(module, moduleIndex) in publishedModules" :key="module.id" variant="outline" padding="lg"><EyebrowText>Модуль {{ moduleIndex + 1 }}</EyebrowText><h2>{{ module.title }}</h2><p>{{ module.description }}</p><div class="preview-lesson-list"><RouterLink v-for="lesson in module.lessons" :key="lesson.id" :to="{ name: 'lesson-preview', params: { lessonId: lesson.id } }"><span><strong>{{ lesson.title }}</strong><small>{{ lesson.durationMinutes }} мин · {{ lesson.blocks.length }} блоков</small></span><UiButton variant="ghost" size="sm" aria-label="Открыть урок"><ArrowRight :size="17" /></UiButton></RouterLink></div></UiCard>
    </section>
    <PageState v-else title="Нет опубликованных уроков" description="Опубликуйте хотя бы один урок — после этого он появится в программе курса." />
  </article>
  <PageState v-else-if="courses.error" size="viewport" title="Не удалось загрузить курс" :description="courses.error" action-label="Повторить" retry @action="loadCourse(true)" />
  <PageState v-else size="viewport" title="Курс не найден" description="Возможно, он был удалён или ссылка больше не актуальна." />
</template>

<style scoped src="./course-preview-page.css"></style>
