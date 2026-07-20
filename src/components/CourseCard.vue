<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, BookOpen, Clock3, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import CourseRoleBadge from '@/components/course/CourseRoleBadge.vue'
import type { Course } from '@/types/course'

const props = withDefaults(defineProps<{ course: Course; deletable?: boolean }>(), { deletable: false })
const emit = defineEmits<{ delete: [course: Course] }>()
const lessons = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.length, 0))
const minutes = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.reduce((value, lesson) => value + lesson.duration, 0), 0))
const href = computed(() => props.course.accessRole === 'creator'
  ? `/app/courses/${props.course.id}`
  : `/preview/courses/${props.course.id}`)
const canDelete = computed(() => props.deletable && props.course.accessRole === 'creator')
</script>

<template>
  <article :class="['course-card product-course-card', canDelete && 'is-deletable']">
    <RouterLink :to="href" class="course-card-link">
      <div class="cover" :style="{ background: course.cover }">
        <span>{{ course.tag }}</span><ArrowUpRight />
      </div>
      <div class="course-body">
        <div class="row">
          <span :class="['product-status', course.status === 'Черновик' && 'is-draft']">{{ course.status }}</span>
          <small>{{ course.updated }}</small>
        </div>
        <div class="course-card-access"><CourseRoleBadge :role="course.accessRole" :creator-name="course.creator.name" /><span v-if="course.accessRole === 'learner'">Автор: {{ course.creator.name }}</span></div>
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="course-meta">
          <span><BookOpen />{{ lessons }} уроков</span>
          <span><Clock3 />{{ Math.round(minutes / 60) }} ч</span>
        </div>
      </div>
    </RouterLink>
    <UiButton v-if="canDelete" severity="danger" text rounded class="course-card-delete" :aria-label="`Удалить курс ${course.title}`" @click="emit('delete', course)">
      <Trash2 />
    </UiButton>
  </article>
</template>
