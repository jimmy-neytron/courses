<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppDataBoundary from '@/components/common/AppDataBoundary.vue'
import { useCourseStore } from '@/stores/courses'

const route = useRoute()
const store = useCourseStore()
const title = computed(() => String(route.meta.title ?? 'Курсор'))
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <AppHeader :title="title" />
      <div v-if="store.loading && store.courses.length" class="sync-bar">Обновляем данные…</div>
      <div v-if="store.loadError" class="sync-error">{{ store.loadError }}</div>
      <main>
        <AppDataBoundary><slot /></AppDataBoundary>
      </main>
    </div>
  </div>
</template>
