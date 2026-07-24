<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  as?: 'label' | 'div'
  wide?: boolean
}>(), {
  as: 'label',
  wide: false,
})
</script>

<template>
  <component :is="as" class="form-field" :class="{ 'form-field--wide': wide }">
    <span class="form-field__label">{{ label }}</span>
    <slot />
  </component>
</template>

<style scoped src="./form-field.css"></style>
