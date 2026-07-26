<script setup lang="ts">
import { computed } from 'vue'
import { normalizeRichText } from '@/components/common/richText'

const props = defineProps<{ content?: string }>()
const html = computed(() => normalizeRichText(props.content ?? ''))
</script>

<template>
  <div class="rich-text-content" v-html="html" />
</template>
