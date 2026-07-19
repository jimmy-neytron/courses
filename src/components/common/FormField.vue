<script setup lang="ts">
withDefaults(defineProps<{ label: string; hint?: string }>(), { hint: '' })
</script>

<template>
  <label class="form-field">
    <span>{{ label }}</span>
    <slot />
    <small v-if="hint">{{ hint }}</small>
  </label>
</template>
