<script setup lang="ts">
import { computed } from 'vue'
import { GraduationCap, UserRoundPen } from 'lucide-vue-next'
import type { CourseAccessRole } from '@/types/course'

const props = defineProps<{ role: CourseAccessRole; creatorName?: string }>()
const label = computed(() => props.role === 'creator' ? 'Вы автор' : 'Вы проходите')
const hint = computed(() => props.role === 'creator'
  ? 'Вы создали этот курс и можете его редактировать'
  : `Автор курса: ${props.creatorName || 'не указан'}`)
</script>

<template>
  <span :class="['course-role-badge', `is-${role}`]" :title="hint">
    <UserRoundPen v-if="role === 'creator'" />
    <GraduationCap v-else />
    {{ label }}
  </span>
</template>
