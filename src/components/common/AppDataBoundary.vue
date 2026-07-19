<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageLoader from '@/components/loading/PageLoader.vue'
import { useCourseStore } from '@/stores/courses'

withDefaults(defineProps<{ label?: string; fullscreen?: boolean }>(), {
  label: 'Открываем страницу',
  fullscreen: false,
})

const store = useCourseStore()
const ready = ref(store.hydrated)

onMounted(async () => {
  if (ready.value) return
  await store.hydrate()
  ready.value = true
})
</script>

<template>
  <PageLoader v-if="!ready" :label="label" :fullscreen="fullscreen" />
  <template v-else><slot /></template>
</template>
