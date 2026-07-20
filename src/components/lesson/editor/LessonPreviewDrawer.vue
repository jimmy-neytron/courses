<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import UiDrawer from '@/components/ui/UiDrawer.vue'
import UiButton from '@/components/ui/UiButton.vue'
import LessonPlayer from '@/components/lesson/LessonPlayer.vue'
import type { Lesson } from '@/types/course'

defineProps<{ lesson: Lesson }>()
const visible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <UiDrawer v-model:visible="visible" position="right" class="lesson-preview-drawer">
    <template #header>
      <div class="lesson-preview-heading">
        <div><small>Живой предпросмотр</small><strong>{{ lesson.title }}</strong></div>
        <UiButton as="a" :href="`/preview/lessons/${lesson.id}`" target="_blank" severity="secondary" text size="small">
          <ExternalLink />Открыть отдельно
        </UiButton>
      </div>
    </template>
    <div class="lesson-preview-surface engine-single-preview">
      <LessonPlayer :lesson="lesson" />
    </div>
  </UiDrawer>
</template>
