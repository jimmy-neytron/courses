<script setup lang="ts">
import { BookOpen, Check, Dumbbell, Headphones, ListChecks } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

import type {
  LessonPreviewSection,
  LessonPreviewSectionId,
} from '@/composables/useLessonPreview'

const props = defineProps<{
  sections: LessonPreviewSection[]
  activeId: LessonPreviewSectionId
  completedIds: LessonPreviewSectionId[]
}>()

const emit = defineEmits<{
  select: [sectionId: LessonPreviewSectionId]
}>()

const icons = {
  theory: BookOpen,
  listening: Headphones,
  practice: Dumbbell,
  test: ListChecks,
}
</script>

<template>
  <nav class="engine-section-nav" aria-label="Разделы урока">
    <UiButton
      v-for="section in props.sections"
      :key="section.id"
      class="engine-section-nav__button"
      :class="{
        active: section.id === props.activeId,
        done: props.completedIds.includes(section.id),
      }"
      variant="ghost"
      size="sm"
      @click="emit('select', section.id)"
    >
      <template #leading>
        <component :is="icons[section.id]" :size="15" />
      </template>
      {{ section.label }}
      <Check
        v-if="props.completedIds.includes(section.id)"
        class="section-check"
        :size="13"
      />
    </UiButton>
  </nav>
</template>

<style scoped src="./lesson-section-nav.css"></style>
