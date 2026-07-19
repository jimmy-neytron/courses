<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageLoader from '@/components/loading/PageLoader.vue'
import { useCourseStore } from '@/stores/courses'

const route=useRoute()
const store=useCourseStore()
const ready=ref(false)
const label=computed(()=>String(route.meta.loadingLabel??'Открываем страницу'))

onMounted(async()=>{await store.hydrate();ready.value=true})
</script>

<template>
  <PageLoader v-if="!ready" :label="label" fullscreen />
  <slot v-else />
</template>
