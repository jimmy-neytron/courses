import { ref } from 'vue'
import { defineStore } from 'pinia'

export type NotificationTone = 'success' | 'error' | 'info'

export interface AppNotification {
  id: number
  message: string
  tone: NotificationTone
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  let nextId = 0

  function remove(id: number): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(message: string, tone: NotificationTone = 'success', duration = 3600): number {
    const id = ++nextId
    items.value.push({ id, message, tone })
    window.setTimeout(() => remove(id), duration)
    return id
  }

  return {
    items,
    remove,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error', 5200),
    info: (message: string) => push(message, 'info'),
  }
})