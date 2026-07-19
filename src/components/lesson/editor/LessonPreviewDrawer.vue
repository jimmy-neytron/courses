<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import Drawer from 'primevue/drawer'
import PrimeButton from 'primevue/button'
import LessonPlayer from '@/components/lesson/LessonPlayer.vue'
import type { Lesson } from '@/types/course'

defineProps<{ lesson: Lesson }>()
const visible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <Drawer v-model:visible="visible" position="right" class="lesson-preview-drawer">
    <template #header>
      <div class="lesson-preview-heading">
        <div><small>Живой предпросмотр</small><strong>{{ lesson.title }}</strong></div>
        <PrimeButton as="a" :href="`/preview/lessons/${lesson.id}`" target="_blank" severity="secondary" text size="small">
          <ExternalLink />Открыть отдельно
        </PrimeButton>
      </div>
    </template>
    <LessonPlayer :lesson="lesson" />
  </Drawer>
</template>
