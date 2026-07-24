<script setup lang="ts">
import { UiCard } from '@neytron/compact-ui/card'

withDefaults(defineProps<{
  variant?: 'courses' | 'detail' | 'editor' | 'preview'
}>(), {
  variant: 'detail',
})
</script>

<template>
  <div class="skeleton-page" :data-variant="variant" aria-busy="true" aria-label="Загрузка содержимого">
    <template v-if="variant === 'courses'">
      <div class="skeleton-page__header">
        <div>
          <span class="skeleton-line skeleton-line--eyebrow" />
          <span class="skeleton-line skeleton-line--title" />
          <span class="skeleton-line skeleton-line--text" />
        </div>
        <span class="skeleton-control" />
      </div>
      <span class="skeleton-search" />
      <div class="course-grid">
        <UiCard v-for="index in 6" :key="index" class="skeleton-card" variant="outline" padding="lg">
          <div class="skeleton-card__top"><span class="skeleton-circle" /><span class="skeleton-pill" /></div>
          <span class="skeleton-line skeleton-line--card-title" />
          <span class="skeleton-line skeleton-line--text" />
          <span class="skeleton-line skeleton-line--short" />
          <div class="skeleton-card__meta"><span /><span /><span /></div>
          <span class="skeleton-control skeleton-control--wide" />
        </UiCard>
      </div>
    </template>

    <template v-else-if="variant === 'editor'">
      <UiCard class="skeleton-hero" variant="outline" padding="lg">
        <span class="skeleton-line skeleton-line--eyebrow" />
        <span class="skeleton-line skeleton-line--title" />
        <span class="skeleton-line skeleton-line--text" />
      </UiCard>
      <div class="skeleton-editor-grid">
        <UiCard class="skeleton-panel" variant="outline" padding="lg">
          <span v-for="index in 5" :key="index" class="skeleton-field" />
        </UiCard>
        <div class="skeleton-blocks">
          <UiCard v-for="index in 3" :key="index" class="skeleton-block" variant="outline" padding="lg">
            <span class="skeleton-line skeleton-line--card-title" />
            <span class="skeleton-line skeleton-line--text" />
            <span class="skeleton-line skeleton-line--short" />
          </UiCard>
        </div>
      </div>
    </template>

    <template v-else>
      <UiCard class="skeleton-hero" variant="outline" padding="lg">
        <span class="skeleton-pill" />
        <span class="skeleton-line skeleton-line--title" />
        <span class="skeleton-line skeleton-line--text" />
        <span class="skeleton-line skeleton-line--short" />
      </UiCard>
      <div class="skeleton-list">
        <UiCard v-for="index in 3" :key="index" class="skeleton-module" variant="outline" padding="lg">
          <div class="skeleton-card__top"><span class="skeleton-circle" /><span class="skeleton-line skeleton-line--card-title" /></div>
          <span class="skeleton-line skeleton-line--text" />
          <span class="skeleton-field" />
          <span class="skeleton-field" />
        </UiCard>
      </div>
    </template>
  </div>
</template>

<style scoped src="./loading-skeleton.css"></style>
