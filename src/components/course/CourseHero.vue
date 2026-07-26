<script setup lang="ts">
import { BookOpen, Clock3, FileText, Play } from 'lucide-vue-next'
import CourseActionsMenu from '@/components/course/CourseActionsMenu.vue'
import CourseRoleBadge from '@/components/course/CourseRoleBadge.vue'
import type { Course } from '@/types/course'

const props = defineProps<{ course: Course; moduleCount: number; lessonCount: number; totalMinutes: number }>()
defineEmits<{ toggleStatus: []; share: []; delete: [] }>()

const text = {
  draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
  updated: '\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e',
  modules: '\u043c\u043e\u0434\u0443\u043b\u0435\u0439',
  lessons: '\u0443\u0440\u043e\u043a\u043e\u0432',
  hoursProgram: '\u0447 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b',
  continueLearning: '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435',
}
</script>

<template>
  <section class="product-course-hero">
    <div class="product-course-cover" :style="{ background: props.course.cover }"><span>{{ props.course.tag }}</span><i /></div>
    <div class="product-course-copy">
      <div class="product-kicker"><CourseRoleBadge :role="props.course.accessRole" :creator-name="props.course.creator.name" /><span :class="['product-status', props.course.status === text.draft && 'is-draft']">{{ props.course.status }}</span><span>{{ text.updated }} {{ props.course.updated }}</span></div>
      <h1>{{ props.course.title }}</h1><p>{{ props.course.description }}</p>
      <div class="product-course-meta"><span><BookOpen />{{ moduleCount }} {{ text.modules }}</span><span><FileText />{{ lessonCount }} {{ text.lessons }}</span><span><Clock3 />{{ Math.round(totalMinutes / 60) }} {{ text.hoursProgram }}</span></div>
    </div>
    <div v-if="props.course.accessRole === 'creator'" class="product-course-actions is-menu-only">
      <CourseActionsMenu :course="props.course" @share="$emit('share')" @toggle-status="$emit('toggleStatus')" @delete="$emit('delete')" />
    </div>
    <div v-else class="product-course-actions"><RouterLink :to="'/preview/courses/' + props.course.id" class="product-button"><Play />{{ text.continueLearning }}</RouterLink></div>
  </section>
</template>
