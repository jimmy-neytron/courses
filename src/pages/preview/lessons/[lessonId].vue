<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShieldX } from 'lucide-vue-next'
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
    <main v-else class="engine-course-unavailable"><section><span><ShieldX /></span><small>Просмотр урока</small><h1>Урок пока недоступен</h1><p>Автор ещё не опубликовал урок или ссылка больше не действует.</p><div><RouterLink to="/auth" class="product-button">Войти</RouterLink><RouterLink to="/" class="product-button product-button--secondary">На главную</RouterLink></div></section></main>
  </FullscreenLayout>
</template>