<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { UiDialog } from '@neytron/compact-ui/dialog'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
onMounted(() => { document.body.style.overflow = 'hidden' })
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <UiDialog :model-value="true" :title="title" close-label="Закрыть" @update:model-value="!$event && emit('close')">
    <slot />
  </UiDialog>
</template>