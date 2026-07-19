<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, BookOpen, Clock3, Trash2 } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import type { Course } from '@/types/course'

const props = withDefaults(defineProps<{ course: Course; deletable?: boolean }>(), { deletable: false })
const emit = defineEmits<{ delete: [course: Course] }>()
const lessons = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.length, 0))
const minutes = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.reduce((value, lesson) => value + lesson.duration, 0), 0))
</script>

<template>
  <article :class="['course-card product-course-card', deletable && 'is-deletable']">
    <RouterLink :to="`/app/courses/${course.id}`" class="course-card-link">
      <div class="cover" :style="{ background: course.cover }">
        <span>{{ course.tag }}</span><ArrowUpRight />
      </div>
      <div class="course-body">
        <div class="row">
          <span :class="['product-status', course.status === 'Черновик' && 'is-draft']">{{ course.status }}</span>
          <small>{{ course.updated }}</small>
        </div>
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="course-meta">
          <span><BookOpen />{{ lessons }} уроков</span>
          <span><Clock3 />{{ Math.round(minutes / 60) }} ч</span>
        </div>
      </div>
    </RouterLink>
    <PrimeButton v-if="deletable" severity="danger" text rounded class="course-card-delete" :aria-label="`Удалить курс ${course.title}`" @click="emit('delete', course)">
      <Trash2 />
    </PrimeButton>
  </article>
</template>
