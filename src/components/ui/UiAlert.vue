<script setup lang="ts">
import { computed } from 'vue'
import { UiAlert as CompactAlert } from '@neytron/compact-ui/alert'
import type { UiAlertTone } from '@neytron/compact-ui/alert'

const props = withDefaults(defineProps<{ severity?: 'error' | 'success' | 'info' }>(), { severity: 'info' })
const tone = computed<UiAlertTone>(() => props.severity === 'error' ? 'danger' : props.severity)
</script>

<template>
  <CompactAlert :tone="tone" :role="severity === 'error' ? 'alert' : 'status'" :class="['ui-alert', `is-${severity}`]">
    <slot />
  </CompactAlert>
</template>