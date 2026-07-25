<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppDataBoundary from '@/components/common/AppDataBoundary.vue'

const route = useRoute()
const loadingLabel = computed(() => String(route.meta.loadingLabel ?? 'Открываем страницу'))
</script>

<template>
  <div class="fullscreen-shell">
    <AppDataBoundary :label="loadingLabel" fullscreen><slot /></AppDataBoundary>
  </div>
</template>