<script setup lang="ts">
import { BookOpen, RefreshCw } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

withDefaults(defineProps<{
  title: string
  description: string
  actionLabel?: string
  retry?: boolean
  size?: 'default' | 'compact' | 'viewport'
}>(), {
  actionLabel: '',
  retry: false,
  size: 'default',
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="page-state" :data-size="size">
    <span class="page-state__icon"><RefreshCw v-if="retry" :size="27" /><BookOpen v-else :size="29" /></span>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
    <UiButton v-if="actionLabel" @click="emit('action')">
      <template #leading><RefreshCw v-if="retry" :size="17" /></template>
      {{ actionLabel }}
    </UiButton>
    <slot />
  </div>
</template>

<style scoped src="./page-state.css"></style>
