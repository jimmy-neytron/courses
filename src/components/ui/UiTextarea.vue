<script setup lang="ts">
import { useAttrs } from 'vue'
import { UiTextarea as CompactTextarea } from '@neytron/compact-ui/textarea'
import type { UiTextareaResize } from '@neytron/compact-ui/textarea'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  modelValue?: string
  autoResize?: boolean
  fluid?: boolean
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  rows?: number | string
  maxlength?: number
  showCount?: boolean
  resize?: UiTextareaResize
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  name?: string
}>(), { modelValue: '', resize: 'vertical' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [event: Event] }>()
const attrs = useAttrs()
</script>

<template>
  <CompactTextarea v-bind="{ ...attrs, ...props }" :rows="Number(rows ?? 3)" @update:model-value="emit('update:modelValue', $event)" @change="emit('change', $event)" />
</template>