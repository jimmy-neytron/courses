<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { UiButton } from '@neytron/compact-ui/button'

const router = useRouter()
</script>

<template>
  <div class="preview-shell">
    <header class="preview-header">
      <UiButton variant="ghost" @click="router.back()"><template #leading><ArrowLeft :size="17" /></template>Назад в редактор</UiButton>
      <span>Режим предпросмотра</span>
    </header>
    <main class="preview-main"><RouterView /></main>
  </div>
</template>

<style scoped src="./preview-layout.css"></style>
