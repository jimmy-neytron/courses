<script setup lang="ts" generic="T extends string | number | object">
import { computed, useAttrs, useId } from 'vue'
import { UiInput as CompactInput } from '@neytron/compact-ui/input'
import { UiSelect as CompactSelect } from '@neytron/compact-ui/select'
import type { UiSelectOption, UiSelectValue } from '@neytron/compact-ui/select'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  options: readonly T[]
  optionLabel?: string
  optionValue?: string
  placeholder?: string
  fluid?: boolean
  editable?: boolean
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  label?: string
  hint?: string
  name?: string
}>(), { optionLabel: 'label', optionValue: 'value' })
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
const attrs = useAttrs()
const listId = useId()

function valueOf(option: T): UiSelectValue {
  if (typeof option !== 'object' || option === null) return option
  return (option as Record<string, unknown>)[props.optionValue] as UiSelectValue
}
function labelOf(option: T): string {
  if (typeof option !== 'object' || option === null) return String(option)
  return String((option as Record<string, unknown>)[props.optionLabel] ?? valueOf(option))
}
const normalizedOptions = computed<UiSelectOption[]>(() => props.options.map((option) => ({
  label: labelOf(option),
  value: valueOf(option),
  disabled: typeof option === 'object' && option !== null ? Boolean((option as Record<string, unknown>).disabled) : false,
})))
function updateEditable(value: string | number): void {
  const match = props.options.find((option) => String(valueOf(option)) === String(value) || labelOf(option) === String(value))
  emit('update:modelValue', match === undefined ? value : valueOf(match))
}
</script>

<template>
  <template v-if="editable">
    <CompactInput v-bind="attrs" :model-value="modelValue ?? ''" :list="listId" :placeholder="placeholder" :disabled="disabled" @update:model-value="updateEditable" />
    <datalist :id="listId">
      <option v-for="option in normalizedOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
    </datalist>
  </template>
  <CompactSelect v-else v-bind="attrs" :model-value="modelValue" :options="normalizedOptions" :placeholder="placeholder" :searchable="searchable" :clearable="clearable" :disabled="disabled" :loading="loading" :error="error" :label="label" :hint="hint" :name="name" @update:model-value="emit('update:modelValue', $event as UiSelectValue | null)" />
</template>