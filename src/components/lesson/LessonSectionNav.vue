<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { lessonSectionIcons } from '@/components/lesson/lessonSectionIcons'
import type { LessonPlayerSection } from '@/composables/useLessonPlayer'
import type { LessonSectionId } from '@/types/course'

defineProps<{
  sections: LessonPlayerSection[]
  activeId: LessonSectionId
  completedIds: string[]
}>()

const emit = defineEmits<{ select: [sectionId: LessonSectionId] }>()

</script>

<template>
  <nav class="engine-section-nav" aria-label="Разделы урока">
    <button
      v-for="section in sections"
      :key="section.id"
      :class="{ active: activeId === section.id, done: completedIds.includes(section.id) }"
      @click="emit('select', section.id)"
    >
      <component :is="lessonSectionIcons[section.id]" />
      <span>{{ section.label }}</span>
      <Check v-if="completedIds.includes(section.id)" class="section-check" />
    </button>
  </nav>
</template>
