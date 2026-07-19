<script setup lang="ts">
import { BookOpen, Clock3, Eye, FileText, Play, Sparkles, Trash2, UsersRound } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import CourseRoleBadge from '@/components/course/CourseRoleBadge.vue'
import type { Course } from '@/types/course'

defineProps<{ course: Course; moduleCount: number; lessonCount: number; totalMinutes: number }>()
defineEmits<{ publish: []; delete: []; invite: [] }>()
</script>

<template>
  <section class="product-course-hero">
    <div class="product-course-cover" :style="{ background: course.cover }"><span>{{ course.tag }}</span><i /></div>
    <div class="product-course-copy">
      <div class="product-kicker">
        <CourseRoleBadge :role="course.accessRole" :creator-name="course.creator.name" />
        <span :class="['product-status', course.status === 'Черновик' && 'is-draft']">{{ course.status }}</span>
        <span>Обновлено {{ course.updated }}</span>
      </div>
      <h1>{{ course.title }}</h1>
      <p>{{ course.description }}</p>
      <div class="product-course-meta">
        <span><BookOpen />{{ moduleCount }} модулей</span>
        <span><FileText />{{ lessonCount }} уроков</span>
        <span><Clock3 />{{ Math.round(totalMinutes / 60) }} ч программы</span>
      </div>
    </div>
    <div v-if="course.accessRole === 'creator'" class="product-course-actions">
      <RouterLink :to="`/preview/courses/${course.id}`" class="product-button product-button--secondary"><Eye />Предпросмотр</RouterLink>
      <PrimeButton severity="secondary" outlined @click="$emit('invite')"><UsersRound />Пригласить</PrimeButton>
      <PrimeButton :disabled="course.status === 'Опубликован'" @click="$emit('publish')"><Sparkles />{{ course.status === 'Опубликован' ? 'Опубликовано' : 'Опубликовать' }}</PrimeButton>
      <PrimeButton severity="danger" outlined @click="$emit('delete')"><Trash2 />Удалить курс</PrimeButton>
    </div>
    <div v-else class="product-course-actions">
      <RouterLink :to="`/preview/courses/${course.id}`" class="product-button"><Play />Продолжить обучение</RouterLink>
    </div>
  </section>
</template>
