<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notifications'

const notifications = useNotificationStore()
</script>

<template>
  <Teleport to="body">
    <div class="app-notifications" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="notification">
        <article v-for="item in notifications.items" :key="item.id" :class="['app-notification', `is-${item.tone}`]">
          <CheckCircle2 v-if="item.tone === 'success'" />
          <AlertTriangle v-else-if="item.tone === 'error'" />
          <Info v-else />
          <span>{{ item.message }}</span>
          <button type="button" aria-label="Закрыть уведомление" @click="notifications.remove(item.id)"><X /></button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>