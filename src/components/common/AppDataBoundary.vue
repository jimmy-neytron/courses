<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageLoader from '@/components/loading/PageLoader.vue'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/courses'

withDefaults(defineProps<{ label?: string; fullscreen?: boolean }>(), { label: 'Открываем страницу', fullscreen: false })
const route = useRoute()
const auth = useAuthStore()
const store = useCourseStore()

function hasRouteData(courseId: string, lessonId: string): boolean {
  if (lessonId) return Boolean(store.findLesson(lessonId))
  if (courseId) return Boolean(store.findCourse(courseId))
  return store.hydrated
}

const ready = ref(hasRouteData(String(route.params.courseId ?? ''), String(route.params.lessonId ?? '')))

watch(
  () => [String(route.params.courseId ?? ''), String(route.params.lessonId ?? ''), auth.user?.id ?? ''] as const,
  async ([courseId, lessonId]) => {
    if (!hasRouteData(courseId, lessonId)) ready.value = false
    try {
      await store.hydrate()
      if (courseId) await store.loadAccessibleCourse(courseId)
      if (lessonId) await store.loadAccessibleLesson(lessonId)
    } finally {
      ready.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <PageLoader v-if="!ready" :label="label" :fullscreen="fullscreen" />
  <template v-else><slot /></template>
</template>