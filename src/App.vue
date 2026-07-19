<script setup lang="ts">
import { RouterView } from 'vue-router'
import RouteProgress from '@/components/loading/RouteProgress.vue'
</script>

<template>
  <RouteProgress />
  <RouterView />
</template>
