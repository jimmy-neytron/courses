<script setup lang="ts" generic="T extends string | number | object">
import { useId } from 'vue'

const props = withDefaults(defineProps<{ modelValue?: string | number | null; options: T[]; optionLabel?: string; optionValue?: string; placeholder?: string; fluid?: boolean; editable?: boolean }>(), { optionLabel: 'label', optionValue: 'value' })
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
const listId = useId()

function valueOf(option: T): string | number {
  if (typeof option !== 'object' || option === null) return option
  return (option as Record<string, unknown>)[props.optionValue] as string | number
}
function labelOf(option: T): string {
  if (typeof option !== 'object' || option === null) return String(option)
  return String((option as Record<string, unknown>)[props.optionLabel] ?? valueOf(option))
}
function update(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  const match = props.options.find((option) => String(valueOf(option)) === raw)
  emit('update:modelValue', match === undefined ? raw : valueOf(match))
}
function updateEditable(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const match = props.options.find((option) => String(valueOf(option)) === raw || labelOf(option) === raw)
  emit('update:modelValue', match === undefined ? raw : valueOf(match))
}
</script>

<template>
  <input v-if="editable" :value="modelValue ?? ''" :list="listId" :class="['ui-input', 'ui-select-editable', { 'is-fluid': fluid }]" @input="updateEditable" />
  <datalist v-if="editable" :id="listId">
    <option v-for="option in options" :key="String(valueOf(option))" :value="valueOf(option)">{{ labelOf(option) }}</option>
  </datalist>
  <select v-else :value="modelValue ?? ''" :class="['ui-select', { 'is-fluid': fluid }]" @change="update">
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="option in options" :key="String(valueOf(option))" :value="valueOf(option)">{{ labelOf(option) }}</option>
  </select>
</template>
