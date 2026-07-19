<script setup lang="ts">
import { RouterView } from 'vue-router'
import RouteProgress from '@/components/loading/RouteProgress.vue'
</script>

<template>
  <RouteProgress />
  <RouterView v-slot="{ Component }">
    <Transition name="page-fade">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.page-fade-enter-active{transition:opacity .16s ease,transform .16s ease}.page-fade-enter-from{opacity:0;transform:translateY(3px)}
@media(prefers-reduced-motion:reduce){.page-fade-enter-active{transition:none}}
</style>