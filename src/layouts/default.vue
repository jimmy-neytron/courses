<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import AppDataBoundary from '@/components/common/AppDataBoundary.vue'
import { useCourseStore } from '@/stores/courses'
import { useLayoutStore } from '@/stores/layout'

const store = useCourseStore()
const layout = useLayoutStore()
</script>

<template>
  <div class="shell workspace-shell">
    <AppSidebar />
    <button class="shell-mobile-menu" aria-label="Открыть навигацию" @click="layout.openSidebar"><Menu /></button>
    <div class="shell-content">
      <div v-if="store.loading && store.courses.length" class="sync-bar">Обновляем данные…</div>
      <div v-if="store.loadError" class="sync-error">{{ store.loadError }}</div>
      <main class="workspace-main">
        <AppDataBoundary><slot /></AppDataBoundary>
      </main>
    </div>
  </div>
</template>