<script setup lang="ts" generic="T extends string | number">
import { computed, useAttrs } from 'vue'
import { UiTabs as CompactTabs } from '@neytron/compact-ui/tabs'
import type { UiTabItem } from '@neytron/compact-ui/tabs'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ modelValue: T; options: T[]; allowEmpty?: boolean; formatLabel?: (value: T) => string }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const attrs = useAttrs()
const items = computed<UiTabItem<T>[]>(() => props.options.map((option) => ({ label: props.formatLabel?.(option) ?? String(option), value: option })))
</script>

<template>
  <CompactTabs v-bind="attrs" class="ui-segmented" :model-value="modelValue" :items="items" @update:model-value="emit('update:modelValue', $event)" />
</template>
