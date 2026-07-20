<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ modelValue?: string; autoResize?: boolean; fluid?: boolean }>(), { modelValue: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const element = ref<HTMLTextAreaElement>()

function resize(): void {
  if (!props.autoResize || !element.value) return
  element.value.style.height = 'auto'
  element.value.style.height = `${element.value.scrollHeight}px`
}
function update(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
  void nextTick(resize)
}
watch(() => props.modelValue, () => void nextTick(resize))
onMounted(resize)
</script>

<template>
  <textarea ref="element" :value="modelValue" :class="['ui-textarea', { 'is-fluid': fluid }]" @input="update" />
</template>
