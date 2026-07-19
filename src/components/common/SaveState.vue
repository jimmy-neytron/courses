<script setup lang="ts">
import { Check, LoaderCircle } from 'lucide-vue-next'

defineProps<{ saving?: boolean; saved?: boolean }>()
</script>

<template>
  <span v-if="saving" class="save-state save-state--saving"><LoaderCircle />Сохраняем…</span>
  <span v-else-if="saved" class="save-state save-state--saved"><Check />Сохранено</span>
</template>
