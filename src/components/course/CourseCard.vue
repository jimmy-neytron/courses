<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, Clock3, FileText, Play } from 'lucide-vue-next'
import CourseActionsMenu from '@/components/course/CourseActionsMenu.vue'
import CourseRoleBadge from '@/components/course/CourseRoleBadge.vue'
import { useRecentCourses } from '@/composables/useRecentCourses'
import type { Course } from '@/types/course'
import { formatDuration } from '@/utils/format-duration'

const props = withDefaults(defineProps<{ course: Course; actionable?: boolean }>(), { actionable: false })
const emit = defineEmits<{ delete: [course: Course]; share: [course: Course]; toggleStatus: [course: Course] }>()
const recent = useRecentCourses()
const lessons = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.length, 0))
const minutes = computed(() => props.course.modules.reduce((sum, module) => sum + module.lessons.reduce((value, lesson) => value + lesson.duration, 0), 0))
const duration = computed(() => formatDuration(minutes.value))
const href = computed(() => '/app/courses/' + props.course.id)
const canManage = computed(() => props.actionable && props.course.accessRole === 'creator')
const resume = computed(() => recent.forCourse(props.course.id))
const text = {
  draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
  author: '\u0410\u0432\u0442\u043e\u0440:',
  lessons: '\u0443\u0440\u043e\u043a\u043e\u0432',
  continueWork: '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0440\u0430\u0431\u043e\u0442\u0443',
  continueLearning: '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435',
}
const resumeLabel = computed(() => props.course.accessRole === 'creator' ? text.continueWork : text.continueLearning)
</script>

<template>
  <article :class="['course-card product-course-card', canManage && 'is-actionable']">
    <RouterLink :to="href" class="course-card-link">
      <div class="cover" :style="{ background: course.cover }">
        <span>{{ course.tag }}</span><ArrowUpRight />
      </div>
      <div class="course-body">
        <div class="row">
          <span :class="['product-status', course.status === text.draft && 'is-draft']">{{ course.status }}</span>
          <small>{{ course.updated }}</small>
        </div>
        <div class="course-card-access"><CourseRoleBadge :role="course.accessRole" :creator-name="course.creator.name" /><span v-if="course.accessRole === 'learner'">{{ text.author }} {{ course.creator.name }}</span></div>
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="course-meta">
          <span><FileText />{{ lessons }} {{ text.lessons }}</span>
          <span><Clock3 />{{ duration }}</span>
        </div>
      </div>
    </RouterLink>
    <RouterLink v-if="resume" :to="resume.path" class="course-card-resume"><Play />{{ resumeLabel }}<span>{{ resume.label }}</span></RouterLink>
    <div v-if="canManage" class="course-card-menu">
      <CourseActionsMenu compact :course="course" @share="emit('share', course)" @toggle-status="emit('toggleStatus', course)" @delete="emit('delete', course)" />
    </div>
  </article>
</template>
