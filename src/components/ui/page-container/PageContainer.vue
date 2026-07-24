<script setup lang="ts">
withDefaults(defineProps<{
  as?: 'section' | 'main' | 'div' | 'article'
}>(), {
  as: 'section',
})
</script>

<template>
  <component :is="as" class="page-container"><slot /></component>
</template>

<style scoped src="./page-container.css"></style>
