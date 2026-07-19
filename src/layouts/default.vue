<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import PageLoader from '@/components/loading/PageLoader.vue'
import { useCourseStore } from '@/stores/courses'

const route=useRoute()
const store=useCourseStore()
const ready=ref(false)
const title=computed(()=>String(route.meta.title??'Курсор'))

onMounted(async()=>{await store.hydrate();ready.value=true})
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <AppHeader :title="title" />
      <div v-if="store.loading&&ready" class="sync-bar">Обновляем данные…</div>
      <div v-if="store.loadError" class="sync-error">{{ store.loadError }}</div>
      <main><PageLoader v-if="!ready" /><slot v-else /></main>
    </div>
  </div>
</template>
