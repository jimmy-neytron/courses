<script setup lang="ts">
import { BookOpen, LayoutList, Settings2 } from 'lucide-vue-next'
import type { CourseDetailsTab } from '@/composables/useCourseDetails'

defineProps<{ modelValue: CourseDetailsTab }>()
defineEmits<{ 'update:modelValue': [value: CourseDetailsTab] }>()

const tabs = [
  { id: 'overview', label: 'Обзор', icon: LayoutList },
  { id: 'curriculum', label: 'Программа', icon: BookOpen },
  { id: 'settings', label: 'Настройки', icon: Settings2 },
] as const
</script>

<template>
  <nav class="product-tabs" aria-label="Разделы курса">
    <button v-for="item in tabs" :key="item.id" :class="{ active: modelValue === item.id }" @click="$emit('update:modelValue', item.id)">
      <component :is="item.icon" />{{ item.label }}
    </button>
  </nav>
</template>
