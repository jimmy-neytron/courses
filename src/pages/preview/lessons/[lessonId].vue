<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, BookOpen } from 'lucide-vue-next'
import { useCourseStore } from '@/stores/courses'
import LessonPlayer from '@/components/lesson/LessonPlayer.vue'
const route=useRoute(),store=useCourseStore(),ready=ref(false)
const found=computed(()=>store.findLesson(String(route.params.lessonId)))
onMounted(async()=>{await store.hydrate();ready.value=true})
</script>
<template>
  <section v-if="!ready" class="engine-loading"><span></span><h2>Загружаем урок…</h2></section>
  <div v-else-if="found" class="engine-single-preview"><header class="engine-single-topbar"><RouterLink :to="`/preview/courses/${found.course.id}`"><ArrowLeft />К программе курса</RouterLink><div><b>Режим ученика</b><small>{{ found.course.title }}</small></div></header><LessonPlayer :lesson="found.lesson" /></div>
  <section v-else class="empty-state"><BookOpen /><h2>Урок не найден</h2><p v-if="store.loadError">{{ store.loadError }}</p><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
</template>