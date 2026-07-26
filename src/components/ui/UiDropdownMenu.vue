<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { UiDropdownMenu as CompactDropdownMenu } from '@neytron/compact-ui/dropdown-menu'
import type { UiDropdownMenuItem, UiDropdownMenuValue } from '@neytron/compact-ui/dropdown-menu'

export type AppDropdownMenuValue = UiDropdownMenuValue
export type AppDropdownMenuItem<T extends AppDropdownMenuValue = AppDropdownMenuValue> = UiDropdownMenuItem<T>

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: boolean
  items: readonly AppDropdownMenuItem[]
  placement?: 'top' | 'right' | 'bottom' | 'left'
  disabled?: boolean
}>(), { placement: 'bottom', disabled: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [value: AppDropdownMenuValue]
  open: []
  close: []
}>()
const attrs = useAttrs()
const internalOpen = ref(false)
const open = computed(() => props.modelValue ?? internalOpen.value)

function updateOpen(value: boolean): void {
  if (props.modelValue === undefined) internalOpen.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <CompactDropdownMenu
    v-bind="attrs"
    class="ui-dropdown-menu"
    :model-value="open"
    :items="items"
    :placement="placement"
    :disabled="disabled"
    @update:model-value="updateOpen"
    @select="emit('select', $event)"
    @open="emit('open')"
    @close="emit('close')"
  >
    <template #trigger><slot name="trigger" /></template>
    <template #item="{ item }"><slot name="item" :item="item">{{ item.label }}</slot></template>
  </CompactDropdownMenu>
</template>
