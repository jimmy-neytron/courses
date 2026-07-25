<script setup lang="ts">
import { UiSwitch as CompactSwitch } from '@neytron/compact-ui/switch'

withDefaults(defineProps<{
  modelValue?: boolean
  label?: string
  description?: string
  disabled?: boolean
  required?: boolean
  name?: string
}>(), { modelValue: false })
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; change: [event: Event] }>()
</script>

<template>
  <CompactSwitch :model-value="modelValue" :label="label" :description="description" :disabled="disabled" :required="required" :name="name" @update:model-value="emit('update:modelValue', $event)" @change="emit('change', $event)" />
</template>