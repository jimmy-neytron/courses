<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Check, ChevronDown, Clock3, GraduationCap, Play, X } from 'lucide-vue-next'
import { useCourseStore } from '@/stores/courses'
import { useLearningProgress } from '@/composables/useLearningProgress'
import { useRecentCourses } from '@/composables/useRecentCourses'
import LessonPlayer from '@/components/lesson/LessonPlayer.vue'
import FullscreenLayout from '@/layouts/fullscreen.vue'

const route = useRoute()
const router = useRouter()
const store = useCourseStore()
const progress = useLearningProgress()
const recent = useRecentCourses()
const selectedId = ref(String(route.query.lesson ?? ''))
const course = computed(() => store.findCourse(String(route.params.courseId)))
const lessons = computed(() => course.value?.modules.flatMap((module) => module.lessons) ?? [])
const nextLesson = computed(() => lessons.value.find((lesson) => !progress.isCompleted(lesson.id)) ?? lessons.value.at(-1))
const selected = computed(() => lessons.value.find((lesson) => lesson.id === selectedId.value) ?? nextLesson.value ?? lessons.value[0])
const completedCount = computed(() => lessons.value.filter((lesson) => progress.isCompleted(lesson.id)).length)

watch([course, selected], ([currentCourse, lesson]) => {
  if (!currentCourse || !lesson) return
  recent.record({
    courseId: currentCourse.id,
    lessonId: lesson.id,
    path: `/preview/courses/${currentCourse.id}?lesson=${lesson.id}`,
    label: lesson.title,
  })
}, { immediate: true })

function select(id: string): void {
  selectedId.value = id
  void router.replace({ query: { ...route.query, lesson: id } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <FullscreenLayout>
    <div v-if="course" class="engine-course-shell">
      <aside class="engine-course-sidebar">
        <div class="engine-course-brand"><span><GraduationCap /></span><div><small>Учебная программа</small><strong>{{ course.title }}</strong></div></div>
        <section class="engine-course-summary"><span>{{ course.tag }}</span><div><b>{{ completedCount }} из {{ lessons.length }} уроков</b><small>{{ nextLesson ? `Продолжить: ${nextLesson.title}` : 'Программа завершена' }}</small></div></section>
        <nav><section v-for="module in course.modules" :key="module.id" class="engine-phase"><header><ChevronDown /><div><strong>{{ module.title }}</strong><small>{{ module.lessons.length }} уроков</small></div></header><button v-for="lesson in module.lessons" :key="lesson.id" :class="{ active: selected?.id === lesson.id, completed: progress.isCompleted(lesson.id) }" @click="select(lesson.id)"><span><Check v-if="progress.isCompleted(lesson.id)" /><Play v-else /></span><div><b>{{ lesson.title }}</b><small><Clock3 />{{ lesson.duration }} мин · {{ lesson.blocks.length }} материалов</small></div></button></section></nav>
      </aside>
      <main class="engine-course-main"><header class="engine-course-topbar"><div><BookOpen /><span><small>Курс</small><b>{{ course.title }}</b></span></div><RouterLink :to="`/app/courses/${course.id}`" class="icon-button" aria-label="Закрыть курс"><X /></RouterLink></header><LessonPlayer v-if="selected" :lesson="selected" /><section v-else class="product-empty full"><BookOpen /><h2>В курсе пока нет уроков</h2></section></main>
    </div>
    <section v-else class="empty-state"><h2>Курс не найден</h2><p v-if="store.loadError">{{ store.loadError }}</p><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
  </FullscreenLayout>
</template>