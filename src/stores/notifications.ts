import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createId } from '@/utils/id'

export type NotificationTone = 'success' | 'danger' | 'info'

export interface AppNotification {
  id: string
  message: string
  tone: NotificationTone
}

const NOTIFICATION_LIFETIME_MS = 3500

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])

  function remove(id: string): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(message: string, tone: NotificationTone = 'info'): void {
    const notification: AppNotification = { id: createId(), message, tone }
    items.value.push(notification)
    window.setTimeout(() => remove(notification.id), NOTIFICATION_LIFETIME_MS)
  }

  return { items, push, remove }
})
