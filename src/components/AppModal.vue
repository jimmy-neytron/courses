<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}
onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="ui-modal-layer" @mousedown.self="emit('close')">
      <section class="ui-modal app-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <header class="ui-modal-header"><h2>{{ title }}</h2><button type="button" aria-label="Закрыть" @click="emit('close')"><X /></button></header>
        <div class="ui-modal-content"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>