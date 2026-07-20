<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const visible = defineModel<boolean>('visible', { required: true })
defineProps<{ position?: 'right' | 'left' }>()
watch(visible, (value) => { document.body.style.overflow = value ? 'hidden' : '' }, { immediate: true })
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-drawer">
      <div v-if="visible" class="ui-drawer-layer" @mousedown.self="visible = false">
        <aside class="ui-drawer" role="dialog" aria-modal="true" v-bind="$attrs">
          <header class="ui-drawer-header"><slot name="header" /><button type="button" aria-label="Закрыть" @click="visible = false"><X /></button></header>
          <div class="ui-drawer-content"><slot /></div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
