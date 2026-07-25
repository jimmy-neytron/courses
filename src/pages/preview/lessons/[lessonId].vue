<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BookOpen } from 'lucide-vue-next'
import { useCourseStore } from '@/stores/courses'
import LessonPlayer from '@/components/lesson/player/LessonPlayer.vue'
import AppBreadcrumbs from '@/components/app/AppBreadcrumbs.vue'
import FullscreenLayout from '@/layouts/fullscreen.vue'
const route = useRoute()
const store = useCourseStore()
const found = computed(() => store.findLesson(String(route.params.lessonId)))
</script>
<template>
  <FullscreenLayout>
    <div v-if="found" class="engine-single-preview"><header class="engine-single-topbar"><AppBreadcrumbs :items="[{ label: 'Курсы', to: '/app/courses' }, { label: found.course.title, to: `/preview/courses/${found.course.id}` }, { label: found.lesson.title }]" /><div><b>Режим прохождения</b><small>{{ found.course.title }}</small></div></header><LessonPlayer :lesson="found.lesson" /></div>
    <section v-else class="empty-state"><BookOpen /><h2>Урок не найден</h2><p v-if="store.loadError">{{ store.loadError }}</p><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
  </FullscreenLayout>
</template>