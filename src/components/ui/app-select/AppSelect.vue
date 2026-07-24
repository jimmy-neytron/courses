<script setup lang="ts" generic="TValue extends string = string">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'

import type { AppSelectOption } from '@/types/ui'

const props = withDefaults(defineProps<{
  modelValue: TValue
  options: AppSelectOption<TValue>[]
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Выберите значение',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: TValue] }>()
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const selected = computed(() => props.options.find((option) => option.value === props.modelValue))

function toggle(): void {
  if (!props.disabled) open.value = !open.value
}

function select(value: TValue): void {
  emit('update:modelValue', value)
  open.value = false
}

function closeFromOutside(event: PointerEvent): void {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', closeFromOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeFromOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="app-select">
    <UiButton
      class="app-select__trigger"
      variant="secondary"
      block
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span :class="{ 'app-select__placeholder': !selected }">{{ selected?.label || placeholder }}</span>
      <template #trailing>
        <ChevronDown class="app-select__chevron" :class="{ 'is-open': open }" :size="17" />
      </template>
    </UiButton>

    <Transition name="select-popover">
      <UiCard v-if="open" class="app-select__menu" variant="outline" role="listbox">
        <UiButton
          v-for="option in options"
          :key="option.value"
          class="app-select__option"
          :class="{ 'is-selected': option.value === modelValue }"
          variant="ghost"
          block
          role="option"
          :aria-selected="option.value === modelValue"
          @click="select(option.value)"
        >
          <span class="app-select__option-copy">
            <strong>{{ option.label }}</strong>
            <small v-if="option.description">{{ option.description }}</small>
          </span>
          <template #trailing><Check v-if="option.value === modelValue" :size="16" /></template>
        </UiButton>
      </UiCard>
    </Transition>
  </div>
</template>

<style scoped src="./app-select.css"></style>
