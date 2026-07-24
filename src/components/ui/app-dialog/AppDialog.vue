<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import EyebrowText from '@/components/ui/eyebrow-text/EyebrowText.vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  eyebrow?: string
  maxWidth?: string
}>(), {
  eyebrow: '',
  maxWidth: '680px',
})

const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) emit('close')
}

watch(() => props.open, (open) => {
  document.body.classList.toggle('has-dialog', open)
}, { immediate: true })

document.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
  document.body.classList.remove('has-dialog')
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="open" class="dialog-backdrop" @click.self="emit('close')">
        <UiCard
          class="dialog-card"
          variant="outline"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="{ '--dialog-max-width': maxWidth }"
        >
          <header class="dialog-card__header">
            <div>
              <EyebrowText v-if="eyebrow">{{ eyebrow }}</EyebrowText>
              <h2>{{ title }}</h2>
            </div>
            <UiButton class="dialog-close" variant="ghost" size="sm" aria-label="Закрыть" @click="emit('close')">
              <X :size="18" />
            </UiButton>
          </header>

          <div class="dialog-card__body"><slot /></div>
          <footer v-if="$slots.footer" class="dialog-card__footer"><slot name="footer" /></footer>
        </UiCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped src="./app-dialog.css"></style>
