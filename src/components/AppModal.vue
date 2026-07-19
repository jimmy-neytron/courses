<script setup lang="ts">
import Dialog from 'primevue/dialog'

defineProps<{title:string}>()
const emit=defineEmits<{close:[]}>()
</script>

<template>
  <Dialog
    :visible="true"
    :header="title"
    modal
    dismissable-mask
    class="app-dialog"
    :style="{width:'min(540px, calc(100vw - 32px))'}"
    @update:visible="value=>!value&&emit('close')"
  >
    <slot/>
  </Dialog>
</template>
