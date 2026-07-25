<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { UiInput as CompactInput } from '@neytron/compact-ui/input'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel'
  fluid?: boolean
  suffix?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  name?: string
  autocomplete?: string
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: number | string
  pattern?: string
}>(), { modelValue: '', type: 'text' })
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
const attrs = useAttrs()
const component = ref<InstanceType<typeof CompactInput>>()
const value = computed(() => props.modelValue ?? '')
const forwarded = computed(() => ({
  ...props,
  maxlength: props.maxlength === undefined ? undefined : Number(props.maxlength),
}))

function focus(): void {
  const root = component.value?.$el as HTMLElement | undefined
  root?.querySelector<HTMLInputElement>('.cui-input__native')?.focus()
}

defineExpose({ focus })
</script>

<template>
  <CompactInput ref="component" v-bind="{ ...attrs, ...forwarded }" :model-value="value" @update:model-value="emit('update:modelValue', $event)" @change="emit('change', $event)" @focus="emit('focus', $event)" @blur="emit('blur', $event)">
    <template v-if="suffix" #suffix>{{ suffix }}</template>
  </CompactInput>
</template>