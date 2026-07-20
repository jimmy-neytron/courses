<script setup lang="ts">
import { ArrowLeft, Eye, PanelRightOpen, Save, SlidersHorizontal } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import SaveState from '@/components/common/SaveState.vue'
import type { CourseStatus } from '@/types/course'

defineProps<{
  courseId: string
  courseTitle: string
  lessonTitle: string
  status: CourseStatus
  busy?: boolean
  saved?: boolean
}>()

defineEmits<{ sections: []; preview: []; inspect: []; publish: [] }>()
</script>

<template>
  <header class="product-editor-topbar">
    <RouterLink :to="`/app/courses/${courseId}`" class="editor-back" aria-label="Вернуться к курсу"><ArrowLeft /></RouterLink>
    <div class="editor-crumbs"><span>{{ courseTitle }}</span><strong>{{ lessonTitle }}</strong></div>
    <div class="editor-save-state"><SaveState :saving="busy" :saved="saved" /></div>
    <UiButton severity="secondary" outlined @click="$emit('sections')"><SlidersHorizontal />Разделы</UiButton>
    <UiButton severity="secondary" outlined @click="$emit('preview')"><Eye />Предпросмотр</UiButton>
    <UiButton class="editor-inspector-trigger" severity="secondary" outlined aria-label="Настройки блока" @click="$emit('inspect')"><PanelRightOpen />Настройки</UiButton>
    <UiButton :disabled="status === 'Опубликован'" @click="$emit('publish')">
      <Save />{{ status === 'Опубликован' ? 'Опубликовано' : 'Опубликовать' }}
    </UiButton>
  </header>
</template>
