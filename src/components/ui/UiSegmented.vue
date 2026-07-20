<script setup lang="ts" generic="T extends string | number">
defineProps<{ modelValue: T; options: T[]; allowEmpty?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="ui-segmented" role="group">
    <button v-for="option in options" :key="String(option)" type="button" :class="['ui-segmented-option', { 'is-active': option === modelValue }]" :aria-pressed="option === modelValue" @click="emit('update:modelValue', option)">{{ option }}</button>
  </div>
</template>
