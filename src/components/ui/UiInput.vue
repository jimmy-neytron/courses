<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ modelValue?: string | number | null; type?: string; fluid?: boolean }>(), { modelValue: '', type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [value: string | number]; change: [event: Event] }>()
const value = computed(() => props.modelValue ?? '')

function update(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  emit('update:modelValue', props.type === 'number' && raw !== '' ? Number(raw) : raw)
}
</script>

<template>
  <input :value="value" :type="type" :class="['ui-input', { 'is-fluid': fluid }]" @input="update" @change="emit('change', $event)" />
</template>
