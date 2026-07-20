<script setup lang="ts">
withDefaults(defineProps<{ severity?: 'error' | 'success' | 'info' }>(), { severity: 'info' })
</script>

<template><div :class="['ui-alert', `is-${severity}`]" role="status"><slot /></div></template>
