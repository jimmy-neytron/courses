<script setup lang="ts">
import EyebrowText from '@/components/ui/eyebrow-text/EyebrowText.vue'

defineProps<{
  eyebrow: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="section-heading">
    <div class="section-heading__copy">
      <EyebrowText>{{ eyebrow }}</EyebrowText>
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="section-heading__action"><slot name="action" /></div>
  </header>
</template>

<style scoped src="./section-heading.css"></style>
