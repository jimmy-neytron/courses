<script setup lang="ts">
import { computed } from 'vue'
import { ArchiveRestore, Eye, Sparkles, SlidersHorizontal } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import SaveState from '@/components/common/SaveState.vue'
import AppBreadcrumbs from '@/components/app/AppBreadcrumbs.vue'
import type { CourseStatus } from '@/types/course'

const props = defineProps<{
  courseId: string
  courseTitle: string
  lessonTitle: string
  status: CourseStatus
  busy?: boolean
  saved?: boolean
}>()

defineEmits<{ sections: []; preview: []; toggleStatus: [] }>()

const breadcrumbs = computed(() => [
  { label: 'Курсы', to: '/app/courses' },
  { label: props.courseTitle, to: `/app/courses/${props.courseId}` },
  { label: props.lessonTitle },
])
</script>

<template>
  <header class="product-editor-topbar">
    <AppBreadcrumbs :items="breadcrumbs" />
    <div class="editor-save-state"><SaveState :saving="busy" :saved="saved" /></div>
    <UiButton severity="secondary" outlined @click="$emit('sections')"><SlidersHorizontal />Разделы</UiButton>
    <UiButton severity="secondary" outlined @click="$emit('preview')"><Eye />Предпросмотр</UiButton>
    <UiButton :severity="status === 'Опубликован' ? 'secondary' : undefined" :outlined="status === 'Опубликован'" @click="$emit('toggleStatus')">
      <ArchiveRestore v-if="status === 'Опубликован'" />
      <Sparkles v-else />
      {{ status === 'Опубликован' ? 'Вернуть в черновик' : 'Опубликовать' }}
    </UiButton>
  </header>
</template>