<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

import AppDialog from '@/components/ui/app-dialog/AppDialog.vue'

withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
}>(), {
  confirmLabel: 'Удалить',
  loading: false,
})

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppDialog :open="open" :title="title" eyebrow="Подтверждение" max-width="480px" @close="emit('close')">
    <div class="confirm-dialog__content">
      <span class="confirm-dialog__icon"><AlertTriangle :size="22" /></span>
      <p>{{ description }}</p>
    </div>
    <template #footer>
      <UiButton variant="ghost" :disabled="loading" @click="emit('close')">Отмена</UiButton>
      <UiButton class="danger-action" variant="secondary" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </UiButton>
    </template>
  </AppDialog>
</template>

<style scoped src="./confirm-dialog.css"></style>
