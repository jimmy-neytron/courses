<script setup lang="ts">
import { ArchiveRestore, BookOpen, Clock3, Eye, FileText, Link2, Play, Sparkles, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import CourseRoleBadge from '@/components/course/CourseRoleBadge.vue'
import type { Course } from '@/types/course'

defineProps<{ course: Course; moduleCount: number; lessonCount: number; totalMinutes: number }>()
defineEmits<{ toggleStatus: []; share: []; delete: [] }>()
</script>

<template>
  <section class="product-course-hero">
    <div class="product-course-cover" :style="{ background: course.cover }"><span>{{ course.tag }}</span><i /></div>
    <div class="product-course-copy">
      <div class="product-kicker"><CourseRoleBadge :role="course.accessRole" :creator-name="course.creator.name" /><span :class="['product-status', course.status === 'Черновик' && 'is-draft']">{{ course.status }}</span><span>Обновлено {{ course.updated }}</span></div>
      <h1>{{ course.title }}</h1><p>{{ course.description }}</p>
      <div class="product-course-meta"><span><BookOpen />{{ moduleCount }} модулей</span><span><FileText />{{ lessonCount }} уроков</span><span><Clock3 />{{ Math.round(totalMinutes / 60) }} ч программы</span></div>
    </div>
    <div v-if="course.accessRole === 'creator'" class="product-course-actions">
      <RouterLink :to="`/preview/courses/${course.id}`" class="product-button product-button--secondary"><Eye />Предпросмотр</RouterLink>
      <UiButton severity="secondary" outlined @click="$emit('share')"><Link2 />Поделиться</UiButton>
      <UiButton :severity="course.status === 'Опубликован' ? 'secondary' : undefined" :outlined="course.status === 'Опубликован'" @click="$emit('toggleStatus')"><ArchiveRestore v-if="course.status === 'Опубликован'" /><Sparkles v-else />{{ course.status === 'Опубликован' ? 'Вернуть в черновик' : 'Опубликовать' }}</UiButton>
      <UiButton severity="danger" outlined @click="$emit('delete')"><Trash2 />Удалить курс</UiButton>
    </div>
    <div v-else class="product-course-actions"><RouterLink :to="`/preview/courses/${course.id}`" class="product-button"><Play />Продолжить обучение</RouterLink></div>
  </section>
</template>