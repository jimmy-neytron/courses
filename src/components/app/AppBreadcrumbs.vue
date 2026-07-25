<script setup lang="ts">
import { ChevronRight, Home } from 'lucide-vue-next'

defineProps<{ items: Array<{ label: string; to?: string }> }>()
</script>

<template>
  <nav class="app-breadcrumbs" aria-label="Хлебные крошки">
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <ChevronRight v-if="index" aria-hidden="true" />
      <RouterLink v-if="item.to" :to="item.to" :aria-label="index === 0 ? item.label : undefined">
        <Home v-if="index === 0" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
      <span v-else class="is-current" aria-current="page">{{ item.label }}</span>
    </template>
  </nav>
</template>