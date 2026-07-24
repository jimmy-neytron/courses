<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()
</script>

<template>
  <div class="notification-stack" aria-live="polite">
    <article v-for="item in notifications.items" :key="item.id" class="notification" :data-tone="item.tone">
      <span>{{ item.message }}</span>
      <UiButton class="notification__close" variant="ghost" size="sm" aria-label="Закрыть уведомление" @click="notifications.remove(item.id)"><X :size="15" /></UiButton>
    </article>
  </div>
</template>

<style scoped src="./notification-stack.css"></style>
