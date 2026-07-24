<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useCoursesStore } from '@/stores/courses'
import LessonPlayer from '@/components/lesson/LessonPlayer.vue'
import { LoadingSkeleton, PageState } from '@/components/ui'

const route = useRoute()
const courses = useCoursesStore()
const lesson = computed(() => courses.lessonById(String(route.params.lessonId)))
const isAuthorPreview = computed(() => route.query.mode === 'author')
const visibleLesson = computed(() => (
  lesson.value && (lesson.value.status === 'published' || isAuthorPreview.value)
    ? lesson.value
    : undefined
))
onMounted(() => loadLesson())
async function loadLesson(force = false): Promise<void> { try { await courses.load(force) } catch {} }
</script>

<template>
  <LoadingSkeleton v-if="!courses.loaded || courses.loading" variant="preview" />
  <LessonPlayer v-else-if="visibleLesson" :lesson="visibleLesson" :author-preview="isAuthorPreview" />
  <PageState v-else-if="lesson && lesson.status !== 'published'" size="viewport" title="Урок находится в черновике" description="Он скрыт из предпросмотра курса. Откройте авторский предпросмотр из редактора урока." />
  <PageState v-else-if="courses.error" size="viewport" title="Не удалось загрузить урок" :description="courses.error" action-label="Повторить" retry @action="loadLesson(true)" />
  <PageState v-else size="viewport" title="Урок не найден" description="Возможно, он был удалён или ссылка больше не актуальна." />
</template>
