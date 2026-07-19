import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

export function useTransientFlag(duration = 1400) {
  const value = ref(false)
  const { start, stop } = useTimeoutFn(() => { value.value = false }, duration, { immediate: false })

  function show() {
    stop()
    value.value = true
    start()
  }

  return { value, show }
}
