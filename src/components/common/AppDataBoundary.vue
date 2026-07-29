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
  if (courseId) return store.isCourseLoaded(courseId)
  return store.hydrated
}

const ready = ref(hasRouteData(String(route.params.courseId ?? ''), String(route.params.lessonId ?? '')))

watch(
  () => [String(route.params.courseId ?? ''), String(route.params.lessonId ?? ''), auth.user?.id ?? ''] as const,
  async ([courseId, lessonId]) => {
    if (!hasRouteData(courseId, lessonId)) ready.value = false
    try {
      const routeRequest = courseId
        ? store.loadAccessibleCourse(courseId)
        : lessonId
          ? store.loadAccessibleLesson(lessonId)
          : Promise.resolve()

      await Promise.all([
        store.hydrate(),
        routeRequest,
      ])
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
