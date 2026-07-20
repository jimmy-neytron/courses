<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import CommandPalette from '@/components/CommandPalette.vue'
import RouteProgress from '@/components/loading/RouteProgress.vue'
import { useRecentCourses } from '@/composables/useRecentCourses'
import { useCourseStore } from '@/stores/courses'

const route = useRoute()
const store = useCourseStore()
const recent = useRecentCourses()

watch([() => route.fullPath, () => store.courses.length], () => {
  const lessonId = String(route.params.lessonId ?? '')
  if (lessonId) {
    const found = store.findLesson(lessonId)
    if (found) {
      recent.record({
        courseId: found.course.id,
        lessonId,
        path: route.fullPath,
        label: found.lesson.title,
      })
    }
    return
  }

  const courseId = String(route.params.courseId ?? '')
  if (courseId && route.path.startsWith('/app/courses/') && !recent.forCourse(courseId)) {
    const course = store.findCourse(courseId)
    if (course) recent.record({ courseId, path: route.fullPath, label: course.title })
  }
}, { immediate: true })
</script>

<template>
  <RouteProgress />
  <RouterView />
  <CommandPalette />
</template>