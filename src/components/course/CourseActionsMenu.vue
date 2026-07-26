<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArchiveRestore, Eye, Link2, MoreHorizontal, Sparkles, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiDropdownMenu from '@/components/ui/UiDropdownMenu.vue'
import type { Component } from 'vue'
import type { AppDropdownMenuItem, AppDropdownMenuValue } from '@/components/ui/UiDropdownMenu.vue'
import type { Course } from '@/types/course'

const props = withDefaults(defineProps<{
  course: Course
  compact?: boolean
}>(), { compact: false })

const emit = defineEmits<{
  share: []
  toggleStatus: []
  delete: []
}>()

type CourseAction = 'preview' | 'share' | 'toggleStatus' | 'delete'

const open = ref(false)
const text = {
  preview: '\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440',
  share: '\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f',
  published: '\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d',
  returnToDraft: '\u0412\u0435\u0440\u043d\u0443\u0442\u044c \u0432 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
  publish: '\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c',
  deleteCourse: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u0443\u0440\u0441',
  actions: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043a\u0443\u0440\u0441\u0430',
}

const actionItems = computed<AppDropdownMenuItem<CourseAction>[]>(() => [
  { value: 'preview', label: text.preview, href: '/preview/courses/' + props.course.id },
  { value: 'share', label: text.share },
  { value: 'toggleStatus', label: props.course.status === text.published ? text.returnToDraft : text.publish },
  { value: 'delete', label: text.deleteCourse, danger: true },
])

function actionIcon(value: CourseAction): Component {
  if (value === 'preview') return Eye
  if (value === 'share') return Link2
  if (value === 'delete') return Trash2
  return props.course.status === text.published ? ArchiveRestore : Sparkles
}

function toggleMenu(): void {
  open.value = !open.value
}

function handleAction(value: AppDropdownMenuValue): void {
  open.value = false
  if (value === 'share') emit('share')
  else if (value === 'toggleStatus') emit('toggleStatus')
  else if (value === 'delete') emit('delete')
}
</script>

<template>
  <UiDropdownMenu v-model="open" :class="['course-actions-menu', compact && 'is-compact']" :items="actionItems" placement="bottom" @select="handleAction">
    <template #trigger>
      <UiButton severity="secondary" outlined rounded :aria-label="text.actions" :title="text.actions" @click.stop.prevent="toggleMenu"><MoreHorizontal /></UiButton>
    </template>
    <template #item="{ item }">
      <component :is="actionIcon(item.value as CourseAction)" />
      <span>{{ item.label }}</span>
    </template>
  </UiDropdownMenu>
</template>
