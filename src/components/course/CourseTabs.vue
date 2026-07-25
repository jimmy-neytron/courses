<script setup lang="ts">
import { UiTabs } from '@neytron/compact-ui/tabs'
import { BookOpen, LayoutList, Settings2 } from 'lucide-vue-next'
import type { CourseDetailsTab } from '@/composables/useCourseDetails'

const props = defineProps<{ modelValue: CourseDetailsTab }>()
const emit = defineEmits<{ 'update:modelValue': [value: CourseDetailsTab] }>()
const tabs = [
  { value: 'overview', label: 'Обзор', icon: LayoutList },
  { value: 'curriculum', label: 'Программа', icon: BookOpen },
  { value: 'settings', label: 'Настройки', icon: Settings2 },
] as const
</script>

<template>
  <UiTabs class="product-tabs" aria-label="Разделы курса" :model-value="props.modelValue" :items="tabs" @update:model-value="emit('update:modelValue', $event)">
    <template #tab="{ item }"><component :is="tabs.find((tab) => tab.value === item.value)?.icon" />{{ item.label }}</template>
  </UiTabs>
</template>